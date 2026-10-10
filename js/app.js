/**
 * 渡影 (DuCinema) - 渡赏专属云端片库前端逻辑
 * 核心升级：
 * 1. 挂载光速超清源（全球免 IP 封锁、原生支持 CORS）
 * 2. 独家「双模态播放内核」：
 *    - ⚡ 极速免检通道：Iframe 官方嵌入秒播，100% 免疫任何代理节点和浏览器跨域限制
 *    - 🍎 原生 HLS 通道：HTML5 原生解码，支持全屏、画中画与 0.5x~3.0x 倍速
 *    - ⛵ 渡赏硬解通道：dushang://play?url=... 一键呼叫安卓 DuOS 原生 App
 */

class DuCinemaApp {
  constructor() {
    this.apiEndpoint = '/api/vod';
    this.currentPage = 1;
    this.currentType = '';
    this.currentYear = '';
    this.currentKeyword = '';
    this.playerMode = 'iframe'; // 'iframe' or 'hls'
    
    this.currentSource = 'guangsu';
    this.sourceInfo = {
      'guangsu': { name: '🌟 光速 1080P 专线', badge: '1080P 推荐', api: 'https://api.guangsuapi.com/api.php/provide/vod/' },
      'bdzy': { name: '💎 百度 蓝光大片专线', badge: '蓝光原画', api: 'https://api.apibdzy.com/api.php/provide/vod/' },
      'ffzy': { name: '🚀 非凡 极速秒播专线', badge: '秒播低延', api: 'https://cj.ffzyapi.com/api.php/provide/vod/' },
      'xinlang': { name: '🎬 新浪 高清全库专线', badge: '综合全库', api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/' }
    };
    
    this.movies = [];
    this.currentMovie = null;
    this.currentEpisodes = [];
    this.currentEpIndex = 0;
    
    this.hls = null;
    this.videoEl = document.getElementById('html5-player');
    this.iframeEl = document.getElementById('iframe-player');

    // High-res curated fallback blockbuster (Guangsu CDN)
    this.featuredFallback = {
      vod_id: 99999,
      vod_name: '流浪地球 3(上)（前导预告）',
      vod_year: '2027',
      vod_area: '中国大陆',
      vod_class: '科幻 / 冒险 / 灾难',
      vod_actor: '吴京, 刘德华, 李雪健, 沙溢',
      vod_pic: 'https://img.guangsuimage.com/upload/vod/20240904-1/363b9074b1e52fc2a76fa8e9323c6b2a.jpg',
      vod_score: '9.0',
      vod_blurb: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新家园。然而宇宙之路危机四伏，人类再次挺身而出...',
      vod_play_url: '预告片$https://v.gsuus.com/play/xboNyywa$$$预告片$https://v.gsuus.com/play/xboNyywa/index.m3u8'
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateApiUrlDisplay();
    this.loadCatalog();
  }

  bindEvents() {
    // Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.currentType = item.dataset.type || '';
        this.currentKeyword = '';
        this.currentPage = 1;
        document.getElementById('search-input').value = '';
        this.loadCatalog();
      });
    });

    // Search Input & Submit
    const searchInput = document.getElementById('search-input');
    const searchSubmit = document.getElementById('search-submit');
    const searchClear = document.getElementById('search-clear');

    searchSubmit.addEventListener('click', () => this.handleSearch());
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    searchInput.addEventListener('input', () => {
      searchClear.style.display = searchInput.value ? 'flex' : 'none';
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      this.currentKeyword = '';
      this.currentPage = 1;
      this.loadCatalog();
    });

    // Hot Search Tags
    document.querySelectorAll('.hot-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const kw = tag.dataset.kw;
        searchInput.value = kw;
        searchClear.style.display = 'flex';
        this.handleSearch(kw);
      });
    });

    // Year Filter Pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentYear = pill.dataset.year || '';
        this.currentPage = 1;
        this.loadCatalog();
      });
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadCatalog();
      }
    });
    document.getElementById('next-page').addEventListener('click', () => {
      this.currentPage++;
      this.loadCatalog();
    });

    // Player Mode Toggle (Iframe vs HLS)
    const btnIframe = document.getElementById('btn-mode-iframe');
    const btnHls = document.getElementById('btn-mode-hls');

    if (btnIframe && btnHls) {
      btnIframe.addEventListener('click', () => {
        this.setPlayerMode('iframe');
      });
      btnHls.addEventListener('click', () => {
        this.setPlayerMode('hls');
      });
    }

    // DuShang Deep Link & Copy Buttons in Modal
    document.getElementById('modal-dushang-btn').addEventListener('click', () => {
      this.invokeDuShangPlayer();
    });
    document.getElementById('modal-copy-btn').addEventListener('click', () => {
      this.copyCurrentStreamUrl();
    });

    // Hero Spotlight Actions
    document.getElementById('hero-play-dushang').addEventListener('click', () => {
      const target = this.featuredMovie || this.featuredFallback;
      this.openModal(target, 0);
      this.invokeDuShangPlayer();
    });
    document.getElementById('hero-play-web').addEventListener('click', () => {
      const target = this.featuredMovie || this.featuredFallback;
      this.openModal(target, 0);
    });

    // API Modal Dialog
    document.getElementById('btn-api-modal').addEventListener('click', () => {
      document.getElementById('api-modal').classList.add('active');
    });
    document.getElementById('copy-api-url').addEventListener('click', () => {
      const url = document.getElementById('api-url-text').innerText;
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('✅ 渡赏片库 API 地址已复制到剪贴板！');
      });
    });

    // Source Switch
    document.getElementById('btn-source-switch').addEventListener('click', () => {
      this.openSourceModal();
    });
  }

  openSourceModal() {
    document.getElementById('source-modal').classList.add('active');
  }

  closeSourceModal() {
    document.getElementById('source-modal').classList.remove('active');
  }

  switchSource(srcKey) {
    if (!this.sourceInfo[srcKey]) return;
    this.currentSource = srcKey;
    
    // Update active state in source cards
    document.querySelectorAll('.source-card').forEach(card => {
      const isMatch = card.dataset.src === srcKey;
      card.classList.toggle('active', isMatch);
      const radio = card.querySelector('.src-radio');
      if (radio) radio.innerText = isMatch ? '✓' : '';
    });

    // Update header button text
    const info = this.sourceInfo[srcKey];
    const sourceBtn = document.getElementById('btn-source-switch');
    if (sourceBtn) {
      sourceBtn.innerHTML = `<span class="btn-icon">⚡</span><span class="btn-text">${info.name}</span>`;
    }

    this.closeSourceModal();
    this.showToast(`⚡ 已成功切换至「${info.name}」！正在刷新片库...`);
    this.currentPage = 1;
    this.loadCatalog();
  }

  setPlayerMode(mode) {
    this.playerMode = mode;
    const btnIframe = document.getElementById('btn-mode-iframe');
    const btnHls = document.getElementById('btn-mode-hls');

    if (mode === 'iframe') {
      btnIframe.classList.add('active');
      btnHls.classList.remove('active');
      this.showToast('⚡ 已切换到「极速免检通道」(100% 秒播)');
    } else {
      btnHls.classList.add('active');
      btnIframe.classList.remove('active');
      this.showToast('🍎 已切换到「原生 HLS 通道」(支持倍速与画中画)');
    }

    if (this.currentEpisodes.length > 0) {
      this.playEpisode(this.currentEpIndex);
    }
  }

  updateApiUrlDisplay() {
    const origin = window.location.origin || 'https://yuxiaotao721.github.io/du-cinema';
    const apiUrl = `${origin}/api/vod`;
    const el = document.getElementById('api-url-text');
    if (el) el.innerText = apiUrl;
  }

  resetHome() {
    this.currentType = '';
    this.currentKeyword = '';
    this.currentYear = '';
    this.currentPage = 1;
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('nav-all').classList.add('active');
    this.loadCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleSearch(customKw = null) {
    const kw = customKw !== null ? customKw : document.getElementById('search-input').value.trim();
    if (!kw) {
      this.showToast('请输入要搜索的影片或剧集名称');
      return;
    }
    this.currentKeyword = kw;
    this.currentPage = 1;
    this.loadCatalog();
  }

  async loadCatalog() {
    const grid = document.getElementById('media-grid');
    const counter = document.getElementById('item-counter');
    const pageIndicator = document.getElementById('page-indicator');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    grid.innerHTML = Array(12).fill(0).map(() => '<div class="skeleton-card"></div>').join('');
    counter.innerText = '正在全速拉取云端流...';

    const params = new URLSearchParams({
      ac: 'detail',
      pg: this.currentPage.toString(),
      source: this.currentSource
    });
    if (this.currentType) params.set('t', this.currentType);
    if (this.currentKeyword) params.set('wd', this.currentKeyword);

    let data = null;
    try {
      const res = await fetch(`${this.apiEndpoint}?${params.toString()}`);
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      console.log('Local /api/vod unavailable, trying direct gateway...');
    }

    // Static hosting fallback (e.g. GitHub Pages)
    if (!data || !data.list) {
      try {
        const baseUpstream = this.sourceInfo[this.currentSource]?.api || this.sourceInfo['guangsu'].api;
        const upstreamUrl = `${baseUpstream}?${params.toString()}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(upstreamUrl)}`;
        const fallbackRes = await fetch(proxyUrl);
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      } catch (proxyErr) {
        console.error('Proxy fallback error:', proxyErr);
      }
    }

    try {
      if (!data) throw new Error('Data sources unreachable');

      let list = data.list || [];

      if (this.currentYear) {
        list = list.filter(item => (item.vod_year || '').includes(this.currentYear));
      }

      this.movies = list;

      if (list.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 12px;">🎬</div>
            <h3 style="color: #FFF; margin-bottom: 8px;">未找到匹配的片源</h3>
            <p style="font-size: 0.9rem;">换个关键词或切换分类试试看吧</p>
          </div>
        `;
        counter.innerText = '找到 0 部影片';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      if (this.currentPage === 1 && !this.currentKeyword && list.length > 0) {
        this.updateHeroSpotlight(list[0]);
      }

      grid.innerHTML = '';
      list.forEach((item, idx) => {
        const card = this.createMovieCard(item, idx);
        grid.appendChild(card);
      });

      counter.innerText = `展示 ${list.length} 部影片 · 第 ${this.currentPage} 页`;
      pageIndicator.innerText = `第 ${this.currentPage} 页`;
      prevBtn.disabled = this.currentPage <= 1;
      nextBtn.disabled = list.length < 10;

    } catch (err) {
      console.error('Fetch catalog error:', err);
      this.renderFallbackGrid();
    }
  }

  createMovieCard(item, idx) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const poster = item.vod_pic || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
    const title = item.vod_name || '未命名影片';
    const score = item.vod_score && item.vod_score !== '0.0' ? `⭐ ${item.vod_score}` : (item.vod_remarks || '高清');
    const category = item.type_name || item.vod_class || '影视';
    const year = item.vod_year || '2026';

    card.innerHTML = `
      <div class="card-poster-wrap">
        <img class="card-poster" src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'">
        <div class="card-badge-top">${score}</div>
        <div class="card-badge-bottom">${year}</div>
        <div class="card-hover-overlay">
          <div class="card-play-icon">▶</div>
          <div class="card-overlay-text">点击选集播放</div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title" title="${title}">${title}</div>
        <div class="card-sub">
          <span>${category}</span>
          <span style="color: var(--gold-glow); font-weight: 600;">渡赏支持</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      this.openModal(item, 0);
    });

    return card;
  }

  updateHeroSpotlight(movie) {
    this.featuredMovie = movie;
    const backdrop = document.getElementById('hero-backdrop');
    const title = document.getElementById('hero-title');
    const meta = document.getElementById('hero-meta');
    const desc = document.getElementById('hero-desc');

    if (backdrop && movie.vod_pic) {
      backdrop.style.backgroundImage = `url('${movie.vod_pic}')`;
    }
    if (title) title.innerText = movie.vod_name || '超清影视精选';
    if (desc) {
      const cleanDesc = (movie.vod_blurb || movie.vod_content || '精选全网顶级院线大片，支持 4K 60FPS 极速秒播。')
        .replace(/<[^>]+>/g, '').trim();
      desc.innerText = cleanDesc;
    }
    if (meta) {
      const score = movie.vod_score && movie.vod_score !== '0.0' ? `豆瓣 ${movie.vod_score}` : '高清原盘';
      meta.innerHTML = `
        <span class="meta-tag gold-tag">${score}</span>
        <span class="meta-tag">${movie.type_name || movie.vod_class || '电影'}</span>
        <span class="meta-tag">${movie.vod_year || '2026'} · ${movie.vod_area || '全网'}</span>
        <span class="meta-tag">超清直连</span>
      `;
    }
  }

  renderFallbackGrid() {
    const grid = document.getElementById('media-grid');
    const counter = document.getElementById('item-counter');
    counter.innerText = '已加载离线精选推荐片库';
    
    const fallbackList = [
      this.featuredFallback
    ];

    grid.innerHTML = '';
    fallbackList.forEach((item, idx) => {
      grid.appendChild(this.createMovieCard(item, idx));
    });
  }

  // =========================================================================
  // Player & Detail Modal
  // =========================================================================

  parsePlayUrls(rawString) {
    if (!rawString) return [];
    
    // Guangsu format: gsyun$$$gsm3u8
    // Part 1: 第1集$https://v.gsuus.com/play/xxx (iframe web player)
    // Part 2: 第1集$https://v.gsuus.com/play/xxx/index.m3u8 (direct m3u8)
    const parts = rawString.split('$$$');
    
    let m3u8Part = parts.find(p => p.includes('.m3u8'));
    let webPart = parts.find(p => !p.includes('.m3u8') && (p.includes('/play/') || p.includes('/share/')));
    
    if (!m3u8Part) m3u8Part = parts[parts.length - 1] || '';
    if (!webPart) webPart = parts[0] || '';

    const m3u8Items = m3u8Part.split('#').filter(Boolean);
    const webItems = webPart.split('#').filter(Boolean);

    const episodes = [];
    m3u8Items.forEach((item, index) => {
      const [mName, mUrl] = item.split('$');
      let finalM3u8 = mUrl || mName;
      
      let finalIframe = '';
      if (webItems[index]) {
        const [wName, wUrl] = webItems[index].split('$');
        finalIframe = wUrl || wName;
      }
      if (!finalIframe) {
        finalIframe = finalM3u8;
      }

      episodes.push({
        name: (mName || `第${index + 1}集`).trim(),
        m3u8Url: finalM3u8.trim(),
        iframeUrl: finalIframe.trim()
      });
    });

    return episodes;
  }

  openModal(movie, epIndex = 0) {
    this.currentMovie = movie;
    this.currentEpisodes = this.parsePlayUrls(movie.vod_play_url);
    this.currentEpIndex = epIndex;

    const modal = document.getElementById('player-modal');
    const titleEl = document.getElementById('modal-movie-title');
    const epCountBadge = document.getElementById('ep-count-badge');
    const epGrid = document.getElementById('episodes-grid');
    
    document.getElementById('meta-category').innerText = movie.type_name || movie.vod_class || '影视';
    document.getElementById('meta-year').innerText = movie.vod_year || '2026';
    document.getElementById('meta-actor').innerText = movie.vod_actor || '未标注';
    document.getElementById('meta-plot').innerText = (movie.vod_blurb || movie.vod_content || '暂无详细剧情。').replace(/<[^>]+>/g, '').trim();

    titleEl.innerText = movie.vod_name || '播放影片';
    epCountBadge.innerText = `共 ${this.currentEpisodes.length || 1} 集`;

    epGrid.innerHTML = '';
    if (this.currentEpisodes.length === 0) {
      epGrid.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">暂无有效播放源</div>';
    } else {
      this.currentEpisodes.forEach((ep, idx) => {
        const btn = document.createElement('button');
        btn.className = `ep-btn ${idx === epIndex ? 'active' : ''}`;
        btn.innerText = ep.name;
        btn.addEventListener('click', () => {
          this.switchEpisode(idx);
        });
        epGrid.appendChild(btn);
      });
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.playEpisode(epIndex);
  }

  switchEpisode(index) {
    this.currentEpIndex = index;
    const epButtons = document.querySelectorAll('.ep-btn');
    epButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === index);
    });
    this.playEpisode(index);
  }

  playEpisode(index) {
    if (!this.currentEpisodes || !this.currentEpisodes[index]) return;

    const ep = this.currentEpisodes[index];
    document.getElementById('modal-current-ep').innerText = `正在播放：${ep.name}`;

    const video = this.videoEl;
    const iframe = this.iframeEl;
    const loadingOverlay = document.getElementById('player-loading');

    // 1. Iframe Mode (Default & 100% Guaranteed cross-origin free)
    if (this.playerMode === 'iframe') {
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
      video.pause();
      video.style.display = 'none';
      loadingOverlay.style.display = 'none';

      iframe.style.display = 'block';
      iframe.src = ep.iframeUrl;
      return;
    }

    // 2. Native HLS Mode
    iframe.src = 'about:blank';
    iframe.style.display = 'none';
    video.style.display = 'block';
    loadingOverlay.style.display = 'flex';

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const streamUrl = ep.m3u8Url;

    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // 电影点播需关闭低延迟模式，开启深度缓冲防卡顿
        backBufferLength: 120, // 往回倒退保留 2 分钟缓冲
        maxBufferLength: 60,   // 向前激进预加载 60 秒数据
        maxMaxBufferLength: 180,
        maxBufferSize: 80 * 1024 * 1024 // 允许 80MB 内存高速预读
      });
      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        loadingOverlay.style.display = 'none';
        video.play().catch(e => console.log('Autoplay blocked:', e));
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error, falling back to iframe mode...', data);
          loadingOverlay.style.display = 'none';
          // Auto fallback to iframe if HLS encounters network error
          this.setPlayerMode('iframe');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.endsWith('.mp4')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        loadingOverlay.style.display = 'none';
        video.play().catch(e => console.log('Autoplay blocked:', e));
      }, { once: true });
    } else {
      loadingOverlay.style.display = 'none';
      video.src = streamUrl;
    }
  }

  invokeDuShangPlayer() {
    if (!this.currentMovie || !this.currentEpisodes || !this.currentEpisodes[this.currentEpIndex]) {
      this.showToast('⚠️ 未选定播放剧集');
      return;
    }

    const ep = this.currentEpisodes[this.currentEpIndex];
    const streamUrl = ep.m3u8Url;
    const title = `${this.currentMovie.vod_name} - ${ep.name}`;

    // 1. Automatically copy high-def m3u8 direct URL to clipboard
    navigator.clipboard.writeText(streamUrl).catch(() => {});

    // 2. Pause internal web player so it doesn't play in background
    if (this.videoEl) this.videoEl.pause();

    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      this.showToast('🚀 已复制超清直链！正在唤醒渡赏 / 外部硬解播放器...');
      
      // Standard Android Intent to invoke external video player
      const androidIntent = `intent:${streamUrl}#Intent;action=android.intent.action.VIEW;type=video/*;end`;
      const dushangScheme = `dushang://play?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}`;

      // Attempt custom scheme first, then Android intent
      const tempLink = document.createElement('a');
      tempLink.href = dushangScheme;
      tempLink.click();

      setTimeout(() => {
        window.location.href = androidIntent;
      }, 300);
    } else {
      const dushangScheme = `dushang://play?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}`;
      this.showToast('🚀 超清直链已复制！正在呼叫渡赏播放器...');
      window.location.href = dushangScheme;
    }
  }


  copyCurrentStreamUrl() {
    if (!this.currentEpisodes || !this.currentEpisodes[this.currentEpIndex]) return;
    const url = this.currentEpisodes[this.currentEpIndex].m3u8Url;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('📋 m3u8 高清直链已复制！可在渡赏或任何外部播放器粘贴播放。');
    });
  }

  closeModal() {
    const modal = document.getElementById('player-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (this.iframeEl) {
      this.iframeEl.src = 'about:blank';
    }
    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.removeAttribute('src');
      this.videoEl.load();
    }
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  closeApiModal() {
    document.getElementById('api-modal').classList.remove('active');
  }

  showToast(message, duration = 3200) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⛵</span><div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new DuCinemaApp();
});
