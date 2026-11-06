# SDD ledger — plan: docs/plans/2026-11-06-plan-templates.md

Ruling: 执行分支为 main（不建 worktree/feature 分支）——本会话既定协作模式（用户每次直接验收并推送 main），成本：回滚依赖 git revert，可接受。
Ruling: TDD 以计划 Global Constraints 声明的验证形式执行（node --check / JSON 校验 / wechatide CLI 编译截图 / 云端测试），不引入单测框架——项目无测试基建且计划（用户已确认）锁定此方式；成本：云函数逻辑错误靠云端测试而非单测拦截。
Ruling: sdd-workspace/task-start 脚本不可用（subagent-driven-development 包未安装），ledger 由执行者手动维护于本文件；成本：无脚本化任务边界校验，靠计划文本+todo 自律。

Pre-flight: Task 2 消费 Task 3 产出的计划字段（plan_id/plan_day 写入 checkins）；Task 4/5/6 消费 Task 3 接口（list/detail/join/completeDay）；Task 7 消费全部。命名已锁定：plan_id / day_no / current_day / status(ongoing|completed|quit)。无冲突。
