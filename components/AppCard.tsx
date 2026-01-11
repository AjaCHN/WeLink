import React from 'react';
import { AppFolder, AppStatus, MoveStep, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { Folder, ShieldCheck, AlertTriangle, Database, Loader2, ArrowRight } from 'lucide-react';

interface AppCardProps {
  app: AppFolder;
  isSelected: boolean;
  onSelect: (id: string) => void;
  lang: Language;
}

export const AppCard: React.FC<AppCardProps> = ({ app, isSelected, onSelect, lang }) => {
  const t = TRANSLATIONS[lang];

  const getStatusStyles = (status: AppStatus) => {
    switch (status) {
      case AppStatus.Moved: return 'border-green-500/20 bg-green-500/5 hover:border-green-500/40';
      case AppStatus.Error: return 'border-red-500/20 bg-red-500/5 hover:border-red-500/40';
      case AppStatus.Moving: return 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40';
      case AppStatus.Analyzing: return 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40';
      default: return 'border-transparent bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700';
    }
  };

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
      className={`
        relative p-3 rounded-xl border transition-all duration-200 cursor-pointer group
        ${getStatusStyles(app.status)}
        ${isSelected ? '!bg-blue-600/10 !border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : 'hover:scale-[1.02]'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
          ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}
        `}>
          <Folder size={20} fill={isSelected ? "currentColor" : "none"} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className={`font-medium text-sm truncate ${isSelected ? 'text-blue-100' : 'text-slate-200'}`}>
              {app.name}
            </h3>
            {app.status === AppStatus.Moved && (
               <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">MOVED</span>
            )}
          </div>
          
          <p className="text-[10px] text-slate-500 font-mono truncate opacity-80" title={app.sourcePath}>
            {app.sourcePath}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900/30 px-1.5 py-0.5 rounded border border-slate-700/30">
              <Database size={10} />
              <span>{app.size}</span>
            </div>

            {app.aiAnalysis && (
               <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                 app.safetyScore && app.safetyScore > 80 
                 ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                 : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
               }`}>
                  {app.safetyScore && app.safetyScore > 80 ? <ShieldCheck size={10} /> : <AlertTriangle size={10} />}
                  <span>{app.safetyScore}% Safe</span>
               </div>
            )}
          </div>
        </div>

        {/* Selection Indicator Arrow (Only on hover if not selected) */}
        {!isSelected && app.status === AppStatus.Ready && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-500">
                <ArrowRight size={16} />
            </div>
        )}
      </div>

      {/* Progress Bar for Moving State */}
      {app.status === AppStatus.Moving && (
        <div className="mt-3 bg-slate-900/50 rounded-full h-1.5 w-full overflow-hidden flex">
          <div className="h-full bg-blue-500 animate-pulse w-2/3 rounded-full" />
        </div>
      )}
      
      {app.status === AppStatus.Moving && (
        <div className="absolute top-[-4px] right-[-4px] flex items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
          <Loader2 size={8} className="animate-spin" />
          {getMovingLabel(app.moveStep)}
        </div>
      )}
    </div>
  );
};