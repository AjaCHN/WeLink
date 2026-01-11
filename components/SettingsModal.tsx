import React, { useState } from 'react';
import { X, Globe, HardDrive, Cpu, ShieldCheck, Zap, Trash2, FileArchive, Moon, Sun } from 'lucide-react';
import { AppSettings, Language, Theme } from '../types';
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

  const isDark = localSettings.theme === 'dark';

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
    <div className={`flex items-start justify-between p-3 rounded-lg transition-colors ${
        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100'
    }`}>
      <div className="flex gap-3">
        {Icon && <div className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Icon size={18} /></div>}
        <div>
          <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</div>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{desc}</div>
        </div>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full relative transition-colors duration-200 mt-1 ${
          checked ? 'bg-blue-600' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
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
      <div className={`border w-full max-w-2xl h-[500px] rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        
        {/* Sidebar */}
        <div className={`w-48 border-r p-4 flex flex-col gap-1 ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-lg font-bold mb-4 px-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.title}</h2>
          
          {[
              { id: 'general', icon: Globe, label: t.categories.general },
              { id: 'migration', icon: HardDrive, label: t.categories.migration },
              { id: 'ai', icon: Cpu, label: t.categories.ai }
          ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                    ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-200 text-blue-600') 
                    : (isDark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')
                }`}
            >
                <tab.icon size={16} />
                {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {activeTab === 'general' && t.categories.general}
              {activeTab === 'migration' && t.categories.migration}
              {activeTab === 'ai' && t.categories.ai}
            </h3>
            <button onClick={onClose} className={`${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'} transition-colors`}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.language}</label>
                  <select 
                    value={localSettings.language}
                    onChange={(e) => setLocalSettings({...localSettings, language: e.target.value as Language})}
                    className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition-colors ${
                        isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-200' 
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="en">English</option>
                    <option value="zh">中文 (简体)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.theme}</label>
                  <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setLocalSettings({...localSettings, theme: 'light'})}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            localSettings.theme === 'light'
                            ? 'bg-white border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-500'
                            : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200')
                        }`}
                      >
                          <Sun size={16} />
                          {t.themeLight}
                      </button>
                      <button
                        onClick={() => setLocalSettings({...localSettings, theme: 'dark'})}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            localSettings.theme === 'dark'
                            ? 'bg-slate-800 border-blue-500 text-blue-400 shadow-sm ring-1 ring-blue-500/50'
                            : (isDark ? 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200')
                        }`}
                      >
                          <Moon size={16} />
                          {t.themeDark}
                      </button>
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
              </div>
            )}
          </div>

          <div className={`p-4 border-t flex justify-end gap-3 ${
              isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}>
             <button 
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
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