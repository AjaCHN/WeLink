import { LogEntry, AppFolder, AppStatus, MoveStep, AppSettings } from '../types';
import { MOCK_APPS } from '../constants';

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

// --- CORE UTILITIES ---

/**
 * Calculates the real size of a folder using PowerShell
 */
export const calculateFolderSize = async (path: string): Promise<string> => {
  if (!isTauri()) {
    await new Promise(r => setTimeout(r, 600)); // Simulate lag
    return "2.4 GB (Sim)";
  }

  try {
    const psScript = `
      $ErrorActionPreference = 'SilentlyContinue'
      if (Test-Path -Path '${path}') {
          $size = (Get-ChildItem -Path '${path}' -Recurse -Force | Measure-Object -Property Length -Sum).Sum
          if ($size -gt 1GB) { "{0:N2} GB" -f ($size / 1GB) } 
          elseif ($size -gt 1MB) { "{0:N2} MB" -f ($size / 1MB) }
          else { "{0:N2} KB" -f ($size / 1KB) }
      } else {
          "0 KB"
      }
    `;
    const cmd = new window.__TAURI__!.shell.Command('powershell', [
        '-NoProfile', '-EncodedCommand', encodePowerShell(psScript)
    ]);
    const res = await cmd.execute();
    return res.stdout.trim() || "Unknown";
  } catch (e) {
    return "Error";
  }
};

/**
 * Checks if a folder is locked by a process (Primitive check by trying to open/rename logic)
 */
const checkFolderLock = async (path: string): Promise<boolean> => {
  if (!isTauri()) return false;
  // Strategy: Try to rename the folder to itself. If it fails, it's likely in use.
  // Note: This is a heuristic.
  const psScript = `
    $ErrorActionPreference = 'Stop'
    try {
        $path = '${path}'
        if (!(Test-Path $path)) { return $false }
        
        # Test basic write access / lock
        $testFile = Join-Path $path "winlink_lock_test.tmp"
        [System.IO.File]::WriteAllText($testFile, "test")
        Remove-Item $testFile -Force
        
        return $false
    } catch {
        return $true
    }
  `;
  const cmd = new window.__TAURI__!.shell.Command('powershell', ['-EncodedCommand', encodePowerShell(psScript)]);
  const res = await cmd.execute();
  return res.stdout.trim() === 'True';
};

/**
 * Checks available disk space on target
 */
const checkDiskSpace = async (driveLetter: string): Promise<boolean> => {
    if(!isTauri()) return true;
    // Just a placeholder for the concept. Assume true for now or implement Get-Volume.
    return true; 
}

// --- MAIN FUNCTIONS ---

/**
 * Scans both Roaming and Local AppData. Detects Junctions.
 */
export const scanSystemApps = async (driveLabel: string): Promise<AppFolder[]> => {
  if (!isTauri()) {
    console.warn("Web Mode: Returning Mock Data");
    await new Promise(r => setTimeout(r, 800));
    return MOCK_APPS;
  }

  try {
    if (!driveLabel.startsWith("C")) return [];

    // Script scans both Roaming and Local.
    // Identifies if a folder is a ReparsePoint (Junction/Symlink) and where it points.
    const psScript = `
      $ErrorActionPreference = 'SilentlyContinue'
      
      function Get-Apps ($basePath, $isLocal) {
        if (!(Test-Path $basePath)) { return @() }
        $folders = Get-ChildItem -Path $basePath -Directory | Select-Object -First 30
        
        $res = @()
        foreach ($item in $folders) {
            $isJunction = $item.Attributes.HasFlag([System.IO.FileAttributes]::ReparsePoint)
            $target = ""
            if ($isJunction) {
                # Extract target from reparse point
                $target = (Get-Item $item.FullName).Target
            }
            
            $res += @{
                id = $item.Name + ($isLocal ? "_local" : "_roaming")
                name = $item.Name
                sourcePath = $item.FullName
                size = "Calc on Select"
                status = if ($isJunction) { "MOVED" } else { "READY" }
                isJunction = $isJunction
                linkTarget = $target
                isLocal = $isLocal
            }
        }
        return $res
      }

      $roaming = Get-Apps -basePath ([Environment]::GetFolderPath("ApplicationData")) -isLocal $false
      $local   = Get-Apps -basePath ([Environment]::GetFolderPath("LocalApplicationData")) -isLocal $true
      
      ($roaming + $local) | ConvertTo-Json -Compress -Depth 2
    `;

    const cmd = new window.__TAURI__!.shell.Command('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodePowerShell(psScript)
    ]);

    const output = await cmd.execute();
    
    if (output.code === 0) {
      let data = [];
      try {
        data = JSON.parse(output.stdout);
      } catch { return []; }
      
      const arrayData = Array.isArray(data) ? data : [data];
      
      return arrayData.map((item: any) => ({
        id: item.id,
        name: item.name,
        sourcePath: item.sourcePath,
        size: item.size,
        status: item.status as AppStatus,
        isJunction: item.isJunction,
        linkTarget: item.linkTarget,
        isLocal: item.isLocal
      }));
    }
    return [];
  } catch (e) {
    console.error("Scan error", e);
    return [];
  }
};

/**
 * Migration Logic with Safety Checks
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
    // 1. Safety Checks
    onLog("Checking folder locks...", 'info');
    const isLocked = await checkFolderLock(app.sourcePath);
    if (isLocked) {
        onLog("CRITICAL: Folder appears to be in use. Close the application first.", 'error');
        return false;
    }

    // 2. PowerShell Elevation
    const safeSource = app.sourcePath.replace(/'/g, "''");
    const safeTarget = targetPath.replace(/'/g, "''");

    const psScript = `
        $ErrorActionPreference = 'Stop'
        $source = '${safeSource}'
        $target = '${safeTarget}'
        
        # 1. Check Space (Simplified)
        # 2. Create Dir
        if (!(Test-Path $target)) { New-Item -ItemType Directory -Force -Path $target | Out-Null }

        # 3. Robocopy
        Write-Host "ROBOCOPY_START"
        $proc = Start-Process robocopy -ArgumentList "\`"$source\`" \`"$target\`" /MOVE /E /COPYALL /NFL /NDL /NJH /NJS" -Wait -PassThru -NoNewWindow
        if ($proc.ExitCode -ge 8) { throw "Robocopy failed code $($proc.ExitCode)" }

        # 4. Cleanup Source
        if (Test-Path $source) { Remove-Item -Path $source -Force -Recurse }

        # 5. Mklink
        cmd /c mklink /J "\`"$source\`"" "\`"$target\`""
    `;

    try {
        onStatusChange(MoveStep.MkDir);
        onLog("Requesting Admin Access...", 'warning');
        
        const cmd = new window.__TAURI__!.shell.Command('powershell', [
            '-WindowStyle', 'Hidden',
            '-Command',
            `Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodePowerShell(psScript)}'`
        ]);

        const result = await cmd.execute();
        if (result.code === 0) {
            onStatusChange(MoveStep.Done);
            return true;
        } else {
            onLog(`Failed with code ${result.code}`, 'error');
            return false;
        }
    } catch (e) {
        onLog(`Execution Error: ${e}`, 'error');
        return false;
    }
  } else {
    // Web Simulation
    onLog(`[SIMULATION] Checking locks for ${app.name}...`, 'info');
    await new Promise(r => setTimeout(r, 1000));
    
    // Simulate Random Lock Error
    if (Math.random() > 0.9) {
        onLog("Error: Folder is locked by 'Code.exe'", 'error');
        return false;
    }

    onStatusChange(MoveStep.MkDir);
    await new Promise(r => setTimeout(r, 1000));
    onStatusChange(MoveStep.Robocopy);
    onLog(`robocopy "${app.sourcePath}" "${targetPath}" /MOVE`, 'command');
    await new Promise(r => setTimeout(r, 2000));
    onStatusChange(MoveStep.MkLink);
    onLog(`mklink /J "${app.sourcePath}" "${targetPath}"`, 'command');
    await new Promise(r => setTimeout(r, 1000));
    return true;
  }
};

/**
 * Restore Logic: Removes Junction, Moves files back
 */
export const executeRestore = async (
    app: AppFolder,
    onLog: LogCallback,
    onStatusChange: StatusCallback
): Promise<boolean> => {
    
    // If we don't know the target (e.g. freshly scanned without linkTarget), we might need to resolve it first
    // But scanSystemApps now returns linkTarget.
    let targetStorage = app.linkTarget;
    
    if (!targetStorage && isTauri()) {
        onLog("Cannot identify restore source. Please check directory manually.", 'error');
        return false;
    }

    // In web mode, guess a target
    if (!targetStorage && !isTauri()) targetStorage = `D:\\AppData\\${app.name}`;

    if (isTauri()) {
        const safeSource = app.sourcePath.replace(/'/g, "''"); // C:\Users\...\AppData\Roaming\App
        const safeStorage = targetStorage!.replace(/'/g, "''"); // D:\AppData\App

        const psScript = `
            $ErrorActionPreference = 'Stop'
            $junctionPoint = '${safeSource}'
            $storageDir = '${safeStorage}'

            # 1. Remove Junction
            Write-Host "Removing Junction..."
            if ((Get-Item $junctionPoint).Attributes.HasFlag([System.IO.FileAttributes]::ReparsePoint)) {
                Remove-Item $junctionPoint -Force
            } else {
                throw "Path is not a junction point."
            }

            # 2. Move files back
            Write-Host "Moving data back..."
            $proc = Start-Process robocopy -ArgumentList "\`"$storageDir\`" \`"$junctionPoint\`" /MOVE /E /COPYALL /NFL /NDL /NJH /NJS" -Wait -PassThru -NoNewWindow
            if ($proc.ExitCode -ge 8) { throw "Robocopy failed code $($proc.ExitCode)" }
            
            # 3. Cleanup Storage Dir (Robocopy /MOVE leaves empty root)
            if (Test-Path $storageDir) { Remove-Item $storageDir -Force -Recurse }
        `;

        try {
            onStatusChange(MoveStep.Unlink);
            onLog("Restoring: Requesting Admin Access...", 'warning');
            
            const cmd = new window.__TAURI__!.shell.Command('powershell', [
                '-WindowStyle', 'Hidden',
                '-Command',
                `Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodePowerShell(psScript)}'`
            ]);
    
            const result = await cmd.execute();
            if (result.code === 0) {
                onStatusChange(MoveStep.Done);
                return true;
            } else {
                onLog(`Restore failed code ${result.code}`, 'error');
                return false;
            }
        } catch (e) {
            onLog(`Restore Error: ${e}`, 'error');
            return false;
        }

    } else {
        // Web Sim
        onStatusChange(MoveStep.Unlink);
        onLog(`rmdir "${app.sourcePath}" (Removing Junction)`, 'command');
        await new Promise(r => setTimeout(r, 1000));
        
        onStatusChange(MoveStep.RestoreCopy);
        onLog(`robocopy "${targetStorage}" "${app.sourcePath}" /MOVE`, 'command');
        await new Promise(r => setTimeout(r, 2000));
        
        return true;
    }
}