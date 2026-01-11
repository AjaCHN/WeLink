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
import { AppFolder, AppStatus, LogEntry, MoveStep, Language, AppSettings, Theme } from './types';
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
  isLast = false,
  isDark
}: { 
  status: 'pending' | 'active' | 'completed', 
  label: string,
  subtext?: string,
  isLast?: boolean,
  isDark: boolean
}) => (
  <div className="flex gap-4 relative group">
    {/* Timeline Line */}
    {!isLast && (
      <div className={`absolute left-[11px] top-7 bottom-[-12px] w-[2px] transition-colors duration-500 ${
        status === 'completed' ? 'bg-emerald-500/30' : (isDark ? 'bg-slate-800' : 'bg-slate-200')
      }`} />
    )}
    
    <div className={`mt-0.5 relative z-10 p-1 rounded-full border-2 transition-all duration-300 ${
      status === 'completed' ? (isDark ? 'bg-slate-950 border-emerald-500 text-emerald-500' : 'bg-white border-emerald-500 text-emerald-600') + ' shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-110' :
      status === 'active' ? (isDark ? 'bg-slate-950 border-blue-500 text-blue-500' : 'bg-white border-blue-500 text-blue-600') + ' shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110' :
      (isDark ? 'bg-slate-900 border-slate-700 text-slate-700' : 'bg-slate-100 border-slate-300 text-slate-300')
    }`}>
      {status === 'completed' && <Check size={12} strokeWidth={3} />}
      {status === 'active' && <Loader2 size={12} className="animate-spin" />}
      {status === 'pending' && <Circle size={12} className="opacity-0" />} 
    </div>
    
    <div className={`flex-1 pb-4 transition-all duration-300 ${status === 'pending' ? 'opacity-40 blur-[0.5px]' : 'opacity-100'}`}>
      <div className={`text-sm font-semibold tracking-tight ${
        status === 'completed' ? 'text-emerald-400' : 
        status === 'active' ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-slate-300' : 'text-slate-600')
      }`}>
        {label}
      </div>
      {subtext && (
        <div className={`text-[10px] mt-1 font-mono px-2 py-0.5 rounded border w-fit ${
            isDark ? 'text-slate-500 bg-slate-900/50 border-slate-800' : 'text-slate-500 bg-slate-100 border-slate-200'
        }`}>
            {subtext}
        </div>
      )}
    </div>
  </div>
);

// Simulated Windows Title Bar
const TitleBar = ({ title, isDark }: { title: string, isDark: boolean }) => (
  <div className={`h-9 backdrop-blur-md flex items-center justify-between select-none w-full border-b z-50 transition-colors duration-300 ${
      isDark ? 'bg-slate-950/80 border-slate-800/50' : 'bg-white/80 border-slate-200/50'
  }`} style={{ WebkitAppRegion: 'drag' } as any}>
    <div className="px-4 flex items-center gap-3 text-xs font-medium text-slate-400">
      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
      <span className={`tracking-wide ${isDark ? 'opacity-80' : 'opacity-60 text-slate-600'}`}>{title}</span>
    </div>
    <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button className={`w-12 h-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}>
        <Minus size={16} />
      </button>
      <button className={`w-12 h-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}>
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
    theme: 'dark',
    verifyCopy: true,
    deleteSource: false,
    autoAnalyze: false,
    compression: false
  });

  const envInfo = getEnvironmentCapabilities();

  // Derived state for theme
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    setLang(settings.language);
  }, [settings.language]);

  const t = TRANSLATIONS[lang];

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  }, []);

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

  // Initialize - moved after handleSourceDriveChange is defined
  useEffect(() => {
    handleSourceDriveChange(SOURCE_DRIVES[0]);
  }, []);

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
      app, 
      targetDrive, 
      settings, 
      addLog,
      (step) => setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, moveStep: step } : a)),
      (progress) => setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, progressDetails: progress } : a))
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
    <div className={`flex flex-col h-screen font-sans overflow-hidden antialiased selection:bg-blue-500/30 transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background Ambience */}
      <div className={`fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none ${isDark ? 'opacity-100' : 'opacity-60'}`} />
      <div className={`fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none ${isDark ? 'opacity-100' : 'opacity-60'}`} />

      <TitleBar title={t.appName} isDark={isDark} />
      
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar */}
        <div className={`w-80 backdrop-blur-xl border-r flex flex-col shrink-0 z-20 shadow-2xl transition-colors duration-300 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/60 border-slate-200'
        }`}>
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg border border-white/10">
                  <ArrowRightLeft size={20} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className={`font-bold text-lg tracking-tight leading-none mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>WinLink</h1>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Migrator</p>
              </div>
            </div>

            <div className={`rounded-xl p-1 border shadow-inner ${
                isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-100/50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <HardDrive size={12} />
                {t.sourceDrive}
              </div>
              <div className="px-1 pb-1">
                <select 
                  value={sourceDrive}
                  onChange={(e) => handleSourceDriveChange(e.target.value)}
                  disabled={isScanning || isProcessing}
                  className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50 font-mono ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700/50 text-slate-200 hover:bg-slate-700/80' 
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {SOURCE_DRIVES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2 relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div className={`sticky top-0 backdrop-blur z-10 py-2 border-b mb-2 flex justify-between items-center ${
                isDark ? 'bg-slate-900/95 border-slate-800/50' : 'bg-white/95 border-slate-200/50'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{t.detectedApps}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>{apps.length}</span>
            </div>
            
            {isScanning ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-4">
                 <div className="relative">
                   <div className="absolute inset-0 bg-blue-500 blur opacity-20 animate-pulse" />
                   <div className={`relative p-2 rounded-full border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                     <Loader2 size={24} className="animate-spin text-blue-500" />
                   </div>
                 </div>
                 <span className="text-xs font-medium tracking-wide animate-pulse">{t.scanning}</span>
               </div>
            ) : apps.length === 0 ? (
               <div className={`text-center py-12 text-slate-600 text-xs italic border border-dashed rounded-xl m-2 ${
                   isDark ? 'border-slate-800' : 'border-slate-300 bg-slate-50'
               }`}>
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
                  theme={settings.theme}
                />
              ))
            )}
          </div>

          <div className={`p-4 border-t backdrop-blur-sm ${
              isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'
          }`}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.targetDrive}</div>
            <select 
              value={targetDrive}
              onChange={(e) => setTargetDrive(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition-colors cursor-pointer font-mono shadow-sm ${
                  isDark 
                  ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300' 
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {TARGET_DRIVES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
          <header className="h-16 flex items-center justify-between px-8 bg-transparent shrink-0 z-10">
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-blue-400 shadow-sm backdrop-blur-sm ${
                  isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
              }`}>
                <Cpu size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.environment.label}</span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {envInfo.isNative ? t.environment.native : t.environment.web} <span className="text-slate-600 mx-1">|</span> v{envInfo.version}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setShowDownloadModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border backdrop-blur-sm ${
                    isDark 
                    ? 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:border-slate-600'
                    : 'bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
               >
                 <Download size={14} />
                 <span>{t.download}</span>
               </button>
               <button 
                 onClick={() => setIsSettingsOpen(true)}
                 className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${
                     isDark 
                     ? 'hover:bg-slate-800 text-slate-400 hover:text-white border-transparent hover:border-slate-700' 
                     : 'hover:bg-white text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-200 hover:shadow-sm'
                 }`}
               >
                 <Settings size={16} />
               </button>
            </div>
          </header>

          <div className={`flex-1 p-6 pt-2 grid grid-cols-12 gap-6 overflow-y-auto scrollbar-thin ${
              isDark ? 'scrollbar-thumb-slate-800' : 'scrollbar-thumb-slate-300'
          }`}>
            
            {/* Left Column - Inputs & Logs */}
            <div className="col-span-7 flex flex-col gap-6">
              <div className={`backdrop-blur-md border rounded-xl p-1.5 shadow-sm flex items-center gap-2 transition-all ${
                  isDark 
                  ? 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60' 
                  : 'bg-white/40 border-slate-200 hover:border-blue-200 hover:bg-white/60'
              }`}>
                 <div className="relative flex-1">
                   <div className="absolute left-3 top-2.5 text-slate-500">
                     <FolderInput size={16} />
                   </div>
                   <input 
                    type="text" 
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder={t.addPath}
                    className={`w-full bg-transparent border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-0 font-mono ${
                        isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'
                    }`}
                   />
                 </div>
                 <button 
                  onClick={handleAddCustom}
                  className={`px-4 py-2 rounded-lg font-medium text-xs transition-colors border shadow-sm active:scale-95 ${
                      isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                 >
                   {t.add}
                 </button>
              </div>

              {/* Status Hero / Log Area */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <TerminalLog logs={logs} />
              </div>
            </div>

            {/* Right Column - Active Task Dashboard */}
            <div className="col-span-5 flex flex-col h-full">
              <div className={`rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col h-full ring-1 ${
                  isDark 
                  ? 'bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 ring-white/10' 
                  : 'bg-white/60 backdrop-blur-xl border border-slate-200 ring-black/5'
              }`}>
                 {/* Decorative background for panel */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

                 {!selectedApp ? (
                   <div className={`flex-1 flex flex-col items-center justify-center gap-6 opacity-60 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                     <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center shadow-inner ${
                         isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'
                     }`}>
                        <HardDrive size={40} strokeWidth={1.5} />
                     </div>
                     <div className="text-center">
                        <p className={`text-sm font-medium tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.selectPrompt}</p>
                        <p className={`text-xs mt-2 max-w-[200px] mx-auto leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
                            Select an app from the list to view details, analyze safety, and migrate data.
                        </p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500 z-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-blue-400 border shadow-lg group ${
                                isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-white border-slate-200'
                            }`}>
                                <Package size={28} className="group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedApp.name}</h3>
                                <p className={`text-xs font-mono mt-1 break-all max-w-[200px] opacity-70 border-b border-dashed pb-0.5 inline-block ${
                                    isDark ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-300'
                                }`}>
                                    {selectedApp.sourcePath.split('\\').pop()}
                                </p>
                            </div>
                        </div>
                        <div className={`text-right px-4 py-2 rounded-lg border ${
                            isDark ? 'bg-black/20 border-slate-800/50' : 'bg-slate-100/50 border-slate-200'
                        }`}>
                          <div className="text-2xl font-light text-blue-400 tabular-nums tracking-tighter">{selectedApp.size}</div>
                          <div className={`text-[9px] uppercase font-bold tracking-widest mt-0.5 ${
                              isDark ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            {selectedApp.size === t.calcSize ? t.calcSize : t.realSpace}
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-xl p-4 mb-8 border flex flex-col gap-2 ${
                          isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-white/50 border-slate-200'
                      }`}>
                         <div className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`} />
                            <span className="opacity-60">{t.dashboard.origin}</span>
                         </div>
                         <div className={`pl-4 border-l ml-1 text-xs font-mono truncate ${
                             isDark ? 'border-slate-800 text-slate-300' : 'border-slate-300 text-slate-700'
                         }`}>
                            {selectedApp.sourcePath}
                         </div>
                         
                         <div className={`my-1 border-t border-dashed ${isDark ? 'border-slate-800/50' : 'border-slate-200'}`} />
                         
                         <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="opacity-80">{t.targetDest}</span>
                         </div>
                         <div className={`pl-4 border-l border-blue-900/50 ml-1 text-xs font-mono truncate ${
                             isDark ? 'text-blue-200' : 'text-blue-700'
                         }`}>
                             {selectedApp.status === AppStatus.Moved && selectedApp.linkTarget 
                              ? selectedApp.linkTarget 
                              : `${targetDrive}\\${selectedApp.name}`}
                         </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                         {selectedApp.status === AppStatus.Moving ? (
                           <div className="space-y-6">
                             <div className={`pl-2 border-l space-y-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.MkDir)} label={t.steps.mkdir} isDark={isDark} />
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.Robocopy)} label={t.steps.copy} subtext="robocopy /MOVE /E" isDark={isDark} />
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.MkLink)} label={t.steps.link} subtext="mklink /J" isLast={true} isDark={isDark} />
                             </div>
                             
                             {/* Detailed Progress Feedback */}
                             {selectedApp.progressDetails && (
                                <div className={`mt-auto rounded-xl p-4 border shadow-lg ${
                                    isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'
                                }`}>
                                    <div className={`flex justify-between text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <span className="uppercase tracking-wider font-bold text-[10px]">{t.dashboard.filesProcessed}</span>
                                        <span className="text-blue-400 font-mono text-lg">{selectedApp.progressDetails.filesCopied}</span>
                                    </div>
                                    <div className={`text-[10px] truncate font-mono p-1.5 rounded ${
                                        isDark ? 'text-slate-500 bg-black/20' : 'text-slate-600 bg-slate-100'
                                    }`}>
                                        {selectedApp.progressDetails.currentFile}
                                    </div>
                                </div>
                             )}
                           </div>
                         ) : selectedApp.status === AppStatus.Restoring ? (
                           <div className="space-y-6">
                             <div className={`pl-2 border-l space-y-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.Unlink)} label={t.steps.unlink} isDark={isDark} />
                                <ProgressStepItem status={getStepStatus(selectedApp.moveStep, MoveStep.RestoreCopy)} label={t.steps.restoreCopy} subtext="robocopy /MOVE" isLast={true} isDark={isDark} />
                             </div>
                           </div>
                         ) : selectedApp.status === AppStatus.Moved ? (
                           <div className={`h-full flex flex-col items-center justify-center p-6 border rounded-2xl text-center gap-4 animate-in zoom-in-95 duration-500 ${
                               isDark ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                           }`}>
                             <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] ${
                                 isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'
                             }`}>
                                <CheckCircle2 size={40} className="text-emerald-500" />
                             </div>
                             <div>
                                <h4 className="text-xl font-bold text-emerald-400 tracking-tight">{t.migrated}</h4>
                                <p className={`text-sm mt-2 ${isDark ? 'text-emerald-500/60' : 'text-emerald-600/80'}`}>{t.dashboard.symlinkActive}</p>
                             </div>
                             <button 
                                onClick={handleRestore}
                                disabled={isProcessing}
                                className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors border shadow-lg ${
                                    isDark 
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                             >
                               {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                               {t.restoreBtn}
                             </button>
                           </div>
                         ) : (
                           <div className="space-y-4 h-full flex flex-col">
                             {selectedApp.aiAnalysis && (
                                <div className={`p-4 rounded-xl border backdrop-blur-sm shadow-lg ${
                                    selectedApp.safetyScore && selectedApp.safetyScore > 80 
                                    ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-900/10' : 'bg-emerald-50 border-emerald-200') 
                                    : (isDark ? 'bg-amber-500/5 border-amber-500/20 shadow-amber-900/10' : 'bg-amber-50 border-amber-200')
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedApp.safetyScore && selectedApp.safetyScore > 80 ? (
                                            <CheckCircle2 size={18} className="text-emerald-400" />
                                        ) : (
                                            <ShieldAlert size={18} className="text-amber-400" />
                                        )}
                                        <span className={`text-sm font-bold tracking-wide ${
                                            selectedApp.safetyScore && selectedApp.safetyScore > 80 ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>{t.dashboard.aiResult}</span>
                                    </div>
                                    <p className={`text-xs leading-relaxed opacity-90 pl-6 border-l-2 ${
                                        isDark ? 'text-slate-300 border-white/5' : 'text-slate-700 border-black/5'
                                    }`}>
                                        {selectedApp.aiAnalysis}
                                    </p>
                                </div>
                             )}

                             <div className="mt-auto pt-4">
                                {!selectedApp.aiAnalysis ? (
                                    <button 
                                      onClick={() => handleAnalyze()}
                                      disabled={isProcessing}
                                      className={`w-full py-4 border rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden active:scale-[0.98] ${
                                          isDark 
                                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-600/50 text-white' 
                                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                                      }`}
                                    >
                                      {/* Shimmer effect */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                      
                                      {isProcessing && selectedApp.status === AppStatus.Analyzing ? (
                                        <Loader2 size={18} className="animate-spin text-blue-400" />
                                      ) : (
                                        <Cpu size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                      )}
                                      <span className="relative tracking-wide">{t.analyzeBtn}</span>
                                    </button>
                                ) : (
                                   <div className="grid grid-cols-1 gap-3">
                                     <button 
                                       onClick={handleMove}
                                       disabled={isProcessing}
                                       className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] flex items-center justify-center gap-3 active:scale-[0.98] border border-white/10"
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
        <div className={`fixed bottom-6 right-6 max-w-sm backdrop-blur-md border p-4 rounded-xl shadow-2xl z-40 text-xs animate-in slide-in-from-bottom-10 fade-in duration-700 pr-8 ring-1 ${
            isDark 
            ? 'bg-slate-900/90 border-slate-700/50 text-slate-400 ring-white/5' 
            : 'bg-white/90 border-slate-200 text-slate-600 ring-black/5'
        }`}>
           <button 
            onClick={() => setShowSimBanner(false)}
            className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${
                isDark ? 'hover:bg-slate-700/50 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
            }`}
           >
             <X size={14} />
           </button>
          <div className="flex gap-3 items-start">
            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <AlertCircle size={16} className="shrink-0 text-blue-400" />
            </div>
            <div>
                <p className={`font-semibold mb-1 tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.simulationMode}</p>
                <p className="opacity-80 leading-relaxed">{t.simulationDesc}</p>
            </div>
          </div>
        </div>
        )}

        {showDownloadModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
             <div className={`border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ${
                 isDark ? 'bg-slate-900 border-slate-700 ring-white/10' : 'bg-white border-slate-200 ring-black/5'
             }`}>
                <div className="h-40 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <Package size={80} className="text-white opacity-5 absolute top-[-20px] right-[-20px] rotate-12" />
                  <div className="text-center z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3 border border-white/10">
                        <Download size={32} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{t.downloadModal.title}</h2>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                     <span className={`text-xs font-bold px-2 py-1 rounded border ${
                         isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-slate-100 text-blue-600 border-slate-200'
                     }`}>{t.downloadModal.version}</span>
                     <span className="text-xs text-slate-500 font-mono">x64 / ARM64</span>
                  </div>
                  
                  <p className={`text-sm leading-relaxed mb-8 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t.downloadModal.desc}
                  </p>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        addLog('Initiating download simulation...', 'command');
                        setTimeout(() => addLog('Error: Build artifact not found. Please clone repository and build with Electron.', 'error'), 1000);
                        setShowDownloadModal(false);
                      }}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] border border-white/10"
                    >
                      <Download size={18} />
                      {t.downloadModal.btn}
                    </button>
                    
                    <button 
                      onClick={() => setShowDownloadModal(false)}
                      className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border ${
                          isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Github size={18} />
                      {t.downloadModal.source}
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => setShowDownloadModal(false)} 
                      className="text-slate-500 text-xs hover:text-slate-400 transition-colors"
                    >
                      {t.dashboard.closeWindow}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}