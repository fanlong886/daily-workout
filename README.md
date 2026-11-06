# 今天练了吗

大众健身 + 减脂塑形微信小程序：打卡、记录、坚持。

- 产品蓝图：[docs/MVP产品蓝图.md](docs/MVP产品蓝图.md)（含 §9 接口契约、§10 数据字段最终版）
- 技术路线：微信小程序原生（WXML / WXSS / JS，第一版不用 TypeScript）+ 微信云开发（云函数 / 云数据库 / 云存储）

## 目录结构

```
daily-workout/
├── project.config.json          # 项目配置（miniprogramRoot / cloudfunctionRoot / appid）
├── project.private.config.json  # 个人本地偏好（不入团队约定的部分）
├── miniprogram/                 # 小程序代码
│   ├── app.js                   # 入口：仅做 wx.cloud.init
│   ├── app.json                 # 页面注册 + tabBar（4 tab）+ window
│   ├── app.wxss                 # 全局样式入口
│   ├── styles/                  # 设计变量 + 通用原子类
│   ├── utils/
│   │   ├── request.js           # 前端数据访问唯一出口（封装 wx.cloud.callFunction）
│   │   └── streak.js            # 连续天数前端唯一计算入口（本批占位）
│   ├── components/              # 自定义组件（暂空）
│   └── pages/                   # index 今日 / plan 计划 / stats 数据 / mine 我的
└── cloudfunctions/
    └── login/                   # user.login 静默登录/注册（蓝图 §9.2）
```

## 快速开始

### 1. 替换 AppID

`project.config.json` 中 `appid` 当前为占位值 `"touristappid"`。
**注意：云开发需要真实 AppID，测试号（游客模式）不支持开通云环境。** 拿到 AppID 后直接替换该字段即可。

### 2. 开通云开发并创建环境

微信开发者工具 → 顶部「云开发」→ 开通 → 创建环境。

> 免费体验版（2025-02 政策）：未发布上线阶段可一直免费使用；**小程序发布上线后 15 天内需转为付费套餐（¥19.9/月），否则环境进入隔离期并被销毁**。`app.js` 当前使用默认环境（账号仅一个环境）；未来新增多环境时，需在 `wx.cloud.init` 显式指定 `env`。

### 3. 创建集合并配置权限（蓝图 §10.7）

在云开发控制台 → 数据库，创建以下集合并设置权限：

| 集合 | 权限 |
|------|------|
| users | 仅创建者可读写 |
| checkins | 仅创建者可读写 |
| body_metrics | 仅创建者可读写 |
| training_types | 所有用户可读，任何人不可写（自定义安全规则 `write: false`） |

### 4. 创建索引（蓝图 §10.6）

| 集合 | 索引字段 | 类型 |
|------|----------|------|
| users | openid | 唯一 |
| checkins | user_id + date | 组合（非唯一） |
| body_metrics | user_id + date | 组合（非唯一） |

### 4.5 创建计划相关集合并导入计划模板（P1）

1. 控制台建 3 个集合（权限均为「仅创建者可读写」）：`plans`、`plan_items`、`user_plans`；
2. `plans` 集合 → 导入 → `docs/plans.json`（2 条）→ Insert；
3. `plan_items` 集合 → 导入 → `docs/plan_items.json`（28 条）→ Insert；
4. **无需人工回填 type_id**：`plan_items` 的 `type_name` 会在计划详情读取时自动映射到 `training_types` 的 `_id` 与图标。

### 5. 导入 training_types 预置数据（蓝图 §10.3）

导入文件已生成：[docs/training_types.json](docs/training_types.json)（JSON Lines 格式，每行一个对象，UTF-8）。
在云开发控制台 `training_types` 集合 → 导入 → 选择该文件，冲突处理选「Insert」。

### 6. 部署 login 云函数

开发者工具资源管理器中右键 `cloudfunctions/login` → 「上传并部署：云端安装依赖」（依赖 `wx-server-sdk@latest`）。

### 7. 运行

工具内编译预览即可看到 4 个 tab 静态骨架；真机预览请在「详情 → 本地设置」勾选「不校验合法域名」（仅开发阶段）。

## 初始化数据

`training_types` 预置 8 条（云开发控制台导入格式为 JSON Lines，每行一个对象；`_id` 由数据库自动生成，无需写入）：

```json
{"name":"自选训练","icon":"✅","default_duration_min":20,"sort":0,"enabled":true}
{"name":"快走/跑步","icon":"🏃","default_duration_min":30,"sort":1,"enabled":true}
{"name":"跳绳","icon":"🪢","default_duration_min":15,"sort":2,"enabled":true}
{"name":"HIIT 燃脂","icon":"🔥","default_duration_min":15,"sort":3,"enabled":true}
{"name":"力量训练","icon":"💪","default_duration_min":30,"sort":4,"enabled":true}
{"name":"瑜伽/拉伸","icon":"🧘","default_duration_min":20,"sort":5,"enabled":true}
{"name":"游泳","icon":"🏊","default_duration_min":30,"sort":6,"enabled":true}
{"name":"骑行","icon":"🚴","default_duration_min":30,"sort":7,"enabled":true}
```

> 「自选训练」为打卡兜底项，`default_duration_min` 固定为 20，与蓝图 §10.3 一致，请勿删除或改值。

## 下一批次待办

1. **tabBar 图标**：`app.json` 为严格 JSON 不支持注释，在此记录——`tabBar.list` 当前为纯文字（`iconPath` 合法可省略）；下批为每项补充 `iconPath` / `selectedIconPath` 两个字段即可，**不改 tabBar 结构**。图标资源放 `miniprogram/assets/tabbar/`。
2. **streak.js 实现**：按蓝图 §9.1 口径实现 `calcCurrentStreak`（当前恒返回 0，页面用演示数据）。
3. **业务云函数**：按蓝图 §9 契约生成 `checkin` / `stats` / `body` / `user`（资料更新部分）。
4. **页面接真实数据**：首页 `checkin.todayStatus`、数据页 `stats.summary` 等，替换各页 `demo` 演示数据。

## 开发约束备忘

- 前端不直接操作云数据库，数据访问一律经 `utils/request.js` → 云函数；
- 连续天数计算只允许出现在 `utils/streak.js`（前端入口）与对应云函数（云端），其他文件禁止重复实现；
- 所有云函数返回统一 `{ code, message, data }` 结构，错误码表见蓝图 §9.1；
- 不做 P0 之外的功能（P1/P2 清单见蓝图 §3、§8）。
