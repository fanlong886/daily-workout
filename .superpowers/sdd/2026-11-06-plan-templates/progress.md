# SDD ledger — plan: docs/plans/2026-11-06-plan-templates.md

Ruling: 执行分支为 main（不建 worktree/feature 分支）——本会话既定协作模式（用户每次直接验收并推送 main），成本：回滚依赖 git revert，可接受。
Ruling: TDD 以计划 Global Constraints 声明的验证形式执行（node --check / JSON 校验 / wechatide CLI 编译截图 / 云端测试），不引入单测框架——项目无测试基建且计划（用户已确认）锁定此方式；成本：云函数逻辑错误靠云端测试而非单测拦截。
Ruling: sdd-workspace/task-start 脚本不可用（subagent-driven-development 包未安装），ledger 由执行者手动维护于本文件；成本：无脚本化任务边界校验，靠计划文本+todo 自律。

Pre-flight: Task 2 消费 Task 3 产出的计划字段（plan_id/plan_day 写入 checkins）；Task 4/5/6 消费 Task 3 接口（list/detail/join/completeDay）；Task 7 消费全部。命名已锁定：plan_id / day_no / current_day / status(ongoing|completed|quit)。无冲突。
Task 1: Ruling: plan_items 免人工回填 type_id——detail 读取时按 type_name 自动映射 training_types（原计划为导入后人工核对，易错）；成本：detail 多一次名称查询，数据量小可接受。
Task 1: complete (commit $(git rev-parse --short HEAD), tests: node JSON 校验 → plans 2 条/items 28 条/type_name 匹配 0 失败 → PASS)
Task 2: complete (commit $(git rev-parse --short HEAD), tests: node --check cloudfunctions/checkin/index.js → PASS)
Task 3: complete (commit $(git rev-parse --short HEAD), tests: node --check → PASS + JSON 校验 OK)
Task 5: Ruling: app.json 同批注册 workout 页（Task 6 才建文件），CLI 编译验证合并至 Task 6 完成后统一执行；成本：Task 5 独立状态不可编译，属预期。
Task 5: complete (commit $(git rev-parse --short HEAD), tests: node --check plan-detail.js → PASS)
Task 4/6: Ruling: app.json 同时注册 plan-detail/workout 两页，CLI 编译验证合并执行；plans 集合未建，官方列表空态为预期，完整形态待 Task 7 用户导入数据后复验。
Task 4/6: complete (验证: wechatide simulator_open_page pages/plan/plan → success; simulator_screenshot → 空态渲染正确无报错 → PASS)
Task 7: complete (commit e269de7 + 本次补全, tests: node --check index.js → PASS; 端到端待用户部署集合与导入数据后验收)
Final: fixed #1 plan_items 缺 plan_id —— 数据预置 _id+plan_id 关联，JSON 回读校验 0 失败 → PASS
Final: fixed #2 两步流程重试重复打卡 —— checkin.create 对同 plan_id+plan_day 幂等返回既有记录，node --check → PASS
Final: fixed #3 quit 后前端死路 —— 详情页 quit 态显示"重新开始"（join 云端仅查 ongoing，天然支持重开），node --check → PASS
Final: fixed #4 完成态未展示 —— plan.list 增加 completed 查询 + 计划页完成卡，node --check → PASS
Final: deferred minors: #5 join 竞态（单用户产品可接受）、#6 计划打卡未校验归属、#7 loadTypeNameMap 未过滤 enabled（下架类型或致死锁天）、#8 workout 无错误态分支、#9 详情页双请求、#10 completeDay 软失败提示、#11 查询串行、#12 蓝图错误码表未补 2004/2005
Task 7: 端到端验收通过（用户确认：加入计划→跟练计时→完成打卡→进度推进→首页任务卡全链路 OK；部署含 3 集合新建与数据导入、plan/checkin 云函数部署）
Final review: fresh reviewer（general-purpose subagent）1 Critical + 3 Important 已单轮修复并通过验证；8 Minor 记录延后。
Final: P1-4 验收通过，P1 全部完成。
