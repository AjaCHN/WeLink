
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
    realSpace: "Real Size",
    calcSize: "Calculating...",
    targetDest: "Target Destination",
    migrated: "Data Migrated & Linked",
    analyzeBtn: "Analyze Safety with Gemini",
    analyzed: "Analyzed",
    moveBtn: "Move & Link",
    restoreBtn: "Restore to Original",
    aiAnalysis: "AI Analysis",
    simulationMode: "Simulation Mode",
    simulationDesc: "Web browsers cannot execute native mklink or robocopy commands. In production, this UI would use Electron/Tauri.",
    download: "Download Client",
    environment: {
      label: "Environment",
      native: "Native (Tauri)",
      web: "Web (Simulation)"
    },
    dashboard: {
      readyTitle: "Ready to Optimize",
      readyDesc: "Select an application from the sidebar to analyze its portability and migrate data safely.",
      origin: "ORIGIN",
      filesProcessed: "Files Processed",
      symlinkActive: "Symbolic link is active.",
      aiResult: "AI Analysis Result",
      closeWindow: "Close Window",
      safe: "Safe"
    },
    errors: {
      locked: "Folder is locked by a running process.",
      noSpace: "Insufficient disk space on target.",
      generic: "Operation failed."
    },
    status: {
      preparing: "PREPARING",
      copying: "COPYING",
      linking: "LINKING",
      moving: "MOVING",
      moved: "MOVED",
      restoring: "RESTORING",
      unlinking: "UNLINKING",
      movedTag: "MOVED"
    },
    steps: {
      mkdir: "Create Directory",
      copy: "Migrate Data",
      link: "Create Junction Link",
      progress: "Operation Progress",
      unlink: "Remove Junction",
      restoreCopy: "Restore Data"
    },
    downloadModal: {
      title: "Get WinLink for Windows",
      desc: "To perform actual file operations (Symbolic Links, Robocopy), this application must run natively on your system.",
      btn: "Download Installer (x64)",
      source: "View Build Instructions",
      version: "Version 1.0.0-beta"
    },
    settings: {
      title: "Settings",
      categories: {
        general: "General",
        migration: "Migration",
        ai: "AI Configuration"
      },
      language: "Language",
      theme: "Theme",
      themes: {
        dark: "Dark",
        light: "Light",
        system: "System"
      },
      verifyCopy: "Verify File Integrity",
      verifyCopyDesc: "Calculate checksums after copy (slower but safer)",
      deleteSource: "Cleanup Source",
      deleteSourceDesc: "Delete original files after successful link (frees up space)",
      compression: "NTFS Compression",
      compressionDesc: "Compress target folder to save disk space",
      autoAnalyze: "Auto-Analyze",
      autoAnalyzeDesc: "Automatically check safety when selecting an app",
      save: "Save Changes",
      cancel: "Cancel"
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
    realSpace: "实际大小",
    calcSize: "计算中...",
    targetDest: "目标路径",
    migrated: "数据已迁移并链接",
    analyzeBtn: "使用 Gemini 分析安全性",
    analyzed: "已分析",
    moveBtn: "迁移并创建链接",
    restoreBtn: "还原到原始位置",
    aiAnalysis: "AI 安全分析",
    simulationMode: "模拟模式",
    simulationDesc: "Web 浏览器无法执行原生的 mklink 或 robocopy 命令。在生产环境中，此界面将配合 Electron/Tauri 使用。",
    download: "下载客户端",
    environment: {
      label: "运行环境",
      native: "原生 (Tauri)",
      web: "Web (模拟)"
    },
    dashboard: {
      readyTitle: "准备优化",
      readyDesc: "从侧边栏选择应用以分析可移植性并安全迁移数据。",
      origin: "源路径",
      filesProcessed: "已处理文件",
      symlinkActive: "符号链接已激活，系统运行正常。",
      aiResult: "AI 分析结果",
      closeWindow: "关闭窗口",
      safe: "安全"
    },
    errors: {
      locked: "文件夹被占用，请关闭相关应用。",
      noSpace: "目标磁盘空间不足。",
      generic: "操作失败。"
    },
    status: {
      preparing: "准备中",
      copying: "复制中",
      linking: "链接中",
      moving: "迁移中",
      moved: "已完成",
      restoring: "还原中",
      unlinking: "断开链接",
      movedTag: "已迁移"
    },
    steps: {
      mkdir: "创建目标目录",
      copy: "迁移应用数据",
      link: "创建符号链接 (Junction)",
      progress: "操作进度",
      unlink: "移除符号链接",
      restoreCopy: "还原数据至 C 盘"
    },
    downloadModal: {
      title: "获取 WinLink Windows 版",
      desc: "要执行实际的文件操作（符号链接、Robocopy），此应用程序必须在您的系统上本地运行。",
      btn: "下载安装包 (x64)",
      source: "查看构建说明",
      version: "版本 1.0.0-beta"
    },
    settings: {
      title: "设置",
      categories: {
        general: "常规",
        migration: "迁移行为",
        ai: "AI 配置"
      },
      language: "界面语言",
      theme: "外观主题",
      themes: {
        dark: "深色",
        light: "浅色",
        system: "跟随系统"
      },
      verifyCopy: "验证文件完整性",
      verifyCopyDesc: "复制后计算校验和（较慢但更安全）",
      deleteSource: "清理源文件",
      deleteSourceDesc: "链接成功后删除原始文件（释放空间）",
      compression: "NTFS 压缩",
      compressionDesc: "压缩目标文件夹以节省磁盘空间",
      autoAnalyze: "自动分析",
      autoAnalyzeDesc: "选中应用时自动检查安全性",
      save: "保存更改",
      cancel: "取消"
    }
  }
};

export type Translation = typeof TRANSLATIONS.en;
