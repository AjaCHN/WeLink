
<div align="center">

# 🚀 WinLink Migrator

**智能 Windows 应用数据迁移工具 | Intelligent App Data Migration Utility**

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=google-gemini)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=WinLink+Dashboard+Preview" alt="WinLink Dashboard Preview" width="800" />
  <br>
  <em>(Concept UI Preview / 概念界面预览)</em>
</p>

[English](#-english) | [中文说明](#-中文说明)

</div>

---

<div id="en"></div>

## 📖 Introduction

**WinLink Migrator** is a modern Windows utility dashboard designed to solve the common "C: Drive Full" problem. It allows users to safely move heavy `AppData` or application folders to a secondary drive while maintaining system compatibility using **Symbolic Links (Junctions)**.

Unlike traditional tools, WinLink integrates **Google Gemini AI** to analyze the safety of moving specific folders, warning users about potential risks (e.g., hardcoded paths or system services) before they act.

> **Note:** This is currently a **Web Proof of Concept (POC)** demonstrating the UI, logic flow, and AI integration. To perform actual file operations, this codebase is designed to be wrapped with **Electron** or **Tauri**.

## ✨ Key Features

*   **🛡️ AI-Powered Safety Analysis**: Uses Google Gemini to analyze folder names and paths, providing a risk score and recommendation before migration.
*   **🔗 Symlink Automation Logic**: visualizes the workflow of `robocopy` (data transfer) and `mklink /J` (junction creation).
*   **🎨 Modern Windows 11 UI**: Built with Tailwind CSS, featuring a dark mode aesthetic, native-like title bar, and terminal logs.
*   **🌍 Internationalization**: Native support for English and Chinese (Simplified).
*   **📊 Real-time Status Tracking**: Granular progress indicators for `MkDir`, `Robocopy`, and `MkLink` steps.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS, Lucide React (Icons)
*   **AI Integration**: Google GenAI SDK (`gemini-3-flash-preview`)
*   **State Management**: React Hooks

## 📐 System Architecture & Specs

### Core Data Flow
The application manages its lifecycle through `AppStatus`:
`READY` -> `ANALYZING` (Gemini AI Check) -> `MOVING` (Execution) -> `MOVED` (Success) or `ERROR`.

The moving process involves granular steps tracked in the UI:
1.  **MKDIR**: Create destination directory.
2.  **ROBOCOPY**: Transfer data preserving attributes.
3.  **MKLINK**: Create Junction point mapping source to destination.

### Directory Structure
```text
src/
├── App.tsx             # Main Application Logic & Layout
├── types.ts            # TypeScript Definitions (AppFolder, LogEntry)
├── constants.ts        # Mock Data & Drive Configuration
├── translations.ts     # i18n Resources (EN/ZH)
├── services/           # Business Logic
│   └── geminiService.ts # Google Gemini AI Integration
└── components/         # UI Components
    ├── AppCard.tsx      # Application Status Card
    └── TerminalLog.tsx  # Simulated Terminal Output
```

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/winlink-migrator.git
    cd winlink-migrator
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root directory:
    ```env
    REACT_APP_API_KEY=your_google_gemini_api_key
    ```
    *(Note: In the current POC, ensure the process.env logic matches your bundler, e.g., Vite or Webpack)*

4.  **Run the App**
    ```bash
    npm start
    ```

## 🔮 Future Roadmap (Native Integration)

To turn this into a fully functional Windows Desktop App:

1.  **File System**: Replace `constants.ts` mock data with Node.js `fs` or Rust `std::fs` to scan real `%APPDATA%`.
2.  **Command Execution**: Replace `setTimeout` simulations in `App.tsx` with `child_process.exec` (Electron) or `Command` (Tauri).
3.  **Privileges**: Implement UAC handling, as `mklink` requires administrative privileges on Windows.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div id="cn"></div>

## 🇨🇳 中文说明

**WinLink Migrator** 是一个现代化的 Windows 实用工具仪表盘，旨在解决 C 盘空间不足的问题。它允许用户将庞大的 `AppData` 或应用文件夹安全迁移到其他分区，并通过创建 **符号链接 (Junctions)** 保持原路径的兼容性。

与传统工具不同，WinLink 集成了 **Google Gemini AI**，用于智能评估迁移特定文件夹的安全性，在用户操作前预警潜在风险（如硬编码路径或系统服务依赖）。

> **注意：** 本项目目前为 **Web 概念验证 (POC)** 版本，用于展示 UI 交互、逻辑流转及 AI 集成。要执行实际的文件操作，需将此代码库通过 **Electron** 或 **Tauri** 进行打包。

## ✨ 核心功能

*   **🛡️ AI 智能安全分析**：调用 Google Gemini 分析文件夹名称和路径，提供风险评分和操作建议。
*   **🔗 自动化流程可视化**：清晰展示 `robocopy`（数据迁移）和 `mklink /J`（创建链接）的工作流。
*   **🎨 Windows 11 风格界面**：基于 Tailwind CSS 构建，拥有深色模式、原生风格标题栏及终端日志窗口。
*   **🌍 多语言支持**：内置中英文切换。
*   **📊 实时状态追踪**：细粒度的进度展示（创建目录 -> 复制数据 -> 创建链接）。

## 🛠️ 技术栈

*   **前端**: React 19, TypeScript
*   **样式**: Tailwind CSS, Lucide React (图标库)
*   **AI 服务**: Google GenAI SDK (`gemini-3-flash-preview`)

## 📐 系统架构与开发规范

### 核心状态流转
应用通过 `AppStatus` 枚举管理生命周期：
`READY` (就绪) -> `ANALYZING` (AI 分析中) -> `MOVING` (迁移执行中) -> `MOVED` (成功) 或 `ERROR` (失败)。

迁移过程包含以下原子操作步骤：
1.  **MKDIR**: 创建目标磁盘目录。
2.  **ROBOCOPY**: 保留属性复制文件数据。
3.  **MKLINK**: 在原位置创建 Junction 软链指向新位置。

### 项目目录结构
```text
src/
├── App.tsx             # 主应用逻辑与布局
├── types.ts            # 类型定义 (AppFolder, LogEntry)
├── constants.ts        # 模拟数据与磁盘配置
├── translations.ts     # 国际化资源 (中/英)
├── services/           # 业务逻辑服务
│   └── geminiService.ts # Google Gemini AI 集成
└── components/         # UI 组件
    ├── AppCard.tsx      # 应用状态卡片
    └── TerminalLog.tsx  # 模拟终端日志
```

## 🧠 开发指南

### 本地运行

1.  克隆仓库并安装依赖 (`npm install`)。
2.  配置环境变量 `REACT_APP_API_KEY` 以启用 AI 功能。
3.  运行 `npm start` 启动开发服务器。

### 生产环境适配 (Native)

若要将本项目打包为可实际使用的 `.exe`，需进行以下改造：

1.  **文件系统**: 使用 Node.js `fs` 模块或 Rust 后端替换 `constants.ts` 中的 Mock 数据，以扫描真实的 `%APPDATA%` 目录。
2.  **命令执行**: 移除 `App.tsx` 中的 `setTimeout` 模拟逻辑，使用 `child_process.spawn` (Electron) 或 `Command` (Tauri) 执行真实系统命令。
3.  **权限管理**: 创建符号链接通常需要管理员权限，需在打包应用中处理 UAC 提权逻辑。

---

Created with ❤️ by [Your Name]
