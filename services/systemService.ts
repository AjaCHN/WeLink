import { LogEntry, AppFolder, AppStatus, MoveStep, AppSettings, ProgressDetails } from '../types';
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
      fs?: {
        readTextFile: (filePath: string) => Promise<string>;
        removeFile: (filePath: string) => Promise<void>;
        exists: (filePath: string) => Promise<boolean>;
      }
    };
  }
}

const isTauri = () => !!window.__TAURI__;

type LogCallback = (msg: string, type: LogEntry['type']) => void;
type StatusCallback = (step: MoveStep) => void;
type ProgressCallback = (details: ProgressDetails) => void;

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

export const getEnvironmentCapabilities = () => {
  return {
    isNative: isTauri(),
    version: '1.0.1-stable'
  };
};

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
 * Checks if a folder is locked by a process
 */
const checkFolderLock = async (path: string): Promise<boolean> => {
  if (!isTauri()) return false;
  // Strategy: Try to rename the folder to itself. If it fails, it's likely in use.
  const psScript = `
    $ErrorActionPreference = 'Stop'
    try {
        $path = '${path}'
        if (!(Test-Path $path)) { return $false }
        
        # Test basic write access / lock by creating a dummy file
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
 * Checks if target drive has enough space for the source folder
 */
const checkTargetSpace = async (targetDrive: string, sourcePath: string): Promise<boolean> => {
    if(!isTauri()) return true;

    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $src = '${sourcePath}'
        $drive = '${targetDrive.substring(0, 2)}' # Extract C: or D:
        
        if (!(Test-Path $src)) { return "False" }
        
        # Calculate Source Size
        $srcSize = (Get-ChildItem $src -Recurse -Force | Measure-Object -Property Length -Sum).Sum
        
        # Get Free Space
        $free = (Get-PSDrive -Name $drive[0]).Free
        
        # Require 10% buffer
        if ($free -gt ($srcSize * 1.1)) { "True" } else { "False" }
      `;
      
      const cmd = new window.__TAURI__!.shell.Command('powershell', ['-EncodedCommand', encodePowerShell(psScript)]);
      const res = await cmd.execute();
      return res.stdout.trim() === 'True';
    } catch (e) {
      console.error("Space check failed", e);
      return true; // Allow to proceed if check fails, Robocopy will error eventually
    }
}

/**
 * Helper to get AppData path for log storage
 */
const getAppDataPath = async (): Promise<string> => {
    if (!isTauri()) return "";
    try {
        const cmd = new window.__TAURI__!.shell.Command('powershell', ['-Command', 'Write-Host $env:APPDATA']);
        const out = await cmd.execute();
        return out.stdout.trim();
    } catch {
        return "";
    }
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

    const psScript = `
      $ErrorActionPreference = 'SilentlyContinue'
      
      function Get-Apps ($basePath, $isLocal) {
        if (!(Test-Path $basePath)) { return @() }
        # Increased limit to 50 to find more apps
        $folders = Get-ChildItem -Path $basePath -Directory | Select-Object -First 50
        
        $res = @()
        foreach ($item in $folders) {
            $isJunction = $item.Attributes.HasFlag([System.IO.FileAttributes]::ReparsePoint)
            $target = ""
            if ($isJunction) {
                try {
                  $target = (Get-Item $item.FullName).Target
                } catch { $target = "Unknown" }
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
 * Migration Logic with Safety Checks and Progress Tracking
 */
export const executeMigration = async (
  app: AppFolder,
  targetDrive: string,
  settings: AppSettings,
  onLog: LogCallback,
  onStatusChange: StatusCallback,
  onProgress?: ProgressCallback
): Promise<boolean> => {
  const targetPath = `${targetDrive}\\${app.name}`;

  if (isTauri()) {
    // 1. Check Lock
    onLog("Safety Check: Checking folder locks...", 'info');
    const isLocked = await checkFolderLock(app.sourcePath);
    if (isLocked) {
        onLog("CRITICAL: Folder appears to be in use. Please close the application first.", 'error');
        return false;
    }

    // 2. Check Disk Space
    onLog("Safety Check: Verifying target disk space...", 'info');
    const hasSpace = await checkTargetSpace(targetDrive, app.sourcePath);
    if (!hasSpace) {
        onLog("CRITICAL: Insufficient space on target drive.", 'error');
        return false;
    }

    // 3. Prepare Progress Logging
    const appData = await getAppDataPath();
    const logFile = `${appData}\\winlink_move_${Date.now()}.log`;
    
    // 4. PowerShell Elevation & Execution
    const safeSource = app.sourcePath.replace(/'/g, "''");
    const safeTarget = targetPath.replace(/'/g, "''");
    const safeLogFile = logFile.replace(/'/g, "''");

    // Construct Robocopy arguments
    // /LOG: writes status to file. /TEE outputs to console (for debug)
    let robocopyArgs = `/MOVE /E /COPYALL /NDL /NJH /NJS /LOG:"${safeLogFile}" /TEE`;
    
    if (settings.verifyCopy) {
        onLog("Config: Verification enabled (/V)", 'info');
        robocopyArgs += " /V";
    }

    const psScript = `
        $ErrorActionPreference = 'Stop'
        $source = '${safeSource}'
        $target = '${safeTarget}'
        
        if (!(Test-Path $source)) { throw "Source folder not found" }
        if (!(Test-Path $target)) { New-Item -ItemType Directory -Force -Path $target | Out-Null }

        ${settings.compression ? `
        Write-Host "Enabling NTFS Compression on target..."
        compact /c /s /i "$target" | Out-Null
        ` : ''}

        # Robocopy
        Write-Host "ROBOCOPY_START"
        $proc = Start-Process robocopy -ArgumentList "\`"$source\`" \`"$target\`" ${robocopyArgs}" -Wait -PassThru -NoNewWindow
        
        if ($proc.ExitCode -ge 8) { throw "Robocopy failed code $($proc.ExitCode)" }

        # Cleanup Source
        if (Test-Path $source) { 
           Remove-Item -Path $source -Force -Recurse 
        }

        # Mklink
        cmd /c mklink /J "\`"$source\`"" "\`"$target\`""
    `;

    try {
        onStatusChange(MoveStep.MkDir);
        onLog("Requesting Admin Access for Migration...", 'warning');
        
        // Start Progress Polling
        let progressInterval: number | null = null;
        let processedCount = 0;
        
        if (window.__TAURI__?.fs && onProgress) {
            progressInterval = window.setInterval(async () => {
                try {
                    const exists = await window.__TAURI__!.fs!.exists(logFile);
                    if (exists) {
                        const content = await window.__TAURI__!.fs!.readTextFile(logFile);
                        const lines = content.split('\n');
                        // Robocopy logs "New File" lines
                        const newFileLines = lines.filter(l => l.includes("New File"));
                        const currentCount = newFileLines.length;
                        
                        if (currentCount > processedCount) {
                            processedCount = currentCount;
                            const lastLine = newFileLines[newFileLines.length - 1];
                            // Extract filename (simple regex approximation)
                            // "New File <size> <path>"
                            const match = lastLine.match(/New File\s+\d+\s+(.*)$/);
                            const currentFile = match ? match[1].trim() : "Processing...";
                            
                            onProgress({
                                filesCopied: processedCount,
                                currentFile: currentFile
                            });
                        }
                    }
                } catch (e) {
                    // Ignore read errors (file locking etc)
                }
            }, 500);
        }

        onStatusChange(MoveStep.Robocopy);
        const cmd = new window.__TAURI__!.shell.Command('powershell', [
            '-WindowStyle', 'Hidden',
            '-Command',
            `Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodePowerShell(psScript)}'`
        ]);

        const result = await cmd.execute();
        
        // Cleanup Polling
        if (progressInterval) clearInterval(progressInterval);
        if (window.__TAURI__?.fs) {
             try {
                if (await window.__TAURI__!.fs!.exists(logFile)) {
                   await window.__TAURI__!.fs!.removeFile(logFile);
                }
             } catch {}
        }

        if (result.code === 0) {
            onStatusChange(MoveStep.Done);
            return true;
        } else {
            onLog(`Migration failed with exit code ${result.code}`, 'error');
            return false;
        }
    } catch (e) {
        onLog(`Execution Error: ${e}`, 'error');
        return false;
    }
  } else {
    // Web Simulation
    onLog(`[SIMULATION] Checking locks for ${app.name}...`, 'info');
    await new Promise(r => setTimeout(r, 800));
    
    // Simulate Random Lock Error
    if (Math.random() > 0.9) {
        onLog("Error: Folder is locked by 'Code.exe'", 'error');
        return false;
    }

    onLog(`[SIMULATION] Checking disk space on ${targetDrive}...`, 'info');
    await new Promise(r => setTimeout(r, 500));

    onStatusChange(MoveStep.MkDir);
    if (settings.compression) {
      onLog("Enabling NTFS compression on target...", 'info');
      await new Promise(r => setTimeout(r, 400));
    }

    await new Promise(r => setTimeout(r, 1000));
    
    // Simulate Progress
    onStatusChange(MoveStep.Robocopy);
    onLog(`robocopy "${app.sourcePath}" "${targetPath}" /MOVE ${settings.verifyCopy ? '/V' : ''}`, 'command');
    
    const mockFiles = [
        "data.db", "assets/texture.png", "config/settings.json", "bin/executable.exe", 
        "logs/today.log", "cache/index.tmp", "user/profile.dat", "lib/core.dll"
    ];
    
    for (let i = 0; i < mockFiles.length; i++) {
        await new Promise(r => setTimeout(r, 300)); // Delay per file
        if (onProgress) {
            onProgress({
                filesCopied: i + 1,
                currentFile: mockFiles[i]
            });
        }
    }

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
    
    let targetStorage = app.linkTarget;
    
    if (!targetStorage && isTauri()) {
        onLog("Cannot identify restore source. Please check directory manually.", 'error');
        return false;
    }

    if (!targetStorage && !isTauri()) targetStorage = `D:\\AppData\\${app.name}`;

    if (isTauri()) {
        const safeSource = app.sourcePath.replace(/'/g, "''"); // Link Location
        const safeStorage = targetStorage!.replace(/'/g, "''"); // Real Data Location

        const psScript = `
            $ErrorActionPreference = 'Stop'
            $junctionPoint = '${safeSource}'
            $storageDir = '${safeStorage}'

            # SAFETY CHECK 1: Ensure it is actually a junction
            if (!(Test-Path $junctionPoint)) { throw "Link not found at $junctionPoint" }
            if (!((Get-Item $junctionPoint).Attributes.HasFlag([System.IO.FileAttributes]::ReparsePoint))) {
                throw "Target is not a junction point. Aborting to prevent data loss."
            }

            # SAFETY CHECK 2: Ensure backup data actually exists
            if (!(Test-Path $storageDir)) { 
                throw "Backup data not found at $storageDir. Cannot restore." 
            }

            # 1. Remove Junction
            Write-Host "Removing Junction..."
            Remove-Item $junctionPoint -Force

            # 2. Move files back
            Write-Host "Moving data back..."
            $proc = Start-Process robocopy -ArgumentList "\`"$storageDir\`" \`"$junctionPoint\`" /MOVE /E /COPYALL /NFL /NDL /NJH /NJS" -Wait -PassThru -NoNewWindow
            if ($proc.ExitCode -ge 8) { throw "Robocopy failed code $($proc.ExitCode)" }
            
            # 3. Cleanup Storage Dir
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
                onLog(`Restore failed code ${result.code}. Check if backup data exists.`, 'error');
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