
export enum AppStatus {
  Ready = 'READY',
  Analyzing = 'ANALYZING',
  Moving = 'MOVING',
  Moved = 'MOVED',
  Error = 'ERROR'
}

export enum MoveStep {
  Idle = 'IDLE',
  MkDir = 'MKDIR',
  Robocopy = 'ROBOCOPY',
  MkLink = 'MKLINK',
  Done = 'DONE'
}

export type Language = 'en' | 'zh';

export interface AppFolder {
  id: string;
  name: string;
  sourcePath: string;
  size: string;
  status: AppStatus;
  moveStep?: MoveStep;
  safetyScore?: number; // 0-100
  aiAnalysis?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

export interface AppSettings {
  language: Language;
  verifyCopy: boolean;
  deleteSource: boolean; // dangerous in real app, simulated here
  autoAnalyze: boolean;
  theme: 'dark' | 'light' | 'system';
  compression: boolean;
}