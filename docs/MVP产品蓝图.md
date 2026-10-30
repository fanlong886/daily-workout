# 《今天练了吗》MVP 产品蓝图

> 定位：面向大众减脂塑形人群的轻量健身打卡小程序。
> 一句话：不打教你练，专注让你坚持——打卡、记录、看得见的进步。
> 版本：v0.1（待确认）｜日期：2026-10-30

---

## 1. 目标用户画像

### 画像 A：久坐减脂上班族「想瘦的小李」（25–35 岁，预计主力人群）
- **场景**：久坐 8h+，微胖/肚腩焦虑，办过健身卡但去了不到 3 次
- **行为**：只有碎片时间，愿意在家跟练 10–20 分钟
- **痛点**：不知道练什么、没人监督、三分钟热度
- **对产品的期待**：打开就知道今天练啥，练完顺手打个卡

### 画像 B：健身小白学生党/职场新人「怕社死的小张」（18–28 岁）
- **场景**：零基础，不敢去健身房，想"悄悄变好"
- **痛点**：动作不会、计划看不懂、坚持不过一周
- **对产品的期待**：傻瓜式跟练，连续天数和体重曲线看得见进步

### 画像 C：居家宝妈/体重管理人群「碎片时间的王姐」（28–40 岁）
- **场景**：带娃没整块时间，产后塑形/控体重
- **痛点**：时间碎、容易中断，中断一次就彻底放弃
- **对产品的期待**：5–15 分钟短训练也算数，断了有提醒拉回来

**共性洞察**：三类人都不是健身爱好者，核心诉求不是"更专业的训练"，而是"**开始并坚持**"。产品一切设计服务三件事：**低门槛、即时正反馈、损失厌恶（连续天数）**。

---

## 2. 核心价值主张

> **「打开就能练，3 步就打卡——让『坚持』变成看得见的连续天数。」**

**为什么用户每天要打开它：**
- 打开第一眼：首页置顶是"今天还没练"的状态提醒 + 连续天数（**损失厌恶**，断了可惜）
- 打卡瞬间：庆祝动效 + 天数 +1（**即时正反馈**，成本 3 秒）
- 长期动机：体重曲线、月历点亮让"我的变化"可见（**进步可视化**）

---

## 3. MVP 功能清单（P0 / P1 / P2）

### P0 —— 没有它产品不成立

| # | 功能 | 说明 |
|---|------|------|
| 1 | 微信登录 | `wx.login` 静默登录无弹窗；头像昵称用微信快捷填写能力，**可跳过** |
| 2 | 快速打卡 | 首页大按钮，3 步内完成：选类型（默认已选）→ 时长（默认 20 分钟可改）→ 完成打卡 |
| 3 | 训练记录 | 类型 / 时长 / 强度 / 备注 / 照片（全部可选，备注照片非必填），按时间倒序 |
| 4 | 数据统计 | 累计天数、连续天数、本月次数、累计时长 |
| 5 | 打卡日历 | 月历视图，打卡日点亮（坚持感的核心载体） |
| 6 | 体重记录 | 手动录入体重（体脂可选），趋势曲线 |
| 7 | 个人主页 | 资料 + 核心数据摘要 |

### P1 —— 提升留存

| # | 功能 | 说明 |
|---|------|------|
| 1 | 连续打卡 streak | 断签前通过订阅消息预警 |
| 2 | 每日提醒 | 微信订阅消息，用户自选时间 |
| 3 | 官方计划模板 | 7 天入门 / 21 天减脂等，每日任务勾选，跟练完成自动打卡 |
| 4 | 跟练计时器 | 计划内训练倒计时，结束自动打卡 |
| 5 | 打卡广场 | 公开打卡 feed（昵称+头像+内容），只读 + 点赞鼓励（轻社交，无评论私信） |
| 6 | 成就徽章 | 3 / 7 / 21 / 50 / 100 天里程碑 |
| 7 | 打卡分享海报 | Canvas 生成带连续天数图片，分享好友/朋友圈，兼作拉新 |

### P2 —— 后续迭代

| # | 功能 | 说明 |
|---|------|------|
| 1 | 视频跟练课程库 | 内容版权与制作成本高，需验证留存后再投入 |
| 2 | AI 个性化计划 | 根据体测数据/打卡历史生成 |
| 3 | 好友 / 组队 / 押金挑战 | 强社交 + 变现玩法 |
| 4 | 饮食记录 | 卡路里记录与建议 |
| 5 | 变现 | 会员、商城、广告 |
| 6 | 数据接入 | 微信运动步数、手表手环 |

---

## 4. 核心用户路径（新用户 → 第一次打卡）

**目标：30 秒内完成首次打卡，全程 ≤ 3 步。**

1. **进入**：扫码/点分享卡片进入 → `wx.login` 静默登录，**无任何弹窗**
2. **首次引导（一次性，3 秒）**：单选目标卡片「减脂 / 塑形 / 保持」→ 按目标出今日推荐训练（可跳过，默认减脂）
3. **落地首页 = 打卡台**：置顶大按钮「+ 开始今日训练」，下方今日推荐卡片（如"新手燃脂 15 分钟"）
4. **完成打卡，两条路径任选**：
   - **路径 A（记录式，最快 2 步）**：点「+ 快速打卡」→ 类型默认"自选训练"、时长默认 20 分钟 → 点「完成打卡」✅
   - **路径 B（跟练式）**：点推荐卡片 → 进入跟练页倒计时 → 结束自动打卡 ✅
5. **成功页**：庆祝动效 + 「连续 1 天」+ 引导开启每日提醒（订阅消息授权，可拒绝）+ 生成分享海报入口

**步数核算（路径 A）**：① 点按钮 → ②（可选）改类型/时长 → ③ 确认。**必填项 0 个**，所有字段有默认值兜底。

**关键决策**：头像昵称授权**不在首次打卡路径中**（保证零门槛），推迟到分享海报或进入广场时再请求。

---

## 5. 页面结构

**底部 Tab × 4：**

| Tab | 页面 | 核心功能 |
|-----|------|----------|
| 今日 | 首页 | 今日打卡状态卡（未练/已练 + 连续天数）、快速打卡大按钮、今日推荐训练、本周概览 |
| 计划 | 计划中心 | 官方计划列表、我的进行中计划、开始/继续计划 |
| 数据 | 统计 | 月历点亮、累计数据卡、体重曲线、历史记录列表 |
| 我的 | 个人中心 | 资料、徽章墙、提醒设置、打卡广场入口（P1）、关于/反馈 |

**二级页面清单：**

| 页面 | 核心功能 |
|------|----------|
| 打卡编辑弹层（半屏） | 类型、时长、强度、备注、照片，全默认值兜底 |
| 打卡成功页 | 庆祝动效、连续天数、海报分享、提醒引导 |
| 计划详情页 | 每日任务列表、开始计划 |
| 跟练执行页 | 倒计时器、动作列表（名称+文字提示）、完成自动打卡 |
| 体重记录页 | 快捷录入 + 趋势曲线 |
| 记录详情页 | 单条打卡详情、编辑/删除 |
| 打卡广场页（P1） | 公开 feed、点赞 |
| 提醒设置页 | 开关 + 时间选择（订阅消息授权） |
| 编辑资料页 | 昵称、头像、性别、身高、目标 |
| 徽章墙 | 已获/未获徽章、解锁条件 |

---

## 6. 数据模型草案（云开发集合，文档型）

### users 用户
`_id, openid, nickname, avatar_url, gender, height_cm, goal(减脂/塑形/保持), reminder_enabled, reminder_time, created_at, last_active_at`

### checkins 打卡记录（核心表）
`_id, user_id, date(YYYY-MM-DD), type_id, duration_min, intensity(低/中/高), note, photo_file_ids[], plan_id?, plan_day?, source(manual/timer/plan), created_at`
- 索引：`(user_id, date)` 组合查询 + 日期倒序分页
- 允许一天多条（早+晚练都算），"今日已打卡"= 当天存在任意记录；连续天数按"自然日有记录"计算

### training_types 训练类型字典
`_id, name, icon, default_duration_min, sort, enabled`

### plans 计划模板 / plan_items 计划日任务
- plans：`_id, title, cover, level, total_days, goal_tag, is_official, description`
- plan_items：`_id, plan_id, day_no, title, type_id, duration_min, tips`

### user_plans 用户计划实例
`_id, user_id, plan_id, start_date, status(进行中/已完成/已放弃), current_day`

### body_metrics 身体数据
`_id, user_id, date, weight_kg, body_fat_pct?, created_at`

### achievements 徽章定义 / user_achievements 用户徽章
- achievements：`_id, code, name, icon, condition_type, condition_value`
- user_achievements：`_id, user_id, achievement_id, earned_at`

### user_stats 统计冗余（可选，后置）
`user_id, total_days, current_streak, longest_streak, total_duration_min`
- P0 阶段连续天数基于 checkins 实时聚合即可（单人数据量极小）；用户量大后再引入冗余表做读写优化

---

## 7. 技术选型建议

### 前端：推荐 **微信小程序原生**（WXML/WXSS + TypeScript）

| 方案 | 结论 | 理由 |
|------|------|------|
| **原生（推荐）** | ✅ MVP 首选 | 只做微信一个端，跨端框架的抽象层反而是负担；调试直接、包体最小、单人维护成本最低；打卡工具性能要求不高 |
| Taro / uni-app | 备选 | 仅当①明确要发抖音/支付宝多端，或②团队强 React/Vue 栈时才值得引入构建复杂度；现在选择 = 为不确定的需求提前付税 |

配套：TypeScript + 少量 Vant Weapp 组件加速开发；海报用 Canvas 2D；图表用 ECharts 微信版（ec-canvas）或轻量自绘。

### 后端：推荐 **微信云开发**（云函数 + 云数据库 + 云存储）

| 方案 | 结论 | 理由 |
|------|------|------|
| **云开发（推荐）** | ✅ MVP 首选 | 免服务器/域名/备案/运维；openid 鉴权天然打通；订阅消息推送方便；打卡类读写量小，按量付费近乎零成本；单人全栈交付最快 |
| 自建（NestJS/Spring Boot + MySQL） | 备选 | 适合确定要做大、要多端、有运维能力时再切换；需域名备案，交付周期 +2 周以上 |

**锁定风险对策**：数据访问统一封装 service 层，字段结构按可迁移原则设计（时间戳、主键语义、无云开发私有类型渗漏到业务层），未来迁移只换 service 实现。

---

## 8. 第一版明确"不做什么"（防范围蔓延）

1. **不做教学内容生产**：无视频课程、无详细动作库；训练推荐只到「名称 + 时长 + 一句话文字提示」粒度
2. **不做任何变现**：会员 / 商城 / 广告一律无
3. **不做强社交**：无评论、无私信、无好友关系链；P1 广场只读 + 点赞
4. **不做 AI 计划生成**：推荐用规则实现（目标 → 固定模板映射）
5. **不做饮食/卡路里**：只记录训练时长，不做精确热量换算
6. **不做硬件与步数同步**：微信运动、手环接入后置
7. **不做多端 / 深色模式 / 多语言**
8. **不强制任何授权**：不要手机号，头像昵称可跳过
9. **不做打卡防作弊**（GPS/运动验证）：大众自律工具，作弊无收益，不为此增加打卡摩擦

### 验收基线
- 新用户冷启动 → 首次打卡 **≤ 3 步 / 30 秒**
- 打卡必填项 **0 个**（全默认值兜底）
- 老用户每日打卡 **≤ 3 次点击**

---

## 待确认决策点

1. **技术路线**：原生 + 云开发是否 OK？（若未来明确要多端，现在改 uni-app 成本最低）
2. **P0 范围**：7 项 P0 是否有增减？（打卡日历我放在了 P0，它是"坚持感"的核心视觉）
3. **打卡规则**：一天允许多次打卡（早+晚都记录，但"今日已打卡"只看有无）是否符合预期？

---

## 9. 云函数/Service 接口契约（P0）

> 技术路线补充约定：前端为原生 WXML/WXSS/JS（第一版不用 TypeScript）；前端**不直接读写任何云数据库集合**，数据访问一律经云函数（service 层）完成。

### 9.1 通用约定

**统一返回结构**（所有方法）：

- 成功：`{ code: 0, message: "ok", data: <业务数据> }`
- 失败：`{ code: <非0错误码>, message: <用户可读文案>, data: null }`

**错误码表：**

| code | message 示例 | 场景 |
|------|--------------|------|
| 0 | ok | 成功 |
| 1001 | 请重新进入小程序 | 云函数上下文未取得 openid |
| 1002 | 参数有误 | 入参校验失败（message 注明字段） |
| 2001 | 记录不存在 | checkin_id / record_id 无效 |
| 2002 | 无权操作 | 操作他人数据 |
| 2003 | 训练类型无效 | type_id 不存在或已下架 |
| 5000 | 服务开小差了，稍后再试 | 云函数内部异常 |

**判定口径（全局唯一）：**

1. **「今日已打卡」**：checkins 中存在 `user_id = 本人 且 date = 今天` 的**任意一条**记录即算已打卡；一天允许多条。
2. **连续天数 current_streak**：按自然日计算——今天有记录则从今天往回连续计数；今天没有则**从昨天往回计数**（今天未练不清零，避免晨间打开的挫败感，断签后次日归零重计）。
3. **「今天」**：一律指 **UTC+8 自然日**（云函数默认时区为 UTC，须显式 +8 换算）。`date` 为 `YYYY-MM-DD` 字符串，**由服务端生成，前端不可传入**。

**鉴权总则：**

- openid 一律取自云函数上下文，**前端不传任何身份参数**；
- 云函数以管理员权限操作集合（集合权限对其不生效），因此**归属校验在 service 层实现**：读改删前校验目标记录 `openid == 调用者 openid`，集合权限规则仅作前端直连场景的兜底（见 §10.7）。

### 9.2 user.*

#### user.login（静默登录/注册）

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回 data | `{ is_new_user: boolean, profile: UserProfile }`（UserProfile 即 §10.1 users 落库字段） |
| 职责 | 静默登录；openid 不存在则建档（goal 默认"减脂"，昵称默认"健身er_四位随机"，头像空串）；`is_new_user` 供前端进入首次引导 |
| 读写集合 | 读 + 写 users |
| 鉴权 | 微信上下文自动携带 openid，无需额外登录态 |

#### user.get（读取本人资料）

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回 data | `{ profile: UserProfile }` |
| 职责 | 读取本人完整资料 |
| 读写集合 | 读 users |
| 鉴权 | 仅本人 |

#### user.update（更新本人资料）

| 项 | 说明 |
|----|------|
| 入参 | 以下字段全部可选、**至少传一个**：`nickname: string ≤20`；`avatar_url: string`（云存储 fileID 或临时链接）；`gender: enum(unknown/male/female)`；`height_cm: number 80–250`；`goal: enum(减脂/塑形/保持)` |
| 返回 data | `{ profile: UserProfile }`（更新后全量） |
| 职责 | 白名单字段更新，未传字段不动 |
| 读写集合 | 写 users |
| 鉴权 | 仅本人 |

### 9.3 checkin.*

#### checkin.types（训练类型字典）

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回 data | `{ types: [{_id, name, icon, default_duration_min, sort}] }`（仅 enabled=true，按 sort 升序） |
| 职责 | 打卡弹层的类型选项；内容公共，前端可缓存 24 小时 |
| 读写集合 | 读 training_types |
| 鉴权 | 须登录（公共字典，无本人数据概念） |

#### checkin.create（创建打卡）

| 项 | 说明 |
|----|------|
| 入参 | `type_id: string`，必填；`duration_min: number`，必填（前端默认取所选类型的 default_duration_min，自选训练=20）；`intensity: enum(低/中/高)`，可选，默认"中"；`note: string ≤200`，可选，默认 ""；`photo_file_id: string`，可选，默认 ""（云存储 fileID，P0 仅单张） |
| 返回 data | `{ checkin_id, date, is_today_first, streak_after }` |
| 职责 | 创建本人当日打卡记录（`date` 服务端按 UTC+8 生成，一天可多条）；返回打卡后连续天数，成功页直接展示，免二次请求 |
| 读写集合 | 写 checkins；读 training_types（校验 type_id 存在且 enabled） |
| 鉴权 | 须登录；仅写本人数据；type_id 无效返回 2003 |

#### checkin.list（打卡记录分页）

| 项 | 说明 |
|----|------|
| 入参 | `page: number`，可选，默认 1；`page_size: number`，可选，默认 20，上限 50 |
| 返回 data | `{ list: [CheckinItem], page, page_size, has_more }`；CheckinItem = `{_id, date, type_id, type_name, duration_min, intensity, note, photo_file_id, created_at}` |
| 职责 | 本人打卡历史倒序分页（type_name 为创建时快照冗余，免联表） |
| 读写集合 | 读 checkins |
| 鉴权 | 仅本人数据 |

#### checkin.todayStatus（今日状态 + 连续天数）

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回 data | `{ date, checked_today, today_count, current_streak }` |
| 职责 | 首页打卡台首屏：今天是否已练、今日条数、当前连续天数（口径见 §9.1：今天未练时 current_streak 返回截至昨天的连续数，不清零） |
| 读写集合 | 读 checkins |
| 鉴权 | 仅本人 |

#### checkin.monthCalendar（当月日历点亮）

| 项 | 说明 |
|----|------|
| 入参 | `month: string "YYYY-MM"`，可选，默认当月。**P0 前端固定不传**（只展示当月、只读点亮，不可切月、不可补签）；切月能力 P1 再开放 |
| 返回 data | `{ month, days: [{date, checked}], checked_count }`（days 为整月逐日） |
| 职责 | 数据 Tab 月历点亮视图 |
| 读写集合 | 读 checkins |
| 鉴权 | 仅本人 |

#### checkin.update（编辑打卡）｜低频，P0 末位实现

| 项 | 说明 |
|----|------|
| 入参 | `checkin_id: string`，必填；可改字段至少一个：`duration_min / intensity / note / photo_file_id / type_id` |
| 返回 data | `{ updated: true }` |
| 职责 | 编辑本人某条打卡内容；`date`、`source` 不可改 |
| 读写集合 | 读 + 写 checkins |
| 鉴权 | 仅本人（记录不存在 2001，非本人 2002） |

#### checkin.delete（删除打卡）｜低频，P0 末位实现

| 项 | 说明 |
|----|------|
| 入参 | `checkin_id: string`，必填 |
| 返回 data | `{ deleted: true, current_streak }`（删除后重算；若删的是今日唯一记录，"今日已打卡"与连续天数自然回退） |
| 职责 | 删除本人某条打卡记录 |
| 读写集合 | 读 + 写 checkins |
| 鉴权 | 仅本人 |

### 9.4 stats.*

#### stats.summary（统计摘要）

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回 data | `{ total_days, current_streak, week_count, month_days, total_duration_min }`。total_days=累计打卡天数（去重自然日）；week_count=本周打卡次数（自然周，周一为起点）；month_days=本月打卡天数；total_duration_min=累计时长 |
| 职责 | 数据 Tab 摘要卡 + 首页"本周概览"；P0 基于本人 checkins 实时聚合（数据量小），**不建 user_stats 冗余表**（与 §6 差异见 §10.5） |
| 读写集合 | 读 checkins（聚合） |
| 鉴权 | 仅本人 |

### 9.5 body.*

#### body.add（体重录入）

| 项 | 说明 |
|----|------|
| 入参 | `weight_kg: number`，必填，范围 25–300，保留 1 位小数；`body_fat_pct: number`，可选，范围 1–70；`date: string "YYYY-MM-DD"`，可选，默认今天，允许补录过去日期、不允许晚于今天 |
| 返回 data | `{ record_id }` |
| 职责 | 录入一条体重（体脂可选），同日可重复录入（趋势取当日最后一次） |
| 读写集合 | 写 body_metrics |
| 鉴权 | 仅本人 |

#### body.trend（体重趋势）

| 项 | 说明 |
|----|------|
| 入参 | `days: number`，可选，默认 30，上限 365 |
| 返回 data | `{ records: [{date, weight_kg, body_fat_pct}]（按日期升序，同日取最后一次）, latest, diff_kg }`；diff_kg = 最新值 − 区间最早值，记录不足 2 条时为 null |
| 职责 | 体重趋势曲线数据（数据 Tab / 体重页共用） |
| 读写集合 | 读 body_metrics |
| 鉴权 | 仅本人 |

### 9.6 页面 ↔ 接口映射

| 页面 | 调用 |
|------|------|
| 小程序启动 | user.login（静默，全应用一次） |
| 首页（今日） | checkin.todayStatus、stats.summary（本周概览） |
| 打卡编辑弹层 | checkin.types（可缓存）、checkin.create |
| 打卡成功页 | 复用 create 返回值，不新调接口 |
| 计划 Tab | P0 仅静态展示"即将上线"占位，无接口 |
| 数据 Tab | stats.summary + checkin.monthCalendar + body.trend + checkin.list |
| 记录详情页 | checkin.update / checkin.delete |
| 体重记录页 | body.add + body.trend |
| 我的 | user.get、user.update、body.add（快捷称重入口可选） |

---

## 10. P0 数据字段最终版

> 与 §6 的差异以本节为准：① checkins 照片 P0 为**单张** `photo_file_id`（`photo_file_ids[]` 多图为 P1 扩展）；② `user_stats`、`plans/plan_items/user_plans`、`achievements/user_achievements` **P0 不建**；③ users 提醒字段 P1 再加。字段时间类型：`date` 类字符串为 YYYY-MM-DD，时间戳用云数据库 Date 类型。

### 10.1 users 用户

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | string | 自动 | 系统生成 | 文档 ID |
| openid | string | 是 | 云函数注入 | 微信 openid，**唯一索引** |
| nickname | string | 是 | "健身er_四位随机" | user.update 可改；微信昵称快捷填写后覆盖 |
| avatar_url | string | 否 | "" | 空则前端显示默认占位头像 |
| gender | string | 否 | "unknown" | unknown / male / female |
| height_cm | number | 否 | null | 80–250 |
| goal | string | 是 | "减脂" | 减脂 / 塑形 / 保持（首次引导可选） |
| created_at | Date | 是 | 服务端当前时间 | 建档时间 |
| last_active_at | Date | 是 | 服务端当前时间 | 每次登录/活跃刷新 |
| reminder_enabled / reminder_time | bool / string | **P1 再加** | - | 提醒功能上线时添加，P0 不建 |

### 10.2 checkins 打卡记录（核心表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | string | 自动 | 系统生成 | 文档 ID（即 checkin_id） |
| user_id | string | 是 | 云函数注入 openid | 冗余存 openid，查询与未来迁移友好 |
| date | string | 是 | 服务端按 UTC+8 生成 | YYYY-MM-DD 自然日；**前端不可传**；一天可多条 |
| type_id | string | 是 | - | 关联 training_types._id，创建时校验 |
| type_name | string | 是 | 字典当前值快照 | 冗余快照，字典改名不影响历史展示 |
| duration_min | number | 是 | - | 1–600 整数（分钟） |
| intensity | string | 是 | "中" | 低 / 中 / 高 |
| note | string | 否 | "" | ≤200 字 |
| photo_file_id | string | 否 | "" | 单张云存储 fileID；P1 扩展为 photo_file_ids[]（与 §6 冲突，以本表为准） |
| source | string | 是 | "manual" | P0 仅 manual；timer / plan 枚举值 P1 启用 |
| plan_id / plan_day | string / number | **P1 再加** | - | 跟练计划关联，P0 不建 |
| created_at | Date | 是 | 服务端当前时间 | 用于同日多条排序 |

### 10.3 training_types 训练类型字典

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | string | 自动 | 系统生成 | 文档 ID（即 type_id） |
| name | string | 是 | - | 类型名 |
| icon | string | 否 | "" | 前端图标 key（P0 可直接用 emoji） |
| default_duration_min | number | 是 | 20 | 打卡弹层时长默认值；**"自选训练"固定为 20** |
| sort | number | 是 | 0 | 升序展示 |
| enabled | bool | 是 | true | 下架开关 |

**预置数据（P0 全量 8 项）：**

| sort | name | icon | default_duration_min |
|------|------|------|----------------------|
| 0 | 自选训练（兜底项） | ✅ | **20** |
| 1 | 快走/跑步 | 🏃 | 30 |
| 2 | 跳绳 | 🪢 | 15 |
| 3 | HIIT 燃脂 | 🔥 | 15 |
| 4 | 力量训练 | 💪 | 30 |
| 5 | 瑜伽/拉伸 | 🧘 | 20 |
| 6 | 游泳 | 🏊 | 30 |
| 7 | 骑行 | 🚴 | 30 |

### 10.4 body_metrics 身体数据

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | string | 自动 | 系统生成 | 文档 ID（即 record_id） |
| user_id | string | 是 | 云函数注入 openid | |
| date | string | 是 | 默认今天 | YYYY-MM-DD；允许补录过去，不允许晚于今天 |
| weight_kg | number | 是 | - | 25–300，保留 1 位小数 |
| body_fat_pct | number | 否 | null | 1–70 |
| created_at | Date | 是 | 服务端当前时间 | 同日多条取最后一次 |

### 10.5 P1 才建的集合 / 字段（P0 明确不建）

| 对象 | 处理 |
|------|------|
| user_stats 整表 | P0 不建；统计全部基于 checkins 实时聚合（与 §6"可选后置"收敛为"P1 再建"） |
| plans / plan_items / user_plans | P1 计划功能上线时建 |
| achievements / user_achievements | P1 徽章功能上线时建 |
| checkins.photo_file_ids[] | P1 由单张 photo_file_id 扩展为多图数组 |
| checkins.plan_id / plan_day、source=timer/plan | P1 |
| users.reminder_enabled / reminder_time | P1 |

### 10.6 必建索引

| 集合 | 索引字段 | 类型 | 用途 |
|------|----------|------|------|
| users | openid | 唯一 | 登录建档查重 |
| checkins | user_id + date（组合） | 非唯一 | 覆盖今日状态、当月日历、列表分页全部查询（均为 user_id 前缀 + date 等值/范围）；单人记录量小，排序在查询结果内完成 |
| body_metrics | user_id + date（组合） | 非唯一 | 趋势查询 |
| training_types | sort（可选） | 普通 | 字典量 <20，可不建，内存排序即可 |

### 10.7 云数据库权限规则建议

| 集合 | read | write | 说明 |
|------|------|-------|------|
| users | 仅创建者可读写 | 仅创建者可读写 | 兜底防线 |
| checkins | 仅创建者可读写 | 仅创建者可读写 | 兜底防线 |
| body_metrics | 仅创建者可读写 | 仅创建者可读写 | 兜底防线 |
| training_types | 所有用户可读 | 任何人不可写（自定义安全规则 write: false） | 字典维护走云开发控制台/管理脚本 |

> 分层说明：本项目前端一律经云函数访问数据（背景约束），云函数以管理员权限操作、**不受集合权限限制**；因此集合权限只是"前端误直连"场景的兜底，真正的数据归属校验在 service 层完成（见 §9.1 鉴权总则）。
