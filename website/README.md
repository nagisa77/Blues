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
npm run typecheck
npm run generate
```

GitHub Pages 使用仓库项目路径 `/Blues/`。工作流通过 `NUXT_APP_BASE_URL=/Blues/` 生成正确的资源链接。
