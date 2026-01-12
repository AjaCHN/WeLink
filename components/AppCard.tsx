import React from 'react';
import { AppFolder, AppStatus, MoveStep, Language, Theme } from '../types';
import { TRANSLATIONS } from '../translations';
import { Folder, ShieldCheck, AlertTriangle, Database, Loader2, ArrowRight, FileText, Check, Link } from 'lucide-react';

interface AppCardProps {
  app: AppFolder;
  isSelected: boolean;
  onSelect: (id: string) => void;
  lang: Language;
  theme: Theme;
}

export const AppCard: React.FC<AppCardProps> = ({ app, isSelected, onSelect, lang, theme }) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const isLinked = app.status === AppStatus.Moved || app.isJunction;

  const getStatusColor = (status: AppStatus) => {
    switch (status) {
      case AppStatus.Moved: 
        return isDark 
          ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' 
          : 'text-emerald-700 border-emerald-300 bg-emerald-50';
      case AppStatus.Error: 
        return isDark 
          ? 'text-red-400 border-red-500/30 bg-red-500/5' 
          : 'text-red-600 border-red-200 bg-red-50';
      case AppStatus.Moving: 
        return isDark 
          ? 'text-blue-400 border-blue-500/30 bg-blue-500/5' 
          : 'text-blue-600 border-blue-200 bg-blue-50';
      case AppStatus.Analyzing: 
        return isDark 
          ? 'text-purple-400 border-purple-500/30 bg-purple-500/5' 
          : 'text-purple-600 border-purple-200 bg-purple-50';
      default: 
        return isDark 
          ? 'text-slate-400 border-slate-700/50 bg-slate-800/20' 
          : 'text-slate-500 border-slate-200 bg-white';
    }
  };

  const containerBase = `
    relative p-3.5 rounded-xl border transition-all duration-300 cursor-pointer group overflow-hidden
  `;
  
  const containerState = isSelected 
    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
    : (isDark 
        ? 'hover:bg-slate-800/40 hover:border-slate-600/50 hover:shadow-lg' 
        : 'hover:bg-white hover:border-blue-200 hover:shadow-md');

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
      onClick={() => app.status === AppStatus.Ready || app.status === AppStatus.Moved ? onSelect(app.id) : null}
      className={`${containerBase} ${containerState} ${getStatusColor(app.status)}`}
    >
      {/* Background Gradient Mesh for Selected State */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 pointer-events-none" />
      )}

      {/* Linked Indicator (Icon in corner) */}
      {isLinked && !isSelected && (
         <div className={`absolute top-0 right-0 p-1.5 rounded-bl-lg border-b border-l ${
            isDark ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-600'
         }`}>
           <Link size={12} strokeWidth={2.5} />
         </div>
      )}

      <div className="relative flex items-start justify-between gap-3.5">
        {/* Icon Container */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 shadow-inner
          ${isSelected 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20 scale-105' 
            : (isDark 
                ? (isLinked ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-200 group-hover:bg-slate-700') 
                : (isLinked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200'))}
        `}>
          {isLinked ? (
             <Link size={20} strokeWidth={2.5} />
          ) : (
             <Folder size={20} fill={isSelected ? "currentColor" : "none"} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start">
                <h3 className={`font-semibold text-sm truncate tracking-tight pr-4 ${isSelected ? 'text-white' : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                {app.name}
                </h3>
            </div>
            
            <p className={`text-[10px] font-mono truncate mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity ${
                isDark ? 'text-slate-500' : 'text-slate-500'
            }`} title={app.sourcePath}>
                {app.sourcePath}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            {/* Size Badge */}
            <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                isSelected 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' 
                    : (isDark 
                        ? 'bg-slate-900/40 border-slate-700/50 text-slate-400' 
                        : 'bg-slate-100 border-slate-200 text-slate-600')
            }`}>
              <Database size={10} />
              <span className="font-mono">{app.size}</span>
            </div>

            {/* AI Badge */}
            {app.aiAnalysis && (
               <div className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border font-medium ${
                 app.safetyScore && app.safetyScore > 80 
                 ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
                 : (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200')
               }`}>
                  {app.safetyScore && app.safetyScore > 80 ? <ShieldCheck size={10} /> : <AlertTriangle size={10} />}
                  <span>{app.safetyScore}%</span>
               </div>
            )}
            
            {/* Status Text for Moved */}
            {isLinked && (
               <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                 isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
               }`}>
                  {t.status.movedTag}
               </div>
            )}
          </div>
        </div>

        {/* Hover Arrow */}
        {!isSelected && app.status === AppStatus.Ready && (
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
                <ArrowRight size={16} />
            </div>
        )}
      </div>

      {/* Progress Bar Area */}
      {app.status === AppStatus.Moving && (
        <div className="mt-3 relative z-10 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className={`flex justify-between items-center text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-blue-300' : 'text-blue-600'
          }`}>
              <span className="flex items-center gap-1">
                  <Loader2 size={8} className="animate-spin" />
                  {getMovingLabel(app.moveStep)}
              </span>
              <span className="font-mono">{app.progressDetails?.filesCopied || 0} files</span>
          </div>
          <div className={`rounded-full h-1 w-full overflow-hidden ${isDark ? 'bg-slate-900/50' : 'bg-slate-200'}`}>
            <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 animate-[shimmer_2s_infinite] w-[80%]" style={{ backgroundSize: '200% 100%' }} />
          </div>
          <div className={`mt-1 text-[9px] font-mono truncate opacity-60 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {app.progressDetails?.currentFile || "Initializing..."}
          </div>
        </div>
      )}
    </div>
  );
};