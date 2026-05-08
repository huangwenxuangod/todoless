# todoless

> 说话就能创建任务的桌面应用。

一个语音优先、AI 驱动的任务管理器。按下快捷键，说出你想做的事，todoless 自动将其解析为结构化任务并保存到本地数据库。

## 特性

- **语音创建任务** — 按住 `Ctrl + Shift + Space` 说话，松开后自动转写并解析为任务
- **AI 智能解析** — 自动识别时间、优先级、标签，支持自然语言输入（如"明天下午三点提醒我提交报告"）
- **本地优先** — 所有任务存储在本地 SQLite，离线可用
- **双窗口模式** — 主面板（620 × 760）用于完整管理，浮动 Widget（370 × 300）随时置顶快速查看
- **离线语音识别** — 可选下载 SenseVoice Small 本地模型（~229MB），无需联网即可转写
- **亮色 / 暗色 / 系统主题** — 全量 CSS 变量切换，无缝适配系统外观
- **极简设计** — 自定义无框窗口、暖色调低对比度界面、Framer Motion 微交互动画

## 快速开始

```bash
# 安装依赖
bun install

# 配置 API Key
cp .env.example .env.local
# 编辑 .env.local，填入 OPENROUTER_API_KEY

# 启动开发环境
bun run tauri:dev
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Tauri v2 (Rust) |
| 前端 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS v4 |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| 校验 | Zod |
| 数据库 | SQLite (`@tauri-apps/plugin-sql`) |

## 项目结构

```
src/
  App.tsx              # 主窗口
  WidgetApp.tsx        # 悬浮 Widget 窗口
  main.tsx             # 入口（根据 ?mode=widget 分支渲染）
  styles.css           # 全局设计系统（CSS Variables + Tailwind v4）
  components/          # React 组件
  hooks/               # useVoiceCapture、useDismissableLayer 等
  stores/              # 自定义 useSyncExternalStore 全局状态
  services/            # voiceAgent、db、SenseVoice 模型管理
  types/               # TypeScript 类型与 Zod Schema
  lib/                 # 日期工具、ID 生成器
  data/                # 种子数据
src-tauri/src/lib.rs   # Rust 后端：OpenRouter API、SenseVoice 下载、全局快捷键、托盘
```

## 语音管道

```
用户按住快捷键说话
  -> MediaRecorder 录制音频 (webm/opus)
  -> 停止后调用 transcribe_audio（OpenRouter Whisper）
  -> 调用 plan_tasks（DeepSeek V4 Flash 解析为结构化 JSON）
  -> Zod 校验 -> SQLite 写入
  -> 发射 "tasks-updated" 事件 -> 双窗口同步刷新
```

## 环境变量

在项目根目录创建 `.env.local`：

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_ASR_MODEL=openai/whisper-large-v3-turbo   # 可选
OPENROUTER_TEXT_MODEL=deepseek/deepseek-v4-flash     # 可选
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `bun run tauri:dev` | 启动 Vite + Tauri 开发环境 |
| `bun run check` | TypeScript 类型检查 |
| `bun run tauri:build` | 构建生产版本 |

## 设计系统

- **暗色默认**：`#0e0d0b` 背景，`#f0ece4` 文字，暖灰棕强调色 `#b8a99a`
- **优先级颜色**：P0 灰 / P1 蓝 / P2 黄 / P3 红
- **字体栈**：`-apple-system, BlinkMacSystemFont, "Segoe UI Variable", "HarmonyOS Sans SC", ...`
- **无框窗口**：完全自定义标题栏，支持拖拽移动与系统托盘菜单

## License

Private
