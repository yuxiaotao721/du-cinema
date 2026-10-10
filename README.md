# 🎬 渡影 (DuCinema)

> **渡赏专属云端片库 · 自由视界**  
> 专为渡生态打造的现代极客流媒体影视聚合站与云端片库引擎。

---

## ✨ 核心特性

1. **渡家族黑金曜石美学 (Black Obsidian & Luxury Gold)**
   - 沉浸式巨幕聚焦点播 (Hero Spotlight)
   - 流金发光边框与毛玻璃卡片交互
   - 响应式设计：完美适配苹果 iPhone Safari、安卓手机及桌面超宽屏

2. **双引擎一键播放 (Dual-Engine Playback)**
   - **🍎 苹果 / 网页端原生播放**：集成高画质 HLS.js 播放器，零广告、支持全屏与倍速
   - **⛵ 安卓 / DuOS 渡赏硬解**：一键触发 `dushang://play?url={m3u8}&title={name}` 深度唤醒渡赏原生 App，享受 GPU 硬件解码与无损全景声

3. **全网极速片库搜索与智能聚合**
   - 直连高速影视数据源，即搜即播
   - 剧集选集自动智能解析与切换

4. **渡赏 (DuShang) 标准云端片库 API**
   - 暴露 `/api/vod` 标准 JSON 片库接口
   - 渡赏 App 可直接以此作为全网片库源展示海报墙与热播榜

---

## 🚀 本地运行

```bash
# 无需任何复杂依赖，原生 Node.js 直接秒启
node server.js
```

访问：`http://localhost:3000`

---

## 🌐 免费一键云端部署

本仓库开箱即用支持以下两种无服务器 (Serverless) 免费托管平台：

### 方案 1：Vercel 部署
- 仓库内已内置 `api/vod.js` 边缘函数与缓存逻辑
- 直接在 Vercel 导入本仓库，点击 Deploy 即可

### 方案 2：Cloudflare Pages 部署
- 仓库内已内置 `functions/api/vod.js`
- 关联 GitHub 仓库，全免费全球全球加速
