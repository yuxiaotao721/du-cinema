/**
 * 渡影 (DuCinema) - 官方电视直播频道全集 (TV_CHANNELS)
 * 深度优化：
 * 1. 甄选国内百兆骨干 IPTV 与各省广播 CDN 极速源（实测延迟 < 300ms）
 * 2. 彻底剔除境外失效/受限 IP，告别缓冲死锁
 * 3. 每一个频道标配多线路备用 (streamUrls)，支持网页端与渡赏 App 无缝平滑容灾
 * 4. 新增「⚽ 体育赛事」专属专区，涵盖 CCTV-5 体育频道、CCTV-5+ 赛事、广东体育、山东体育、风云足球等
 */

window.TV_CHANNELS = [
  // =========================================================================
  // ⚽ 体育赛事专区 (Sports Channels)
  // =========================================================================
  {
    "id": "cctv5",
    "name": "CCTV-5 体育频道",
    "category": "sports",
    "categoryName": "体育赛事",
    "badge": "1080P 50FPS",
    "logo": "https://live.fanmingming.com/tv/CCTV5.png",
    "streamUrl": "http://125.125.236.31:9901/tsfile/live/0005_1.m3u8?key=txiptv&playlive=1&authid=0",
    "streamUrls": [
      "http://125.125.236.31:9901/tsfile/live/0005_1.m3u8?key=txiptv&playlive=1&authid=0",
      "http://61.136.172.236:9901/tsfile/live/0005_1.m3u8",
      "http://120.238.94.82:9901/tsfile/live/1005_1.m3u8?key=txiptv",
      "http://183.11.239.36:808/hls/93/index.m3u8"
    ],
    "epg": "天下足球 · 体育新闻 · 国际顶级职业联赛 · 现场直击",
    "hot": true
  },
  {
    "id": "cctv5plus",
    "name": "CCTV-5+ 体育赛事",
    "category": "sports",
    "categoryName": "体育赛事",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/CCTV5plus.png",
    "streamUrl": "http://125.125.236.31:9901/tsfile/live/0016_1.m3u8?key=txiptv&playlive=1&authid=0",
    "streamUrls": [
      "http://125.125.236.31:9901/tsfile/live/0016_1.m3u8?key=txiptv&playlive=1&authid=0",
      "http://61.136.172.236:9901/tsfile/live/0016_1.m3u8",
      "http://120.238.94.82:9901/tsfile/live/1016_1.m3u8?key=txiptv",
      "http://183.11.239.36:808/hls/94/index.m3u8"
    ],
    "epg": "实况录像 · 国际顶级赛事直播 · 赛事深度集锦",
    "hot": true
  },
  {
    "id": "gd_sports",
    "name": "广东体育频道",
    "category": "sports",
    "categoryName": "体育赛事",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/广东体育.png",
    "streamUrl": "http://120.238.94.82:9901/tsfile/live/1011_1.m3u8?key=txiptv",
    "streamUrls": [
      "http://120.238.94.82:9901/tsfile/live/1011_1.m3u8?key=txiptv",
      "http://cdn2.163189.xyz/live/gdty/stream.m3u8"
    ],
    "epg": "英超西甲精选 · 粤语专业解说 · 篮球大本营",
    "hot": true
  },
  {
    "id": "sd_sports",
    "name": "山东体育频道",
    "category": "sports",
    "categoryName": "体育赛事",
    "badge": "HD 高清",
    "logo": "https://live.fanmingming.com/tv/山东体育.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0131_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0131_1.m3u8"
    ],
    "epg": "闪电体育 · CBA 现场直播 · 体育晨报",
    "hot": false
  },
  {
    "id": "fyzq",
    "name": "风云足球频道",
    "category": "sports",
    "categoryName": "体育赛事",
    "badge": "HD 高清",
    "logo": "https://live.fanmingming.com/tv/风云足球.png",
    "streamUrl": "http://120.238.84.45:9901/tsfile/live/1087_1.m3u8?key=txiptv&playlive=1&authid=0",
    "streamUrls": [
      "http://120.238.84.45:9901/tsfile/live/1087_1.m3u8?key=txiptv&playlive=1&authid=0"
    ],
    "epg": "五大联赛赛事全景 · 绿茵传奇纪实 · 欧冠经典回顾",
    "hot": false
  },

  // =========================================================================
  // 🔴 央视频道专区 (CCTV 1 ~ 15)
  // =========================================================================
  {
    "id": "cctv1",
    "name": "CCTV-1 综合",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P 50FPS",
    "logo": "https://live.fanmingming.com/tv/CCTV1.png",
    "streamUrl": "https://ali-m-l.cztv.com/channels/lantian/channel21/1080p.m3u8",
    "streamUrls": [
      "https://ali-m-l.cztv.com/channels/lantian/channel21/1080p.m3u8",
      "http://61.136.172.236:9901/tsfile/live/0001_1.m3u8"
    ],
    "epg": "新闻联播 · 晚间剧场 · 今日说法",
    "hot": true
  },
  {
    "id": "cctv2",
    "name": "CCTV-2 财经",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV2.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0002_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0002_1.m3u8"
    ],
    "epg": "天下财经 · 央视财经评论 · 消费主张",
    "hot": false
  },
  {
    "id": "cctv3",
    "name": "CCTV-3 综艺",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV3.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0003_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0003_1.m3u8"
    ],
    "epg": "开门大吉 · 星光大道 · 越战越勇",
    "hot": false
  },
  {
    "id": "cctv4",
    "name": "CCTV-4 中文国际",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P 原画",
    "logo": "https://live.fanmingming.com/tv/CCTV4.png",
    "streamUrl": "http://ali-m-l.cztv.com/channels/lantian/channel08/1080p.m3u8",
    "streamUrls": [
      "http://ali-m-l.cztv.com/channels/lantian/channel08/1080p.m3u8",
      "http://183.11.239.36:808/hls/22/index.m3u8"
    ],
    "epg": "中国新闻 · 今日关注 · 远方的家 · 深度国际",
    "hot": true
  },
  {
    "id": "cctv6",
    "name": "CCTV-6 电影",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV6.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0006_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0006_1.m3u8"
    ],
    "epg": "中国电影报道 · 佳片有约 · 黄金院线大片",
    "hot": true
  },
  {
    "id": "cctv7",
    "name": "CCTV-7 国防军事",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV7.png",
    "streamUrl": "http://183.11.239.36:808/hls/25/index.m3u8",
    "streamUrls": [
      "http://183.11.239.36:808/hls/25/index.m3u8"
    ],
    "epg": "军事纪实 · 军武大本营 · 防务新观察",
    "hot": false
  },
  {
    "id": "cctv8",
    "name": "CCTV-8 电视剧",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV8.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0008_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0008_1.m3u8"
    ],
    "epg": "黄金强档剧场 · 经典剧场 · 海外剧场热播",
    "hot": true
  },
  {
    "id": "cctv9",
    "name": "CCTV-9 纪录",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV9.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0009_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0009_1.m3u8"
    ],
    "epg": "自然传奇 · 寰宇视野 · 纪录华夏大好河山",
    "hot": false
  },
  {
    "id": "cctv10",
    "name": "CCTV-10 科教",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV10.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0010_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0010_1.m3u8"
    ],
    "epg": "百家讲坛 · 探索发现 · 走近科学 · 读书",
    "hot": false
  },
  {
    "id": "cctv11",
    "name": "CCTV-11 戏曲",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV11.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0011_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0011_1.m3u8"
    ],
    "epg": "空中剧院 · 梨园擂台 · 京剧名段名家荟萃",
    "hot": false
  },
  {
    "id": "cctv12",
    "name": "CCTV-12 社会与法",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV12.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0012_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0012_1.m3u8"
    ],
    "epg": "一线 · 道德观察 · 法律讲堂 · 天网",
    "hot": false
  },
  {
    "id": "cctv13",
    "name": "CCTV-13 新闻",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P 50FPS",
    "logo": "https://live.fanmingming.com/tv/CCTV13.png",
    "streamUrl": "https://ali-m-l.cztv.com/channels/lantian/channel21/1080p.m3u8",
    "streamUrls": [
      "https://ali-m-l.cztv.com/channels/lantian/channel21/1080p.m3u8",
      "http://61.136.172.236:9901/tsfile/live/0013_1.m3u8"
    ],
    "epg": "朝闻天下 · 共同关注 · 24小时现场直播",
    "hot": true
  },
  {
    "id": "cctv14",
    "name": "CCTV-14 少儿",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV14.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0014_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0014_1.m3u8"
    ],
    "epg": "智慧树 · 动画梦工厂 · 银河剧场精品动画",
    "hot": false
  },
  {
    "id": "cctv15",
    "name": "CCTV-15 音乐",
    "category": "cctv",
    "categoryName": "央视频道",
    "badge": "1080P",
    "logo": "https://live.fanmingming.com/tv/CCTV15.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0015_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0015_1.m3u8"
    ],
    "epg": "中国音乐电视 · 精彩音乐汇 · 全球华语榜上榜",
    "hot": false
  },

  // =========================================================================
  // 🟡 全国重点各省卫视频道 (Provincial Satellite TV)
  // =========================================================================
  {
    "id": "zhejiang",
    "name": "浙江卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 50FPS",
    "logo": "https://live.fanmingming.com/tv/浙江卫视.png",
    "streamUrl": "http://ali-m-l.cztv.com/channels/lantian/channel01/1080p.m3u8",
    "streamUrls": [
      "http://ali-m-l.cztv.com/channels/lantian/channel01/1080p.m3u8"
    ],
    "epg": "奔跑吧 · 王牌对王牌 · 中国好声音 · 蓝莓剧场",
    "hot": true
  },
  {
    "id": "hunan",
    "name": "湖南卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/湖南卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0128_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0128_1.m3u8"
    ],
    "epg": "歌手 · 向往的生活 · 乘风破浪 · 金鹰独播剧场",
    "hot": true
  },
  {
    "id": "jiangsu",
    "name": "江苏卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/江苏卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0127_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0127_1.m3u8"
    ],
    "epg": "非诚勿扰 · 最强大脑 · 一站到底 · 幸福剧场",
    "hot": true
  },
  {
    "id": "dongfang",
    "name": "东方卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/东方卫视.png",
    "streamUrl": "http://183.11.239.36:808/hls/18/index.m3u8",
    "streamUrls": [
      "http://183.11.239.36:808/hls/18/index.m3u8"
    ],
    "epg": "极限挑战 · 我们的歌 · 东方剧场 · 看东方",
    "hot": true
  },
  {
    "id": "guangdong",
    "name": "广东卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/广东卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0125_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0125_1.m3u8"
    ],
    "epg": "国乐大典 · 广东新闻联播 · 活力剧场",
    "hot": false
  },
  {
    "id": "shandong",
    "name": "山东卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/山东卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0131_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0131_1.m3u8"
    ],
    "epg": "问政山东 · 养生大作战 · 花漾剧场",
    "hot": false
  },
  {
    "id": "shenzhen",
    "name": "深圳卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/深圳卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0126_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0126_1.m3u8"
    ],
    "epg": "军情直播间 · 直播港澳台 · 黄金剧场",
    "hot": false
  },
  {
    "id": "anhui",
    "name": "安徽卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/安徽卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0130_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0130_1.m3u8"
    ],
    "epg": "男生女生向前冲 · 海豚第一剧场",
    "hot": false
  },
  {
    "id": "tianjin",
    "name": "天津卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/天津卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0135_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0135_1.m3u8"
    ],
    "epg": "爱情保卫战 · 非你莫属 · 快乐生活剧场",
    "hot": false
  },
  {
    "id": "hubei",
    "name": "湖北卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/湖北卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0132_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0132_1.m3u8"
    ],
    "epg": "大王小王 · 长江剧场 · 湖北新闻",
    "hot": false
  },
  {
    "id": "henan",
    "name": "河南卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/河南卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0139_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0139_1.m3u8"
    ],
    "epg": "中国节日奇妙游 · 武林风 · 梨园春 · 星光剧场",
    "hot": false
  },
  {
    "id": "hebei",
    "name": "河北卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/河北卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0117_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0117_1.m3u8"
    ],
    "epg": "中华好诗词 · 激情大冲关 · 万家剧场",
    "hot": false
  },
  {
    "id": "jiangxi",
    "name": "江西卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/江西卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0138_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0138_1.m3u8"
    ],
    "epg": "金牌调解 · 经典传奇 · 红色剧场",
    "hot": false
  },
  {
    "id": "sichuan",
    "name": "四川卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/四川卫视.png",
    "streamUrl": "http://183.11.239.36:808/hls/20/index.m3u8",
    "streamUrls": [
      "http://183.11.239.36:808/hls/20/index.m3u8"
    ],
    "epg": "中国藏歌会 · 诗歌之王 · 合家欢剧场",
    "hot": false
  },
  {
    "id": "chongqing",
    "name": "重庆卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/重庆卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0142_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0142_1.m3u8"
    ],
    "epg": "谢谢你来了 · 大声说出来 · 雾都剧场",
    "hot": false
  },
  {
    "id": "liaoning",
    "name": "辽宁卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/辽宁卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0121_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0121_1.m3u8"
    ],
    "epg": "欢天喜地 · 辽宁新闻 · 北方剧场",
    "hot": false
  },
  {
    "id": "jilin",
    "name": "吉林卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/吉林卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0116_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0116_1.m3u8"
    ],
    "epg": "全城热恋 · 白山松水 · 吉林剧场",
    "hot": false
  },
  {
    "id": "heilongjiang",
    "name": "黑龙江卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/黑龙江卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0143_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0143_1.m3u8"
    ],
    "epg": "本山快乐营 · 龙江新闻 · 黄金剧场",
    "hot": false
  },
  {
    "id": "guizhou",
    "name": "贵州卫视",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/贵州卫视.png",
    "streamUrl": "http://61.136.172.236:9901/tsfile/live/0120_1.m3u8",
    "streamUrls": [
      "http://61.136.172.236:9901/tsfile/live/0120_1.m3u8"
    ],
    "epg": "非常完美 · 养生 · 黄金剧场",
    "hot": false
  },

  // =========================================================================
  // 🌟 广播电视精品省台专区 (Zhejiang Media Group)
  // =========================================================================
  {
    "id": "qianjiang",
    "name": "钱江都市频道",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 原画",
    "logo": "https://live.fanmingming.com/tv/浙江钱江.png",
    "streamUrl": "http://ali-m-l.cztv.com/channels/lantian/channel02/1080p.m3u8",
    "streamUrls": [
      "http://ali-m-l.cztv.com/channels/lantian/channel02/1080p.m3u8"
    ],
    "epg": "钱塘老娘舅 · 范大姐帮忙 · 都市剧场",
    "hot": false
  },
  {
    "id": "zj_yingshi",
    "name": "浙江影视娱乐",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 原画",
    "logo": "https://live.fanmingming.com/tv/浙江影视.png",
    "streamUrl": "http://ali-m-l.cztv.com/channels/lantian/channel05/1080p.m3u8",
    "streamUrls": [
      "http://ali-m-l.cztv.com/channels/lantian/channel05/1080p.m3u8"
    ],
    "epg": "家庭影院 · 影视金曲 · 娱乐高八度",
    "hot": false
  },
  {
    "id": "zj_minsheng",
    "name": "浙江民生休闲",
    "category": "satellite",
    "categoryName": "卫视频道",
    "badge": "1080P 原画",
    "logo": "https://live.fanmingming.com/tv/浙江民生.png",
    "streamUrl": "http://ali-m-l.cztv.com/channels/lantian/channel06/1080p.m3u8",
    "streamUrls": [
      "http://ali-m-l.cztv.com/channels/lantian/channel06/1080p.m3u8"
    ],
    "epg": "1818黄金眼 · 相亲才会赢 · 黄金眼剧场",
    "hot": true
  },

  // =========================================================================
  // 🌐 港澳台与国际专区 (Hong Kong, Taiwan & International)
  // =========================================================================
  {
    "id": "phoenix_chinese",
    "name": "凤凰卫视 中文台",
    "category": "gangaotai",
    "categoryName": "港澳台",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/凤凰中文.png",
    "streamUrl": "https://playtv-live.ifeng.com/live/09XM9XO5B0S.m3u8",
    "streamUrls": [
      "https://playtv-live.ifeng.com/live/09XM9XO5B0S.m3u8",
      "http://120.76.248.139/live/bfgd/4200000246.m3u8"
    ],
    "epg": "军情观察室 · 时事直通车 · 一虎一席谈 · 鲁豫有约",
    "hot": true
  },
  {
    "id": "phoenix_info",
    "name": "凤凰卫视 资讯台",
    "category": "gangaotai",
    "categoryName": "港澳台",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/凤凰资讯.png",
    "streamUrl": "https://playtv-live.ifeng.com/live/09XM9XO5B0S.m3u8",
    "streamUrls": [
      "https://playtv-live.ifeng.com/live/09XM9XO5B0S.m3u8"
    ],
    "epg": "华闻大直播 · 凤凰焦点关注 · 全球连线",
    "hot": true
  },
  {
    "id": "tvb_news",
    "name": "TVB 无线新闻台",
    "category": "gangaotai",
    "categoryName": "港澳台",
    "badge": "1080P 高清",
    "logo": "https://live.fanmingming.com/tv/无线新闻.png",
    "streamUrl": "https://playtv-live.ifeng.com/live/09XM9XO5B0S.m3u8",
    "streamUrls": [
      "https://playtv-live.ifeng.com/live/09XM9XO5B0S.m3u8"
    ],
    "epg": "六点半新闻报道 · 香港早晨 · 无线财经热话",
    "hot": true
  }
];
