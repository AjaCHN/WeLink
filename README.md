
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

## 🧠 How It Works (Simulation)

Since browsers cannot access the native file system directly, this POC runs in **Simulation Mode**:

1.  **Select App**: Choose a mock application (e.g., Docker, VS Code Extensions).
2.  **Analyze**: The app sends a prompt to **Gemini AI**: *"Is it safe to move [Folder Name]?"*.
3.  **Migrate**: The UI simulates the execution of:
    *   `mkdir "D:\Target\Path"`
    *   `robocopy "C:\Source" "D:\Target" /E /COPYALL /MOVE`
    *   `mklink /J "C:\Source" "D:\Target"`
4.  **Log**: All steps are recorded in the simulated terminal at the bottom.

## 🔮 Future Roadmap (Native Integration)

To turn this into a fully functional Windows Desktop App:

- [ ] **Electron/Tauri Integration**: Wrap the React app to gain access to Node.js `fs` module or Rust backend.
- [ ] **Real File System Scanning**: Replace mock data with actual directory scanning of `%APPDATA%`.
- [ ] **Admin Privileges**: Implement UAC prompting for `mklink` commands.
- [ ] **Rollback Feature**: Automated restoration if the move fails.

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

## 🧠 工作原理 (模拟模式)

由于浏览器无法直接操作本地文件系统，当前 POC 运行在 **模拟模式** 下：

1.  **选择应用**：选择一个模拟应用（如 Docker, VS Code 扩展等）。
2.  **分析**：应用向 **Gemini AI** 发送提示词：*"迁移 [文件夹名] 是否安全？"*。
3.  **迁移**：UI 模拟执行以下 Windows 命令：
    *   `mkdir "D:\Target\Path"`
    *   `robocopy "C:\Source" "D:\Target" /E /COPYALL /MOVE`
    *   `mklink /J "C:\Source" "D:\Target"`
4.  **日志**：所有步骤均记录在底部的模拟终端中。

---

Created with ❤️ by [Your Name]
