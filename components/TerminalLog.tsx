import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Copy } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden font-mono text-sm shadow-inner group">
      <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-500" />
            <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Console Output</span>
        </div>
        <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] sm:text-xs leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="text-slate-600 mb-4 opacity-50">Microsoft Windows [Version 10.0.22631.3296]<br/>(c) Microsoft Corporation. All rights reserved.</div>
        
        {logs.length === 0 && (
          <div className="text-slate-700 italic opacity-50 pl-2 border-l-2 border-slate-800">
            System ready. Waiting for user input...
          </div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 group/line hover:bg-slate-800/30 rounded px-1 py-0.5 -mx-1 transition-colors">
            <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
            <div className="flex-1 break-all">
               {log.type === 'command' && (
                   <span className="text-blue-400 font-bold mr-2 select-none">{'>'}</span>
               )}
               <span className={`
                 ${log.type === 'command' ? 'text-slate-200' :
                   log.type === 'error' ? 'text-red-400' :
                   log.type === 'success' ? 'text-emerald-400' :
                   log.type === 'warning' ? 'text-amber-400' :
                   'text-slate-400'}
               `}>
                 {log.message}
               </span>
            </div>
          </div>
        ))}
        
        {/* Blinking Cursor */}
        <div className="flex items-center gap-2 text-blue-500 mt-2 animate-pulse">
            <span>{'>'}</span>
            <div className="w-2 h-4 bg-blue-500/50"></div>
        </div>
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
};