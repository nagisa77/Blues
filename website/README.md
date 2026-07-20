# Tim / Blues Practice Archive

Nuxt 4 静态网站，展示仓库中的练习日志、个人录音、曲目状态和 8 周进度。

## 本地开发

```bash
npm install
npm run dev
```

内容不是在站点内重复维护的。`scripts/generate-content.mjs` 会在开发、构建和静态生成前，从仓库根目录的 Markdown 档案生成类型化 JSON。

生成脚本会在系统可用时通过 `ffmpeg` 从个人录音提取真实波形；如果不可用，界面会显示明确的音频轨道占位，不生成伪波形。

## 验证

```bash
npm test
npm run typecheck
npm run generate
```

`scripts/content/` 按配置、Markdown 解析、证据边界与领域规则拆分；新增档案格式或曲目匹配规则时，应在对应模块扩展并补测试。`npm run check` 可一次运行全部验证。

## 代码边界

- `app/config/`：站点级常量与导航定义。
- `app/composables/`：档案查询、播放器、A/B 对比、练习草稿和 URL 状态等可复用行为。
- `app/utils/`：无页面状态的格式化与证据展示规则。
- `app/assets/css/`：依次按 foundation、components、pages、responsive、refinements 加载；新增样式放入职责对应的文件，避免继续在单一入口尾部叠加覆盖。
- `scripts/content/`：从训练档案生成站点数据的纯解析与领域规则；`generate-content.mjs` 只负责读取、组装和输出。

GitHub Pages 使用仓库项目路径 `/Blues/`。工作流通过 `NUXT_APP_BASE_URL=/Blues/` 生成正确的资源链接。
