import { Language } from "./types";

export const TRANSLATIONS = {
  en: {
    appName: "WinLink Migrator",
    appSubtitle: "Symlink Utility",
    sourceDrive: "Source Drive",
    targetDrive: "Target Drive",
    detectedApps: "Detected Apps",
    scanning: "Scanning...",
    noApps: "No Movable Apps Found",
    systemReady: "System Ready",
    addPath: "Add Manual Path",
    add: "Add",
    appData: "Application Data",
    itemsFound: "items found",
    selectPrompt: "Select an application to manage",
    estSpace: "Estimated Space",
    targetDest: "Target Destination",
    migrated: "Data Migrated & Linked",
    analyzeBtn: "Analyze Safety with Gemini",
    analyzed: "Analyzed",
    moveBtn: "Move & Link",
    aiAnalysis: "AI Analysis",
    simulationMode: "Simulation Mode",
    simulationDesc: "Web browsers cannot execute native mklink or robocopy commands. In production, this UI would use Electron/Tauri.",
    download: "Download Client",
    status: {
      preparing: "PREPARING",
      copying: "COPYING",
      linking: "LINKING",
      moving: "MOVING",
      moved: "MOVED"
    },
    steps: {
      mkdir: "Create Directory",
      copy: "Migrate Data",
      link: "Create Junction Link",
      progress: "Operation Progress"
    },
    downloadModal: {
      title: "Get WinLink for Windows",
      desc: "To perform actual file operations (Symbolic Links, Robocopy), this application must run natively on your system.",
      btn: "Download Installer (x64)",
      source: "View Build Instructions",
      version: "Version 1.0.0-beta"
    }
  },
  zh: {
    appName: "WinLink 迁移助手",
    appSubtitle: "符号链接工具",
    sourceDrive: "源磁盘",
    targetDrive: "目标位置",
    detectedApps: "已发现应用",
    scanning: "正在扫描...",
    noApps: "未发现可迁移应用",
    systemReady: "系统就绪",
    addPath: "添加自定义路径",
    add: "添加",
    appData: "应用数据",
    itemsFound: "个项目",
    selectPrompt: "请选择一个应用进行管理",
    estSpace: "预估占用空间",
    targetDest: "目标路径",
    migrated: "数据已迁移并链接",
    analyzeBtn: "使用 Gemini 分析安全性",
    analyzed: "已分析",
    moveBtn: "迁移并创建链接",
    aiAnalysis: "AI 安全分析",
    simulationMode: "模拟模式",
    simulationDesc: "Web 浏览器无法执行原生的 mklink 或 robocopy 命令。在生产环境中，此界面将配合 Electron/Tauri 使用。",
    download: "下载客户端",
    status: {
      preparing: "准备中",
      copying: "复制中",
      linking: "链接中",
      moving: "迁移中",
      moved: "已完成"
    },
    steps: {
      mkdir: "创建目标目录",
      copy: "迁移应用数据",
      link: "创建符号链接 (Junction)",
      progress: "操作进度"
    },
    downloadModal: {
      title: "获取 WinLink Windows 版",
      desc: "要执行实际的文件操作（符号链接、Robocopy），此应用程序必须在您的系统上本地运行。",
      btn: "下载安装包 (x64)",
      source: "查看构建说明",
      version: "版本 1.0.0-beta"
    }
  }
};

export type Translation = typeof TRANSLATIONS.en;