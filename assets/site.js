/* ============================================================
   site.js — 遊記共用邏輯
   1. 文章頁:自動生成 TOC(on this page)+ scrollspy
   2. 文章頁:初始化 .trip-map 地圖(Leaflet,三種免費底圖)
   3. 首頁:讀 posts.json 生成卡片 + tag 篩選(支援 ?tag= 網址)
   寫新遊記不需要動這個檔案。
   ============================================================ */
(() => {
  'use strict';

  /* ---------- 文章頁:TOC ---------- */
  function buildTOC() {
    const article = document.querySelector('article');
    const tocBox = document.querySelector('.toc ul');
    if (!article || !tocBox) return;

    const heads = article.querySelectorAll('h2, h3');
    if (!heads.length) return;

    heads.forEach((h, i) => {
      if (!h.id) h.id = 'sec-' + i + '-' + h.textContent.trim().replace(/\s+/g, '-');
      const li = document.createElement('li');
      li.className = h.tagName === 'H3' ? 'lv3' : 'lv2';
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocBox.appendChild(li);
    });

    // scrollspy:目前閱讀到的段落在 TOC 上高亮
    const links = tocBox.querySelectorAll('a');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(l => l.classList.toggle(
          'active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    heads.forEach(h => spy.observe(h));
  }

  /* ---------- 文章頁:地圖 ----------
     用法:<div class="trip-map" data-lat="38.136" data-lng="140.449"
                data-popup="御釜" data-zoom="12"></div>
     底圖三選一(全部免費、免金鑰):
       街道 OpenStreetMap / 地形 OpenTopoMap(等高線+山徑)/ 衛星 Esri  */
  function initMaps() {
    const nodes = document.querySelectorAll('.trip-map');
    if (!nodes.length || typeof L === 'undefined') return;

    nodes.forEach(el => {
      const lat = parseFloat(el.dataset.lat);
      const lng = parseFloat(el.dataset.lng);
      const zoom = parseInt(el.dataset.zoom || '12', 10);
      if (isNaN(lat) || isNaN(lng)) return;

      const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });
      const topo = L.tileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; OpenStreetMap, SRTM | &copy; OpenTopoMap (CC-BY-SA)'
      });
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri'
      });

      const map = L.map(el, { layers: [topo], scrollWheelZoom: false })
        .setView([lat, lng], zoom);
      L.control.layers(
        { '地形(等高線)': topo, '街道': osm, '衛星': sat },
        null, { collapsed: true }
      ).addTo(map);

      const pLat = parseFloat(el.dataset.popupLat || lat);
      const pLng = parseFloat(el.dataset.popupLng || lng);
      const marker = L.marker([pLat, pLng]).addTo(map);
      if (el.dataset.popup) marker.bindPopup(el.dataset.popup).openPopup();

      // 點一下才啟用滾輪縮放,避免捲頁時被地圖攔截
      map.once('click', () => map.scrollWheelZoom.enable());
    });
  }

  /* ---------- 首頁:文章列表 + tag 篩選 ---------- */
  async function initIndex() {
    const grid = document.querySelector('#post-grid');
    if (!grid) return;

    let posts = [];
    try {
      posts = await (await fetch('posts.json')).json();
    } catch (e) {
      grid.innerHTML = '<p class="empty">posts.json 讀取失敗</p>';
      return;
    }
    posts.sort((a, b) => b.date.localeCompare(a.date));

    // 收集所有 tag
    const allTags = [...new Set(posts.flatMap(p => p.tags))];
    const bar = document.querySelector('#tag-filter');
    const wrap = document.querySelector('.filter-bar');
    const toggle = document.querySelector('#tag-toggle');
    const current = () => new URLSearchParams(location.search).get('tag') || '';

    function updateToggle() {
      const t = current();
      toggle.innerHTML = (t ? '標籤:' + t : '標籤') + ' <span class="chev">▾</span>';
    }
    toggle.addEventListener('click', () => wrap.classList.toggle('open'));
    if (current()) wrap.classList.add('open');   // 帶著 ?tag= 進來 → 直接展開

    function renderBar() {
      bar.innerHTML = '';
      const mk = (label, value) => {
        const b = document.createElement('a');
        b.className = 'tag' + ((current() === value) ? ' active' : '');
        b.textContent = label;
        b.href = value ? '?tag=' + encodeURIComponent(value) : location.pathname;
        b.addEventListener('click', e => {
          e.preventDefault();
          history.replaceState(null, '', b.getAttribute('href'));
          renderBar(); renderGrid(); updateToggle();
        });
        bar.appendChild(b);
      };
      mk('全部', '');
      allTags.forEach(t => mk(t, t));
    }

    let expanded = false;
    const INITIAL = 6;                     // 預設只顯示最新六篇
    function renderGrid() {
      const t = current();
      const list = t ? posts.filter(p => p.tags.includes(t)) : posts;
      const shown = expanded ? list : list.slice(0, INITIAL);
      grid.innerHTML = list.length ? '' : '<p class="empty">這個標籤下還沒有遊記</p>';
      shown.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <a class="cover" href="posts/${p.slug}/">
            <img src="${p.thumb}" alt="${p.title}" loading="lazy"></a>
          <div class="body">
            <time>${p.date}</time>
            <h2><a href="posts/${p.slug}/">${p.title}</a></h2>
            <p>${p.description}</p>
            <div class="tags">${p.tags.map(t =>
              `<a class="tag" href="?tag=${encodeURIComponent(t)}">${t}</a>`).join('')}
            </div>
          </div>`;
        grid.appendChild(card);
      });
      if (!expanded && list.length > INITIAL) {
        const more = document.createElement('button');
        more.className = 'more-posts';
        more.type = 'button';
        more.textContent = 'MORE POSTS ↓';
        more.addEventListener('click', () => { expanded = true; renderGrid(); });
        grid.appendChild(more);
      }
    }

    renderBar();
    renderGrid();
    updateToggle();
  }

  /* ---------- favicon:用 canvas 畫一顆鉤環(carabiner) ---------- */
  function setFavicon() {
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');

    // 底:暖橘圓角方塊
    x.fillStyle = '#e08a4a';
    x.beginPath();
    x.roundRect(0, 0, s, s, 15);
    x.fill();

    // 鉤環:略斜的圓角 D 形環
    x.save();
    x.translate(s / 2, s / 2);
    x.rotate(-0.42);
    x.strokeStyle = '#fff7ec';
    x.lineWidth = 7;
    x.lineCap = 'round';
    x.beginPath();
    x.roundRect(-12, -21, 24, 42, 11);
    x.stroke();
    // 開口(gate):在右側斷開一段再畫斜桿
    x.strokeStyle = '#e08a4a';
    x.lineWidth = 9;
    x.beginPath(); x.moveTo(12, -4); x.lineTo(12, 10); x.stroke();
    x.strokeStyle = '#ffe1bd';
    x.lineWidth = 5.5;
    x.beginPath(); x.moveTo(12.5, -5); x.lineTo(9.5, 10); x.stroke();
    x.restore();

    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = c.toDataURL('image/png');
  }

  /* ---------- 文章頁:相簿(左右切換,照片直出不加濾鏡) ----------
     用法:<div class="carousel" data-dir="../../img/chialo/"
                data-images="51.jpg,52.jpg,54.jpg"></div>            */
  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(el => {
      const dir = el.dataset.dir || '';
      const imgs = (el.dataset.images || '').split(',')
        .map(v => v.trim()).filter(Boolean);
      if (!imgs.length) return;
      let idx = 0;
      el.innerHTML = `
        <div class="car-frame"><img alt=""></div>
        <button class="car-btn prev" type="button" aria-label="上一張">‹</button>
        <button class="car-btn next" type="button" aria-label="下一張">›</button>
        <div class="car-dots"></div>`;
      const img = el.querySelector('img');
      const dots = el.querySelector('.car-dots');
      imgs.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'car-dot'; d.type = 'button';
        d.addEventListener('click', () => show(i));
        dots.appendChild(d);
      });
      function show(i) {
        idx = (i + imgs.length) % imgs.length;
        img.src = dir + imgs[idx];
        [...dots.children].forEach((d, k) => d.classList.toggle('on', k === idx));
      }
      el.querySelector('.prev').addEventListener('click', () => show(idx - 1));
      el.querySelector('.next').addEventListener('click', () => show(idx + 1));
      let sx = null;                              // 手機滑動切換
      el.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
      el.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
        sx = null;
      }, { passive: true });
      show(0);
    });
  }

  /* ---------- 文章頁:爬繩貓(閱讀進度)----------
     一條垂直的繩,一隻迷你橘貓抓著繩隨閱讀進度往上爬,讀完登頂揮手。
     桌機:貼在 TOC 目錄旁;手機:固定在螢幕左緣。            */
  function initRopeCat() {
    const article = document.querySelector('article');
    if (!article) return;

    const wrap = document.createElement('div');
    wrap.className = 'rope-cat';
    wrap.innerHTML = '<canvas width="144" height="576"></canvas>';
    document.body.appendChild(wrap);
    const cv = wrap.querySelector('canvas');
    const c = cv.getContext('2d');
    c.scale(2, 2);                          // @2x, 邏輯尺寸 30×120

    const RW = 72, RH = 288;               // 繩區邏輯寬高(放大版)
    const ropeX = 36;

    function head(hx, hy) {
      c.fillStyle = '#e8944e';             // 耳朵
      c.beginPath(); c.moveTo(hx - 9.7, hy - 4.9); c.lineTo(hx - 15.1, hy - 18);
      c.lineTo(hx - 3.4, hy - 11.2); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(hx + 9.7, hy - 4.9); c.lineTo(hx + 15.1, hy - 18);
      c.lineTo(hx + 3.4, hy - 11.2); c.closePath(); c.fill();
      c.beginPath(); c.arc(hx, hy, 12.2, 0, 7); c.fill();
      c.fillStyle = '#d94f4f';             // 小岩盔
      c.beginPath(); c.arc(hx, hy - 2.5, 13, Math.PI, 0); c.fill();
      c.fillRect(hx - 13, hy - 3.4, 26, 3.4);
      c.fillStyle = '#4a4238';             // 眼睛
      c.beginPath(); c.arc(hx - 4.3, hy + 4, 2.2, 0, 7); c.fill();
      c.beginPath(); c.arc(hx + 4.3, hy + 4, 2.2, 0, 7); c.fill();
    }

    function draw(pr, frame) {
      c.clearRect(0, 0, RW, RH);
      // 繩(紅色,貫穿整條)
      c.strokeStyle = '#e2635f'; c.lineWidth = 6.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(ropeX, 4); c.lineTo(ropeX, RH - 4); c.stroke();
      // 頂端固定點
      c.strokeStyle = '#7d838e'; c.lineWidth = 5.4;
      c.beginPath(); c.arc(ropeX, 9, 6.1, 0, 7); c.stroke();

      // 貓的高度隨進度;登頂時再往下留一點,耳朵才不會被上緣切掉
      const cy = 34 + (RH - 72) * (1 - pr) + (pr >= .95 ? 16 : 0);
      const top = pr >= .95;
      if (top) {
        c.strokeStyle = '#e8944e'; c.lineWidth = 7.2;    // 尾(最底層,先畫)
        c.beginPath(); c.moveTo(ropeX - 7.2, cy + 20); c.quadraticCurveTo(ropeX - 20, cy + 25, ropeX - 17, cy + 34); c.stroke();
        c.fillStyle = '#e8944e';                         // 身體
        c.beginPath(); c.ellipse(ropeX, cy + 9.7, 15.8, 18.2, 0, 0, 7); c.fill();
        c.strokeStyle = '#c97231'; c.lineWidth = 6.3;    // 揮手
        c.beginPath(); c.moveTo(ropeX + 9.7, cy - 2.5); c.lineTo(ropeX + 21.6, cy - 20); c.stroke();
        head(ropeX, cy - 20);
      } else {
        const up = frame ? 6.3 : 0;
        c.strokeStyle = '#e8944e'; c.lineWidth = 7.2;    // 尾(最底層,先畫)
        c.beginPath(); c.moveTo(ropeX - 4.9, cy + 20); c.quadraticCurveTo(ropeX - 17.1, cy + 27, ropeX - 14.4, cy + 36); c.stroke();
        c.strokeStyle = '#c97231'; c.lineWidth = 6.3;    // 抓繩的手/踩繩的腳,交替
        c.beginPath(); c.moveTo(ropeX - 4.9, cy - 7.2); c.lineTo(ropeX, cy - 21.6 + up); c.stroke();
        c.beginPath(); c.moveTo(ropeX + 4.9, cy - 7.2); c.lineTo(ropeX, cy - 17.1 - up); c.stroke();
        c.beginPath(); c.moveTo(ropeX - 7.2, cy + 14.4); c.lineTo(ropeX - 14.4, cy + 27 - up); c.stroke();
        c.beginPath(); c.moveTo(ropeX + 7.2, cy + 14.4); c.lineTo(ropeX + 12.2, cy + 28.8 + up); c.stroke();
        c.fillStyle = '#e8944e';                         // 身體(貼著繩)
        c.beginPath(); c.ellipse(ropeX + 2.5, cy, 13.3, 19.4, 0, 0, 7); c.fill();
        c.fillStyle = '#c97231';                         // 虎斑
        [-9.7, 0, 9.7].forEach(sy => c.fillRect(ropeX - 4.9, cy + sy, 14.4, 3.6));
        head(ropeX + 2.5, cy - 24.3);
      }
    }

    let frame = 0, last = -1;
    function onScroll() {
      const r = article.getBoundingClientRect();
      // 進度:文章頂端進入視窗 → 文章底端離開視窗,對應 0 → 1
      const total = Math.max(1, r.height - innerHeight * .5);
      const pr = Math.min(1, Math.max(0, (innerHeight * .45 - r.top) / total));
      if (Math.abs(pr - last) > .014) { frame ^= 1; last = pr; }   // 值越大 → 擺動越慢
      draw(pr, frame);
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 載入畫面:就緒後淡出 ----------
     最少顯示 0.6 秒(避免一閃而過),最多 2.6 秒保底(照片再慢也不卡住)。 */
  function initLoader() {
    const el = document.getElementById('loader');
    if (!el) return;
    const t0 = performance.now();
    let hidden = false;
    const hide = () => {
      if (hidden) return;
      hidden = true;
      const wait = Math.max(0, 600 - (performance.now() - t0));
      setTimeout(() => {
        el.classList.add('done');
        setTimeout(() => el.remove(), 700);   // 淡出後移除,不擋互動
      }, wait);
    };
    if (document.readyState === 'complete') hide();
    else addEventListener('load', hide);
    setTimeout(hide, 2600);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    setFavicon();
    buildTOC();
    initRopeCat();
    initMaps();
    initCarousels();
    initIndex();
  });
})();
