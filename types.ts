
export enum AppStatus {
  Ready = 'READY',
  Analyzing = 'ANALYZING',
  Moving = 'MOVING',
  Moved = 'MOVED',
  Error = 'ERROR',
  Restoring = 'RESTORING' // New status
}

export enum MoveStep {
  Idle = 'IDLE',
  MkDir = 'MKDIR',
  Robocopy = 'ROBOCOPY',
  MkLink = 'MKLINK',
  Done = 'DONE',
  // Restore Steps
  Unlink = 'UNLINK',
  RestoreCopy = 'RESTORE_COPY',
  CleanTarget = 'CLEAN_TARGET'
}

export type Language = 'en' | 'zh';
export type Theme = 'dark' | 'light';

export interface ProgressDetails {
  currentFile: string;
  filesCopied: number;
}

export interface AppFolder {
  id: string;
  name: string;
  sourcePath: string;
  size: string;
  status: AppStatus;
  moveStep?: MoveStep;
  safetyScore?: number; // 0-100
  aiAnalysis?: string;
  isJunction?: boolean; // New: Is it already a link?
  linkTarget?: string;  // New: Where does it point to?
  isLocal?: boolean;    // New: Is it inside Local AppData?
  progressDetails?: ProgressDetails; // New: Real-time progress
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  verifyCopy: boolean;
  deleteSource: boolean; // dangerous in real app, simulated here
  autoAnalyze: boolean;
  compression: boolean;
}