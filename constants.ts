import { AppFolder, AppStatus } from './types';

const C_DRIVE_APPS: AppFolder[] = [
  {
    id: '1',
    name: 'Trae CN',
    sourcePath: 'C:\\Users\\Admin\\AppData\\Roaming\\Trae CN',
    size: '1.2 GB',
    status: AppStatus.Ready
  },
  {
    id: '2',
    name: 'VS Code Extensions',
    sourcePath: 'C:\\Users\\Admin\\.vscode\\extensions',
    size: '4.5 GB',
    status: AppStatus.Ready
  },
  {
    id: '3',
    name: 'Docker Desktop',
    sourcePath: 'C:\\Users\\Admin\\AppData\\Local\\Docker',
    size: '12.8 GB',
    status: AppStatus.Ready
  },
  {
    id: '4',
    name: 'npm Cache',
    sourcePath: 'C:\\Users\\Admin\\AppData\\Roaming\\npm-cache',
    size: '2.1 GB',
    status: AppStatus.Ready
  },
  {
    id: '5',
    name: 'Adobe Common',
    sourcePath: 'C:\\Users\\Admin\\AppData\\Roaming\\Adobe\\Common',
    size: '8.4 GB',
    status: AppStatus.Ready
  }
];

const D_DRIVE_APPS: AppFolder[] = [
  {
    id: 'd1',
    name: 'Steam Library',
    sourcePath: 'D:\\SteamLibrary',
    size: '142.5 GB',
    status: AppStatus.Ready
  },
  {
    id: 'd2',
    name: 'Unity Projects',
    sourcePath: 'D:\\Dev\\Unity',
    size: '15.2 GB',
    status: AppStatus.Ready
  },
  {
    id: 'd3',
    name: 'Blender Cache',
    sourcePath: 'D:\\Temp\\Blender',
    size: '4.1 GB',
    status: AppStatus.Ready
  }
];

export const MOCK_APPS = C_DRIVE_APPS; // Default export for compatibility

export const SOURCE_DRIVES = [
  'C:\\ (System)',
  'D:\\ (Data)',
  'E:\\ (Backup)'
];

export const TARGET_DRIVES = [
  'D:\\AppData',
  'E:\\AppData',
  'F:\\ExternalStore'
];

export const getAppsForDrive = (driveLabel: string): AppFolder[] => {
  if (driveLabel.startsWith('C')) return C_DRIVE_APPS;
  if (driveLabel.startsWith('D')) return D_DRIVE_APPS;
  return [];
};