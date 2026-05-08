{
  "content": "# 最优秀的待办事项与任务管理应用 UI 设计分析（2025–2026）  \n（覆盖：Things 3、Todoist、Notion、OmniFocus、Apple Reminders、Microsoft To Do、Any.do、Bear、Craft、Linear、Height；关注界面视觉、交互/动效、排版与色彩、信息架构、平台差异、可访问性、可定制性、同步/通知、任务视图、快捷与手势、集成/AI）\n\n## 摘要\n在 2025–2026 年间，主流待办/任务类应用的 UI 设计呈现几条清晰的趋势：Apple‑主导的“Liquid Glass”材料与更大胆的排版开始影响大量原生与跨平台产品；微交互与触觉/流体反馈被广泛采用以提升可理解性与满足感；底部优先的交互区与可折叠容器（bottom sheets）更适配单拇指可达区；深度整合的 AI 与自动化功能从辅助排期走向主动建议与生成；同时可访问性与法规合规（例如欧洲无障碍法规）成为设计优先项。下文在总体趋势之上，逐一分析各款产品的界面语言、核心交互与差异化创新，并在结尾给出比较矩阵与设计启示。 [1], [2], [33], [34], [35], [38]\n\n## 2025–2026 年的总体设计趋势（依据证据的综合）\n- Liquid Glass / 玻璃质感与更大胆左对齐排版：Apple 在 WWDC 2025 中正式提出“Liquid Glass”材料并调整系统排版与滚动边缘建议，随后多款应用在视觉上响应或重塑自有变体以配合系统视觉语言（见下文应用例证）。[1], [2]  \n- 微交互与触觉反馈标准化：市场／研究与业界（包含 Gartner 引述）把微交互从点缀变为常态，用以提供即时反馈与引导（轻微抬升、变形、发光等）。[35], [36]  \n- 底部优先的操作区、标准化底部容器（bottom sheets）和单拇指可达优化：移动端交互正向底部中心化演化以适配大屏、单拇指交互模型。[34], [36]  \n- 暗色模式、可访问性与法规合规：暗模式被许多产品作为优先或默认出发点，可访问性功能（如系统级朗读、Live Captions、无障碍标签）和对 EU 等法规的合规要求推动设计实践调整。[33], [15], [37], [38]  \n- AI 从工具向代理演进：从自然语言输入、智能排期，到可定制的“Agents”/助手，AI 在产品中承担建议、自动填充与执行一体化工作流的角色。[8], [9], [27], [28], [23]\n\n（上段趋势基于多项来源的综合：Apple WWDC 与设计资源、行业样式文章及产品发布记录。）[1], [2], [33], [34], [35], [38]\n\n## 应用逐项分析（每款为一段，段内事实来自列示来源）\n\n### Things (Cultured Code)\n视觉与界面：在面向 iOS/macOS 的 2025–2026 更新中，Things 进行了配合 OS‑26 的视觉刷新（支持 Liquid Glass 风格），提供新图标的多种变体（Default/Dark/Tinted/Clear），窗口、对话与控制元件采用更宽间距与半透明玻璃感按钮。交互/动效：Magic Plus 按钮呈现流体变形反馈，且按钮会在触控时放大发光以提供触觉式视觉回馈；已扩展 Spotlight 集成以便快速创建待办。平台/功能：增加 Vision Pro 小组件与写作工具、扩展的 Widget 样式，并保留 Siri 与快捷方式集成。独特性：Things 将“桌面级”任务组织与 Apple 原生体验紧密耦合，并在动效与按钮物理感上做出差异化。参考官方博客与 App Store 列表。[3], [4]\n\n### Todoist\n视觉与界面：在 2025–2026 多次更新中进行了界面与引导刷新（包括 iOS26 风格的引导与工具提示），并对看板（Board）视图进行了视觉调整使其与整体界面一致。小组件与可视化：Android 小组件支持主题色与不透明度设置，iOS/Android 上的小组件、Widget 交互（点按完成或打开任务等）被细化。交互/可用性：支持自定义滑动手势以进行安排、完成、删除等操作；Ramble 语音捕捉功能（AI 助手）可在配对耳机上免手操作录入并支持提示与错误反馈。可访问性：统一屏幕阅读器对重复日期的朗读方式与暗色模式细调。Todoist 亦在 2026 持续改进小图标与导航元素以提升可触达性。整体上以干净、轻量的界面为主，强调跨平台一致性与快速创建。参考 Todoist 官方变更日志与功能文档。[5], [6], [31], [7]\n\n### Notion\n视觉与界面：Notion 持续朝向一致的视觉语言演进，同时扩展富交互数据库（数据库条件着色、子项过滤、日历双向同步等），并在桌面端启用语音输入等功能以改善编辑体验。交互/信息架构：Notion 将“页面即数据库”的架构持续强化，数据库视图（表格/看板/日历）与模板化页面结合，支持 API 创建页面与从模板填充。AI 与代理：推出可细化的 Custom Agents 与 AI Autofill，用于自动填充数据库字段、生成议程与草稿，并在协作场景中提供日历/邮箱联动的自动化建议。移动体验：提供多种小组件（页面、收藏、最近项、AI 快捷）以支持主屏快速访问。Notion 的差异化在于把“内容创作 + 任务管理”合并为可高度自定义的工作区并内置可定制 AI。参考 Notion 官方发布记录与小组件说明。[8], [9], [10], [32]\n\n### OmniFocus\n视觉与界面：OmniFocus 在 4.x 系列里实现了统一且可自定义的现代界面，并在后续版本中采纳了与平台新视觉（如 Liquid Glass）兼容的刷新。交互与视图：强调“视角（Perspectives）”的过滤与定制能力，4.2 开始支持基于日期/重复等的规则过滤，支持锁屏控件及扩展的快捷方式。可访问性与键盘：改进 VoiceOver 对重复任务的朗读，增强 iPad 键盘导航，并扩展 Omni Automation API 与 Shortcuts 集成。差异化：面向“高阶 GTD/任务体系”的深度自定义与脚本化自动化是其主要定位。参考 OmniGroup 官方路线图与发布说明。[11], [12]\n\n### Apple Reminders（系统级）\n视觉与界面：在 iOS 26 中，Reminders 采用 Liquid Glass 视觉刷新，Smart Lists 与图标更新，并在系统层级（控制中心、锁屏、Action Button）加入快速创建入口。智能与自动化：系统级 Apple Intelligence 提供建议性提醒（基于共享邮件、网页等）；新增自动分类列表功能与逐条提醒的时区覆盖选项。差异化：作为系统应用，Reminders 能较早获得系统级交互入口（Control Center/Lock Screen/Action Button）与 Apple Intelligence 的深度整合。参考 9to5Mac 与 Apple 发布汇总。[14]\n\n### Microsoft To Do\n视觉与界面：近年改版引入更多背景选项（纯色或整图）、减少列表标题比重以突出任务，Web/桌面实现展示色彩编码列表与更新图标。功能与可访问性：引入 Steps（子任务）、提高附件支持（计划扩展到 Android 的附件支持）并提供跨平台屏幕阅读器支持（iOS/macOS/Android）。差异化：强调与 Microsoft 生态（Outlook/Planner）联动与企业级无障碍支持。参考 Microsoft 支持文档。[24], [25]\n\n### Any.do\n视觉与界面与可定制性：Any.do 支持 Auto/Light/Dark 主题与一组预置背景（不允许上传个人图片）；提供默认视图设置。交互与核心功能：Plan My Day 为“开箱即用”的日程规划功能，支持通过 WhatsApp 添加任务并与 Siri 集成进行语音捕捉；原生同步 Google Calendar/Outlook 以便时间块规划。AI 与隐私：提供 ChatGPT/Assistant 集成实现自然语言输入、智能排期与优先级建议，且提供开/关与加密承诺。商业化：Premium 提供更丰富的 AI 建议、自动生成子任务与工作区自动化。差异化：主打“易上手的 AI 驱动日计划 + 即时跨渠道捕捉（WhatsApp/Siri）”。参考 Any.do 官方支持页与博客说明。[26], [27], [28], [29]\n\n### Bear\n界面与信息架构：Bear 在 macOS 上采用三栏布局（标签/笔记列表/笔记内容），支持 OCR、数学公式与 Callouts，并通过 iCloud 同步（付费）；Web 版本在 Beta 中逐步完善跨平台功能。差异化：Bear 更偏向笔记与写作工具，但通过“智能的 todo 列表”与高质量的文本处理能力（OCR、加密）扩展任务捕捉场景。参考 Bear 官方博客与评测。[16], [17]\n\n### Craft\n界面与视图：Craft 的 Calendar 视图将日记、任务与外部日历事件合并在同一面板，支持拖拽调整任务时间并在文档间收集任务（Inbox）。集成：支持 Google Calendar 与与 Apple Reminders 的互联以实现跨工具日程同步。差异化：将文档/笔记与任务日历紧密结合，适合以内容为中心的任务流。参考 Craft 文档与产品博客。[18], [19]\n\n### Linear\n视觉与界面/动效：Linear 自行重建了自己的 Liquid Glass 变体以保持自定义导航灵活性，界面采用近单色/靛蓝点缀的高对比配色，注重极简与速度；动效表现为元素在触控时轻微抬升、拖动越界时的轻微形变、以及顶部/底部滚动边缘的可变模糊叠加色彩罩。快捷与键盘：提供丰富快捷键以实现极高效的键盘优先工作流。差异化：把速度与线性工作流（issues→cycles→projects）置于核心，视觉上减少干扰，把注意力集中在关键动作上。参考 Linear 官方说明与配色/快捷键集合。[20], [21], [22], [39]\n\n### Height\n视图与信息架构：Height 支持即时切换的 List、Board（Kanban）、Calendar 与 Gantt 视图（并无加载状态感），Board 提供顺畅的拖拽，Gantt 支持拖拽创建依赖关系。AI 功能：Height 的 AI 能建议任务指派并生成子任务，采用量化接受率与节省工时的度量作为产品价值论证。差异化：组合即时切换的多视图与 AI 辅助分配/分解。参考 Height 产品评测。[23]\n\n## 平台实现差异（移动、桌面与 Web）\n- iOS 原生应用倾向充分利用系统新材料（Liquid Glass）、Control Center／锁屏快速入口与系统级 AI 能力（例如 Reminders 的系统级入口），部分高阶应用提供 Vision Pro 支持与专用小组件。示例：Things 与 OmniFocus 在 Apple 平台上推出 Vision Pro / lock‑screen 小组件与写作工具等系统级整合。[3], [11], [14]  \n- Android 实现更注重可定制的小组件（如 Todoist 可调主题色与不透明度）和手势自定义；某些功能的附件或上传限制在平台间仍有差异（如 Microsoft To Do 附件支持差异、Any.do 在 Android 的事件可见性差异）。[31], [24], [26]  \n- Web 与桌面：为保证跨平台一致性，许多应用（Todoist、Notion、Linear、Height）在 Web/桌面上保留键盘与快速导航体验（更多快捷键、无加载式视图切换），而一些以 Apple 为主的平台特性（Liquid Glass 视觉）在 Web 上以变体实现或不完全同步。Notion、Linear、Height 等在 Web 侧强调性能与键盘效率；Bear 的 Web 版本仍为 Beta。[7], [20], [23], [16]\n\n（以上段落的事实依据相应应用的官方发布/帮助与评测文档。）[3], [31], [24], [7], [20], [23], [16]\n\n## 无障碍与可用性考量\n- 系统级推动：Apple 于 2025 年推出一系列可访问性功能（例如 Accessibility Reader、Magnifier for Mac、Braille Access），并在设计资源中推荐兼容性实践，这推动应用厂商调整 UI 与无障碍支持。与此同时，欧洲可及法案强制执行提高了可访问性合规的优先级。[15], [37]  \n- 产品实践示例：OmniFocus 明确改进 VoiceOver 对重复规则的朗读与 Dynamic Type 支持；Microsoft To Do 提供跨平台的屏幕阅读器支持；Todoist 统一了重复日期的屏幕朗读。总体上，主流产品在 2025–2026 年对辅读/可变文字大小/朗读一致性等做出明显改进。[12], [25], [5]\n\n## 交互模式、动效与微交互（要点与产品示例）\n- 流体与触觉反馈：Things 的 Magic Plus 流体变形、Linear 的拖动轻微变形与抬升、以及 Glassy 按钮的发光与缩放，都是把微动效当作核心反馈通路的代表。微交互用于确认操作、边界提示与引导。[3], [20]  \n- 微交互成为功能可发现性的手段：微动效配合底部容器/小组件能在最小空间内提供上下文可操作提示（例如 Todoist Widget 在小尺寸下仍支持完成与打开任务交互）。[31], [5]  \n- 运动规范与平台建议：Apple 的设计资源建议单个视图只使用单一滚动边缘效果并推荐一致的圆角胶囊形状等，这些系统级规范被多家应用采纳或以自定义变体实现。[1], [2]\n\n## AI、自动化与集成（现实功能与差异化）\n- Notion：推出 Custom Agents、AI Autofill 与与邮箱/日历的双向协作能力，使 AI 能在工作区内自动填充与执行日常流程（如会议安排、邮件草稿）。[8], [9]  \n- Any.do：通过 ChatGPT 集成、Plan My Day 功能与 WhatsApp、Siri 的任务捕捉，使 AI 在个人日程规划与跨渠道捕捉上发挥作用；Premium 扩展 AI 生成建议与自动化。[26], [27], [29]  \n- Todoist：Ramble 语音 AI 支持与耳机集成、优先级/调度建议与日历视图结合，为移动捕捉与后续整理提供闭环体验。[5], [31]  \n- Height 与 OmniFocus：Height 用 AI 建议指派与子任务生成（并量化接纳率）；OmniFocus 开始探索在本地通过插件部署基础模型的可能性（Omni Automation 插件与 on‑device 模型示例）。[23], [13]  \n- 差异化方向：部分产品将 AI 作为“增强决策建议”并保留用户控制（Any.do 强调保留控制），另一些（Notion）朝可配置代理/Agents 方向发展以支持复杂工作流程。Notion 的企业策略也包含零保留 / 企业级数据控制选项。[8], [27], [23], [33]\n\n## 信息架构与视图策略（列表、看板、日历、甘特等）\n- 多视图即时切换：Height 明确以即时切换 List/Board/Calendar/Gantt 为卖点；Notion/Linear/Things/OmniFocus 在不同层级支持列表/看板/日历/自定义过滤，但定位不同（Notion 强 DB 灵活性、OmniFocus 强视角规则、Linear 强 issue→sprint 流程）。[23], [8], [11], [20]  \n- 任务层级：支持子任务/Steps（Microsoft To Do）、子项与数据库子项（Notion）、复杂重复与延后规则（OmniFocus），产品在层级表达上体现不同强调点：轻量向（Any.do、Todoist）与重度管理向（OmniFocus、Height 的依赖 Gantt）。[24], [7], [12], [23]  \n- 时间视图与时间块：Todoist、Any.do 与 Craft 支持将任务映射/调度到日历以便时间块规划；Notion 进一步在数据库层提供日历编辑能力（双向同步）。[31], [26], [18], [9]\n\n## 快捷操作、键盘与手势支持\n- 键盘优先：Linear 与 OmniFocus 提供丰富键盘捷径以支撑高效桌面工作流（Linear 的“g b / c / create” 类快捷，OmniFocus 的视角与折叠/展开快捷键）。[22], [12]  \n- 手势与自定义：Todoist 支持自定义滑动手势以实现安排/完成等；移动端小组件与快速入口（锁屏/Action Button/Control Center）在各家实现上存在平台差异（Apple 系统级入口尤为优势）。[31], [14]\n\n## 可定制性与个性化\n- 视觉主题与背景：Microsoft To Do 提供丰富背景选项（含整图），Any.do 提供主题模式但不允许上传自定义背景，Todoist 支持与设备暗/亮模式联动并可在小组件上选择颜色与不透明度。产品在“灵活性 vs 统一风格”间取舍各异。[24], [26], [31]  \n- AI 驱动的个性化：AI 根据用户数据提供个性化排期（Notion Agent、Any.do Plan My Day、Todoist 的 Ramble 与自动优先建议），某些产品允许开启/关闭 AI 功能并承诺加密与隐私控制。[8], [27], [5]\n\n## 同步与通知体验\n- 同步：多数产品提供近实时同步（Any.do、Todoist、Notion、Things、OmniFocus），但实现差异存在（例如 Bear 的 iCloud 同步为付费项、OmniFocus Web 刷新以改善稳定性）。通知方面，Things 与 OmniFocus 向系统通知集成扩展了可变 snooze 时段与锁屏创建入口。AI 限额/通知（例如 Todoist 通知 AI 用量）也出现在设计里以管理用户期望。[4], [12], [31], [16]\n\n## 关键屏幕示例引用（按应用）\n- Things：官方博客的 OS‑26 更新与 App Store 列表展示了 Liquid Glass 风格、Magic Plus 动效与 Widget 样式。[3], [4]  \n- Todoist：2025/2026 的变更日志与小组件说明展示了 Widget 交互、Ramble 诱导与视图命名调整。[5], [31]  \n- Notion：发布记录（含 Custom Agents、数据库着色、双向日历）与移动小组件文档展示数据库/日历与 AI 集成界面。[8], [10], [9]  \n- OmniFocus：路线图与发布说明展示 Perspective 过滤、通知增强与 Omni Automation API 的 UI 点位。[11], [12]  \n- Apple Reminders：iOS 26 评测与汇总展示了系统级 Liquid Glass 风格与锁屏/Control Center 快速创建控件。[14]  \n- Microsoft To Do：更新说明示例展示了背景选择与色彩编码列表 UI 变化。[24]  \n- Any.do：官方博客展示 Plan My Day 与 ChatGPT 集成的示意与同步功能说明。[27], [28]  \n- Bear：PCMag 与官方更新日志展示三栏布局与文本处理扩展（OCR、公式、Callouts）。[16], [17]  \n- Craft：官方文档展示 Calendar 视图中日程/任务/日记合并与拖拽交互。[18], [19]  \n- Linear：官方“Liquid Glass”说明与配色/快捷键文档展示其抬升/变形动效、近单色配色与强键盘支持。[20], [21], [22]  \n- Height：第三方评测展示 List/Board/Calendar/Gantt 的即时切换与 AI 建议功能。[23]\n\n## 比较矩阵（基于上述事实；列限制：5 列）\n注意：矩阵行列下的要点为归纳性表述，矩阵外的段落与上文说明提供详细引用依据。\n\nApp | 视觉/风格（示例） | 主要交互/动效 | 支持的视图 / 层级 | AI / 集成\n--- | ---: | --- | --- | ---\nThings | Liquid Glass 风格、玻璃感按钮与多图标变体 | Magic Plus 流体变形、触控放大/发光 | 列表/项目/Today/Widgets | Spotlight 快速创建、Siri、写作工具（Vision Pro） [3][4]\nTodoist | 干净轻量、iOS26 风格调整 | 小组件交互、滑动手势自定义、Ramble 语音 | 列表、看板、日历（项目级） | Ramble 语音 AI、日历同步 [5][31]\nNotion | 一体化数据库/页面视觉 | 页面即载体、数据库条件着色、可视化模板 | 表格/看板/日历/子项 | Custom Agents、AI Autofill、日历/邮箱联动 [8][9]\nOmniFocus | 现代可定制 Apple 优化界面 | 以 Perspectives 为核心的过滤动效 | 项目/视角/标签/Review | Omni Automation API、本地插件支持（方向） [11][12]\nApple Reminders | 系统级 Liquid Glass、系统入口 | 快速创建控件、自动分类 | 列表/Smart Lists | Apple Intelligence 建议、时区覆盖 [14]\nMicrosoft To Do | 丰富背景、色彩编码 | 轻量卡片式交互、减少标题干扰 | 列表、子任务(Steps) | Outlook/Planner 集成、屏幕阅读器支持 [24][25]\nAny.do | 主题/背景选项（预置） | Plan My Day 流程、WhatsApp/Siri 捕捉 | My Day/Next7/All/Boards | ChatGPT 集成、智能排期、Calendar 同步 [26][27]\nBear | 三栏写作式界面 | 文本处理微交互（Callouts） | 标签+笔记+内容 | OCR、加密、（Beta）Web [16][17]\nCraft | 文档‑日历融合 | 拖拽到日历、日记/任务混合 | 文档内任务、Calendar | Google Calendar、Apple Reminders 集成 [18][19]\nLinear | 近单色+靛蓝点缀 | 抬升/越界变形、快速响应 | Issues/Board/Cycles | GitHub 集成、快速键盘操作 [20][21][22]\nHeight | 现代协作 UI | 平滑拖拽、实时视图切换 | List/Board/Calendar/Gantt | AI 指派建议、子任务生成 [23]\n\n（矩阵条目基于上文分段的来源合成。）[3], [4], [5], [31], [8], [9], [11], [12], [14], [24], [25], [26], [27], [16], [17], [18], [19], [20], [21], [22], [23]\n\n## 设计启示（给产品/视觉设计师的可执行建议）\n- 考虑系统材料但保留品牌辨识：在采用 Liquid Glass 或半透明材料时，保留自有色票与控件节律以维持品牌差异（Linear 的自建变体即为示例）。[1], [20]  \n- 把微交互当作信息策略：将微动画用于确认、错误与边界提示（例如按键发光、拖动超限变形），并确保在“减少运动”设置下提供替代反馈。Things、Linear 的做法是可参考范例。[3], [20], [35]  \n- 优先底部可达区的核心操作：尤其在移动端，将常用操作放在底部并用 bottom sheet 承载次级操作以减少手部移动。该趋势由行业交互研究与实务文章支持。[34], [36]  \n- 设计 AI 接口以保留控制权：AI 建议应明确可开/关并提供配额/通知（例如 Todoist 的 AI 限额提示；Any.do 提供开关），同时让用户在建议上可快速接受/拒绝。[5], [27], [28]  \n- 将可访问性设为设计起点：在构建视觉风格时即测试高对比、可调整排版（Dynamic Type）、语义结构与屏幕阅读器流。系统级功能（Accessibility Reader、Braille Access）会影响用户预期。[15], [37], [38]  \n- 对多视图产品，优化即时切换与状态一致性：Height 的无加载视图切换为用户体验优先级设定了标杆，设计时需保证视图切换时的上下文连续性。[23]\n\n## 证据空白（Evidence Gaps）\n- Windows 原生桌面（非 Web）上各款应用的细节实现、视觉差异与性能数据：当前证据对 Windows 桌面版的描述有限（Microsoft To Do 有说明，但其他产品在 Windows 上的实现细节缺乏公开资料）。[24]  \n- 具体的可访问性可量化测试与合规性审计结果：除个别应用（OmniFocus、Microsoft To Do）的无障碍改进说明外，缺乏系统化的 WCAG/EN‑301‑549 合规性报告对比。[12], [25], [37]  \n- 真实用户研究量化数据（例如微动效对任务完成率/满意度的直接 A/B 结果）在公开资料中稀疏：仅少量第三方/厂商内部披露（Any.do 的改版效果来自独立项目陈述），但缺乏可比的多产品数据。[29]  \n- 跨平台视觉一致性的详尽资源（完整组件库、设计系统对比）在公开域未集中列举：一些公司提供自家设计系统片段，但缺乏直接可比的组件级对照表。 \n\n## 结论\n2025–2026 年的待办与任务管理类应用设计正经历由“纯列表工具”向“平台化工作空间 + 智能代理”的转变：视觉上更多厂商拥抱系统级材料（Liquid Glass）或自建类玻璃感变体以获得现代感；交互上微交互与触觉式反馈成为常态以提升即时可感知性；AI 从辅助功能逐渐成为主动的流程参与者（从建议到执行），但以保留用户控制为主要采纳逻辑。对于产品设计师而言，核心挑战在于平衡品牌差异化、系统视觉一致性、可访问性与 AI 的透明性；同时设计需优先考虑移动单拇指可达区、键盘效率（桌面）与跨视图的一致上下文体验。\n\n## 参考文献（按本文内引用次序编号）\n[1] https://developer.apple.com/videos/play/wwdc2025/356  \n[2] https://developer.apple.com/design/whats-new/  \n[3] https://culturedcode.com/things/blog/2025/09/things-for-os-26/  \n[4] https://apps.apple.com/us/app/things-3/id904237743  \n[5] https://todoist.com/help/articles/changelog-entries-from-2025-SsEIOCtjK  \n[6] https://todoist.com/help/articles/2026-changelog-HD3jJAtLd  \n[7] https://todoist.com/inspiration/hidden-features-todoist  \n[8] https://notion.com/releases  \n[9] https://notion.com/releases/2025-11-17  \n[10] https://notion.com/help/mobile-widgets  \n[11] https://omnigroup.com/blog/omni-roadmap-2025  \n[12] https://omnigroup.com/releasenotes/omnifocus/P45  \n[13] https://omnigroup.com/releasenotes/omnifocus/P25  \n[14] https://9to5mac.com/2025/10/13/heres-everything-new-in-reminders-with-ios-26/  \n[15] https://apple.com/newsroom/2025/05/apple-unveils-powerful-accessibility-features-coming-later-this-year/  \n[16] https://me.pcmag.com/en/productivity/21056/bear  \n[17] https://blog.bear.app/category/updates/  \n[18] https://craft-support.mintlify.app/en/plan-and-do/calendar  \n[19] https://craft.do/blog/introducing-tasks  \n[20] https://linear.app/now/linear-liquid-glass  \n[21] https://mobbin.com/colors/brand/linear  \n[22] https://keycombiner.com/collections/linear/  \n[23] https://workflowautomation.net/reviews/height  \n[24] https://support.microsoft.com/en-gb/office/what-s-new-in-microsoft-to-do-e4385509-13af-4a55-ae17-1c5a61cf2d41  \n[25] https://support.microsoft.com/en-au/office/screen-reader-support-for-microsoft-to-do-61cc610b-00b2-4cd4-be75-afd1a2d8231f  \n[26] https://support.any.do/en/articles/8609910-personalize-your-any-do-app-settings  \n[27] https://any.do/blog/the-best-ai-daily-planner-app-in-2026-why-any-do-stands-out/  \n[28] https://any.do/blog/any-do-chatgpt-integration/  \n[29] https://support.any.do/en/articles/8617898-getting-started-with-premium  \n[30] https://todoist.com/help/articles/use-a-todoist-widget-on-your-android-device-632pZA  \n[31] https://simple.ink/blog/notion-2025-what-to-expect-exploring-new-features-and-strategic-directions  \n[32] https://medium.com/@qicapp/10-latest-mobile-app-design-trends-to-follow-in-2026-48ab43e1433a  \n[33] https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/  \n[34] https://betasofttechnology.com/motion-ui-trends-and-micro-interactions/  \n[35] https://frankrausch.com/ios-navigation/  \n[36] https://forasoft.com/blog/article/accessibility-ios-app-development  \n[37] https://applevis.com/podcasts/what-s-new-ios-26-accessibility  \n[38] https://blog.logrocket.com/ux-design/linear-design/\n\n（本文中每一处事实的引用对应上述编号；若需针对单款产品的屏幕级别示例与素材，可直接参照每款产品的官方发布页或变更日志以获取高分辨率示意图与演示。）",
  "sources": [
    {
      "url": "https://developer.apple.com/design/whats-new/",
      "title": "What’s new - Design - Apple Developer",
      "favicon": "https://developer.apple.com/favicon.ico"
    },
    {
      "url": "https://www.todoist.com/help/articles/changelog-entries-from-2025-SsEIOCtjK",
      "title": "Changelog entries from 2025",
      "favicon": "https://www.todoist.com/static/favicon.ico"
    },
    {
      "url": "https://www.todoist.com/inspiration/hidden-features-todoist",
      "title": "26 Little-Known Todoist Features",
      "favicon": "https://www.todoist.com/static/favicon.ico"
    },
    {
      "url": "https://www.simple.ink/blog/notion-2025-what-to-expect-exploring-new-features-and-strategic-directions",
      "title": "Notion 2025: What to Expect? Exploring New Features and Strategic Directions",
      "favicon": "https://cdn.prod.website-files.com/610db4fccfb55c0a1dd2f429/610db4fccfb55ccee5d2f456_Webclip%20SI%20Coloured.png"
    },
    {
      "url": "https://www.omnigroup.com/blog/omni-roadmap-2025",
      "title": "Omni Roadmap 2025 - The Omni Group",
      "favicon": "https://www.omnigroup.com/assets/img/logo/BlueOmni.png"
    },
    {
      "url": "https://9to5mac.com/2025/10/13/heres-everything-new-in-reminders-with-ios-26/",
      "title": "Here’s everything new for Reminders in iOS 26 - 9to5Mac",
      "favicon": "https://9to5mac.com/wp-content/uploads/sites/6/2019/10/cropped-cropped-mac1-1.png?w=180"
    },
    {
      "url": "https://me.pcmag.com/en/productivity/21056/bear",
      "title": "Bear - Review 2025 - PCMag Middle East",
      "favicon": "https://www.pcmag.com/apple-touch-icon.png"
    },
    {
      "url": "https://linear.app/now/linear-liquid-glass",
      "title": "A Linear spin on Liquid Glass - Linear",
      "favicon": "https://linear.app/static/apple-touch-icon.png?v=2"
    },
    {
      "url": "https://support.microsoft.com/en-gb/office/what-s-new-in-microsoft-to-do-e4385509-13af-4a55-ae17-1c5a61cf2d41",
      "title": "What's new in Microsoft To Do - Microsoft Support",
      "favicon": "https://support.microsoft.com/apple-touch-icon.png"
    },
    {
      "url": "https://support.microsoft.com/en-au/office/screen-reader-support-for-microsoft-to-do-61cc610b-00b2-4cd4-be75-afd1a2d8231f",
      "title": "Screen reader support for Microsoft To Do - Microsoft Support",
      "favicon": "https://support.microsoft.com/apple-touch-icon.png"
    },
    {
      "url": "https://support.any.do/en/articles/8609910-personalize-your-any-do-app-settings",
      "title": "Personalize your Any.do app settings",
      "favicon": "https://intercom.help/anydo-helpcenter/assets/favicon"
    },
    {
      "url": "https://www.any.do/blog/the-best-ai-daily-planner-app-in-2026-why-any-do-stands-out/",
      "title": "The Best AI Daily Planner App in 2026: Why Any.do Stands Out",
      "favicon": "https://www.any.do/favicon.ico"
    },
    {
      "url": "https://www.apple.com/newsroom/2025/05/apple-unveils-powerful-accessibility-features-coming-later-this-year/",
      "title": "Apple unveils powerful accessibility features coming later this year - Apple",
      "favicon": "https://www.apple.com/favicon.ico"
    },
    {
      "url": "https://medium.com/@qicapp/10-latest-mobile-app-design-trends-to-follow-in-2026-48ab43e1433a",
      "title": "10+ Latest Mobile App Design Trends To Follow In 2026",
      "favicon": "https://miro.medium.com/v2/resize:fill:152:152/10fd5c419ac61637245384e7099e131627900034828f4f386bdaa47a74eae156"
    },
    {
      "url": "https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/",
      "title": "What’s Changing in Mobile App Design? UI Patterns That Matter in 2026 | Muzli Blog",
      "favicon": "https://muz.li/favicon.ico"
    },
    {
      "url": "https://workflowautomation.net/reviews/height",
      "title": "Height Review 2025 - Features, Pricing & Alternatives",
      "favicon": "https://workflowautomation.net/apple-touch-icon.png"
    },
    {
      "url": "https://frankrausch.com/ios-navigation/",
      "title": "Modern iOS Navigation Patterns · Frank Rausch",
      "favicon": "https://frankrausch.com/assets/img/favicon-180.png"
    },
    {
      "url": "https://www.betasofttechnology.com/motion-ui-trends-and-micro-interactions/",
      "title": "Motion UI Trends 2025: Micro-Interactions That Elevate UX Design",
      "favicon": "https://www.betasofttechnology.com/wp-content/uploads/2016/08/favicon.ico"
    },
    {
      "url": "https://www.applevis.com/podcasts/what-s-new-ios-26-accessibility",
      "title": "What’s New in iOS 26 Accessibility | AppleVis",
      "favicon": "https://applevis.com/sites/default/files/logo64x64.ico"
    },
    {
      "url": "https://culturedcode.com/things/blog/2025/09/things-for-os-26/",
      "title": "Things for OS 26 - Things Blog - Cultured Code",
      "favicon": "https://culturedcode.com/favicon.ico"
    },
    {
      "url": "https://www.todoist.com/help/articles/2026-changelog-HD3jJAtLd",
      "title": "2026 Changelog - Todoist",
      "favicon": "https://www.todoist.com/static/favicon.ico"
    },
    {
      "url": "https://www.todoist.com/help/articles/use-a-todoist-widget-on-your-android-device-632pZA",
      "title": "Use a Todoist widget on your Android device",
      "favicon": "https://www.todoist.com/static/favicon.ico"
    },
    {
      "url": "https://www.notion.com/releases/2025-11-17",
      "title": "November 17, 2025 – Notion 3.1",
      "favicon": "https://www.notion.com/front-static/logo-ios.png"
    },
    {
      "url": "https://www.forasoft.com/blog/article/accessibility-ios-app-development",
      "title": "The iOS Accessibility Playbook for 2026: 7 Pillars, WCAG 2.2 AA & EAA Compliance",
      "favicon": "https://cdn.prod.website-files.com/64e8910adc5a63966a68acc1/662ce63e7bb96441a4c253a4_Webclip.png"
    },
    {
      "url": "https://www.notion.com/help/mobile-widgets",
      "title": "Mobile widgets – Notion Help Center",
      "favicon": "https://www.notion.com/front-static/logo-ios.png"
    },
    {
      "url": "https://www.omnigroup.com/releasenotes/omnifocus/P45",
      "title": "OmniFocus Release Notes - The Omni Group",
      "favicon": "https://www.omnigroup.com/assets/img/logo/BlueOmni.png"
    },
    {
      "url": "https://www.omnigroup.com/releasenotes/omnifocus/P25",
      "title": "OmniFocus Release Notes - The Omni Group",
      "favicon": "https://www.omnigroup.com/assets/img/logo/BlueOmni.png"
    },
    {
      "url": "https://www.notion.com/releases",
      "title": "What's New - Notion",
      "favicon": "https://www.notion.com/front-static/logo-ios.png"
    },
    {
      "url": "https://blog.bear.app/category/updates/",
      "title": "Updates - Bear App",
      "favicon": "https://blog.bear.app/wp-content/uploads/2019/01/cropped-Red-Graphite-iOS-32x32.png"
    },
    {
      "url": "https://craft-support.mintlify.app/en/plan-and-do/calendar",
      "title": "Calendar view - Craft Help Center",
      "favicon": "https://craft-support.mintlify.app/favicon.ico"
    },
    {
      "url": "https://www.craft.do/blog/introducing-tasks",
      "title": "Craft 3: Introducing Tasks",
      "favicon": "https://www.craft.do/favicons/light/light_192.png"
    },
    {
      "url": "https://keycombiner.com/collections/linear/",
      "title": "Linear Keyboard Shortcuts",
      "favicon": "https://keycombiner.com/static/images/favicons/favicon.fa421f7048ec.png"
    },
    {
      "url": "https://blog.logrocket.com/ux-design/linear-design/",
      "title": "Linear design: The SaaS design trend that's boring and bettering UI - LogRocket Blog",
      "favicon": "https://blog.logrocket.com/wp-content/uploads/2019/06/cropped-cropped-favicon-196x196-150x150.png"
    },
    {
      "url": "https://apps.apple.com/us/app/things-3/id904237743",
      "title": "‎Things 3 App - App Store",
      "favicon": "https://apps.apple.com/assets/favicon/favicon-180.png"
    },
    {
      "url": "https://developer.apple.com/videos/play/wwdc2025/356/",
      "title": "Get to know the new design system - WWDC25 - Videos - Apple Developer",
      "favicon": "https://developer.apple.com/favicon.ico"
    },
    {
      "url": "https://www.any.do/blog/any-do-chatgpt-integration/",
      "title": "Boost Your Productivity with Any.do’s ChatGPT Integration",
      "favicon": "https://www.any.do/favicon.ico"
    },
    {
      "url": "https://support.any.do/en/articles/8617898-getting-started-with-premium",
      "title": "Getting Started with Premium | Any.do Help Center",
      "favicon": "https://intercom.help/anydo-helpcenter/assets/favicon"
    },
    {
      "url": "https://mobbin.com/colors/brand/linear",
      "title": "Linear Brand Color Palette: Hex, RGB, CMYK and UIs",
      "favicon": "https://mobbin.com/apple-icon.png?c21868dc79c132d6"
    }
  ],
  "status": "completed",
  "created_at": "2026-05-08T05:33:47.674645+00:00",
  "response_time": 346.49,
  "request_id": "3f765387-835c-4655-baf9-da0cb06dfa67"
}
