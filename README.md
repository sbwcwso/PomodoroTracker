# 番茄事项

一个 Windows 优先、可继续扩展到 macOS/Linux 的 Electron 番茄钟。事项支持任意层级，例如 `CS188 → Project 1 → Task 1`；每次完整专注会持久化到本地 SQLite 数据库。

## 运行

```powershell
npm install
npm start
```

质量检查和测试：

```powershell
npm run check
npm test
```

生成 Windows 安装包：`npm run dist:win`。

## 架构

- `src/main`：Electron 主进程、SQLite 数据访问和 IPC。
- `src/preload`：最小权限的渲染层 API 桥。
- `src/renderer`：界面、计时器和用户交互，不直接访问 Node.js。
- `test`：Node.js 内置测试框架的自动化测试。

数据库保存在 Electron 的 `userData` 目录，Windows 通常位于 `%APPDATA%/pomodoro-tracker/pomodoro.sqlite3`。主进程开启外键约束和 WAL，删除父事项时会级联清理子项与对应专注记录。

## 规范

项目采用 Google JavaScript Style 的核心原则（2 空格缩进、清晰命名、严格相等、强制大括号）并通过 ESLint 9 和 Prettier 自动检查。`.vscode` 已推荐 ESLint/Prettier 插件并启用保存时格式化。
