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
    this.currentTvCat = 'all';
    this.currentLiveChannel = null;
    this.currentTvLineIndex = 0;
    this.tvWatchdogTimer = null;
    this.isLiveMode = false;
    
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

    this.storageKey = 'ducinema_history';
    this.pendingResumeTime = null;
    this.lastProgressSave = 0;

    this.init();
  }

  init() {
    this.bindEvents();
    this.initVideoProgressEvents();
    this.initDoubleTapGesture();
    this.updateApiUrlDisplay();
    this.initLiveTv();
    this.renderRecentWatch();
    this.loadCatalog();

    // Check URL parameters (e.g. ?channel=cctv5 or ?view=live)
    const urlParams = new URLSearchParams(window.location.search);
    const targetChannelId = urlParams.get('channel') || urlParams.get('ch');
    const viewParam = urlParams.get('view');
    if (targetChannelId) {
      const channel = (window.TV_CHANNELS || []).find(c => c.id === targetChannelId || c.name.toLowerCase().includes(targetChannelId.toLowerCase()));
      if (channel) {
        this.showLiveTvView();
        setTimeout(() => this.openLiveTvPlayer(channel), 150);
      }
    } else if (viewParam === 'live') {
      this.showLiveTvView();
    }
  }

  bindEvents() {
    // Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const type = item.dataset.type || '';
        if (type === 'live') {
          this.showLiveTvView();
          return;
        }
        this.showMovieView();
        this.currentType = type;
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

    // Recent Watch Clear Button
    document.getElementById('recent-clear-btn')?.addEventListener('click', () => this.clearHistory());

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

      // Multi-source Auto Fallback Search if primary source returns empty
      if (list.length === 0 && this.currentKeyword) {
        counter.innerText = '正在智能联搜全网备用片库...';
        const alternateSources = ['guangsu', 'ffzy', 'xinlang', 'bdzy'].filter(s => s !== this.currentSource);
        for (const altSource of alternateSources) {
          try {
            const altParams = new URLSearchParams({
              ac: 'detail',
              pg: '1',
              source: altSource,
              wd: this.currentKeyword
            });
            const altRes = await fetch(`${this.apiEndpoint}?${altParams.toString()}`);
            if (altRes.ok) {
              const altData = await altRes.json();
              if (altData && altData.list && altData.list.length > 0) {
                list = altData.list;
                this.currentSource = altSource;
                this.updateApiUrlDisplay();
                this.showToast(`🔍 主线路未收录，已自动切换至【${this.sourceInfo[altSource]?.name || altSource}】找到 ${list.length} 部片源！`);
                break;
              }
            }
          } catch (e) {
            // continue
          }
        }
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

  openModal(movie, epIndex = 0, resumeTime = null) {
    this.currentMovie = movie;
    this.currentEpisodes = this.parsePlayUrls(movie.vod_play_url);
    
    // Auto restore resume progress if resumeTime is not passed
    if (resumeTime === null) {
      const saved = this.getSavedHistory(movie.vod_id || movie.vod_name);
      if (saved && saved.time > 10) {
        resumeTime = saved.time;
        if (saved.epIndex !== undefined && this.currentEpisodes[saved.epIndex]) {
          epIndex = saved.epIndex;
        }
      }
    }
    this.pendingResumeTime = resumeTime;
    this.currentEpIndex = epIndex;

    this.isLiveMode = false;
    this.currentLiveChannel = null;
    if (this.tvWatchdogTimer) {
      clearTimeout(this.tvWatchdogTimer);
      this.tvWatchdogTimer = null;
    }

    const modal = document.getElementById('player-modal');
    const titleEl = document.getElementById('modal-movie-title');
    const epCountBadge = document.getElementById('ep-count-badge');
    const epGrid = document.getElementById('episodes-grid');
    if (epGrid) epGrid.className = 'episodes-grid';

    // In-player source switcher pills
    this.renderModalSourcePills();

    // Restore standard movie mode buttons
    const modeBar = document.querySelector('.player-mode-bar');
    if (modeBar) {
      modeBar.innerHTML = `
        <span class="mode-label">播放通道：</span>
        <button class="mode-tab ${this.playerMode === 'iframe' ? 'active' : ''}" id="btn-mode-iframe" title="免跨域、免代理限制，100% 极速加载">⚡ 极速免检通道 (推荐)</button>
        <button class="mode-tab ${this.playerMode === 'hls' ? 'active' : ''}" id="btn-mode-hls" title="原生 HLS 播放器，支持自由倍速与画中画">🍎 原生 HLS 通道</button>
      `;
      document.getElementById('btn-mode-iframe')?.addEventListener('click', () => this.setPlayerMode('iframe'));
      document.getElementById('btn-mode-hls')?.addEventListener('click', () => this.setPlayerMode('hls'));
    }
    
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
    this.pendingResumeTime = null;
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

    // Save history point
    this.saveHistory(this.currentMovie, index, this.pendingResumeTime || 0, 0);

    const video = this.videoEl;
    const iframe = this.iframeEl;
    const loadingOverlay = document.getElementById('player-loading');

    const applyResume = () => {
      if (this.pendingResumeTime && this.pendingResumeTime > 5) {
        const t = this.pendingResumeTime;
        video.currentTime = t;
        this.showToast(`💡 记忆续播：已恢复至上次进度 ${this.formatTime(t)}`);
        this.pendingResumeTime = null;
      }
    };

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
        applyResume();
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
        applyResume();
        video.play().catch(e => console.log('Autoplay blocked:', e));
      }, { once: true });
    } else {
      loadingOverlay.style.display = 'none';
      video.src = streamUrl;
      applyResume();
    }
  }

  invokeDuShangPlayer() {
    let streamUrl = '';
    let title = '';

    if (this.isLiveMode && this.currentLiveChannel) {
      const urls = this.currentLiveChannel.streamUrls || [this.currentLiveChannel.streamUrl];
      const selectedIndex = (this.userSelectedLineIndex !== undefined && this.userSelectedLineIndex !== null) ? this.userSelectedLineIndex : 0;
      streamUrl = urls[selectedIndex] || urls[0] || this.currentLiveChannel.streamUrl;
      title = `[电视直播] ${this.currentLiveChannel.name}`;
    } else if (this.currentMovie && this.currentEpisodes && this.currentEpisodes[this.currentEpIndex]) {
      const ep = this.currentEpisodes[this.currentEpIndex];
      streamUrl = ep.m3u8Url;
      title = `${this.currentMovie.vod_name} - ${ep.name}`;
    } else {
      this.showToast('⚠️ 未选定播放节目');
      return;
    }

    // 1. Automatically copy high-def m3u8 direct URL to clipboard
    navigator.clipboard.writeText(streamUrl).catch(() => {});

    // 2. Pause internal web player so it doesn't play in background
    if (this.videoEl) this.videoEl.pause();

    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      this.showToast('🚀 正在直连唤醒「渡赏」原生硬解播放器...');
      const dushangIntent = `intent://play?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}#Intent;scheme=dushang;package=dev.yxt.ferrygram;action=android.intent.action.VIEW;launchFlags=0x14000000;end`;
      window.location.href = dushangIntent;
    } else {
      const dushangScheme = `dushang://play?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}`;
      this.showToast('🚀 超清直链已复制！正在呼叫渡赏播放器...');
      window.location.href = dushangScheme;
    }
  }


  copyCurrentStreamUrl() {
    let url = '';
    if (this.isLiveMode && this.currentLiveChannel) {
      const urls = this.currentLiveChannel.streamUrls || [this.currentLiveChannel.streamUrl];
      url = urls[this.currentTvLineIndex] || urls[0] || this.currentLiveChannel.streamUrl;
    } else if (this.currentEpisodes && this.currentEpisodes[this.currentEpIndex]) {
      url = this.currentEpisodes[this.currentEpIndex].m3u8Url;
    }
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('📋 m3u8 高清直链已复制！可在渡赏或任何外部播放器粘贴播放。');
    });
  }

  closeModal() {
    const modal = document.getElementById('player-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (this.tvWatchdogTimer) {
      clearTimeout(this.tvWatchdogTimer);
      this.tvWatchdogTimer = null;
    }

    if (this.videoEl && this.currentMovie && this.videoEl.currentTime > 2) {
      this.saveHistory(
        this.currentMovie,
        this.currentEpIndex,
        Math.floor(this.videoEl.currentTime),
        Math.floor(this.videoEl.duration || 0)
      );
    }
    this.pendingResumeTime = null;

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
    this.isLiveMode = false;
    const epGrid = document.getElementById('episodes-grid');
    if (epGrid) epGrid.className = 'episodes-grid';
  }

  // =========================================================================
  // Watch History & Auto-Play Helpers
  // =========================================================================

  initVideoProgressEvents() {
    if (!this.videoEl) return;

    // Throttle progress updates to localStorage every 3s
    this.videoEl.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - this.lastProgressSave > 3000) {
        this.lastProgressSave = now;
        if (this.currentMovie && this.videoEl.currentTime > 2) {
          this.saveHistory(
            this.currentMovie,
            this.currentEpIndex,
            Math.floor(this.videoEl.currentTime),
            Math.floor(this.videoEl.duration || 0)
          );
        }
      }
    });

    // Auto-play next episode
    this.videoEl.addEventListener('ended', () => {
      if (this.isLiveMode) return;
      if (this.currentEpisodes && this.currentEpIndex < this.currentEpisodes.length - 1) {
        const nextIndex = this.currentEpIndex + 1;
        const nextEp = this.currentEpisodes[nextIndex];
        this.showToast(`🎉 本集播放完毕，3秒后自动续播【${nextEp.name}】...`);
        setTimeout(() => {
          const modal = document.getElementById('player-modal');
          if (modal && modal.classList.contains('active')) {
            this.switchEpisode(nextIndex);
          }
        }, 3000);
      }
    });
  }

  initDoubleTapGesture() {
    const container = document.getElementById('video-container');
    if (!container) return;

    let lastTap = 0;
    container.addEventListener('click', (e) => {
      const now = Date.now();
      const diff = now - lastTap;
      lastTap = now;

      if (diff < 320 && diff > 50) {
        // Double tap detected
        const rect = container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        if (this.videoEl && this.playerMode === 'hls' && !this.isLiveMode) {
          if (clickX < width * 0.45) {
            // Seek backward 10s
            this.videoEl.currentTime = Math.max(0, this.videoEl.currentTime - 10);
            this.triggerSeekRipple('left');
          } else if (clickX > width * 0.55) {
            // Seek forward 10s
            this.videoEl.currentTime = Math.min(this.videoEl.duration || 99999, this.videoEl.currentTime + 10);
            this.triggerSeekRipple('right');
          }
        }
      }
    });
  }

  triggerSeekRipple(dir) {
    const el = document.getElementById(dir === 'left' ? 'seek-ripple-left' : 'seek-ripple-right');
    if (!el) return;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 500);
  }

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  getSavedHistory(vodIdOrName) {
    const list = this.getHistory();
    return list.find(item => item.id == vodIdOrName || item.name === vodIdOrName) || null;
  }

  saveHistory(movie, epIndex, time = 0, duration = 0) {
    if (!movie) return;
    try {
      let list = this.getHistory();
      const id = movie.vod_id || movie.vod_name;
      const epName = (this.currentEpisodes && this.currentEpisodes[epIndex]) ? this.currentEpisodes[epIndex].name : `第${epIndex + 1}集`;

      // Filter existing
      list = list.filter(item => item.id != id && item.name !== movie.vod_name);

      list.unshift({
        id: id,
        name: movie.vod_name || '未知影片',
        pic: movie.vod_pic || '',
        year: movie.vod_year || '2026',
        category: movie.type_name || movie.vod_class || '影视',
        epIndex: epIndex,
        epName: epName,
        time: time,
        duration: duration,
        movie: movie,
        updatedAt: Date.now()
      });

      if (list.length > 20) list = list.slice(0, 20);
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      this.renderRecentWatch();
    } catch (e) {
      console.error('Save history failed:', e);
    }
  }

  clearHistory() {
    localStorage.removeItem(this.storageKey);
    this.renderRecentWatch();
    this.showToast('已清空全部播放历史');
  }

  renderRecentWatch() {
    const section = document.getElementById('recent-watch-section');
    const track = document.getElementById('recent-track');
    if (!section || !track) return;

    const list = this.getHistory();
    if (list.length === 0) {
      section.style.display = 'none';
      track.innerHTML = '';
      return;
    }

    section.style.display = 'block';
    track.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'recent-card';

      const progressPercent = (item.duration > 0 && item.time > 0) 
        ? Math.min(100, Math.round((item.time / item.duration) * 100)) 
        : (item.time > 0 ? 50 : 0);
      
      const timeText = item.time > 0 ? `看到 ${this.formatTime(item.time)}` : '刚开始看';

      card.innerHTML = `
        <div class="recent-card-poster-wrap">
          <img class="recent-card-poster" src="${item.pic}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'">
          <div class="recent-card-play-icon">▶</div>
          <div class="recent-card-progress-bar" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="recent-card-info">
          <div class="recent-card-title" title="${item.name}">${item.name}</div>
          <div class="recent-card-sub">
            <span>${item.epName}</span>
            <span>${timeText}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openModal(item.movie, item.epIndex, item.time);
      });

      track.appendChild(card);
    });
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // =========================================================================
  // In-Player Source Switching
  // =========================================================================

  renderModalSourcePills() {
    const wrap = document.getElementById('modal-source-pills');
    if (!wrap) return;

    wrap.innerHTML = '';
    const sources = [
      { key: 'guangsu', name: '🌟 光速' },
      { key: 'ffzy', name: '🚀 非凡' },
      { key: 'bdzy', name: '💎 百度' },
      { key: 'xinlang', name: '🎬 新浪' }
    ];

    sources.forEach(s => {
      const btn = document.createElement('button');
      btn.className = `source-pill-btn ${this.currentSource === s.key ? 'active' : ''}`;
      btn.innerText = s.name;
      btn.dataset.source = s.key;
      btn.addEventListener('click', () => this.switchSourceInModal(s.key));
      wrap.appendChild(btn);
    });
  }

  async switchSourceInModal(newSource) {
    if (newSource === this.currentSource) return;
    const wrap = document.getElementById('modal-source-pills');
    const targetBtn = wrap?.querySelector(`[data-source="${newSource}"]`);
    if (targetBtn) {
      targetBtn.innerText = '切源中...';
      targetBtn.disabled = true;
    }

    try {
      const params = new URLSearchParams({
        ac: 'detail',
        source: newSource,
        wd: this.currentMovie.vod_name
      });
      const res = await fetch(`${this.apiEndpoint}?${params.toString()}`);
      if (!res.ok) throw new Error('Source query failed');
      const data = await res.json();
      
      const found = (data.list || []).find(m => m.vod_name === this.currentMovie.vod_name) || (data.list && data.list[0]);
      if (!found || !found.vod_play_url) {
        this.showToast(`【${this.sourceInfo[newSource]?.name || newSource}】暂无该片完整片源`);
        this.renderModalSourcePills();
        return;
      }

      this.currentSource = newSource;
      this.updateApiUrlDisplay();
      this.currentMovie = found;
      this.currentEpisodes = this.parsePlayUrls(found.vod_play_url);
      
      const epCountBadge = document.getElementById('ep-count-badge');
      if (epCountBadge) epCountBadge.innerText = `共 ${this.currentEpisodes.length || 1} 集`;

      const epGrid = document.getElementById('episodes-grid');
      if (epGrid) {
        epGrid.innerHTML = '';
        this.currentEpisodes.forEach((ep, idx) => {
          const btn = document.createElement('button');
          btn.className = `ep-btn ${idx === this.currentEpIndex ? 'active' : ''}`;
          btn.innerText = ep.name;
          btn.addEventListener('click', () => this.switchEpisode(idx));
          epGrid.appendChild(btn);
        });
      }

      const safeEpIndex = Math.min(this.currentEpIndex, this.currentEpisodes.length - 1);
      this.renderModalSourcePills();
      this.showToast(`已无感切源至【${this.sourceInfo[newSource]?.name || newSource}】`);
      this.playEpisode(safeEpIndex);

    } catch (e) {
      console.error('Switch source error:', e);
      this.showToast('切源失败，请重试');
      this.renderModalSourcePills();
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

  // =========================================================================
  // 📡 Live TV Broadcast System
  // =========================================================================

  initLiveTv() {
    const channels = window.TV_CHANNELS || [];
    
    // Calculate counts
    const countAll = channels.length;
    const countCctv = channels.filter(c => c.category === 'cctv').length;
    const countSat = channels.filter(c => c.category === 'satellite').length;
    const countSports = channels.filter(c => c.category === 'sports').length;
    const countIntl = channels.filter(c => c.category === 'gangaotai' || c.category === 'intl').length;

    const elAll = document.getElementById('count-all');
    if (elAll) elAll.innerText = countAll;
    const elCctv = document.getElementById('count-cctv');
    if (elCctv) elCctv.innerText = countCctv;
    const elSat = document.getElementById('count-satellite');
    if (elSat) elSat.innerText = countSat;
    const elSports = document.getElementById('count-sports');
    if (elSports) elSports.innerText = countSports;
    const elIntl = document.getElementById('count-intl');
    if (elIntl) elIntl.innerText = countIntl;

    // Filter pills
    document.querySelectorAll('.live-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.live-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentTvCat = pill.dataset.tvcat || 'all';
        this.renderLiveChannels(this.currentTvCat);
      });
    });

    this.renderLiveChannels('all');
  }

  renderLiveChannels(filterCat = 'all') {
    const grid = document.getElementById('live-channel-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let list = window.TV_CHANNELS || [];
    if (filterCat === 'cctv') {
      list = list.filter(c => c.category === 'cctv');
    } else if (filterCat === 'satellite') {
      list = list.filter(c => c.category === 'satellite');
    } else if (filterCat === 'sports') {
      list = list.filter(c => c.category === 'sports');
    } else if (filterCat === 'intl_all') {
      list = list.filter(c => c.category === 'gangaotai' || c.category === 'intl');
    }

    list.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'channel-card';
      const lineCount = (ch.streamUrls && ch.streamUrls.length) || 1;
      const lineBadge = lineCount > 1 
        ? `<span class="channel-badge-res" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);">${lineCount} 线自愈</span>` 
        : '';

      card.innerHTML = `
        <div class="channel-card-top">
          <div class="channel-logo-wrap">
            <img class="channel-logo-img" src="${ch.logo}" alt="${ch.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <span class="channel-logo-fallback" style="display: none;">📺</span>
          </div>
          <div class="channel-meta-wrap">
            <h4 class="channel-title" title="${ch.name}">${ch.name}</h4>
            <div class="channel-tags-row">
              <span class="channel-badge-res">${ch.badge}</span>
              ${lineBadge}
              <span class="channel-badge-cat">${ch.categoryName}</span>
              <span class="live-badge-glow" style="padding: 1px 6px; font-size: 0.65rem;">
                <span class="live-dot-pulse" style="width: 5px; height: 5px;"></span> LIVE
              </span>
            </div>
          </div>
        </div>
        <div class="channel-epg-box">
          <span class="epg-icon">📻</span>
          <span class="epg-content" title="${ch.epg}">${ch.epg}</span>
        </div>
        <div class="channel-card-actions">
          <button class="btn-tv-web" title="在网页原生播放">▶ 网页直播</button>
          <button class="btn-tv-dushang" title="唤醒渡赏原生 60FPS 硬解与画中画">⛵ 渡赏硬解</button>
        </div>
      `;

      // Actions
      card.querySelector('.btn-tv-web').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLiveTvPlayer(ch);
      });
      card.querySelector('.btn-tv-dushang').addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentLiveChannel = ch;
        this.currentTvLineIndex = 0;
        this.isLiveMode = true;
        this.invokeDuShangPlayer();
      });
      card.addEventListener('click', () => {
        this.openLiveTvPlayer(ch);
      });

      grid.appendChild(card);
    });
  }

  openLiveTvPlayer(channel) {
    this.isLiveMode = true;
    this.currentLiveChannel = channel;
    this.currentTvLineIndex = 0;
    this.currentMovie = null;

    const modal = document.getElementById('player-modal');
    const titleEl = document.getElementById('modal-movie-title');
    const epCountBadge = document.getElementById('ep-count-badge');
    const epGrid = document.getElementById('episodes-grid');
    
    document.getElementById('meta-category').innerText = channel.categoryName || '电视直播';
    document.getElementById('meta-year').innerText = channel.badge || '1080P';
    document.getElementById('meta-actor').innerText = '卫星实时广播 / 原画无损 / 智能防卡顿';
    document.getElementById('meta-plot').innerText = `正在播放：${channel.name}。当前节目排期：${channel.epg || '精彩节目全天候滚动直播'}。已配置多线路极速容灾，若遇缓冲卡顿系统将自动秒切备用线路，亦支持点击「呼叫渡赏」在手机/电视大屏进行 GPU 原生硬解。`;

    titleEl.innerHTML = `<span class="live-dot-pulse" style="margin-right: 6px;"></span>[直播] ${channel.name}`;
    epCountBadge.innerText = `快速换台 (${(window.TV_CHANNELS || []).length} 台)`;

    // Render quick switcher in episodes-grid
    epGrid.innerHTML = '';
    epGrid.className = 'tv-quick-panel';
    const channels = window.TV_CHANNELS || [];
    channels.forEach(ch => {
      const item = document.createElement('div');
      item.className = `tv-quick-item ${ch.id === channel.id ? 'active' : ''}`;
      item.innerHTML = `
        <span class="tv-quick-name">${ch.name}</span>
        <span class="channel-badge-res">${ch.badge}</span>
      `;
      item.addEventListener('click', () => {
        this.openLiveTvPlayer(ch);
      });
      epGrid.appendChild(item);
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Play TV live stream using HLS native mode with multi-line support
    this.setPlayerMode('hls');
    this.playLiveStream(channel, 0);
  }

  getPlayableLiveUrl(rawUrl) {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('/api/live')) return rawUrl;

    // 1. 如果源本身已经是 HTTPS
    if (rawUrl.startsWith('https://')) {
      return rawUrl;
    }

    // 2. 如果当前页面处于 GitHub Pages 静态托管（无后端 /api/live 反代）或本身为 HTTP
    if (window.location.hostname.endsWith('github.io') || window.location.protocol === 'http:') {
      return rawUrl;
    }

    // 3. 在支持 Serverless/Node.js 反代的部署环境（Vercel / Cloudflare / 本地 server）
    return `/api/live?url=${encodeURIComponent(rawUrl)}`;
  }

  playLiveStream(channel, lineIndex = 0) {
    const urls = channel.streamUrls && channel.streamUrls.length ? channel.streamUrls : [channel.streamUrl];
    if (lineIndex >= urls.length) lineIndex = 0;
    this.currentTvLineIndex = lineIndex;
    const rawStreamUrl = urls[lineIndex];
    const playableUrl = this.getPlayableLiveUrl(rawStreamUrl);

    document.getElementById('modal-current-ep').innerText = `正在直播 · ${channel.badge} · 线路 ${lineIndex + 1}/${urls.length} ${lineIndex === 0 ? '(极速优先)' : '(备用稳定)'}`;
    
    // Render Multi-line buttons on mode bar
    const modeBar = document.querySelector('.player-mode-bar');
    if (modeBar) {
      const buttonsHtml = urls.map((u, idx) => `
        <button class="mode-tab ${idx === lineIndex ? 'active' : ''}" data-line="${idx}">
          ${idx === 0 ? '⚡ 线路 1 (极速优先)' : `🛰️ 线路 ${idx + 1} (备用线路)`}
        </button>
      `).join('');

      modeBar.innerHTML = `
        <span class="mode-label">信号源线路：</span>
        ${buttonsHtml}
      `;

      modeBar.querySelectorAll('.mode-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = parseInt(btn.dataset.line, 10);
          this.userSelectedLineIndex = target;
          if (target !== this.currentTvLineIndex) {
            this.playLiveStream(channel, target);
          }
        });
      });
    }

    const video = this.videoEl;
    const iframe = this.iframeEl;
    const loadingOverlay = document.getElementById('player-loading');

    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    video.style.display = 'block';
    loadingOverlay.style.display = 'flex';

    if (this.tvWatchdogTimer) {
      clearTimeout(this.tvWatchdogTimer);
      this.tvWatchdogTimer = null;
    }

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const switchNextLine = (reason = '') => {
      if (this.tvWatchdogTimer) {
        clearTimeout(this.tvWatchdogTimer);
        this.tvWatchdogTimer = null;
      }
      if (lineIndex + 1 < urls.length) {
        console.warn(`[LiveWatchdog] Line ${lineIndex + 1} slow (${reason}). Auto-switching to line ${lineIndex + 2}...`);
        this.showToast(`⚡ 线路 ${lineIndex + 1} 响应稍慢，已为您秒切备用线路 ${lineIndex + 2}`);
        this.playLiveStream(channel, lineIndex + 1);
      } else {
        loadingOverlay.style.display = 'none';
        this.showToast('⚠️ 当前所有备用线路均在排队，推荐点击下方「呼叫渡赏」唤醒原生硬解秒播！', 5000);
      }
    };

    // Watchdog: If buffering exceeds 4.5 seconds, automatically switch to next line
    this.tvWatchdogTimer = setTimeout(() => {
      if (this.isLiveMode && (video.paused || video.readyState < 2 || video.currentTime === 0)) {
        switchNextLine('Buffering timeout');
      }
    }, 4500);

    const onPlaySuccess = () => {
      if (this.tvWatchdogTimer) {
        clearTimeout(this.tvWatchdogTimer);
        this.tvWatchdogTimer = null;
      }
      loadingOverlay.style.display = 'none';
    };

    video.onplaying = onPlaySuccess;
    video.onloadeddata = onPlaySuccess;
    video.onerror = () => {
      if (this.isLiveMode) {
        switchNextLine('Native video element error');
      }
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // iOS Safari / Apple WebKit 原生 HLS (iPhone / iPad / Mac Safari)
      video.src = playableUrl;
      video.addEventListener('loadedmetadata', () => {
        onPlaySuccess();
        video.play().catch(() => {});
      }, { once: true });
    } else if (window.Hls && Hls.isSupported()) {
      // HLS.js for Samsung Internet / Chrome / PC Edge / Android
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 4500,
        manifestLoadingMaxRetry: 1,
        levelLoadingTimeOut: 4500,
        fragLoadingTimeOut: 4500
      });
      this.hls.loadSource(playableUrl);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        onPlaySuccess();
        video.play().catch(() => {});
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switchNextLine(`Fatal HLS error: ${data.details || data.type}`);
        }
      });
    } else {
      video.src = playableUrl;
      onPlaySuccess();
      video.play().catch(() => {});
    }
  }

  showLiveTvView() {
    const hero = document.getElementById('hero-spotlight');
    const catalog = document.getElementById('catalog-section');
    const liveSection = document.getElementById('live-tv-section');
    
    if (hero) hero.style.display = 'none';
    if (catalog) catalog.style.display = 'none';
    if (liveSection) {
      liveSection.style.display = 'block';
      liveSection.scrollIntoView({ behavior: 'smooth' });
    }
    this.renderLiveChannels(this.currentTvCat);
  }

  showMovieView() {
    const hero = document.getElementById('hero-spotlight');
    const catalog = document.getElementById('catalog-section');
    const liveSection = document.getElementById('live-tv-section');

    if (hero) hero.style.display = 'block';
    if (catalog) catalog.style.display = 'block';
    if (liveSection) liveSection.style.display = 'none';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new DuCinemaApp();
});
