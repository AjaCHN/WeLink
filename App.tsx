import React, { useState, useCallback, useEffect } from 'react';
import { 
  HardDrive, 
  ArrowRightLeft, 
  Cpu, 
  Settings, 
  FolderInput, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Loader2,
  Check,
  Circle,
  Languages,
  Minus,
  Square,
  X,
  Download,
  Github,
  Package,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Undo2
} from 'lucide-react';
import { AppFolder, AppStatus, LogEntry, MoveStep, Language, AppSettings } from './types';
import { TRANSLATIONS } from './translations';
import { MOCK_APPS, TARGET_DRIVES, SOURCE_DRIVES } from './constants';
import { AppCard } from './components/AppCard';
import { TerminalLog } from './components/TerminalLog';
import { SettingsModal } from './components/SettingsModal';
import { analyzeFolderSafety } from './services/geminiService';
import { executeMigration, executeRestore, getEnvironmentCapabilities, scanSystemApps, calculateFolderSize } from './services/systemService';

// Helper component for individual steps with timeline connector
const ProgressStepItem = ({ 
  status, 
  label, 
  subtext,
  isLast = false
}: { 
  status: 'pending' | 'active' | 'completed', 
  label: string,
  subtext?: string,
  isLast?: boolean
}) => (
  <div className="flex gap-4 relative">
    {/* Timeline Line */}
    {!isLast && (
      <div className={`absolute left-[11px] top-7 bottom-[-12px] w-[2px] ${
        status === 'completed' ? 'bg-blue-900/50' : 'bg-slate-800'
      }`} />
    )}
    
    <div className={`mt-0.5 relative z-10 p-1 rounded-full border-2 transition-all duration-300 ${
      status === 'completed' ? 'bg-slate-950 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
      status === 'active' ? 'bg-slate-950 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' :
      'bg-slate-900 border-slate-700 text-slate-700'
    }`}>
      {status === 'completed' && <Check size={12} strokeWidth={3} />}
      {status === 'active' && <Loader2 size={12} className="animate-spin" />}
      {status === 'pending' && <Circle size={12} className="opacity-0" />} 
    </div>
    
    <div className={`flex-1 pb-4 transition-opacity duration-300 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
      <div className={`text-sm font-semibold ${
        status === 'completed' ? 'text-green-400' : 
        status === 'active' ? 'text-blue-400' : 'text-slate-300'
      }`}>
        {label}
      </div>
      {subtext && <div className="text-xs text-slate-500 mt-1 font-mono bg-black/20 px-2 py-1 rounded w-fit">{subtext}</div>}
    </div>
  </div>
);

// Simulated Windows Title Bar
const TitleBar = ({ title }: { title: string }) => (
  <div className="h-9 bg-slate-950/80 backdrop-blur-md flex items-center justify-between select-none w-full border-b border-slate-800/50 z-50" style={{ WebkitAppRegion: 'drag' } as any}>
    <div className="px-4 flex items-center gap-3 text-xs font-medium text-slate-400">
      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm" />
      <span className="tracking-wide opacity-80">{title}</span>
    </div>
    <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button className="w-12 h-full flex items-center justify-center hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
        <Minus size={16} />
      </button>
      <button className="w-12 h-full flex items-center justify-center hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
        <Square size={14} />
      </button>
      <button className="w-12 h-full flex items-center justify-center hover:bg-red-500 hover:text-white text-slate-500 transition-colors">
        <X size={16} />
      </button>
    </div>
  </div>
);

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [sourceDrive, setSourceDrive] = useState<string>(SOURCE_DRIVES[0]);
  const [apps, setApps] = useState<AppFolder[]>(MOCK_APPS);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [targetDrive, setTargetDrive] = useState<string>(TARGET_DRIVES[1]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSimBanner, setShowSimBanner] = useState(true);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'zh',
    verifyCopy: true,
    deleteSource: false,
    autoAnalyze: false,
    theme: 'dark',
    compression: false
  });

  const envInfo = getEnvironmentCapabilities();

  useEffect(() => {
    setLang(settings.language);
  }, [settings.language]);

  useEffect(() => {
    handleSourceDriveChange(SOURCE_DRIVES[0]);
  }, []);

  const t = TRANSLATIONS[lang];

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    setSettings(prev => ({ ...prev, language: newLang }));
  };

  const handleSourceDriveChange = async (newDrive: string) => {
    setSourceDrive(newDrive);
    setIsScanning(true);
    setSelectedAppId(null);
    setApps([]); 
    
    addLog(`Scanning drive ${newDrive}...`, 'command');
    
    try {
      const foundApps = await scanSystemApps(newDrive);
      setApps(foundApps);
      addLog(`Scan complete. Found ${foundApps.length} candidates.`, 'success');
    } catch (e) {
      addLog('Scan failed to complete.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectApp = async (id: string) => {
    if (isProcessing) return;
    setSelectedAppId(id);
    
    const app = apps.find(a => a.id === id);
    if (!app) return;

    // Trigger Real Size Calculation
    if (app.size === "Calc on Select" || app.size === "Unknown") {
      setApps(prev => prev.map(a => a.id === id ? { ...a, size: t.calcSize } : a));
      const realSize = await calculateFolderSize(app.sourcePath);
      setApps(prev => prev.map(a => a.id === id ? { ...a, size: realSize } : a));
    }
    
    // Auto-analyze
    if (settings.autoAnalyze && !app.aiAnalysis && app.status === AppStatus.Ready) {
      setTimeout(() => handleAnalyze(id), 100);
    }
  };

  const handleAnalyze = async (overrideId?: string) => {
    const id = overrideId || selectedAppId;
    if (!id) return;
    
    setIsProcessing(true);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: AppStatus.Analyzing } : a));
    
    const app = apps.find(a => a.id === id);
    if (app) {
      addLog(`Initiating AI safety check for ${app.name}...`, 'info');
      
      const analysis = await analyzeFolderSafety(app.name, app.sourcePath);
      
      addLog(`Gemini Analysis Complete: Risk Level - ${analysis.riskLevel}`, analysis.isSafe ? 'success' : 'warning');
      setApps(prev => prev.map(a => a.id === id ? { 
        ...a, 
        status: AppStatus.Ready,
        aiAnalysis: analysis.reason,
        safetyScore: analysis.riskLevel === 'Low' ? 95 : analysis.riskLevel === 'Medium' ? 70 : 40
      } : a));
    }
    
    setIsProcessing(false);
  };

  const handleMove = async () => {
    if (!selectedAppId) return;
    const app = apps.find(a => a.id === selectedAppId);
    if (!app) return;

    setIsProcessing(true);
    setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Moving, moveStep: MoveStep.MkDir } : a));
    addLog(`Starting migration sequence for ${app.name}...`, 'info');

    const success = await executeMigration(
      app, targetDrive, settings, addLog,
      (step) => setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, moveStep: step } : a))
    );

    if (success) {
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Moved, moveStep: MoveStep.Done } : a));
      addLog(`Migration of ${app.name} completed successfully.`, 'success');
      setSelectedAppId(null);
    } else {
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Error } : a));
      addLog(`Migration failed. Check console.`, 'error');
    }
    setIsProcessing(false);
  };

  const handleRestore = async () => {
    if (!selectedAppId) return;
    const app = apps.find(a => a.id === selectedAppId);
    if (!app) return;

    setIsProcessing(true);
    setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Restoring, moveStep: MoveStep.Unlink } : a));
    addLog(`Starting restore sequence for ${app.name}...`, 'info');

    const success = await executeRestore(
      app, addLog,
      (step) => setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, moveStep: step } : a))
    );

    if (success) {
      // Upon success, it is now "Ready" again in its original location
      setApps(prev => prev.map(a => a.id === selectedAppId ? { 
          ...a, 
          status: AppStatus.Ready, 
          moveStep: MoveStep.Idle,
          isJunction: false,
          linkTarget: undefined
      } : a));
      addLog(`Restoration of ${app.name} completed.`, 'success');
      setSelectedAppId(null);
    } else {
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Error } : a));
      addLog(`Restore failed.`, 'error');
    }
    setIsProcessing(false);
  }

  const handleAddCustom = () => {
    if (!customPath) return;
    const name = customPath.split('\\').pop() || 'Unknown App';
    const newApp: AppFolder = {
      id: Date.now().toString(),
      name: name,
      sourcePath: customPath,
      size: 'Calc on Select',
      status: AppStatus.Ready
    };
    setApps(prev => [...prev, newApp]);
    setCustomPath('');
    addLog(`Added custom path: ${customPath}`, 'info');
  };

  const getStepStatus = (current: MoveStep | undefined, stepToCheck: MoveStep) => {
    if (!current) return 'pending';
    // Define ordering for both Move and Restore
    const moveOrder = [MoveStep.MkDir, MoveStep.Robocopy, MoveStep.MkLink, MoveStep.Done];
    const restoreOrder = [MoveStep.Unlink, MoveStep.RestoreCopy, MoveStep.Done];
    
    // Check if we are restoring or moving
    if (current === MoveStep.Unlink || current === MoveStep.RestoreCopy) {
        const cIdx = restoreOrder.indexOf(current);
        const sIdx = restoreOrder.indexOf(stepToCheck);
        if (cIdx > sIdx) return 'completed';
        if (cIdx === sIdx) return 'active';
        return 'pending';
    }

    const currentIndex = moveOrder.indexOf(current);
    const checkIndex = moveOrder.indexOf(stepToCheck);
    
    if (currentIndex > checkIndex) return 'completed';
    if (currentIndex === checkIndex) return 'active';
    return 'pending';
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden antialiased">
      <TitleBar title={t.appName} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-72 bg-slate-900/50 backdrop-blur border-r border-slate-800 flex flex-col shrink-0 z-20">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
                <ArrowRightLeft size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-white leading-tight">WinLink</h1>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Migration Tool</p>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-1 border border-slate-800/50">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <HardDrive size={12} />
                {t.sourceDrive}
              </div>
              <div className="px-1 pb-1">
                <select 
                  value={sourceDrive}
                  onChange={(e) => handleSourceDriveChange(e.target.value)}
                  disabled={isScanning || isProcessing}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-800/80 disabled:opacity-50"
                >
                  {SOURCE_DRIVES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2 relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 py-2 border-b border-slate-800/50 mb-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.detectedApps}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{apps.length}</span>
            </div>
            
            {isScanning ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                 <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-700 border-t-blue-500" />
                 <span className="text-xs font-medium tracking-wide">{t.scanning}</span>
               </div>
            ) : apps.length === 0 ? (
               <div className="text-center py-12 text-slate-600 text-xs italic">
                 {t.noApps}
               </div>
            ) : (
              apps.map(app => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  isSelected={selectedAppId === app.id} 
                  onSelect={handleSelectApp}
                  lang={lang}
                />
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-gradient-to-t from-slate-900 to-slate-900/50">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.targetDrive}</div>
            <select 
              value={targetDrive}
              onChange={(e) => setTargetDrive(e.target.value)}
              className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-300 outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {TARGET_DRIVES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-950 to-slate-900">
          <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/40 backdrop-blur-sm shrink-0 z-10">
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-sm">
                <Cpu size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Environment</span>
                <span className="text-slate-200">
                  {envInfo.isNative ? 'Native (Tauri)' : 'Web (Simulation)'} • {envInfo.version}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all border border-slate-800 hover:border-slate-700 shadow-sm"
               >
                 <Download size={14} />
                 <span>{t.download}</span>
               </button>
               <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all border border-slate-800 hover:border-slate-700 shadow-sm"
               >
                 <Languages size={14} />
                 <span>{lang === 'en' ? 'EN' : '中'}</span>
               </button>
               <button 
                 onClick={() => setIsSettingsOpen(true)}
                 className="w-9 h-9 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
               >
                 <Settings size={18} />
               </button>
            </div>
          </header>

          <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            
            <div className="col-span-7 flex flex-col gap-6">
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-1.5 shadow-sm flex items-center gap-2">
                 <div className="relative flex-1">
                   <div className="absolute left-3 top-2.5 text-slate-500">
                     <FolderInput size={16} />
                   </div>
                   <input 
                    type="text" 
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder={t.addPath}
                    className="w-full bg-transparent border-none rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:ring-0 placeholder:text-slate-600"
                   />
                 </div>
                 <button 
                  onClick={handleAddCustom}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium text-xs transition-colors border border-slate-700 shadow-sm"
                 >
                   {t.add}
                 </button>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/10 to-blue-900/5 border border-slate-800/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[200px] shadow-inner">
                <div className="bg-slate-900/50 p-4 rounded-full mb-4 border border-slate-800">
                  <Package size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-200 mb-1">Ready to Optimize</h3>
                <p className="text-slate-500 text-sm max-w-xs">Select an application from the sidebar to analyze its portability and migrate data safely.</p>
              </div>

              <div className="flex-1 flex flex-col min-h-[300px]">
                <TerminalLog logs={logs} />
              </div>
            </div>

            <div className="col-span-5 flex flex-col h-full">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 flex flex-col h-full">
                 {!selectedApp ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                     <HardDrive size={48} strokeWidth={1} />
                     <p className="text-sm font-medium tracking-wide">{t.selectPrompt}</p>
                   </div>
                 ) : (
                   <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 border border-slate-700 shadow-lg">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-tight">{selectedApp.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-1 break-all max-w-[200px] opacity-70">
                                    {selectedApp.sourcePath}
                                </p>
                            </div>
                        </div>
                        <div className="text-right bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
                          <div className="text-xl font-light text-blue-400 tabular-nums">{selectedApp.size}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-600">
                            {selectedApp.size === t.calcSize ? t.calcSize : t.realSpace}
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/20 rounded-lg p-3 mb-6 border border-slate-800/50 flex items-center gap-2 text-xs font-mono text-slate-400 overflow-hidden">
                        <span className="shrink-0 text-slate-500">ORIGIN</span>
                        <ChevronRight size={14} className="text-slate-600" />
                        <span className="truncate text-blue-300">
                             {selectedApp.status === AppStatus.Moved && selectedApp.linkTarget 
                              ? selectedApp.linkTarget 
                              : `${targetDrive}\\${selectedApp.name}`}
                        </span>
                      </div>

                      <div className="flex-1">
                         {selectedApp.status === AppStatus.Moving ? (
                           <div className="space-y-1">
                             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pl-1">{t.steps.progress}</div>
                             <div className="pl-2 border-l border-slate-800 space-y-2">
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.MkDir)} label={t.steps.mkdir} />
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.Robocopy)} label={t.steps.copy} subtext="robocopy /MOVE /E" />
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.MkLink)} label={t.steps.link} subtext="mklink /J" isLast={true} />
                             </div>
                           </div>
                         ) : selectedApp.status === AppStatus.Restoring ? (
                           <div className="space-y-1">
                             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pl-1">Restore Progress</div>
                             <div className="pl-2 border-l border-slate-800 space-y-2">
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.Unlink)} label={t.steps.unlink} />
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.RestoreCopy)} label={t.steps.restoreCopy} subtext="robocopy /MOVE" isLast={true} />
                             </div>
                           </div>
                         ) : selectedApp.status === AppStatus.Moved ? (
                           <div className="h-full flex flex-col items-center justify-center p-6 bg-green-500/5 border border-green-500/20 rounded-2xl text-center gap-4">
                             <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-green-500" />
                             </div>
                             <div>
                                <h4 className="text-lg font-bold text-green-400">{t.migrated}</h4>
                                <p className="text-sm text-green-500/60 mt-2">Symbolic link is active.</p>
                             </div>
                             <button 
                                onClick={handleRestore}
                                disabled={isProcessing}
                                className="mt-4 flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                             >
                               {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                               {t.restoreBtn}
                             </button>
                           </div>
                         ) : (
                           <div className="space-y-4">
                             {selectedApp.aiAnalysis && (
                                <div className={`p-4 rounded-xl border ${
                                    selectedApp.safetyScore && selectedApp.safetyScore > 80 
                                    ? 'bg-green-500/5 border-green-500/20' 
                                    : 'bg-yellow-500/5 border-yellow-500/20'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedApp.safetyScore && selectedApp.safetyScore > 80 ? (
                                            <CheckCircle2 size={16} className="text-green-400" />
                                        ) : (
                                            <ShieldAlert size={16} className="text-yellow-400" />
                                        )}
                                        <span className={`text-sm font-bold ${
                                            selectedApp.safetyScore && selectedApp.safetyScore > 80 ? 'text-green-400' : 'text-yellow-400'
                                        }`}>AI Analysis Result</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed opacity-90">
                                        {selectedApp.aiAnalysis}
                                    </p>
                                </div>
                             )}

                             <div className="pt-4 mt-auto">
                                {!selectedApp.aiAnalysis ? (
                                    <button 
                                      onClick={() => handleAnalyze()}
                                      disabled={isProcessing}
                                      className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-xl text-white font-medium transition-all shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      {isProcessing && selectedApp.status === AppStatus.Analyzing ? (
                                        <Loader2 size={18} className="animate-spin text-blue-400" />
                                      ) : (
                                        <Cpu size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                      )}
                                      <span className="relative">{t.analyzeBtn}</span>
                                    </button>
                                ) : (
                                   <div className="grid grid-cols-1 gap-3">
                                     <button 
                                       onClick={handleMove}
                                       disabled={isProcessing}
                                       className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3 active:scale-[0.98]"
                                     >
                                       {isProcessing ? (
                                        <Loader2 size={20} className="animate-spin" />
                                       ) : <Play size={20} fill="currentColor" />}
                                       {t.moveBtn}
                                     </button>
                                   </div>
                                 )}
                             </div>
                           </div>
                         )}
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
        
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          settings={settings}
          onSave={setSettings}
          lang={lang}
        />

        {!envInfo.isNative && showSimBanner && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-2xl z-40 text-xs text-slate-400 animate-in slide-in-from-bottom-10 fade-in duration-700 pr-8">
           <button 
            onClick={() => setShowSimBanner(false)}
            className="absolute top-2 right-2 p-1 hover:bg-slate-700/50 rounded-md text-slate-500 hover:text-white transition-colors"
           >
             <X size={14} />
           </button>
          <div className="flex gap-3 items-start">
            <div className="p-1 bg-blue-500/10 rounded-full">
                <AlertCircle size={16} className="shrink-0 text-blue-400" />
            </div>
            <div>
                <p className="font-semibold text-slate-200 mb