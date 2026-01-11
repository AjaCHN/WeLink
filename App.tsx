import React, { useState, useCallback } from 'react';
import { 
  HardDrive, 
  ArrowRightLeft, 
  Cpu, 
  Settings, 
  FolderInput, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Search,
  Loader2,
  Check,
  Circle,
  Languages,
  Minus,
  Square,
  X,
  Download,
  Github,
  Package
} from 'lucide-react';
import { AppFolder, AppStatus, LogEntry, MoveStep, Language } from './types';
import { TRANSLATIONS } from './translations';
import { MOCK_APPS, TARGET_DRIVES, SOURCE_DRIVES, getAppsForDrive } from './constants';
import { AppCard } from './components/AppCard';
import { TerminalLog } from './components/TerminalLog';
import { analyzeFolderSafety } from './services/geminiService';

// Helper component for individual steps
const ProgressStepItem = ({ 
  status, 
  label, 
  subtext 
}: { 
  status: 'pending' | 'active' | 'completed', 
  label: string,
  subtext?: string
}) => (
  <div className={`flex items-start gap-3 p-2 rounded ${status === 'active' ? 'bg-slate-800' : ''}`}>
    <div className={`mt-0.5 shrink-0`}>
      {status === 'completed' && <CheckCircle2 size={18} className="text-green-400" />}
      {status === 'active' && <Loader2 size={18} className="text-blue-400 animate-spin" />}
      {status === 'pending' && <Circle size={18} className="text-slate-600" />}
    </div>
    <div className="flex-1">
      <div className={`text-sm font-medium ${status === 'completed' ? 'text-slate-300' : status === 'active' ? 'text-blue-200' : 'text-slate-500'}`}>
        {label}
      </div>
      {subtext && <div className="text-xs text-slate-500 mt-0.5 font-mono">{subtext}</div>}
    </div>
  </div>
);

// Simulated Windows Title Bar
const TitleBar = ({ title }: { title: string }) => (
  <div className="h-8 bg-slate-900 flex items-center justify-between select-none w-full border-b border-slate-800" style={{ WebkitAppRegion: 'drag' } as any}>
    <div className="px-4 flex items-center gap-2 text-xs text-slate-400">
      <div className="w-3 h-3 rounded-full bg-blue-500/50" />
      <span>{title}</span>
    </div>
    <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button className="w-10 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 transition-colors">
        <Minus size={14} />
      </button>
      <button className="w-10 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 transition-colors">
        <Square size={12} />
      </button>
      <button className="w-10 h-full flex items-center justify-center hover:bg-red-500 hover:text-white text-slate-400 transition-colors">
        <X size={14} />
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
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleSourceDriveChange = async (newDrive: string) => {
    setSourceDrive(newDrive);
    setIsScanning(true);
    setSelectedAppId(null);
    addLog(`Scanning drive ${newDrive}...`, 'command');
    
    setTimeout(() => {
      const foundApps = getAppsForDrive(newDrive);
      setApps(foundApps);
      setIsScanning(false);
      addLog(`Scan complete. Found ${foundApps.length} candidates.`, 'success');
    }, 600);
  };

  const handleSelectApp = (id: string) => {
    if (isProcessing) return;
    setSelectedAppId(id);
  };

  const handleAnalyze = async () => {
    if (!selectedAppId) return;
    
    setIsProcessing(true);
    setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Analyzing } : a));
    
    const app = apps.find(a => a.id === selectedAppId);
    if (app) {
      addLog(`Initiating AI safety check for ${app.name}...`, 'info');
      
      const analysis = await analyzeFolderSafety(app.name, app.sourcePath);
      
      addLog(`Gemini Analysis Complete: Risk Level - ${analysis.riskLevel}`, analysis.isSafe ? 'success' : 'warning');
      addLog(`Recommendation: ${analysis.recommendedAction}`, 'info');

      setApps(prev => prev.map(a => a.id === selectedAppId ? { 
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

    const targetPath = `${targetDrive}\\${app.name}`;

    setIsProcessing(true);
    // Start Moving
    setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Moving, moveStep: MoveStep.MkDir } : a));

    addLog(`Starting migration sequence for ${app.name}`, 'info');
    
    try {
      // Step 1: Create Directory
      addLog(`mkdir "${targetPath}"`, 'command');
      await new Promise(r => setTimeout(r, 1200)); 
      
      // Step 2: Robocopy
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, moveStep: MoveStep.Robocopy } : a));
      addLog(`robocopy "${app.sourcePath}" "${targetPath}" /E /COPYALL /MOVE`, 'command');
      addLog(`Transferring ${app.size} of data...`, 'info');
      await new Promise(r => setTimeout(r, 2500));
      
      // Step 3: Link
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, moveStep: MoveStep.MkLink } : a));
      addLog(`mklink /J "${app.sourcePath}" "${targetPath}"`, 'command');
      await new Promise(r => setTimeout(r, 1000));
      
      addLog(`Junction created successfully -> ${targetPath}`, 'success');

      // Finish
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Moved, moveStep: MoveStep.Done } : a));
      addLog(`Migration of ${app.name} completed successfully.`, 'success');
      setSelectedAppId(null);

    } catch (e) {
      addLog(`Migration failed: ${e}`, 'error');
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, status: AppStatus.Error } : a));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCustom = () => {
    if (!customPath) return;
    const name = customPath.split('\\').pop() || 'Unknown App';
    const newApp: AppFolder = {
      id: Date.now().toString(),
      name: name,
      sourcePath: customPath,
      size: 'Calculated...',
      status: AppStatus.Ready
    };
    setApps(prev => [...prev, newApp]);
    setCustomPath('');
    addLog(`Added custom path: ${customPath}`, 'info');
  };

  const getStepStatus = (current: MoveStep | undefined, stepToCheck: MoveStep) => {
    if (!current) return 'pending';
    const order = [MoveStep.MkDir, MoveStep.Robocopy, MoveStep.MkLink, MoveStep.Done];
    const currentIndex = order.indexOf(current);
    const checkIndex = order.indexOf(stepToCheck);
    
    if (currentIndex > checkIndex) return 'completed';
    if (currentIndex === checkIndex) return 'active';
    return 'pending';
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Native-style Title Bar */}
      <TitleBar title={t.appName} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ArrowRightLeft size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">WinLink</h1>
              <p className="text-xs text-slate-500">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Source Drive Selector */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Search size={12} />
              {t.sourceDrive}
            </div>
            <select 
              value={sourceDrive}
              onChange={(e) => handleSourceDriveChange(e.target.value)}
              disabled={isScanning || isProcessing}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-300 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            >
              {SOURCE_DRIVES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.detectedApps}</div>
            
            {isScanning ? (
               <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                 <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-blue-500" />
                 <span className="text-xs">{t.scanning}</span>
               </div>
            ) : apps.length === 0 ? (
               <div className="text-center py-8 text-slate-600 text-xs italic">
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

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t.targetDrive}</div>
            <select 
              value={targetDrive}
              onChange={(e) => setTargetDrive(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-300 outline-none focus:border-blue-500"
            >
              {TARGET_DRIVES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Cpu size={16} />
              <span>{t.systemReady}</span>
              <span className="mx-2">•</span>
              <span>Windows 11 (23H2)</span>
            </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded text-xs font-medium transition-colors border border-blue-600/20"
               >
                 <Download size={14} />
                 <span>{t.download}</span>
               </button>
               <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-300 transition-colors border border-slate-700"
               >
                 <Languages size={14} />
                 <span>{lang === 'en' ? 'English' : '中文'}</span>
               </button>
               <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                 <Settings size={20} />
               </button>
            </div>
          </header>

          {/* Dashboard Grid */}
          <div className="flex-1 p-8 grid grid-cols-12 gap-8 overflow-y-auto">
            
            {/* Left Column: List & Actions */}
            <div className="col-span-7 flex flex-col gap-6">
              
              {/* Custom Path Input */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                   {t.addPath}
                 </label>
                 <div className="flex gap-2">
                   <div className="relative flex-1">
                     <FolderInput size={18} className="absolute left-3 top-3 text-slate-500" />
                     <input 
                      type="text" 
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      placeholder="C:\Users\Admin\AppData\..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                     />
                   </div>
                   <button 
                    onClick={handleAddCustom}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 rounded-lg font-medium text-sm transition-colors border border-slate-700"
                   >
                     {t.add}
                   </button>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h2 className="text-lg font-semibold text-white">{t.appData}</h2>
                   <span className="text-sm text-slate-500">{apps.length} {t.itemsFound}</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {apps.map(app => (
                    <AppCard 
                      key={app.id} 
                      app={app} 
                      isSelected={selectedAppId === app.id} 
                      onSelect={handleSelectApp}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Inspector & Console */}
            <div className="col-span-5 flex flex-col gap-6 h-full min-h-[500px]">
              
              {/* Action Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden transition-all duration-300">
                 {!selectedApp ? (
                   <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                     <HardDrive size={32} className="opacity-20" />
                     <p>{t.selectPrompt}</p>
                   </div>
                 ) : (
                   <div className="flex flex-col h-full gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{selectedApp.name}</h3>
                          <p className="text-sm text-slate-400 font-mono text-[10px] break-all">
                            {selectedApp.sourcePath}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-light text-blue-400">{selectedApp.size}</div>
                          <div className="text-xs text-slate-500">{t.estSpace}</div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-800 my-2" />

                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-400">{t.targetDest}</span>
                           <span className="text-blue-300 font-mono">{targetDrive}\{selectedApp.name}</span>
                         </div>
                         
                         {selectedApp.status === AppStatus.Moving ? (
                           <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 space-y-2">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.steps.progress}</div>
                             <ProgressStepItem 
                               status={getStepStatus(selectedApp.moveStep, MoveStep.MkDir)}
                               label={t.steps.mkdir}
                             />
                             <ProgressStepItem 
                               status={getStepStatus(selectedApp.moveStep, MoveStep.Robocopy)}
                               label={t.steps.copy}
                               subtext="robocopy /MOVE /E"
                             />
                             <ProgressStepItem 
                               status={getStepStatus(selectedApp.moveStep, MoveStep.MkLink)}
                               label={t.steps.link}
                               subtext="mklink /J"
                             />
                           </div>
                         ) : selectedApp.status === AppStatus.Moved ? (
                           <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                             <CheckCircle2 className="text-green-500" />
                             <span className="text-green-400 font-medium">{t.migrated}</span>
                           </div>
                         ) : (
                           <>
                             {!selectedApp.aiAnalysis ? (
                                <button 
                                  onClick={handleAnalyze}
                                  disabled={isProcessing}
                                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium transition-all flex items-center justify-center gap-2"
                                >
                                  {isProcessing && selectedApp.status === AppStatus.Analyzing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
                                  ) : (
                                    <Cpu size={16} />
                                  )}
                                  {t.analyzeBtn}
                                </button>
                             ) : (
                               <div className="grid grid-cols-2 gap-3">
                                 <button 
                                   disabled className="py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                                 >
                                   <CheckCircle2 size={16} /> {t.analyzed}
                                 </button>
                                 <button 
                                   onClick={handleMove}
                                   disabled={isProcessing}
                                   className="py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                 >
                                   {isProcessing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                   ) : <Play size={16} fill="currentColor" />}
                                   {t.moveBtn}
                                 </button>
                               </div>
                             )}
                           </>
                         )}
                      </div>
                   </div>
                 )}
              </div>

              {/* Terminal Log */}
              <div className="flex-1 min-h-[300px]">
                <TerminalLog logs={logs} />
              </div>

            </div>
          </div>
        </div>
        
        {/* Disclaimer Modal */}
        <div className="fixed bottom-4 right-4 max-w-sm bg-slate-800/90 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-2xl z-40 text-xs text-slate-400">
          <div className="flex gap-2 items-start">
            <AlertCircle size={16} className="shrink-0 text-blue-400 mt-0.5" />
            <p>
              <span className="font-bold text-slate-200">{t.simulationMode}:</span> {t.simulationDesc}
            </p>
          </div>
        </div>

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
                  <Package size={64} className="text-blue-400 opacity-80" />
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                       <h2 className="text-xl font-bold text-white mb-1">{t.downloadModal.title}</h2>
                       <p className="text-xs text-slate-500 font-mono">{t.downloadModal.version}</p>
                     </div>
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {t.downloadModal.desc}
                  </p>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        addLog('Initiating download simulation...', 'command');
                        setTimeout(() => addLog('Error: Build artifact not found. Please clone repository and build with Electron.', 'error'), 1000);
                        setShowDownloadModal(false);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                    >
                      <Download size={18} />
                      {t.downloadModal.btn}
                    </button>
                    
                    <button 
                      onClick={() => setShowDownloadModal(false)}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      <Github size={18} />
                      {t.downloadModal.source}
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => setShowDownloadModal(false)} 
                      className="text-slate-500 text-xs hover:text-slate-300"
                    >
                      Close / 关闭
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