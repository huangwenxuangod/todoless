# todoless 产品需求文档 (PRD)

> 版本: v0.3.2
> 日期: 2026-05-10
> 状态: 桌面端进入 AI 命令与提醒能力打磨；移动端 Expo 54 基线已打通，继续复用桌面端清单哲学

---

## 1. 产品概述

### 1.1 一句话定义

todoless 是一款**语音优先、AI 驱动、本地优先**的跨平台任务管理工具。用户按住快捷键说话，AI 自动将语音解析为结构化任务并保存。

### 1.2 核心价值主张

- **极速录入**: 说话比打字快 3-5 倍，按住快捷键 → 说话 → 松手 → 任务自动创建
- **AI 智能理解与操控**: 自动识别时间、优先级、标签，也能通过自然语言编辑、完成、删除、提醒和设置重复
- **本地优先**: 所有数据默认存储在本地 SQLite，离线可用，零隐私担忧
- **多端一致**: 桌面端深度体验 + 移动端随时查看/轻录入 + 网页端信息展示；云同步是未来选项，不是当前 MVP 前提

### 1.3 目标用户

- **效率工具爱好者**: 追求极简、快速的任务录入方式
- **多设备办公人群**: 需要在电脑和手机上无缝切换查看任务
- **隐私敏感用户**: 不希望任务数据被云端服务分析或训练

### 1.4 产品形态

| 端 | 路径 | 定位 | 核心场景 | 状态 |
|---|---|---|---|---|
| **桌面端** (Tauri) | `apps/desktop` | 主力工作面板 | 深度管理、语音录入、Widget 浮窗速览 | MVP 主线，持续打磨 |
| **移动端** (Expo) | `apps/app` | 随身伴侣 | 查看任务、勾选完成、移动端轻录入 | 早期实现 |
| **Web 端** (Next.js) | `apps/web` | 品牌门面 | 产品展示、Demo、定价、下载、Waitlist | 已建立 |
| **共享包** | `packages/shared` | 跨端基础层 | 类型、日期规则、ID、设计 tokens | 已建立 |

### 1.5 当前实现边界 (2026-05-09)

已实现或已建骨架：

- Bun workspace：`apps/desktop`、`apps/app`、`apps/web`、`packages/shared`。
- 桌面端使用 Tauri v2 + React + TypeScript，保留主窗口和 widget 两种桌面形态。
- 桌面端任务存储为本地 SQLite，包含 `tasks`、`tags`、`task_tags`、`events`、`recent_context`。
- 任务模型已支持 `repeatRule`，第一版仅包含 `none / daily / weekly`。
- 完成重复任务时采用 TickTick-like 逻辑：保留已完成的当前任务，并自动创建下一次打开任务。
- 桌面端支持 OpenRouter ASR，默认模型 `openai/whisper-large-v3-turbo`。
- 桌面端支持 OpenRouter 文本规划，默认模型 `deepseek/deepseek-v4-flash`。
- 桌面端语音 Agent 已从“只创建任务”扩展为“任务命令层”，支持 create / update / complete / delete / set reminder / set repeat。
- 桌面端已加入右下角 todoless reminder card：支持 Done、Later 15 分钟、dismiss，并在触发时尝试拉起主窗口。
- SenseVoice Small 已有下载/取消/删除/状态查询的模型管理入口，完整本地转录仍需 sidecar 执行层。
- 设置页包含 Theme、General、Voice Model、Account；General 中支持主窗口/widget 分离的 always-on-top、快捷键、关闭行为。
- 移动端已升级到 Expo SDK 54 / React Native 0.81 / React 19.1，接入 Expo Router、Expo SQLite、Zustand，并复用 shared 的任务类型/日期逻辑。
- 移动端 Android export/bundle 已验证通过；当前进入 UI 与交互逻辑设计，不扩展到日记、笔记、复杂日历或项目管理。
- Workspace 已统一为 Bun-only；`bunfig.toml` 使用 hoisted linker，`postinstall` 会运行 `scripts/patch-react-native-bun.mjs` 兼容 React Native 0.81 在 Bun/Windows 下的包布局问题。
- Supabase 初始同步迁移已建立，第一版同步范围为 `tasks / tags / task_tags / sync_state`，暂不同步 `events / recent_context / AI 偏好记忆`。
- Web 端已有 Landing、Demo、Pricing、Download、Waitlist API。

尚未完成或仍需谨慎标注：

- Supabase Auth UI、magic link 登录态、自动后台同步调度尚未接入 UI。
- 本地 SenseVoice sidecar 尚未完成真实转录链路。
- 移动端语音链路仍处早期，不应被视为桌面同等能力。
- 移动端暂不在运行时依赖 `react-native-reanimated` / worklets，除非后续完成原生运行时配置；基础交互优先使用 React Native 原生组件。
- 任务时间编辑器尚未最终定型；HeroUI `TimeInput/DatePicker` 可参考，但产品上更接近滴答清单式自定义时间弹层。

---

## 2. 设计系统: Zen Voice

### 2.1 设计哲学

- **暗色优先**: 默认暗色主题，减少视觉疲劳，专注任务本身
- **暖色调**: 摒弃冷灰，采用纸/烛光般的暖棕色调，营造安静氛围
- **低信息密度**: 留白充足，一次只看必要信息
- **微交互优先**: 每个操作都有轻微反馈，但不喧宾夺主

### 2.2 色彩体系

#### 语义色 (Semantic Colors)

| Token | Dark 模式 | Light 模式 | 用途 |
|-------|-----------|------------|------|
| `--bg` | `#0e0d0b` | `#faf8f5` | 页面背景 |
| `--panel` | `#12110f` | `#f5f3f0` | 面板/卡片背景 |
| `--surface` | `#1a1917` | `#edeae5` | 可交互表面 |
| `--surface-hover` | `#22211e` | `#e5e2dd` | 悬停状态 |
| `--text` | `#f0ece4` | `#1e1c19` | 主文字 |
| `--muted` | `#9c968a` | `#7a756d` | 次要文字 |
| `--faint` | `#6b665e` | `#a9a49c` | 弱化文字/占位符 |
| `--accent` | `#b8a99a` | `#8a7d6e` | 强调色/激活态 |
| `--success` | `#8a9e8a` | `#6a8a6a` | 成功提示 |
| `--error` | `#b87a72` | `#a05a52` | 错误提示 |

#### 优先级色 (Priority Colors)

| 优先级 | Dark | Light | 语义 |
|--------|------|-------|------|
| P0 (无) | `#5a5854` | `#b0aba3` | 灰色，最低关注 |
| P1 (低) | `#5a8ec2` | `#4a7eb2` | 蓝色，普通事项 |
| P2 (中) | `#c9a14d` | `#b8903a` | 黄色，重要/近期 |
| P3 (高) | `#c45a5a` | `#b85050` | 红色，紧急/高后果 |

#### 实现方式

- **桌面端 / 落地页**: CSS Custom Properties (`:root` 暗色默认，`html.light` 覆盖)
- **移动端**: StyleSheet + 共享 `tokens.ts` 常量

### 2.3 字体栈

```
-apple-system, BlinkMacSystemFont, "Segoe UI Variable",
"HarmonyOS Sans SC", "MiSans", "Microsoft YaHei UI", sans-serif
```

- 西文使用系统无衬线字体
- 中文优先使用 HarmonyOS Sans SC / MiSans，回退到微软雅黑
- 全局 `font-synthesis: none`，禁用浏览器自动加粗/倾斜

### 2.4 间距与圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `spacing.xs` | 4px | 图标内边距、细缝 |
| `spacing.sm` | 8px | 紧凑间距 |
| `spacing.md` | 12px | 标准组件间距 |
| `spacing.lg` | 16px | 卡片内边距 |
| `spacing.xl` | 24px | 区块间距 |
| `spacing.xxl` | 32px | 大区块间距 |
| `radii.sm` | 6px | 小按钮、标签 |
| `radii.md` | 10px | 输入框、卡片 |
| `radii.lg` | 14px | 大面板 |
| `radii.full` | 9999px | 胶囊按钮、复选框 |

### 2.5 动画规范

| 场景 | 时长 | 曲线 | 实现 |
|------|------|------|------|
| 任务列表进入/退出 | 200ms | `ease-out` | Framer Motion `layout` |
| 页面切换 | 150ms | `ease-in-out` | Framer Motion `AnimatePresence` |
| 悬停状态 | 120ms | `ease` | CSS `transition` |
| Toast 弹出 | 250ms | `spring` | Framer Motion `spring` |
| 语音录制脉冲 | 1.5s | `ease-in-out` | CSS `@keyframes` 无限循环 |

---

## 3. 桌面端 (Desktop App)

### 3.1 技术栈

- **Framework**: Tauri v2 (Rust) + React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS v4 (CSS-first, 无 `tailwind.config.js`)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State**: 自定义 `useSyncExternalStore` stores
- **Database**: SQLite (`@tauri-apps/plugin-sql`)

### 3.2 窗口模型

#### 主窗口 (Main Window)

- **尺寸**: 620 x 760 (最小 460 x 560)
- **位置**: 居中显示
- **Chrome**: 无原生装饰 (`decorations: false`)，完全自定义标题栏
- **可调整大小**: 是
- **置顶**: 可选 (Settings > General)

#### 浮动 Widget (Widget Window)

- **尺寸**: 370 x 300 (固定最小值)
- **初始状态**: 隐藏，可通过托盘菜单或快捷键唤起
- **位置**: 自由定位，记忆上次位置
- **透明背景**: 是 (`transparent: true`)
- **置顶**: 是 (`alwaysOnTop: true`)
- **任务栏**: 不显示 (`skipTaskbar: true`)
- **Chrome**: 无原生装饰，极简化控件

### 3.3 主窗口页面结构

```
┌────────────────────────────────────┐
│ [tl]    todoless          ─ □ ✕  │  ← WindowChrome (自定义标题栏)
├────────────────────────────────────┤
│  Today ▼              ⚙️           │  ← ViewSwitcher + Settings 按钮
├────────────────────────────────────┤
│  ⭕ Review Q3 report               │  ← TaskList (打开的任务)
│     产品 · 14:00                   │
│  ⭕ Call designer about logo       │
│     设计                           │
│                                    │
│  ── Completed ─────────────────   │  ← 可折叠的已完成区域
│  ✓ Submit expense report           │
│  ✓ Weekly team sync                │
├────────────────────────────────────┤
│        [ 🎤 Ctrl Shift Space ]     │  ← VoiceWidget (底部悬浮)
└────────────────────────────────────┘
```

### 3.4 核心功能模块

#### 3.4.1 任务列表 (TaskList)

- **排序**: 创建时间倒序（新任务在上）
- **打开任务**: 默认展开，显示优先级圆点、标题、标签、时间
- **已完成任务**: 按完成日期分组（今天 / 昨天 / MM/DD），默认折叠
- **交互**:
  - 点击任务主体 → 打开 TaskDetailCard
  - 点击优先级圆点 → 切换完成/未完成
  - 已完成任务有删除线样式

#### 3.4.2 任务详情卡片 (TaskDetailCard)

- **触发**: 点击任务项
- **形式**: 居中弹出卡片 (overlay + blur backdrop)
- **内容**:
  - 顶部: 优先级圆点 + 日期/时间 + 关闭按钮
  - 中部: 任务标题 (大号)
  - 可选: 任务内容 (描述文字)
  - 底部: 标签列表
- **交互**:
  - 点击优先级圆点 → 切换完成状态
  - 点击遮罩层 / 按 Escape → 关闭
  - 日期格式: "May 8, Today, 2:00 PM"

#### 3.4.3 视图切换 (ViewSwitcher)

- **形式**: 左上角下拉按钮，显示当前视图名 + 图标 + 下拉箭头
- **可切换视图**:
  - Today (今天截止)
  - Tomorrow (明天截止)
  - Next 7 Days (未来7天)
  - Inbox (无截止日期)
- **标签过滤**: 选择标签后视图切换为 All，显示该标签下所有任务

#### 3.4.4 语音录入与命令 (VoiceWidget)

- **位置**: 主窗口底部居中悬浮
- **默认状态**: 麦克风图标 + "Ctrl Shift Space" 提示
- **录制中**: 声波动画 + "Listening..."
- **转写中**: "Transcribing..."
- **解析中**: "Turning speech into tasks..."
- **完成**: 显示实际命令结果，如 "Created 3 tasks" / "Updated 1 task" / "Reminder updated"
- **错误**: 红色错误提示 + Toast
- **命令范围**:
  - 创建任务：一次语音最多生成 10 个任务
  - 编辑任务：标题、内容、截止时间、提醒时间、优先级、标签、重复规则
  - 完成任务：支持“把刚才那个完成”“发推特那个标记完成”
  - 删除任务：软删除，保留事件日志用于后续学习
  - 提醒管理：设置、推迟、取消提醒
  - 重复管理：设置 daily / weekly / none

#### 3.4.5 提醒卡片 (ReminderCenter)

- **触发条件**: open task 的 `reminderAt <= now` 且未被当前提醒实例处理。
- **启动补偿**: 启动时回补过去 24 小时内错过的提醒；超过 24 小时不弹。
- **位置**: 桌面端右下角，保持 todoless 暗色卡片风格。
- **动作**:
  - `Done`: 完成任务；如果是 daily / weekly 重复任务，则创建下一次任务。
  - `Later`: 推迟 15 分钟。
  - `X`: 仅关闭当前提醒实例，不修改任务。
  - 点击卡片: 打开任务详情。
- **产品原则**: 提醒是 todoless 核心能力，不只是 OS 通知的包装。桌面端用应用内提醒卡片建立品牌与操作闭环；移动端后续使用本地通知、声音、震动和通知动作。

#### 3.4.6 设置面板 (SettingsModal)

- **形式**: 左侧导航 + 右侧内容的双栏模态框
- **导航项**:
  1. **Theme**: Light / Dark / System 三选一
  2. **General**:
     - Main always on top：主窗口是否置顶，默认关闭
     - Widget always on top：widget 是否置顶，默认开启
     - Global shortcut：默认 `Ctrl + Shift + Space`，按住录音、松开转写
     - Close behavior：`Hide to tray` / `Quit app` 下拉选择
     - Default due time：后台默认值，当前为 `22:00`，不在常规 UI 暴露
  3. **Voice Model**:
     - Remote：OpenRouter Whisper Large V3 Turbo / Whisper 1
     - Local：SenseVoice Small 模型管理，支持 ModelScope / Hugging Face 源
     - Task understanding：DeepSeek V4 Flash
  4. **Account**: 当前为 Local 状态，未来承接云同步/订阅

#### 3.4.7 组件复用约束

为避免 widget、主窗口、移动端不断分叉，后续 UI 修改优先复用以下基础层：

- `DropdownMenu` / `SelectMenu`: 视图切换、设置下拉、模型选择、关闭行为选择。
- `TaskParts`: 任务复选框、优先级样式、标签/时间 meta 行。
- `useScrollVisibility`: 仅滚动时显示滚动条。
- `useDismissableLayer`: 设置页、任务详情卡、菜单弹层的 Escape / 外部点击关闭。
- `packages/shared`: 跨端任务类型、日期视图过滤、ID helper、设计 tokens。

新增 UI 时先检查这些基础层能否复用；只有存在明确交互差异时才添加新的局部 class。

### 3.5 浮动 Widget

Widget 是主窗口的"微缩集成版"，不是独立页面。

```
┌──────────────────────────┐
│ Today ▼           ─ ✕    │  ← 可拖拽标题栏
├──────────────────────────┤
│ ⭕ Review Q3 report      │  ← 滚动任务列表
│ ⭕ Call designer         │
│ ⭕ Buy groceries         │
│                          │
├──────────────────────────┤
│        [ 🎤 ]            │  ← 悬浮语音按钮
└──────────────────────────┘
```

- **标题栏**: Today 下拉切换视图 + 最小化/关闭按钮
- **任务列表**: 显示打开的任务，带优先级颜色、标签（最多1个）、时间
- **语音按钮**: 居中悬浮，点击开始/停止录制
- **右键菜单**: Settings 入口
- **拖拽**: 按住标题栏非按钮区域可拖拽窗口

### 3.6 系统托盘

- **图标**: todoless 品牌图标
- **菜单项**:
  - Show todoless → 显示主窗口
  - Open Widget → 显示 Widget
  - Quit → 退出应用
- **左键点击**: 显示菜单

### 3.7 全局快捷键

- **默认**: `Ctrl + Shift + Space`
- **行为**:
  - **按下**: 开始录音（如果当前窗口是 main 或 widget）
  - **释放**: 停止录音，开始转写和解析
- **可配置**: Settings > General > Global shortcut

## 3.8 重复任务 (Repeat)

### 第一版范围

todoless 只实现最小可用重复规则。`none` 只是内部状态，不作为用户可见选项展示；用户设置重复时只看到 `Daily` 和 `Weekly`。

- `none`: 不重复
- `daily`: 每天重复
- `weekly`: 每周重复

暂不做每工作日、每月、每年、自定义间隔、重复结束日期、跳过本次、完成后 N 天再重复和复杂 RRULE。

### 完成逻辑

采用方案 A：完成当前任务后创建下一条任务。

```text
open daily task due today
  -> user completes it
  -> current task becomes done
  -> app creates a new open task due tomorrow
```

这样可以保留完成历史，同时让下一次任务继续出现在对应日期视图里。

### AI 解析

用户说出“每天”“每日”“每周”“每个星期”等自然语言时，Agent 可以输出 `daily` 或 `weekly` 的 `repeatRule`。没有重复语义时默认 `{"type":"none"}`。

---

## 4. 移动端 (Mobile App)

### 4.1 技术栈

- **Framework**: Expo SDK 54 + React Native 0.81 + React 19.1
- **Router**: Expo Router 6 (文件系统路由)
- **Database**: `expo-sqlite` (本地 SQLite，与桌面端同 schema)
- **Animation**: 先使用 React Native `Pressable` / `Animated` / StyleSheet 状态；`react-native-reanimated` 暂不作为运行时依赖，避免 worklets 原生版本不一致
- **Icons**: `lucide-react-native`
- **State**: Zustand (与桌面端 store 模式一致)
- **Sync**: 未来预留云同步；当前移动端仍以本地 SQLite 为主
- **Styling**: StyleSheet + 共享 design tokens

### 4.2 设计适配原则

- **视觉统一**: 颜色、字体、圆角、间距与桌面端完全一致 (via `tokens.ts`)
- **布局适配**: 移动端任务页以单列任务清单为主；设置页在窄屏保持左右结构，左侧仅展示图标，右侧内容滚动
- **交互适配**: 桌面端的 hover 态改为 press 态，增加触觉反馈 (Haptic Feedback)
- **Voice first**: 移动端主入口不是大输入框，而是一个稳定、显眼、可单手触达的麦克风按钮；文字输入只作为兜底
- **只做清单**: 移动端不做日记、笔记、复杂日历、习惯、团队协作；只围绕 Today / Tomorrow / Inbox / Tags 与任务完成

### 4.3 移动端设计参考: TickTick-like, but Voice-native

从移动端滴答清单参考图和公开产品资料中，todoless 只借鉴清单产品的骨架，而不继承功能膨胀：

- **顶部结构**: hamburger / 当前视图名 / 更多菜单，视图名可切换 Today、Tomorrow、Inbox、Next 7 Days。
- **任务行结构**: 左侧优先级圆形 checkbox，中间标题单行省略，右侧日期/时间；重复、提醒等状态图标弱化处理。
- **任务容器**: 移动端可以使用一块深色任务面板承载列表，提升可扫读性；但 todoless 的主窗口仍要更安静、更少边框。
- **Completed**: 作为折叠入口展示数量，不默认展开，不再重复当前视图名。
- **主操作**: TickTick 使用 `+`；todoless 使用麦克风作为默认主操作。文字添加可藏在长按、二级菜单或底部 sheet 中。
- **导航密度**: 移动端底部导航或左侧图标栏都可以，但必须避免把桌面端的复杂设置/视图完整搬过来。

### 4.4 页面结构

#### 底部导航 (Tab Bar)

```
┌──────────────────────────┐
│  Today                   │  ← 顶部标题 + 视图切换下拉
├──────────────────────────┤
│ ⭕ Review Q3 report      │
│    产品 · 14:00          │
│ ⭕ Call designer         │
│                          │
│                          │
│                          │
├──────────────────────────┤
│  📋    🎤    ⚙️          │  ← Tasks / Voice / Settings, or single-list + floating mic
└──────────────────────────┘
```

当前待定的移动端结构有两种候选：

1. **单清单 + 悬浮麦克风**: 顶部视图切换，主体任务列表，右下角麦克风。这最接近桌面 widget 与 TickTick 移动端。
2. **底部 Tab**: Today / Inbox / Settings 三个主入口，中间保留麦克风主操作。更传统，但会削弱 voice-first 心智。

已确认采用方案 1 的变体：底部只保留 `Tasks` 与 `Settings`，`Tasks` 内部通过顶部 `Today ▼` 切换 `Today / Tomorrow / Next 7 Days / Inbox / Tags`。麦克风固定在右下角，不作为 Tab。

#### 任务列表页

- **下拉刷新**: 触发 Supabase 同步
- **左滑**: 删除任务 (带动画)
- **右滑**: 标记完成 (带动画)
- **点击**: 进入任务详情页
- **长按**: 弹出优先级/标签编辑菜单

#### 任务详情页

- **路由**: `/task/[id]`
- **内容**:
  - 优先级选择器 (横向滚动的 P0-P3 圆点)
  - 标题 (可编辑)
  - 内容/备注 (可编辑)
  - 截止日期选择器 (原生日期选择器)
  - 提醒时间选择器
  - 标签管理 (添加/移除)
- **操作**: 保存、删除

#### 语音录入

- **形式**: 底部小录音条或半高 sheet，避免全屏聊天感
- **交互**:
  1. 按住麦克风按钮 → 开始录音 + 声波动画
  2. 松开 → 停止录音
  3. 自动跳转 "Thinking..." 状态
  4. 解析完成后直接创建任务
  5. Toast / inline insert 提示创建结果

默认不做确认预览，保持和桌面端一致：允许猜错，但纠错必须快。

已确认的移动端语音规则：

- 主按钮固定右下角。
- 按住录音，松开提交。
- 支持松开取消 / 取消态（第一版可用长按拖动取消或取消按钮实现）。
- 录音反馈优先使用底部小录音条，而不是全屏录音页。
- 成功 / 错误文案使用英文 toast。
- 直接接入 OpenRouter ASR 与 DeepSeek task planning，不做本地模型前置依赖。
- 移动端整体更接近桌面 widget 的手机版，而不是完整桌面主窗口的手机版。

### 4.5 当前不做的移动端范围

- 不做日记、笔记、复杂日历、习惯打卡、团队协作、项目管理。
- 不做必须登录才能使用。
- 不做云同步作为 MVP 前提。
- 不做聊天式 AI 页面。
- 不做大量字段表单；任务详情只展示必要字段。

### 4.6 未来同步机制

#### 架构

```
手机 (Expo SQLite)          Supabase Cloud          电脑 (Tauri SQLite)
     │                            │                        │
     │── 本地修改 ────────────────│                        │
     │                            │── 写入 Postgres ───────│
     │                            │                        │
     │── 订阅 Realtime ───────────│                        │
     │                            │── 变更广播 ────────────│
     │                            │                        │
     │── 增量拉取 (updated_at >   │                        │
     │    last_synced_at)         │                        │
```

#### 同步策略

1. **本地优先**: 所有读写先操作本地 SQLite，UI 立刻响应
2. **后台同步**: 操作完成后异步 push 到 Supabase
3. **增量同步**: 只传输 `updated_at > last_synced_at` 的记录
4. **冲突解决**: Last-Write-Wins (LWW)，以 `updated_at` 时间戳为准
5. **离线队列**: 网络中断时缓存操作，恢复后批量推送

#### 认证

- **方式**: 匿名登录 (Anonymous Auth) + 可选绑定邮箱
- **理由**: 降低注册门槛，先让用户用起来，后续再引导绑定

---

## 5. 落地页 (Marketing Website)

### 5.1 技术栈

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + HeroUI
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Email**: Resend API
- **Hosting**: Vercel (推荐)

### 5.2 页面规划

#### 首页 `/`

```
┌──────────────────────────────────────────┐
│  nav: Features  Demo  Pricing  Download  │
├──────────────────────────────────────────┤
│                                          │
│         说话就能创建任务                   │
│      你的 AI 效率助手                     │
│                                          │
│   ┌─────────────────────────────────┐    │
│   │  your@email.com     [加入内测]  │    │
│   └─────────────────────────────────┘    │
│                                          │
│      [ App 界面截图 / 演示视频 ]          │
│                                          │
│   ─── 特性 ──────────────────────────    │
│   🎤 语音录入    🤖 AI 解析    🔄 多端同步 │
│                                          │
└──────────────────────────────────────────┘
```

**Hero Section**:
- 大标题 + 副标题
- 邮箱收集表单 (Resend API)
- 提交后显示"感谢加入，我们会尽快联系你"
- 背景: 暗色渐变，延续 Zen Voice 风格

**特性展示**:
- 语音录入: 展示录音 → 转写 → 任务创建流程
- AI 解析: 展示自然语言解析示例
- 多端同步: 桌面 + 手机示意图

#### 演示页 `/demo`

- **可交互 Demo** (纯前端模拟，无需登录):
  1. 中央麦克风按钮
  2. 点击后播放声波动画 (2s)
  3. 显示"Thinking..." (1s)
  4. 展示解析出的 2-3 个任务卡片
  5. 可切换 Today / Tomorrow / Inbox 视图查看
- **预置示例**: "下周三下午三点前提交季度报告，优先级高，标签工作"

#### 定价页 `/pricing`

三档定价，设计参考 Linear / Vercel:

| 套餐 | Free | Pro | Team |
|------|------|-----|------|
| 价格 | 免费 | $4.99/月 或 $39/年 | $12/人/月 |
| 设备 | 1 台桌面 | 无限设备 | 无限设备 |
| 同步 | ❌ | ✅ | ✅ |
| AI 解析 | 基础 | 优先队列 | 优先队列 |
| 主题 | 暗色 | 全主题 | 全主题 |
| 标签 | 基础 | 无限 | 无限 |
| 协作 | ❌ | ❌ | ✅ 共享工作区 |

- Pro 卡片高亮 (推荐标签)
- 年付显示"省 35%"
- CTA 按钮: "开始免费使用" / "升级 Pro"

#### 下载页 `/download`

- **自动检测平台**:
  - Windows → Tauri NSIS `.exe` 安装包（当前主线）
  - macOS → `.dmg` 下载（后续）
  - Linux → `.AppImage` 下载（后续）
- **移动端**: App Store / Google Play 按钮 (占位，未上线时显示"即将上线")
- **二维码**: 方便手机扫码
- **发布约定**: 下载页只指向正式上传后的安装包；开发环境不直接暴露本机 `target` 目录。

### 5.3 API 路由

#### `POST /api/waitlist`

- **功能**: 收集内测邮箱
- **流程**:
  1. 验证邮箱格式
  2. 存入 Resend Audience
  3. 发送欢迎邮件
  4. 返回 `{ success: true }`
- **限流**: 同一 IP 每小时最多 5 次

---

## 6. 数据模型

### 6.1 SQLite Schema (三端统一)

```sql
-- tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'done'
  due_at TEXT,                           -- ISO 8601
  reminder_at TEXT,                      -- ISO 8601
  priority INTEGER NOT NULL DEFAULT 1,   -- 0 | 1 | 2 | 3
  repeat_rule TEXT,                      -- JSON: none | daily | weekly
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  deleted_at TEXT                        -- 软删除
);

-- tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- task_tags (junction)
CREATE TABLE task_tags (
  task_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);

-- events (审计日志)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- recent_context (AI 上下文)
CREATE TABLE recent_context (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title_snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### 6.2 TypeScript 类型 (共享)

```typescript
export type TaskStatus = "open" | "done";
export type TaskPriority = 0 | 1 | 2 | 3;
export type SmartView = "all" | "today" | "tomorrow" | "next7" | "inbox";
export type RepeatRule =
  | { type: "none" }
  | { type: "daily"; interval: 1 }
  | { type: "weekly"; interval: 1 };

export type TaskTag = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  content: string | null;
  status: TaskStatus;
  dueAt: string | null;
  reminderAt: string | null;
  priority: TaskPriority;
  repeatRule: RepeatRule;
  tags: TaskTag[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
```

### 6.3 Supabase Schema (云端)

与本地 SQLite schema 基本一致，当前 migration 位于 `supabase/migrations/20260509152000_initial_sync.sql`。核心表：

```sql
-- 用户表 (由 Supabase Auth 管理)
-- auth.users (内置)

-- tasks (云端版本)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  due_at TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 1,
  repeat_rule JSONB NOT NULL DEFAULT '{"type":"none"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  device_id TEXT NOT NULL,      -- 创建设备标识
  version INTEGER DEFAULT 1     -- 乐观锁版本
);

-- sync_state (设备同步状态)
CREATE TABLE sync_state (
  device_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01'
);

-- RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_tasks_only ON tasks
  USING (auth.uid() = user_id);
```

### 6.4 同步策略

- **本地优先**: 桌面端和移动端都先写本地 SQLite，UI 立即响应。
- **自动后台同步**: 登录后后台 push 本地变更，再 pull 远端变更。
- **未登录可用**: 未登录状态继续本地使用，不阻塞核心体验。
- **登录后上传本地数据**: 用户登录后默认把本地任务上传到云端。
- **冲突策略**: 第一版 Last Write Wins，基于 `updated_at`。
- **删除策略**: 软删除通过 `deleted_at` 同步。
- **同步范围**: 第一版只同步 `tasks / tags / task_tags`，`events / recent_context / preference memory` 后置。
- **同步入口**: UI 上只展示一个同步图标，承载 `local / syncing / error` 状态，不做复杂 Account 工作台。
- **Web**: 暂不做任务页，只保留营销、下载、账号/订阅承接。

---

## 7. AI 解析规则

### 7.1 系统提示词 (System Prompt)

```
You are todoless, a non-chat voice-to-task command agent.
Return only valid JSON. No markdown. No explanation.
The user is the commander. Convert the transcript into one command and execute their intent without asking questions.
Supported intents: create_tasks, update_tasks, complete_tasks, delete_tasks, set_reminders, set_repeat.
Use target objects for edits/completions/deletes:
{"query":"string or null","ordinal":number or null,"recent":boolean}
Use recent=true for "刚才那个"; use ordinal for "第二个"; use query for title/tag/person/project words.
Use coarse tags only.
Detect simple recurring tasks: daily/every day -> repeatRule daily; weekly/every week -> repeatRule weekly; otherwise none.
When no time is provided, set dueAt to today at the user's default due time and reminderAt to null.
When a date is provided but no time is provided, set dueAt to that date at the user's default due time and reminderAt to null.
When the transcript says "提醒我/记得/别忘了", create or update reminderAt.
Use priority: 3=P1 urgent/high consequence, 2=P2 important or soon, 1=P3 normal, 0=P4 low pressure.
Use content only when the task needs extra execution context; short tasks should have content null.
```

### 7.2 默认规则

| 场景 | dueAt | reminderAt | 优先级 |
|------|-------|------------|--------|
| 无时间提及 | 今天 22:00 | null | 根据语气判断 |
| 有日期无时间 | 该日期 22:00 | 该日期 09:00 | 根据语气判断 |
| 有日期有时间 | 该日期 指定时间 | 该日期 09:00 | 根据语气判断 |
| 紧急词 (urgent, asap) | 今天 22:00 | 今天 09:00 | P3 (高) |
| 每天/每日 | 按语义日期或今天 22:00 | null 或语义提醒 | repeatRule=daily |
| 每周/每个星期 | 按语义日期或今天 22:00 | null 或语义提醒 | repeatRule=weekly |

### 7.3 语音编辑与提醒规则

| 用户说法 | Agent intent | 行为 |
|---|---|---|
| 刚才那个改成周五 | `update_tasks` | `target.recent=true`，修改 `dueAt` |
| 第二个优先级调高 | `update_tasks` | `target.ordinal=2`，修改 `priority` |
| 发推特那个完成 | `complete_tasks` | 标记匹配任务完成 |
| 删除那个研究任务 | `delete_tasks` | 软删除匹配任务 |
| 今晚八点提醒我发方案 | `set_reminders` 或 `create_tasks` | 设置 `reminderAt=20:00` |
| 取消这个提醒 | `set_reminders` | `reminderAt=null` |
| 这个任务每天重复 | `set_repeat` | `repeatRule=daily` |

匹配优先级：

1. 显式序号，如“第一个”“第二个”。
2. 最近上下文，如“刚才那个”。
3. 当前标题/标签/内容 query 匹配。
4. 默认最近打开任务。

### 7.4 上下文

- **Today**: 当前日期 ISO 字符串
- **Timezone**: 用户时区
- **Default due time**: 22:00 (后台默认值，当前不在常规设置 UI 暴露)
- **Recent tasks**: 最近 10 条任务标题 (用于理解上下文)

---

## 8. 共享层设计

### 8.1 `packages/shared`

| 模块 | 内容 | 三端使用 |
|------|------|---------|
| `types/task.ts` | Task, TaskTag, SmartView 类型 | ✅ ✅ ✅ |
| `types/agent.ts` | Zod schemas for AI response | ✅ ✅ ✅ |
| `lib/date.ts` | 日期计算、视图匹配、格式化 | ✅ ✅ ✅ |
| `lib/ids.ts` | UUID 生成器 | ✅ ✅ ✅ |
| `tokens.ts` | 颜色、间距、圆角常量 | ✅ ✅ ✅ |
| `sync/index.ts` | 同步协议预留出口 | 规划中 |
| `sync/schema.ts` | Supabase 生成类型预留 | 规划中 |

### 8.2 导入方式

```typescript
// 桌面端 / 落地页
import type { Task } from "@todoless/shared/types/task";
import { formatTaskTime } from "@todoless/shared/lib/date";
import { tokens } from "@todoless/shared/tokens";

// 移动端 (Expo Metro bundler)
import type { Task } from "@todoless/shared/types/task";
import { tokens } from "@todoless/shared/tokens";
```

---

## 9. 开发路线图

### Phase 1: 桌面端 MVP ✅ (已完成)

- [x] 本地 SQLite 任务 CRUD
- [x] 语音录入 + AI 解析 (OpenRouter)
- [x] 双窗口 (主面板 + Widget)
- [x] 主题切换 (亮/暗/系统)
- [x] 设置面板
- [x] Toast 通知系统
- [x] 系统托盘 + 全局快捷键
- [x] Repeat: daily / weekly 本地完成后生成下一条任务
- [x] Voice command: 创建、编辑、完成、删除、提醒、重复
- [x] Desktop reminder cards: Done / Later / dismiss

### Phase 2: Monorepo 迁移 ✅ (已完成)

- [x] 目录结构重组 (apps/desktop, apps/app, apps/web, packages/shared)
- [x] 共享代码迁移 (types, lib, tokens)
- [x] HeroUI 移除
- [x] 构建验证通过

### Phase 3: H5 落地页 (进行中)

- [x] Next.js 项目初始化 (`apps/web`)
- [x] 首页 Hero + Waitlist API 骨架
- [x] Demo 页面
- [x] Pricing 页面
- [x] Download 页面
- [ ] Resend 真实投递配置
- [ ] 部署与域名

### Phase 4: 移动端本地功能 (进行中)

- [x] Expo 项目初始化 (`apps/app`)
- [x] Expo SDK 54 / React Native 0.81 依赖基线
- [x] Bun-only workspace 与 React Native Bun patch
- [x] Expo Router 页面结构
- [x] 本地 SQLite 服务骨架
- [x] Zustand 任务 store
- [x] Today / Inbox / Settings 基础页面
- [x] Android export/bundle 验证通过
- [x] Repeat: daily / weekly 本地完成后生成下一条任务
- [ ] 任务详情页完整编辑能力
- [ ] 语音录入 (expo-av)
- [ ] 移动端本地通知：提醒弹出、声音、震动、Done/Later actions
- [ ] 移动端 TickTick-like 清单 UI 重构
- [ ] Voice-first 主操作设计
- [ ] 主题适配打磨

### Phase 5: 云端同步 (进行中)

- [ ] Supabase 项目配置
- [x] 数据库迁移 (RLS + sync_state)
- [ ] 认证系统 (匿名登录)
- [x] 移动端同步服务骨架
- [x] 桌面端同步服务骨架
- [ ] Realtime 订阅

### Phase 6: 发布与优化 (持续)

- [ ] App Store / Google Play 上架
- [ ] 内测用户反馈迭代
- [ ] 性能优化 (大任务列表虚拟滚动)
- [ ] 高级功能 (重复任务、子任务、协作)

---

## 10. 附录

### 10.1 环境变量模板

```env
# 桌面端 (apps/desktop/.env.local)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_ASR_MODEL=openai/whisper-large-v3-turbo
OPENROUTER_TEXT_MODEL=deepseek/deepseek-v4-flash

# 落地页 (apps/web/.env.local)
RESEND_API_KEY=re_...

# Supabase (根目录 .env)
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### 10.2 命名规范

| 项目 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `TaskList.tsx`, `VoiceWidget.tsx` |
| Hooks | camelCase + use 前缀 | `useVoiceCapture.ts` |
| Stores | camelCase + Store 后缀 | `taskStore.ts`, `themeStore.ts` |
| Services | camelCase | `voiceAgent.ts`, `db.ts` |
| 类型 | PascalCase | `Task`, `TaskPriority`, `SmartView` |
| 常量 | SCREAMING_SNAKE_CASE | `DEFAULT_DUE_TIME = "22:00"` |
| CSS 类 | kebab-case | `task-card`, `voice-widget` |

### 10.3 开发命令速查

```bash
# 桌面端
bun run dev:desktop          # 启动 Tauri 开发
bun run build:desktop        # 构建生产包
bun run check:desktop        # TypeScript 检查

# 落地页
bun run dev:web              # 启动 Next.js 开发
bun run build:web            # 构建静态站点

# 移动端
bun run dev:app              # 启动 Expo 开发服务器

# 数据库
bun run db:start             # 启动 Supabase 本地
bun run db:types             # 生成 TypeScript 类型
```
