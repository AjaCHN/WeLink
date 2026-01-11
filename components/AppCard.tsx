import React from 'react';
import { AppFolder, AppStatus, MoveStep, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { Folder, ShieldCheck, AlertTriangle, Database, Loader2 } from 'lucide-react';

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
      case AppStatus.Moved: return 'border-green-500/50 bg-green-500/5';
      case AppStatus.Error: return 'border-red-500/50 bg-red-500/5';
      case AppStatus.Moving: return 'border-blue-500/50 bg-blue-500/5';
      case AppStatus.Analyzing: return 'border-purple-500/50 bg-purple-500/5';
      default: return 'border-slate-700 hover:border-slate-500 bg-slate-800';
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
        relative p-4 rounded-lg border transition-all cursor-pointer group
        ${getStatusColor(app.status)}
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-slate-800' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
            <Folder size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">{app.name}</h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]" title={app.sourcePath}>
              {app.sourcePath}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
          <Database size={12} />
          <span>{app.size}</span>
        </div>
      </div>

      {app.aiAnalysis && (
        <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs border border-slate-700/50">
           <div className="flex items-center gap-2 mb-1">
             {app.safetyScore && app.safetyScore > 80 ? (
               <ShieldCheck size={14} className="text-green-400" />
             ) : (
               <AlertTriangle size={14} className="text-yellow-400" />
             )}
             <span className="font-bold text-slate-300">{t.aiAnalysis}</span>
           </div>
           <p className="text-slate-400 leading-relaxed">{app.aiAnalysis}</p>
        </div>
      )}

      {/* Status Overlay */}
      {app.status === AppStatus.Moved && (
        <div className="absolute top-2 right-2">
          <span className="bg-green-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {t.status.moved}
          </span>
        </div>
      )}
      
      {app.status === AppStatus.Moving && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Loader2 size={10} className="animate-spin text-blue-400" />
          <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {getMovingLabel(app.moveStep)}
          </span>
        </div>
      )}
    </div>
  );
};