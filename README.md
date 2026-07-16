# Pomodoro Tracker / 番茄事项

[English](#english) · [简体中文](#简体中文)

## English

Pomodoro Tracker is a local-first Electron focus tracker for hierarchical tasks. It combines a
Pomodoro timer, task history, Markdown session notes, dashboards, natural ambient sounds, and a
movable mini timer in one desktop application.

### Highlights

- Organize tasks and sub-tasks at any depth, such as `CS → AI → CS188 → Homework 3`.
- Use global timer defaults or custom focus and break durations for individual tasks.
- Record completed and interrupted sessions with precise dates, times, and durations.
- Add and edit Markdown notes during a focus session or when it finishes.
- Explore day, week, and year dashboards with hierarchical task statistics.
- Search task names and session notes, including regular expressions and date ranges.
- Mix gapless natural ambient sounds while focusing.
- Switch between English and Simplified Chinese at any time.
- Keep all task data and focus history in a local SQLite database.

### Downloads

GitHub Releases provide the following packages:

- Windows x64 NSIS installer
- Windows x86 (32-bit) NSIS installer
- Linux x64 AppImage

The Windows installer supports English and Simplified Chinese and defaults to English. The
application is currently unsigned, so Windows may show a SmartScreen warning.

### Run from source

Requirements: Node.js 22 or newer, npm, and native build tools when a prebuilt
`better-sqlite3` binary is unavailable.

```powershell
npm install
npm start
```

Quality checks:

```powershell
npm run check
npm test
```

### Build packages

Build Windows packages on Windows:

```powershell
npm ci
npm run dist:win:x64
npm run dist:win:ia32
```

Build the AppImage on an x64 Linux host:

```bash
npm ci
npm run dist:linux
chmod +x dist/*.AppImage
```

Because the project uses the native `better-sqlite3` module, build each package on its target
operating system instead of cross-compiling it from another platform.

### Continuous delivery

The `Build and release installers` GitHub Actions workflow runs formatting, lint, and tests, then
builds Windows x64, Windows x86, and Linux x64 AppImage artifacts:

- pushes and pull requests targeting `main` build downloadable workflow artifacts;
- tags matching `v*` also publish all three packages to a GitHub Release;
- the workflow can be started manually from the Actions page.

To publish a release, update the version when needed and push a tag such as `v0.1.0`.

### Architecture and data

- `src/main`: Electron main process, SQLite access, native windows, and IPC.
- `src/preload`: minimal renderer API bridge.
- `src/renderer`: interface, timer, charts, audio, and interactions.
- `test`: automated tests using Node.js's built-in test runner.
- `docs/internationalization.md`: English and Chinese interface contribution rules.

The database is stored under Electron's `userData` directory. On Windows it is normally located
at `%APPDATA%/pomodoro-tracker/pomodoro.sqlite3`. Foreign keys and WAL mode are enabled. Deleting
a parent task cascades to its descendants and related focus records.

---

## 简体中文

番茄事项是一款本地优先的 Electron 专注管理工具，支持任意层级的事项结构，并将番茄钟、专注历史、Markdown 事项记录、数据看板、自然环境声和可移动计时小窗整合在一个桌面应用中。

### 主要功能

- 以任意深度组织事项和子事项，例如 `CS → AI → CS188 → Homework 3`。
- 使用全局默认时间，或为特定事项设置独立的专注与休息时长。
- 记录完整和被打断的专注，包括具体日期、起止时间与实际时长。
- 在专注过程中或结束后填写、修改支持 Markdown 的事项记录。
- 通过日、周、年看板查看包含父子层级关系的统计数据。
- 按名称搜索事项，并通过正则表达式和日期范围搜索事项记录。
- 在专注过程中混合播放无缝衔接的自然环境声。
- 随时切换英文和简体中文界面。
- 所有事项和专注历史均保存在本地 SQLite 数据库中。

### 下载安装

GitHub Releases 提供以下安装文件：

- Windows x64 NSIS 安装程序
- Windows x86（32 位）NSIS 安装程序
- Linux x64 AppImage

Windows 安装程序支持英文和简体中文，并默认选择英文。应用目前没有代码签名，因此 Windows 可能显示 SmartScreen 提示。

### 从源码运行

需要 Node.js 22 或更高版本、npm；如果无法获取 `better-sqlite3` 预编译文件，还需要本机原生编译工具。

```powershell
npm install
npm start
```

执行质量检查：

```powershell
npm run check
npm test
```

### 构建安装包

在 Windows 上构建 Windows 安装程序：

```powershell
npm ci
npm run dist:win:x64
npm run dist:win:ia32
```

在 x64 Linux 主机上构建 AppImage：

```bash
npm ci
npm run dist:linux
chmod +x dist/*.AppImage
```

项目使用了原生模块 `better-sqlite3`，因此各平台安装包应在对应操作系统上构建，不建议跨平台交叉打包。

### 自动构建与发布

`Build and release installers` GitHub Actions 工作流会先运行格式检查、代码检查和测试，然后构建 Windows x64、Windows x86 和 Linux x64 AppImage：

- 推送到 `main` 或向 `main` 提交拉取请求时，会生成可下载的工作流构建产物；
- 推送符合 `v*` 的标签时，还会自动创建 GitHub Release 并上传三个安装包；
- 也可以在 GitHub Actions 页面手动运行工作流。

发布版本时，根据需要更新版本号，然后推送类似 `v0.1.0` 的标签即可。

### 项目结构与数据

- `src/main`：Electron 主进程、SQLite 数据访问、原生窗口和 IPC。
- `src/preload`：最小权限的渲染层 API 桥。
- `src/renderer`：界面、计时器、图表、音频与用户交互。
- `test`：使用 Node.js 内置测试框架的自动化测试。
- `docs/internationalization.md`：中英文界面的开发约定。

数据库保存在 Electron 的 `userData` 目录中，Windows 通常位于 `%APPDATA%/pomodoro-tracker/pomodoro.sqlite3`。数据库开启外键约束和 WAL；删除父事项时，会级联清理子项与相关专注记录。
