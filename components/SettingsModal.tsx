
import React, { useState } from 'react';
import { X, Globe, HardDrive, Cpu, ShieldCheck, Zap, Trash2, FileArchive } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  lang: Language;
}

type Tab = 'general' | 'migration' | 'ai';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, lang }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const t = TRANSLATIONS[lang].settings;

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const Toggle = ({ 
    checked, 
    onChange, 
    label, 
    desc,
    icon: Icon 
  }: { 
    checked: boolean, 
    onChange: (v: boolean) => void, 
    label: string, 
    desc: string,
    icon?: any
  }) => (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex gap-3">
        {Icon && <div className="mt-1 text-slate-400"><Icon size={18} /></div>}
        <div>
          <div className="text-sm font-medium text-slate-200">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full relative transition-colors duration-200 mt-1 ${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        }`}
      >
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </button>
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl h-[500px] rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-48 bg-slate-950/50 border-r border-slate-800 p-4 flex flex-col gap-1">
          <h2 className="text-lg font-bold text-slate-200 mb-4 px-2">{t.title}</h2>
          
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'general' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Globe size={16} />
            {t.categories.general}
          </button>
          
          <button 
            onClick={() => setActiveTab('migration')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'migration' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <HardDrive size={16} />
            {t.categories.migration}
          </button>
          
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ai' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Cpu size={16} />
            {t.categories.ai}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200">
              {activeTab === 'general' && t.categories.general}
              {activeTab === 'migration' && t.categories.migration}
              {activeTab === 'ai' && t.categories.ai}
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.language}</label>
                  <select 
                    value={localSettings.language}
                    onChange={(e) => setLocalSettings({...localSettings, language: e.target.value as Language})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="zh">中文 (简体)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.theme}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['dark', 'light', 'system'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setLocalSettings({...localSettings, theme: theme as any})}
                        className={`py-2 rounded-lg border text-sm capitalize ${
                          localSettings.theme === theme 
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'migration' && (
              <div className="space-y-2">
                 <Toggle 
                   label={t.verifyCopy}
                   desc={t.verifyCopyDesc}
                   checked={localSettings.verifyCopy}
                   onChange={(v) => setLocalSettings({...localSettings, verifyCopy: v})}
                   icon={ShieldCheck}
                 />
                 <Toggle 
                   label={t.deleteSource}
                   desc={t.deleteSourceDesc}
                   checked={localSettings.deleteSource}
                   onChange={(v) => setLocalSettings({...localSettings, deleteSource: v})}
                   icon={Trash2}
                 />
                 <Toggle 
                   label={t.compression}
                   desc={t.compressionDesc}
                   checked={localSettings.compression}
                   onChange={(v) => setLocalSettings({...localSettings, compression: v})}
                   icon={FileArchive}
                 />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <Toggle 
                   label={t.autoAnalyze}
                   desc={t.autoAnalyzeDesc}
                   checked={localSettings.autoAnalyze}
                   onChange={(v) => setLocalSettings({...localSettings, autoAnalyze: v})}
                   icon={Zap}
                />
                
                <div className="space-y-2 pt-2 border-t border-slate-800/50">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.apiKey}</label>
                  <input 
                    type="password"
                    placeholder="AIzaSy..."
                    value={localSettings.geminiApiKey}
                    onChange={(e) => setLocalSettings({...localSettings, geminiApiKey: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 font-mono"
                  />
                  <p className="text-xs text-slate-500">{t.apiKeyDesc}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
             <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
             >
               {t.cancel}
             </button>
             <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
             >
               {t.save}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
