# P1-4 官方计划模板 + 跟练计时器 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户可加入官方计划（7 天入门 / 21 天减脂），按天跟练（倒计时计时器），完成自动打卡并推进计划进度。

**Architecture:** 新增 `plan` 云函数（list/detail/join/completeDay/quit）管理计划生命周期；跟练完成走 `checkin.create` 复用既有链路（徽章/广场/提醒续订全部联动），`plan.completeDay` 只负责幂等推进 `user_plans.current_day`；前端新增计划详情页与跟练执行页，改造现有计划占位页与首页推荐卡。

**Tech Stack:** 微信小程序原生（WXML/WXSS/JS）+ 微信云开发（云函数 + 文档数据库）；计时器用 `setInterval`；自动化验证用 wechatide CLI（编译/截图）。

**Spec:** `docs/MVP产品蓝图.md`（§3 P1-3/4、§5 页面结构、§6 数据模型、§9 接口契约风格）

## Global Constraints

- 原生 JS，第一版不用 TypeScript；所有新 JS 提交前 `node --check` 通过
- 云函数统一返回 `{ code, message, data }`；openid 取自云函数上下文，前端不传身份
- 日期口径 UTC+8，`date` 字段 `YYYY-MM-DD` 由服务端生成（复用各云函数既有 `todayStr()` 实现）
- 前端不直接读写云数据库，一律经 `utils/request.js` → 云函数
- 连续天数计算只允许出现在 `utils/streak.js` 与对应云函数（checkin/achievements/stats），plan 云函数不得重复实现
- 计划跟练打卡必须经 `checkin.create`（携带 `plan_id`/`plan_day`），以复用徽章解锁、广场分享、提醒续订链路
- 新集合权限均为「仅创建者可读写」（控制台手动创建）；本批新增集合：`plans`、`plan_items`、`user_plans`
- 本项目无单测基建：每任务的验证步骤为 `node --check` + wechatide CLI 编译 + 云端测试/模拟器截图，不引入测试框架

## Review Focus

1. **重复加入进行中计划** → `plans.join` 返回明确提示，不产生第二条 user_plans（Task 3 云端测试验证）
2. **跟练中途退出**（返回/放弃）→ 不写任何 checkin，计划进度不变（Task 6 编译 + 手工验证）
3. **同一天/同一 plan_day 重复完成** → `completeDay` 幂等：已有打卡时只推进不重复计（Task 3 云端测试验证）
4. **计划全部天数完成** → `status=completed`，计划列表显示已完成态（Task 7 验收）
5. **计时器页面切后台再回来** → 暂停并保留剩余秒数，不出现负数或跳变（Task 6 编译 + 手工验证）

---

### Task 1: 官方计划预置数据（JSONL + README）

**Files:**
- Create: `docs/plans.json`
- Create: `docs/plan_items.json`
- Modify: `README.md`（快速开始第 3.5 步：建集合并导入）

**Interfaces:**
- Produces: `plans` 集合 2 条（7 天入门 level=入门 goal_tag=减脂 total_days=7；21 天减脂 level=初中级 goal_tag=减脂 total_days=21），`_id` 由数据库生成，`is_official: true`
- Produces: `plan_items` 集合 28 条（7+21），每条含 `plan_id`（导入后需回填!，见 Task 7 验收前手工步骤）、`day_no`、`title`、`type_id`（引用 training_types 现有 8 条）、`duration_min`、`tips`

- [ ] **Step 1: 编写 `docs/plans.json`**（JSONL，每行一条，2 行）
- [ ] **Step 2: 编写 `docs/plan_items.json`**（JSONL，28 行；type_id 使用占位说明文件头注释写明"导入后按 name 换成真实 _id 或直接引用"，因控制台导入无法自动关联——实现时在文件中预置 training_types 各类型的**名称占位字段 `type_name`**，由 Task 7 的手工步骤在控制台核对）
- [ ] **Step 3: JSON 合法性校验**

Run: `node -e "require('fs').readFileSync('docs/plans.json','utf8').trim().split('\n').forEach(l=>JSON.parse(l)); console.log('plans.json OK')" && node -e "...plan_items.json 同理..."`
Expected: 两文件均 OK 且行数 2 / 28

- [ ] **Step 4: README 增加「计划模板初始化数据」章节**（建 3 集合 + 导入 + 字段核对说明）

- [ ] **Step 5: Commit**

```bash
git add docs/plans.json docs/plan_items.json README.md
git commit -m "P1-4: 官方计划模板预置数据（7天入门/21天减脂）"
```

### Task 2: checkin.create 支持计划打卡参数

**Files:**
- Modify: `cloudfunctions/checkin/index.js`（handleCreate）

**Interfaces:**
- Consumes: 既有 handleCreate 全部参数与返回（§9.3）
- Produces: `create` 新增可选入参 `plan_id: string`、`plan_day: number`；两者同传时 `source='plan'`（否则 `'manual'`），写入 checkins 文档；返回结构不变

- [ ] **Step 1: handleCreate 增加参数解析与 `source` 赋值**（plan_id/plan_day 必须成对出现，否则 1002）
- [ ] **Step 2: 语法校验**

Run: `node --check cloudfunctions/checkin/index.js`
Expected: 无输出（通过）

- [ ] **Step 3: Commit**

```bash
git add cloudfunctions/checkin/index.js
git commit -m "P1-4: checkin.create 支持 plan_id/plan_day（source=plan）"
```

### Task 3: plan 云函数（list / detail / join / completeDay / quit）

**Files:**
- Create: `cloudfunctions/plan/index.js`
- Create: `cloudfunctions/plan/package.json`
- Create: `cloudfunctions/plan/config.json`（空对象占位，无 openapi 权限）

**Interfaces:**
- Consumes: `plans` / `plan_items` / `user_plans` / `checkins` 集合；`utc8Now/fmtDate/todayStr` 工具（本地复制实现，口径 §9.1）
- Produces（均返回 `{code,message,data}`）:
  - `list` → `{ official: [{_id,title,cover,level,total_days,goal_tag,description}], my: {plan_id,title,total_days,current_day,status,days:[{day_no,title,duration_min,done}]} | null }`（my 取 status=ongoing 的第一条；days 由 plan_items + checkins where user_id+plan_id 组装 done 标记）
  - `detail` 入参 `plan_id` → `{ plan: {...}, items: [{day_no,title,duration_min,tips}], joined: boolean, my_status }`
  - `join` 入参 `plan_id` → 已有 ongoing 同计划返回 `2004 已在计划中`；否则创建 `{user_id, plan_id, start_date: today, status:'ongoing', current_day:1}` → `{ user_plan_id }`
  - `completeDay` 入参 `plan_id, day_no` → 幂等：校验 user_plans 属主且 ongoing（2005 非进行中）；查该 plan_day 是否已有本人 checkin（`where {user_id, plan_id, plan_day}`），不存在时**不写打卡**只返回提示 `{already_done:false}`（打卡由前端先调 checkin.create）；存在则推进 `current_day` 至下一个未完成 day_no（或 status=completed）→ `{ current_day, status, finished }`
  - `quit` 入参 `plan_id` → `status='quit'` → `{ quit: true }`

- [ ] **Step 1: 编写 plan 云函数三文件**（含错误码：2004 已在计划中、2005 非进行中，复用 1001/1002/2001/5000）
- [ ] **Step 2: 语法校验**

Run: `node --check cloudfunctions/plan/index.js`
Expected: 无输出

- [ ] **Step 3: Commit**

```bash
git add cloudfunctions/plan
git commit -m "P1-4: plan 云函数（list/detail/join/completeDay/quit）"
```

### Task 4: 计划 Tab 页改造（列表 + 我的进行中计划）

**Files:**
- Modify: `miniprogram/pages/plan/plan.js` / `plan.wxml` / `plan.wxss` / `plan.json`

**Interfaces:**
- Consumes: `plan.list`（Task 3）；`pages/plan-detail` 与 `pages/workout` 路由（Task 5/6）
- Produces: 我的进行中计划卡（进度条 + 今日任务 + 「继续跟练」→ `/pages/workout/workout?plan_id=X&day_no=N`）；官方计划卡列表（点击 → `/pages/plan-detail/plan-detail?plan_id=X`）；空态文案

- [ ] **Step 1: 改造 js/wxml/wxss/json 四件套**
- [ ] **Step 2: wechatide 编译 + 截图验证**（CLI：build/compile 工具，见 tool-index）

Run: `wechatide -c ZCode <编译工具>` 后 `simulator_screenshot`
Expected: 计划页显示官方 2 个计划卡与空态「还没有进行中的计划」

- [ ] **Step 3: Commit**

### Task 5: 计划详情页（新页面）

**Files:**
- Create: `miniprogram/pages/plan-detail/plan-detail.{js,wxml,wxss,json}`（4 文件）
- Modify: `miniprogram/app.json`（注册页面）

**Interfaces:**
- Consumes: `plan.detail`、`plan.join`（Task 3）；路由参数 `plan_id`
- Produces: 页面路由 `/pages/plan-detail/plan-detail?plan_id=X`；「开始计划」→ 成功后跳 `/pages/workout/workout?plan_id=X&day_no=1`

- [ ] **Step 1: 编写页面四件套 + app.json 注册**
- [ ] **Step 2: wechatide 编译 + 截图验证**（从计划页点入）
- [ ] **Step 3: Commit**

### Task 6: 跟练执行页（倒计时计时器）

**Files:**
- Create: `miniprogram/pages/workout/workout.{js,wxml,wxss,json}`（4 文件）
- Modify: `miniprogram/app.json`（注册页面）

**Interfaces:**
- Consumes: 路由参数 `plan_id` + `day_no`（由 Task 4/5 传入）；`plan.detail` 取当日 item；`checkin.create`（plan 参数，Task 2）；`plan.completeDay`（Task 3）
- Produces: 页面路由 `/pages/workout/workout?plan_id=X&day_no=N`；行为：进入拉当日任务 → 大倒计时（mm:ss，setInterval 1s）→ 暂停/继续 → 倒计时归零或点「完成打卡」→ 依序调 create + completeDay → 成功提示（含 new_badges toast）→ 返回
- 行为约束：`onHide` 暂停计时并保存剩余秒；`onUnload` 清除 interval；重复点「完成打卡」防抖

- [ ] **Step 1: 编写页面四件套 + app.json 注册**
- [ ] **Step 2: wechatide 编译 + 截图验证**（计时走动/暂停两态截图）
- [ ] **Step 3: Commit**

### Task 7: 首页今日任务卡 + 端到端联调验收

**Files:**
- Modify: `miniprogram/pages/index/index.js` / `index.wxml` / `index.wxss`

**Interfaces:**
- Consumes: `plan.list`（my 分支）；Task 6 跟练页路由
- Produces: 首页推荐卡位：有进行中计划 → 显示「今日任务：{title}（{duration_min} 分钟）」→ 点击直达跟练页；无 → 保留原「今日推荐」占位卡

- [ ] **Step 1: 改造首页三文件 + 语法校验**
- [ ] **Step 2: 部署**：控制台建 3 集合 → 导入 Task 1 数据 → 部署 `plan` + `checkin` 云函数（用户操作）
- [ ] **Step 3: 端到端验收**（云端测试 plan.list/join/completeDay + 模拟器全流程：加入 7 天计划 → 跟练完成 Day1 → 计划页进度 1/7 → checkins 出现 source=plan 记录）
- [ ] **Step 4: Commit + 推送**

## Self-Review 记录

- Spec 覆盖：蓝图 §3 P1-3（计划模板）/P1-4（跟练计时器）、§5 计划详情页与跟练执行页、§6 三集合与 checkins plan 字段、§9 风格契约 —— Task 1–7 全覆盖 ✅
- 口径决策已锁定：跟练完成 = checkin.create(plan 参数) + completeDay 推进（复用徽章/广场链路）；重复完成幂等；加入去重（2004）
- 类型一致性：`plan_id`/`day_no`/`current_day` 命名在 Task 2/3/5/6 间一致 ✅
- Review Focus 5 条均有归属任务与验证方式 ✅
- 比例：计划文档长度与规格相称，无代码转录 ✅
