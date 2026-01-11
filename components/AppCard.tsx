import React from 'react';
import { AppFolder, AppStatus, MoveStep, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { Folder, ShieldCheck, AlertTriangle, Database, Loader2, ArrowRight, FileText, Check } from 'lucide-react';

interface AppCardProps {
  app: AppFolder;
  isSelected: boolean;
  onSelect: (id: string) => void;
  lang: Language;
}

export const AppCard: React.FC<AppCardProps> = ({ app, isSelected, onSelect, lang }) => {
  const t = TRANSLATIONS[lang];

  const getStatusColor = (status: AppStatus) => {
    switch (status) {
      case AppStatus.Moved: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case AppStatus.Error: return 'text-red-400 border-red-500/30 bg-red-500/5';
      case AppStatus.Moving: return 'text-blue-400 border-blue-500/30 bg-blue-500/5';
      case AppStatus.Analyzing: return 'text-purple-400 border-purple-500/30 bg-purple-500/5';
      default: return 'text-slate-400 border-slate-700/50 bg-slate-800/20';
    }
  };

  const containerBase = `
    relative p-3.5 rounded-xl border transition-all duration-300 cursor-pointer group overflow-hidden
  `;
  
  const containerState = isSelected 
    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
    : 'hover:bg-slate-800/40 hover:border-slate-600/50 hover:shadow-lg';

  const getMovingLabel = (step?: MoveStep) => {
    switch (step) {
      case MoveStep.MkDir: return t.status.preparing;
      case MoveStep.Robocopy: return t.status.copying;
      case MoveStep.MkLink: return t.status.linking;
      default: return t.status.moving;
    }
  };

  return (
    <div 
      onClick={() => app.status === AppStatus.Ready ? onSelect(app.id) : null}
      className={`${containerBase} ${containerState} ${getStatusColor(app.status)}`}
    >
      {/* Background Gradient Mesh for Selected State */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 pointer-events-none" />
      )}

      <div className="relative flex items-start justify-between gap-3.5">
        {/* Icon Container */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 shadow-inner
          ${isSelected 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20 scale-105' 
            : 'bg-slate-800 text-slate-500 group-hover:text-slate-200 group-hover:bg-slate-700'}
        `}>
          {app.status === AppStatus.Moved ? (
             <Check size={20} strokeWidth={3} />
          ) : (
             <Folder size={20} fill={isSelected ? "currentColor" : "none"} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start">
                <h3 className={`font-semibold text-sm truncate tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {app.name}
                </h3>
                {app.status === AppStatus.Moved && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded ml-2 shrink-0">
                        {t.status.movedTag}
                    </span>
                )}
            </div>
            
            <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" title={app.sourcePath}>
                {app.sourcePath}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            {/* Size Badge */}
            <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                isSelected ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' : 'bg-slate-900/40 border-slate-700/50 text-slate-400'
            }`}>
              <Database size={10} />
              <span className="font-mono">{app.size}</span>
            </div>

            {/* AI Badge */}
            {app.aiAnalysis && (
               <div className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border font-medium ${
                 app.safetyScore && app.safetyScore > 80 
                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                 : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
               }`}>
                  {app.safetyScore && app.safetyScore > 80 ? <ShieldCheck size={10} /> : <AlertTriangle size={10} />}
                  <span>{app.safetyScore}%</span>
               </div>
            )}
          </div>
        </div>

        {/* Hover Arrow */}
        {!isSelected && app.status === AppStatus.Ready && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 text-slate-500">
                <ArrowRight size={16} />
            </div>
        )}
      </div>

      {/* Progress Bar Area */}
      {app.status === AppStatus.Moving && (
        <div className="mt-3 relative z-10 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex justify-between items-center text-[9px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1">
                  <Loader2 size={8} className="animate-spin" />
                  {getMovingLabel(app.moveStep)}
              </span>
              <span className="font-mono">{app.progressDetails?.filesCopied || 0} files</span>
          </div>
          <div className="bg-slate-900/50 rounded-full h-1 w-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 animate-[shimmer_2s_infinite] w-[80%]" style={{ backgroundSize: '200% 100%' }} />
          </div>
          <div className="mt-1 text-[9px] text-slate-500 font-mono truncate opacity-60">
              {app.progressDetails?.currentFile || "Initializing..."}
          </div>
        </div>
      )}
    </div>
  );
};