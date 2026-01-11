import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden font-mono text-sm shadow-inner">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
        <Terminal size={16} className="text-slate-400" />
        <span className="text-slate-400 text-xs font-semibold tracking-wider">PROCESS LOG</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for operations...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3">
            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
            <span className={`break-all ${
              log.type === 'command' ? 'text-blue-400' :
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'warning' ? 'text-yellow-400' :
              'text-slate-300'
            }`}>
              {log.type === 'command' && <span className="mr-2 text-slate-500">$</span>}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};