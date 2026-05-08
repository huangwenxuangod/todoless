# todoless 产品需求文档 (PRD)

> 版本: v0.2.0
> 日期: 2026-05-08
> 状态: 桌面端 MVP 已完成，移动端 / 落地页开发中

---

## 1. 产品概述

### 1.1 一句话定义

todoless 是一款**语音优先、AI 驱动、本地优先**的跨平台任务管理工具。用户按住快捷键说话，AI 自动将语音解析为结构化任务并保存。

### 1.2 核心价值主张

- **极速录入**: 说话比打字快 3-5 倍，按住快捷键 → 说话 → 松手 → 任务自动创建
- **AI 智能理解**: 自动识别时间、优先级、标签，支持自然语言（如"明天下午三点提醒我提交报告"）
- **本地优先**: 所有数据默认存储在本地 SQLite，离线可用，零隐私担忧
- **多端同步**: 桌面端深度体验 + 移动端随时查看 + 网页端信息展示

### 1.3 目标用户

- **效率工具爱好者**: 追求极简、快速的任务录入方式
- **多设备办公人群**: 需要在电脑和手机上无缝切换查看任务
- **隐私敏感用户**: 不希望任务数据被云端服务分析或训练

### 1.4 产品形态

| 端 | 定位 | 核心场景 | 状态 |
|---|------|---------|------|
| **桌面端** (Tauri) | 主力工作面板 | 深度管理、语音录入、Widget 浮窗速览 | MVP 已完成 |
| **移动端** (Expo) | 随身伴侣 | 查看任务、勾选完成、路上补充语音 | 规划中 |
| **落地页** (Next.js) | 品牌门面 | 产品展示、内测申请、定价、下载引导 | 规划中 |

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

#### 3.4.4 语音录入 (VoiceWidget)

- **位置**: 主窗口底部居中悬浮
- **默认状态**: 麦克风图标 + "Ctrl Shift Space" 提示
- **录制中**: 声波动画 + "Listening..."
- **转写中**: "Transcribing..."
- **解析中**: "Turning speech into tasks..."
- **完成**: "Created N tasks" + Toast 提示
- **错误**: 红色错误提示 + Toast

#### 3.4.5 设置面板 (SettingsModal)

- **形式**: 左侧导航 + 右侧内容的双栏模态框
- **导航项**:
  1. **Theme**: Light / Dark / System 三选一
  2. **General**:
     - Main always on top (开关)
     - Widget always on top (开关)
     - Global shortcut (自定义快捷键录制)
     - Close behavior (Hide to tray / Quit app)
  3. **Voice Model**:
     - Remote: OpenRouter Whisper (Whisper Large V3 Turbo / Whisper 1)
     - Local: SenseVoice Small (下载管理 + 进度条)
  4. **Account**: 当前 Local-only，预留云同步入口

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

---

## 4. 移动端 (Mobile App)

### 4.1 技术栈

- **Framework**: Expo (React Native)
- **Router**: Expo Router v3 (文件系统路由)
- **Database**: `expo-sqlite` (本地 SQLite，与桌面端同 schema)
- **Animation**: `react-native-reanimated` (主要) + `framer-motion/native` (简单过渡)
- **Icons**: `lucide-react-native`
- **State**: Zustand (与桌面端 store 模式一致)
- **Sync**: Supabase (Auth + Postgres + Realtime)
- **Styling**: StyleSheet + 共享 design tokens

### 4.2 设计适配原则

- **视觉统一**: 颜色、字体、圆角、间距与桌面端完全一致 (via `tokens.ts`)
- **布局适配**: 移动端单列布局，触控热区 ≥ 44px
- **交互适配**: 桌面端的 hover 态改为 press 态，增加触觉反馈 (Haptic Feedback)
- **放弃浮动窗**: iOS 不支持全局悬浮窗，Android 需原生模块。改为锁屏快捷指令 + 通知栏操作

### 4.3 页面结构

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
│  🎤    📋    ⚙️          │  ← Tab Bar: Voice / Tasks / Settings
└──────────────────────────┘
```

**Tabs**:
- **Today** (默认): 今日任务列表
- **Inbox**: 无截止日期任务
- **Settings**: 设置、同步状态、账户

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

#### 语音录入页

- **形式**: 底部 sheet 或全屏模态
- **交互**:
  1. 按住麦克风按钮 → 开始录音 + 声波动画
  2. 松开 → 停止录音
  3. 自动跳转 "Thinking..." 状态
  4. 解析完成后展示预览任务列表
  5. 用户确认后保存

### 4.4 同步机制

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
  - macOS → `.dmg` 下载
  - Windows → `.exe` 下载
  - Linux → `.AppImage` 下载
- **移动端**: App Store / Google Play 按钮 (占位，未上线时显示"即将上线")
- **二维码**: 方便手机扫码

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
  tags: TaskTag[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
```

### 6.3 Supabase Schema (云端)

与本地 SQLite schema 基本一致，增加：

```sql
-- 用户表 (由 Supabase Auth 管理)
-- auth.users (内置)

-- tasks (云端版本)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  -- ... 与本地相同字段 ...
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

---

## 7. AI 解析规则

### 7.1 系统提示词 (System Prompt)

```
You are todoless, a non-chat voice-to-task agent.
Return only valid JSON. No markdown. No explanation.
Create up to 10 tasks from the transcript.
Use coarse tags only.
When no time is provided, set dueAt to today at the user's default due time and reminderAt to null.
When a date is provided but no time is provided, set dueAt to that date at the user's default due time and reminderAt to that date at 09:00.
Use priority: 3=P1 urgent/high consequence, 2=P2 important or soon, 1=P3 normal, 0=P4 low pressure.
Use content only when the task needs extra execution context; short tasks should have content null.
Output schema:
{"intent":"create_tasks","tasks":[{"title":"string","content":null,"dueAt":"ISO string or null","reminderAt":"ISO string or null","priority":0,"tags":["string"]}],"memoryUpdates":[]}
```

### 7.2 默认规则

| 场景 | dueAt | reminderAt | 优先级 |
|------|-------|------------|--------|
| 无时间提及 | 今天 22:00 | null | 根据语气判断 |
| 有日期无时间 | 该日期 22:00 | 该日期 09:00 | 根据语气判断 |
| 有日期有时间 | 该日期 指定时间 | 该日期 09:00 | 根据语气判断 |
| 紧急词 (urgent, asap) | 今天 22:00 | 今天 09:00 | P3 (高) |

### 7.3 上下文

- **Today**: 当前日期 ISO 字符串
- **Timezone**: 用户时区
- **Default due time**: 22:00 (可配置)
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
| `sync/protocol.ts` | 同步变更结构、冲突策略 | ✅ ✅ ✅ |
| `sync/schema.ts` | Supabase 生成的类型 | ✅ ✅ ✅ |

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

### Phase 2: Monorepo 迁移 ✅ (已完成)

- [x] 目录结构重组 (apps/desktop, apps/app, apps/web, packages/shared)
- [x] 共享代码迁移 (types, lib, tokens)
- [x] HeroUI 移除
- [x] 构建验证通过

### Phase 3: H5 落地页 (2-3 周)

- [ ] Next.js 15 + HeroUI 项目初始化
- [ ] 首页 Hero + Waitlist (Resend 集成)
- [ ] Demo 交互演示页
- [ ] Pricing 定价页
- [ ] Download 下载页
- [ ] Vercel 部署

### Phase 4: 移动端本地功能 (3-4 周)

- [ ] Expo 项目初始化
- [ ] 本地 SQLite (expo-sqlite)
- [ ] Today / Inbox 任务列表
- [ ] 任务详情页
- [ ] 语音录入 (expo-av)
- [ ] 主题适配

### Phase 5: 云端同步 (2-3 周)

- [ ] Supabase 项目配置
- [ ] 数据库迁移 (RLS + sync_state)
- [ ] 认证系统 (匿名登录)
- [ ] 移动端同步服务
- [ ] 桌面端同步服务
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
