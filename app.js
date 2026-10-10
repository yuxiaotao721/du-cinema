/**
 * 渡影 (DuCinema) - 渡赏专属云端片库前端逻辑
 * 核心功能：
 * 1. 聚合全网高清影视流（m3u8 / MP4）
 * 2. 深度集成「渡赏」原生唤起协议 (dushang://play?url=...&title=...)
 * 3. 苹果 Safari / 电脑端 HLS.js 零广告极速硬解播放
 * 4. 渡赏片库 API 标准分发
 */

class DuCinemaApp {
  constructor() {
    this.apiEndpoint = '/api/vod';
    this.currentPage = 1;
    this.currentType = '';
    this.currentYear = '';
    this.currentKeyword = '';
    
    this.movies = [];
    this.currentMovie = null;
    this.currentEpisodes = [];
    this.currentEpIndex = 0;
    
    this.hls = null;
    this.videoEl = document.getElementById('html5-player');

    // High-res curated fallback blockbusters for instant showcase
    this.featuredFallback = {
      vod_id: 99999,
      vod_name: '流浪地球 2 (The Wandering Earth II)',
      vod_year: '2023',
      vod_area: '中国大陆',
      vod_class: '科幻 / 冒险 / 灾难',
      vod_actor: '吴京, 刘德华, 李雪健, 沙溢, 宁理, 王智, 朱颜曼滋',
      vod_pic: 'https://img.lzipic.com/upload/vod/20230122-1/658b4eb14b9c9e530666016e7888b1b8.jpg',
      vod_score: '8.3',
      vod_blurb: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战...',
      vod_play_url: '4K原盘完整版$https://v.lzcdn28.com/20230122/410_f2998a44/index.m3u8'
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

    // DuShang Deep Link & Copy Buttons in Modal
    document.getElementById('modal-dushang-btn').addEventListener('click', () => {
      this.invokeDuShangPlayer();
    });
    document.getElementById('modal-copy-btn').addEventListener('click', () => {
      this.copyCurrentStreamUrl();
    });

    // Hero Spotlight Actions
    document.getElementById('hero-play-dushang').addEventListener('click', () => {
      if (this.featuredMovie) {
        this.openModal(this.featuredMovie, 0);
        this.invokeDuShangPlayer();
      } else {
        this.openModal(this.featuredFallback, 0);
        this.invokeDuShangPlayer();
      }
    });
    document.getElementById('hero-play-web').addEventListener('click', () => {
      if (this.featuredMovie) {
        this.openModal(this.featuredMovie, 0);
      } else {
        this.openModal(this.featuredFallback, 0);
      }
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
      this.showToast('⚡ 当前已连接主线 CDN 极速加速线路 (量子/非凡双擎集群)');
    });
  }

  updateApiUrlDisplay() {
    const origin = window.location.origin || 'https://ducinema.yxt.dev';
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

    // Show Skeletons
    grid.innerHTML = Array(12).fill(0).map(() => '<div class="skeleton-card"></div>').join('');
    counter.innerText = '正在全速拉取云端流...';

    const params = new URLSearchParams({
      ac: 'detail',
      pg: this.currentPage.toString()
    });
    if (this.currentType) params.set('t', this.currentType);
    if (this.currentKeyword) params.set('wd', this.currentKeyword);

    let data = null;
    try {
      // 1. Try local serverless / edge endpoint (/api/vod)
      const res = await fetch(`${this.apiEndpoint}?${params.toString()}`);
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      console.log('Local /api/vod unavailable, trying cloud proxy fallback...');
    }

    // 2. If static hosting without edge runtime, fallback to CORS gateway
    if (!data || !data.list) {
      try {
        const upstreamUrl = `https://cj.lziapi.com/api.php/provide/vod/?${params.toString()}`;
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
      if (!data) throw new Error('All data sources unreachable');

      let list = data.list || [];

      // Year filter if applied
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

      // Render Spotlight Banner from first item on initial page load
      if (this.currentPage === 1 && !this.currentKeyword && list.length > 0) {
        this.updateHeroSpotlight(list[0]);
      }

      // Render Cards
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
      // Fallback display
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
        <span class="meta-tag">超清 m3u8</span>
      `;
    }
  }

  renderFallbackGrid() {
    const grid = document.getElementById('media-grid');
    const counter = document.getElementById('item-counter');
    counter.innerText = '已加载离线精选推荐片库';
    
    const fallbackList = [
      this.featuredFallback,
      {
        vod_id: 10001,
        vod_name: '三体 (Three-Body)',
        vod_year: '2023',
        vod_pic: 'https://img.lzipic.com/upload/vod/20230115-1/1673789504_2723.jpg',
        vod_score: '8.7',
        type_name: '国产科幻剧',
        vod_actor: '张鲁一, 于和伟, 陈瑾, 王子文, 林永健, 李小冉',
        vod_blurb: '2007年，地球基础科学出现了异常的扰动，科学界人心惶惶。纳米物理学家汪淼与刑警史强联手调查，揭开地外文明“三体”入侵的震撼真相...',
        vod_play_url: '第01集$https://v.lzcdn28.com/20230115/222_9d8ef922/index.m3u8#第02集$https://v.lzcdn28.com/20230115/223_09fe01c5/index.m3u8'
      },
      {
        vod_id: 10002,
        vod_name: '繁花 (Blossoms Shanghai)',
        vod_year: '2024',
        vod_pic: 'https://img.lzipic.com/upload/vod/20231227-1/4101e4dfad0b6e1ba420fcbca2537c44.jpg',
        vod_score: '8.7',
        type_name: '王家卫执导',
        vod_actor: '胡歌, 马伊琍, 唐嫣, 辛芷蕾, 游本昌, 郑恺',
        vod_blurb: '九十年代的上海处处是机遇与希望。阿宝变成宝总，黄河路上灯红酒绿，商海浮沉...',
        vod_play_url: '第01集$https://v.lzcdn28.com/20231227/12903_23efbb80/index.m3u8#第02集$https://v.lzcdn28.com/20231227/12904_7e93da12/index.m3u8'
      }
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
    
    // Some APIs separate lines by $$$
    const parts = rawString.split('$$$');
    // Prefer the part that contains .m3u8
    let targetPart = parts.find(p => p.includes('.m3u8')) || parts[parts.length - 1] || rawString;

    const episodes = [];
    const epItems = targetPart.split('#');
    epItems.forEach(ep => {
      if (!ep.trim()) return;
      const [name, url] = ep.split('$');
      if (url) {
        episodes.push({
          name: name.trim() || '正片',
          url: url.trim()
        });
      } else if (name.startsWith('http')) {
        episodes.push({
          name: '全片放映',
          url: name.trim()
        });
      }
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
    
    // Metadata fields
    document.getElementById('meta-category').innerText = movie.type_name || movie.vod_class || '影视';
    document.getElementById('meta-year').innerText = movie.vod_year || '2026';
    document.getElementById('meta-actor').innerText = movie.vod_actor || '未标注';
    document.getElementById('meta-plot').innerText = (movie.vod_blurb || movie.vod_content || '暂无详细剧情。').replace(/<[^>]+>/g, '').trim();

    titleEl.innerText = movie.vod_name || '播放影片';
    epCountBadge.innerText = `共 ${this.currentEpisodes.length || 1} 集`;

    // Render Episode Buttons
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

    // Play video
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
    const streamUrl = ep.url;
    document.getElementById('modal-current-ep').innerText = `正在播放：${ep.name}`;

    const loadingOverlay = document.getElementById('player-loading');
    loadingOverlay.style.display = 'flex';

    // Teardown previous Hls
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const video = this.videoEl;

    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        loadingOverlay.style.display = 'none';
        video.play().catch(e => console.log('Autoplay blocked:', e));
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          loadingOverlay.style.display = 'none';
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.endsWith('.mp4')) {
      // Native Safari / iOS support
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
    const streamUrl = ep.url;
    const title = `${this.currentMovie.vod_name} - ${ep.name}`;

    // Construct the custom URL Scheme for DuShang
    const dushangScheme = `dushang://play?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}`;

    this.showToast('🚀 正在通过 dushang:// 协议唤醒「渡赏」硬解放映...');

    // Attempt to invoke the native intent
    window.location.href = dushangScheme;

    // Automatically copy direct link as convenience fallback
    navigator.clipboard.writeText(streamUrl).catch(() => {});
  }

  copyCurrentStreamUrl() {
    if (!this.currentEpisodes || !this.currentEpisodes[this.currentEpIndex]) return;
    const url = this.currentEpisodes[this.currentEpIndex].url;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('📋 m3u8 高清直链已复制！可在任何外部播放器粘贴播放。');
    });
  }

  closeModal() {
    const modal = document.getElementById('player-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

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

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  window.app = new DuCinemaApp();
});
