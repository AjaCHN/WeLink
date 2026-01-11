import { LogEntry, AppFolder, AppStatus, MoveStep, AppSettings } from '../types';
import { MOCK_APPS } from '../constants';

// Declare global window type for Tauri
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
      shell: {
        Command: {
          new (program: string, args?: string[] | string): {
            execute: () => Promise<{ code: number; stdout: string; stderr: string }>;
          };
        };
      };
    };
  }
}

const isTauri = () => !!window.__TAURI__;

type LogCallback = (msg: string, type: LogEntry['type']) => void;
type StatusCallback = (step: MoveStep) => void;

/**
 * Encodes a string to Base64 UTF-16LE for PowerShell -EncodedCommand
 */
const encodePowerShell = (str: string): string => {
  const arr = new Uint8Array(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    arr[i * 2] = code & 0xff;
    arr[i * 2 + 1] = (code >> 8) & 0xff;
  }
  let binary = '';
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
};

/**
 * Scans the system AppData folder for folders.
 * Uses PowerShell in Native mode, returns MOCK_APPS in Web mode.
 */
export const scanSystemApps = async (driveLabel: string): Promise<AppFolder[]> => {
  if (!isTauri()) {
    console.warn("Web Mode: Returning Mock Data");
    // Simulate network/disk delay
    await new Promise(r => setTimeout(r, 800));
    return MOCK_APPS;
  }

  try {
    // Only scanning C: (AppData) is supported specifically in this demo for safety
    // For other drives, we might need a recursive search which is slow.
    if (!driveLabel.startsWith("C")) {
       return [];
    }

    // PowerShell script to list directories in Roaming AppData
    // We limit depth to 1 to just get application folders
    const psScript = `
      $ErrorActionPreference = 'Stop'
      $path = [Environment]::GetFolderPath("ApplicationData")
      
      $folders = Get-ChildItem -Path $path -Directory | Select-Object -First 50
      
      $result = @()
      foreach ($item in $folders) {
          $result += @{
              id = $item.Name
              name = $item.Name
              sourcePath = $item.FullName
              # Calculating real folder size is slow in PS, putting placeholder
              size = "Unknown" 
              status = "READY"
          }
      }
      $result | ConvertTo-Json -Compress
    `;

    const encodedCommand = encodePowerShell(psScript);
    const cmd = new window.__TAURI__!.shell.Command('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedCommand
    ]);

    const output = await cmd.execute();
    
    if (output.code === 0) {
      const data = JSON.parse(output.stdout);
      // Ensure data is array (ConvertTo-Json can return single object if only 1 result)
      const arrayData = Array.isArray(data) ? data : [data];
      
      return arrayData.map((item: any) => ({
        id: item.id,
        name: item.name,
        sourcePath: item.sourcePath,
        size: 'Calc on Select', // Calculation is heavy, do it later or separate
        status: AppStatus.Ready
      }));
    } else {
      console.error("Scan failed", output.stderr);
      return [];
    }
  } catch (e) {
    console.error("Tauri invocation failed", e);
    return [];
  }
};

/**
 * Executes the migration process.
 * If in Tauri: Runs an elevated PowerShell script to handle Robocopy and Mklink (triggers UAC).
 * If in Web: Runs simulation with timeouts.
 */
export const executeMigration = async (
  app: AppFolder,
  targetDrive: string,
  settings: AppSettings,
  onLog: LogCallback,
  onStatusChange: StatusCallback
): Promise<boolean> => {
  const targetPath = `${targetDrive}\\${app.name}`;

  if (isTauri()) {
    try {
      // --- NATIVE MODE ---
      onLog(`Initializing Native Mode (Tauri Shell)...`, 'info');
      
      // Construct PowerShell script
      // We use -Verb RunAs to trigger the UAC prompt
      const safeSource = app.sourcePath.replace(/'/g, "''");
      const safeTarget = targetPath.replace(/'/g, "''");

      // Script logic:
      // 1. Create Dir
      // 2. Robocopy (Exit code < 8 is standard success)
      // 3. Remove Source Dir (Critical: mklink fails if directory exists)
      // 4. Mklink (Junction)
      const psScript = `
        $ErrorActionPreference = 'Stop'
        $source = '${safeSource}'
        $target = '${safeTarget}'
        
        Write-Host "Creating target directory..."
        if (!(Test-Path $target)) {
            New-Item -ItemType Directory -Force -Path $target | Out-Null
        }

        Write-Host "Moving files..."
        # Robocopy returns exit codes: 0 (No change), 1 (Copy success), etc. < 8 is standard success.
        $proc = Start-Process robocopy -ArgumentList "\`"$source\`" \`"$target\`" /MOVE /E /COPYALL /NFL /NDL /NJH /NJS" -Wait -PassThru -NoNewWindow
        if ($proc.ExitCode -ge 8) {
            Write-Error "Robocopy failed with code $($proc.ExitCode)"
            exit 1
        }

        # Critical Step: Robocopy /MOVE might leave the empty source root folder.
        # We MUST remove it, otherwise mklink will say "Cannot create a file when that file already exists".
        if (Test-Path $source) {
            Write-Host "Cleaning up source root for junction creation..."
            Remove-Item -Path $source -Force -Recurse
        }

        Write-Host "Creating junction..."
        # mklink is a cmd internal command
        $cmdArgs = "/c mklink /J \`"$source\`" \`"$target\`""
        $linkProc = Start-Process cmd -ArgumentList $cmdArgs -Wait -PassThru -NoNewWindow
        
        if ($linkProc.ExitCode -ne 0) {
            Write-Error "Mklink failed"
            exit 1
        }
      `;

      const encodedCommand = encodePowerShell(psScript);

      onStatusChange(MoveStep.MkDir);
      onLog(`Requesting Admin Privileges (UAC) to perform migration...`, 'warning');
      
      // We spawn a hidden PowerShell that attempts to Start-Process another PowerShell as Admin
      // This triggers the UAC prompt. -Wait ensures we know when it finishes.
      const cmd = new window.__TAURI__!.shell.Command('powershell', [
        '-WindowStyle', 'Hidden',
        '-Command',
        `Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}'`
      ]);

      // Execute command
      onLog(`Executing elevated script...`, 'command');
      const result = await cmd.execute();

      if (result.code === 0) {
        onStatusChange(MoveStep.Done);
        onLog(`Migration completed successfully via elevated process.`, 'success');
        return true;
      } else {
        onLog(`Process exited with code ${result.code}. Check permissions.`, 'error');
        if (result.stderr) onLog(`Error: ${result.stderr}`, 'error');
        return false;
      }

    } catch (error) {
      onLog(`Native Execution Error: ${error}`, 'error');
      onLog(`Ensure 'powershell' is allowed in tauri.conf.json shell scope.`, 'warning');
      return false;
    }
  } else {
    // --- SIMULATION MODE (WEB) ---
    onLog(`[WEB SIMULATION] Running in browser mode. Files will not be moved.`, 'warning');
    
    // Step 1: MkDir
    onStatusChange(MoveStep.MkDir);
    onLog(`mkdir "${targetPath}"`, 'command');
    await new Promise(r => setTimeout(r, 1200)); 
    
    // Step 2: Robocopy
    onStatusChange(MoveStep.Robocopy);
    let copyFlags = "/E /COPYALL /MOVE";
    if (settings.verifyCopy) copyFlags += " /V";
    if (settings.deleteSource) copyFlags += " /PURGE";
    
    onLog(`robocopy "${app.sourcePath}" "${targetPath}" ${copyFlags}`, 'command');
    onLog(`Transferring ${app.size} of data...`, 'info');
    await new Promise(r => setTimeout(r, 2500));

    // Optional Compression
    if (settings.compression) {
      onLog(`Compressing target folder...`, 'info');
      onLog(`compact /c /s "${targetPath}"`, 'command');
      await new Promise(r => setTimeout(r, 800));
    }

    // Step 3: MkLink
    onStatusChange(MoveStep.MkLink);
    onLog(`rmdir "${app.sourcePath}" (Simulated cleanup)`, 'command');
    onLog(`mklink /J "${app.sourcePath}" "${targetPath}"`, 'command');
    await new Promise(r => setTimeout(r, 1000));
    
    onLog(`Junction created successfully -> ${targetPath}`, 'success');
    return true;
  }
};

/**
 * Checks if the environment is capable of real file operations
 */
export const getEnvironmentCapabilities = () => {
  return {
    isNative: isTauri(),
    platform: isTauri() ? 'Windows (Native)' : 'Web (Simulation)',
    version: '1.0.0'
  };
};