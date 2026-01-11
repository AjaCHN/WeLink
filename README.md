<div align="center">

# 🚀 WinLink Migrator

**Intelligent Windows App Data Migration Utility | 智能 Windows 应用数据迁移工具**

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-v1-orange?logo=tauri)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=google-gemini)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=WinLink+Migrator+Dashboard" alt="WinLink Dashboard Preview" width="800" />
  <br>
  <em>(Concept UI Preview / 概念界面预览)</em>
</p>

[English](#-english) | [中文说明](#-中文说明)

</div>

---

<div id="en"></div>

## 📖 Introduction

**WinLink Migrator** is a specialized Windows utility designed to free up space on your primary system drive (C:) by safely moving heavy Application Data folders to a secondary drive. It maintains system stability and application compatibility by automatically creating **Directory Junctions (Symbolic Links)**.

Unlike basic command-line tools, WinLink features a modern, safety-first GUI powered by **Google Gemini AI**. It analyzes target folders before migration to warn against moving critical system components or applications with known hard-coded path dependencies.

## ✨ Key Features

*   **🛡️ AI-Powered Safety Analysis**: Integrates Google Gemini to analyze folder names and paths, providing a risk score and recommendation (Safe/Caution/Unsafe) before you move anything.
*   **🔗 Automated Migration Workflow**:
    *   **Robocopy**: Robust file transfer preserving attributes and timestamps.
    *   **Junction Creation**: Automatically runs `mklink /J` to link the old path to the new location.
    *   **UAC Integration**: Automatically requests administrative privileges when necessary.
*   **🎨 Modern Windows UI**: Built with React and Tailwind CSS, featuring a dark mode aesthetic, native-like title bar, and a terminal-style log window.
*   **🌍 Dual Operation Modes**:
    *   **Web/Simulation Mode**: Safe for testing UI and logic in a browser without touching files.
    *   **Native Mode (Tauri)**: Compiles to a `.exe` for real file system operations.
*   **📊 Real-time Monitoring**: Granular progress tracking for directory creation, file copying, and linking steps.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **UI Framework**: Tailwind CSS, Lucide React (Icons)
*   **Native Container**: [Tauri](https://tauri.app/) (Rust)
*   **AI Integration**: Google GenAI SDK (`gemini-3-flash-preview`)
*   **System Integration**: PowerShell, Robocopy, Mklink

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18+)
*   **Rust** (Required for building the native Windows app) -> [Install Rust](https://www.rust-lang.org/tools/install)
*   **C++ Build Tools** (Visual Studio Build Tools for Windows)
*   **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Development Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/winlink-migrator.git
    cd winlink-migrator
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory (or configure via UI settings):
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run in Web Mode (Simulation)**
    This mode runs in your browser. It **simulates** file operations (delays instead of actual moves).
    ```bash
    npm run dev
    ```

5.  **Run in Native Mode (Tauri)**
    This compiles the Rust backend and launches the actual Windows application window.
    ```bash
    npm run tauri dev
    ```

## 📦 Building for Production

To create a standalone `.exe` or `.msi` installer:

1.  Ensure you have updated the `identifier` in `src-tauri/tauri.conf.json` to be unique.
2.  Run the build command:
    ```bash
    npm run tauri build
    ```
3.  The output files will be located in:
    *   `src-tauri/target/release/bundle/msi/` (Installer)
    *   `src-tauri/target/release/` (Standalone Executable)

## 📐 System Architecture

### Migration Logic (`systemService.ts`)

The core migration logic handles two environments:

1.  **Browser Environment**:
    *   Detects `window.__TAURI__` is missing.
    *   Runs `setTimeout` simulations to demonstrate UI flow.
    *   Useful for frontend development and demos.

2.  **Tauri Environment**:
    *   Detects `window.__TAURI__`.
    *   Constructs a **PowerShell** script that:
        1.  Checks if the target directory exists.
        2.  Executes `robocopy /MOVE /E /COPYALL`.
        3.  Executes `mklink /J` via `cmd.exe`.
    *   **UAC Handling**: The script is wrapped in a `Start-Process -Verb RunAs` command, triggering the Windows UAC prompt so the user can grant Admin rights specifically for the move operation.

### AI Safety Check (`geminiService.ts`)
*   Sends the folder name and path to Google Gemini.
*   The model evaluates against known heuristics (e.g., "Is 'Adobe Common' safe to move?").
*   Returns a JSON object with `riskLevel` and `reason`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div id="cn"></div>

## 🇨🇳 中文说明

**WinLink Migrator** 是一款专业的 Windows 实用工具，旨在通过安全地将大型应用数据文件夹迁移到辅助硬盘，从而释放 C 盘空间。它通过自动创建 **目录联接 (Directory Junctions/符号链接)** 来保持系统稳定性和应用兼容性。

与简单的命令行工具不同，WinLink 拥有由 **Google Gemini AI** 驱动的现代化安全优先界面。在迁移之前，它会分析目标文件夹，针对移动关键系统组件或具有硬编码路径依赖的应用程序发出警告。

## ✨ 核心功能

*   **🛡️ AI 智能安全分析**：集成 Google Gemini 分析文件夹名称和路径，在您操作前提供风险评分和建议（安全/警告/不安全）。
*   **🔗 自动化迁移工作流**：
    *   **Robocopy**：强大的文件传输，保留属性和时间戳。
    *   **创建联接**：自动运行 `mklink /J` 将旧路径链接到新位置。
    *   **UAC 集成**：必要时自动请求管理员权限。
*   **🎨 现代 Windows UI**：使用 React 和 Tailwind CSS 构建，具有深色模式美学、原生风格标题栏和终端风格日志窗口。
*   **🌍 双运行模式**：
    *   **Web/模拟模式**：在浏览器中安全测试 UI 和逻辑，不触及真实文件。
    *   **原生模式 (Tauri)**：编译为 `.exe` 以进行真实的文件系统操作。
*   **📊 实时监控**：细粒度追踪目录创建、文件复制和链接步骤的进度。

## 🛠️ 技术栈

*   **前端**: React 19, TypeScript, Vite
*   **UI 框架**: Tailwind CSS, Lucide React (图标)
*   **原生容器**: [Tauri](https://tauri.app/) (Rust)
*   **AI 集成**: Google GenAI SDK (`gemini-3-flash-preview`)
*   **系统集成**: PowerShell, Robocopy, Mklink

## 🚀 快速开始

###先决条件

*   **Node.js** (v18+)
*   **Rust** (构建原生 Windows 应用需要) -> [安装 Rust](https://www.rust-lang.org/tools/install)
*   **C++ 生成工具** (Visual Studio Build Tools)
*   **Google Gemini API Key** (在 [aistudio.google.com](https://aistudio.google.com/) 获取)

### 开发环境设置

1.  **克隆仓库**
    ```bash
    git clone https://github.com/yourusername/winlink-migrator.git
    cd winlink-migrator
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境**
    在根目录创建 `.env` 文件（或通过 UI 设置配置）：
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **运行 Web 模式 (模拟)**
    此模式在浏览器中运行。它**模拟**文件操作（使用延时而非实际移动）。
    ```bash
    npm run dev
    ```

5.  **运行原生模式 (Tauri)**
    这将编译 Rust 后端并启动实际的 Windows 应用程序窗口。
    ```bash
    npm run tauri dev
    ```

## 📦 构建生产版本

要创建独立的 `.exe` 或 `.msi` 安装程序：

1.  确保已更新 `src-tauri/tauri.conf.json` 中的 `identifier` 为唯一标识符。
2.  运行构建命令：
    ```bash
    npm run tauri build
    ```
3.  输出文件将位于：
    *   `src-tauri/target/release/bundle/msi/` (安装程序)
    *   `src-tauri/target/release/` (独立可执行文件)

## 📐 系统架构

### 迁移逻辑 (`systemService.ts`)

核心迁移逻辑处理两种环境：

1.  **浏览器环境**：
    *   检测到 `window.__TAURI__` 缺失。
    *   运行 `setTimeout` 模拟以演示 UI 流程。
    *   用于前端开发和演示。

2.  **Tauri 环境**：
    *   检测到 `window.__TAURI__`。
    *   构建 **PowerShell** 脚本，该脚本：
        1.  检查目标目录是否存在。
        2.  执行 `robocopy /MOVE /E /COPYALL`。
        3.  通过 `cmd.exe` 执行 `mklink /J`。
    *   **UAC 处理**：脚本被包装在 `Start-Process -Verb RunAs` 命令中，触发 Windows UAC 提示，以便用户专门为移动操作授予管理员权限。

### AI 安全检查 (`geminiService.ts`)
*   将文件夹名称和路径发送给 Google Gemini。
*   模型根据已知启发式规则进行评估（例如，“移动 'Adobe Common' 安全吗？”）。
*   返回包含 `riskLevel`（风险等级）和 `reason`（原因）的 JSON 对象。

## 🤝 贡献

欢迎提交 Pull Request 来改进本项目！

---

Created with ❤️ by [Your Name]
