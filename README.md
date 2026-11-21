# prapers-wechat

刷题盒子：纯前端、本地存储的刷题微信小程序，基于 **uni-app + Vue3 + Vite + TypeScript + Pinia**。

- 无服务端、无账号、无网络请求
- 题库、进度、错题、收藏、统计全部保存在本机
- 支持 JSON 题库导入、刷题、错题本、收藏、统计、模拟考试、备份恢复

完整设计文档见上级目录：[刷题小程序设计方案.md](../刷题小程序设计方案.md)。

## 界面预览

以下为 H5 调试端截图（微信端导航栏与 tabBar 会略有差异）：

| 首页 | 刷题 |
|---|---|
| ![首页](docs/screenshots/home.png) | ![刷题](docs/screenshots/quiz.png) |

| 判分与解析 | 导入预览 |
|---|---|
| ![判分](docs/screenshots/answered.png) | ![导入预览](docs/screenshots/preview.png) |

![练习结果](docs/screenshots/result.png)

## 环境要求

- Node.js 18+ / 20+（本机验证使用 Node 24.21.0）
- 微信开发者工具（用于预览真机效果）
- npm 或 pnpm

## 开始

```bash
npm install
npm run dev:mp-weixin
```

然后在微信开发者工具中导入 `dist/dev/mp-weixin`。

发布构建：

```bash
npm run build:mp-weixin
```

导入 `dist/build/mp-weixin`。

> `src/manifest.json` 中 `mp-weixin.appid` 当前为 `touristappid`，正式发布前替换为你自己的小程序 AppID。

H5 仅用于开发调试：

```bash
npm run dev:h5
npm run build:h5
npm run serve:h5   # 本地静态预览 dist/build/h5
```

## 已有功能

- 题库列表、题库详情、删除、重置进度
- JSON 导入：格式校验、错误定位、预览修正答案、查重
- 单选 / 多选 / 判断
- 顺序练习、随机练习、章节练习、错题重练、收藏练习、模拟考试
- 题目浏览：按章节筛选、查看答案与解析、隐藏答案自测、上下题切换
- 即时判分、答案与解析、答题卡、断点续刷
- 错题自动收录、连续答对移出、收藏
- 今日数据、累计正确率、连续天数、最近 7 天、分库进度
- 设置：解析显示、自动下一题、字号、每日目标、错题阈值、多选少分、考试题量/时长
- 备份导出与恢复（`quizbackup/v1`）
- 内置 23 题示例题库

## 暂未实现（按设计文档属于 P1/P2）

- **PDF 导入**：方案要求先做 pdf.js 小程序端文本提取 POC（Gate），当前入口页明确说明并用 JSON 导入兜底
- 文本粘贴导入
- 图片题、深色模式、间隔重复

## 目录

```text
src/
├── pages/               页面
├── components/          通用组件
├── stores/              Pinia
├── services/            题库、备份、文件选择
├── core/
│   ├── quiz/            判分、选题
│   ├── import/          归一化、JSON 解析
│   ├── storage/         缓存/文件驱动、分片、记录
│   └── stats.ts         统计纯函数
├── types/               领域类型
├── utils/               工具
└── static/              示例题库、tabBar 图标
tests/unit/              Vitest 单元测试
tests/fixtures/          导入测试文件
docs/screenshots/        界面截图
scripts/gen-icons.mjs    tabBar 图标生成脚本
scripts/serve-h5.mjs     H5 静态预览服务
scripts/e2e-smoke.mjs    H5 端到端冒烟测试（可选）
```

## 存储说明

### 本地文件目录（仅微信小程序，`wx.env.USER_DATA_PATH`）

| 目录 | 内容 |
| --- | --- |
| `qb/{bankId}-chunk-*.json` | 题库正文分片，每片 300 题 |
| `backup/quizbackup-yyyyMMdd-HHmm.json` | 导出的备份文件（分享后仍留在本地） |

导入时通过 `chooseMessageFile` 选中的临时文件由微信管理，不属于本应用持久目录。

### 小程序缓存 / H5 localStorage（统一前缀 `qb:v1`）

| 键 | 内容 |
| --- | --- |
| `qb:v1:app` | 安装标识、连续天数、最近备份时间、示例题库标记 |
| `qb:v1:settings` | 刷题偏好、字号、每日目标、考试题量与时长等设置 |
| `qb:v1:banks` | 题库索引与元信息 |
| `qb:v1:stats:daily` | 每日答题统计 |
| `qb:v1:bank:{id}:manifest` | 题目分片索引 |
| `qb:v1:bank:{id}:progress` | 答题进度 |
| `qb:v1:bank:{id}:wrong:*` / `favorite:*` | 错题与收藏，每 200 题一片 |
| `qb:v1:bank:{id}:session` | 未完成的练习 / 考试会话 |
| `qb:v1:bank:{id}:chunk:*` | H5 或不支持文件系统时的题目正文分片（微信端走文件目录） |

缓存单 key 控制在 250KB 以内，避免 1MB/key 限制。清除微信缓存或卸载小程序会丢数据，请使用「备份与恢复」导出 `.json` 文件并发送到聊天保存。

### 一键清空

「我的」「设置」「备份与恢复」三个入口均提供「一键清空数据」：二次确认后删除上述两个文件目录和全部缓存，取消尚未落盘的延迟写入，并重置内存状态。为避免示例题库下次启动被重新种入，会保留一条 `qb:v1:app` 标记（不含题库与记录）。

## 测试与检查

```bash
npm test
npm run type-check
```

当前 8 个测试文件、53 个用例，覆盖判分、答案归一化、JSON 解析、选题、章节分组、统计、题库分片、备份恢复。

### H5 端到端冒烟测试（可选）

需要本机安装 Edge，并先启动静态服务：

```bash
npm run build:h5
npm run serve:h5
# 另开一个终端
node scripts/e2e-smoke.mjs
```

脚本会验证：首页 → 题库详情 → 章节列表/章节练习 → 题目列表/筛选/详情/隐藏答案 → 顺序答题 → 判分/解析 → 答题卡 → 收藏 → 错题 → 模拟考试交卷 → 结果页 → JSON 导入。脚本会使用本机 Edge 的 CDP 端口 `9223`，并临时启动无头浏览器。

## 当前验证结果

- `npm run type-check` 通过
- `npm run build:mp-weixin` 通过，主包约 226KB
- `npm run build:h5` 通过
- 53 个单元/集成测试通过
- H5 端到端冒烟测试通过（含章节练习与题目浏览）
- 未在微信开发者工具/真机运行（本机默认路径未发现微信开发者工具）；`dist/build/mp-weixin` 可直接导入验证

## 与设计文档的差异

- PDF 导入按设计中的 M0 Gate 暂缓，当前提供说明页与 JSON 兜底
- 文件模式使用扁平命名 `qb/{bankId}-chunk-*.json`（设计文档中为子目录命名）
- 未实现：答题流水、图片题
- 示例题库实际为 23 题
- 退出答题页依赖系统返回手势/按钮，不再额外弹确认框；会话与进度会自动保存

## JSON 题库格式

```json
{
  "schema": "quizbank/v1",
  "meta": { "name": "示例题库" },
  "questions": [
    {
      "type": "single",
      "stem": "TCP 属于哪一层协议？",
      "options": [
        { "key": "A", "text": "应用层" },
        { "key": "B", "text": "传输层" }
      ],
      "answer": ["B"],
      "analysis": "TCP 是传输层协议。",
      "chapter": "第一章 网络基础",
      "tags": ["TCP"],
      "difficulty": 1
    }
  ]
}
```

- `type`：`single` / `multiple` / `judge`
- 判断题答案：`A` = 正确，`B` = 错误
- 多选题答案：`["A", "C"]`
- `chapter`：章节名称，用于「按章节刷题」；同一题库中章节名保持一致即可自动归类
- `tags`：标签数组；`difficulty`：难度 0–5（整数）
- 可选字段：`chapter`、`tags`、`difficulty`、`analysis`、`images`（图片题暂不支持）
- 微信中请先把 JSON 文件发送到「文件传输助手」或任意聊天，再从聊天文件中选择
