import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Copy, ChevronDown } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800/80 overflow-hidden font-mono shadow-xl ring-1 ring-black/50">
      <div className="bg-slate-900/50 px-3 py-2 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-800/50 border border-slate-700/50">
                <Terminal size={12} className="text-slate-400" />
            </div>
            <span className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase opacity-80">Output Stream</span>
        </div>
        <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[10px] sm:text-[11px] leading-tight scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="text-slate-600 mb-3 opacity-40 select-none">
            WinLink [Core 1.0.1]<br/>Initialize System... OK
        </div>
        
        {logs.length === 0 && (
          <div className="text-slate-700 italic opacity-40 pl-2 border-l border-slate-800 py-1">
            Ready for instructions...
          </div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 group/line hover:bg-white/5 rounded px-1 py-0.5 -mx-1 transition-colors">
            <span className="text-slate-600 shrink-0 select-none opacity-50 w-14 text-right">
                {log.timestamp.split(' ')[0]}
            </span>
            <div className="flex-1 break-all">
               {log.type === 'command' && (
                   <span className="text-blue-500 font-bold mr-2 select-none">$</span>
               )}
               <span className={`
                 ${log.type === 'command' ? 'text-blue-200' :
                   log.type === 'error' ? 'text-red-400 font-medium' :
                   log.type === 'success' ? 'text-emerald-400' :
                   log.type === 'warning' ? 'text-amber-400' :
                   'text-slate-400'}
               `}>
                 {log.message}
               </span>
            </div>
          </div>
        ))}
        
        <div className="mt-2 h-4 w-full" ref={bottomRef} />
      </div>
    </div>
  );
};