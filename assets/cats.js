/* ============================================================
   cats.js — 首頁主視覺:貓咪先鋒攀登(lead climbing)
   v3:岩壁佔畫面一半以上、路線加長、貓咪放大;
   確保貓身旁有繩堆(隨攀登越變越少)、持續注視攀登者、
   有節奏的給繩動作;登頂平台下修,慶祝時整隻貓可見。
   ============================================================ */
(() => {
  'use strict';
  const canvas = document.getElementById('cat-hero');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SC = 1.3;                       // 貓咪整體放大倍率
  let W = 0, H = 0, dpr = 1;
  let edge = [], wallOut = { x: -1, y: 0 };
  let bolts = [], clouds = [];

  const C = {
    skyTop: '#bfe3f2', skyBot: '#f4f9ee',
    sun: '#ffd97a', cloud: '#ffffff',
    rock: '#dcc9ab', rockShade: '#c3ab85', rockDeep: '#a98f66', rockCrack: '#8f764f',
    grass: '#a8c98a', grassDark: '#8db06e',
    rope: '#e2635f', ropeDark: '#c94f4b',
    bolt: '#7d838e', sling: '#5f7fb8', anchorSling: '#8f6bb5', biner: '#e8b13f',
    orange: '#e8944e', orangeDark: '#c97231',
    grey: '#9aa0ab', greyDark: '#7c828d', greyArm: '#b0b6c0', greyLeg: '#5a616c',
    helmetA: '#d94f4f', helmetAD: '#a83737', helmetB: '#4f7fd9', helmetBD: '#3a5fa8',
    harness: '#4a6fae',
    tent: '#e8944e', tentDark: '#c97231',
    ink: '#4a4238'
  };

  /* ---------- 幾何 ---------- */
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 外傾壁:底部約在畫面中線,頂部再往左傾出 → 岩體佔右半以上
    const bx = W * 0.76, by = H * 0.99;
    const tx = W * 0.66, ty = H * 0.23;
    const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy);
    wallOut = { x: dy / len, y: -dx / len };

    const N = 30;
    edge = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const j = Math.sin(i * 2.63) * 10 + Math.sin(i * 1.31 + 2.2) * 6
              + Math.sin(i * 5.7) * 3;
      edge.push({
        x: bx + dx * t + wallOut.x * j,
        y: by + dy * t + wallOut.y * j
      });
    }

    // 四組耳片,各掛一個完整快扣組(長 dogbone)
    bolts = [0.36, 0.54, 0.72, 0.90].map(p => ({ p }));

    clouds = [
      { x: W * .10, y: H * .14, s: 1.0, v: 8 },
      { x: W * .30, y: H * .28, s: 0.7, v: 12 },
      { x: W * .04, y: H * .44, s: 0.55, v: 16 }
    ];
  }

  function posAt(p, off = 0) {
    const f = Math.min(Math.max(p, 0), 1) * (edge.length - 1);
    const i = Math.floor(f), u = f - i;
    const a = edge[i], b = edge[Math.min(i + 1, edge.length - 1)];
    return {
      x: a.x + (b.x - a.x) * u + wallOut.x * off,
      y: a.y + (b.y - a.y) * u + wallOut.y * off
    };
  }
  const tangentA = p => {
    const a = posAt(Math.max(p - .02, 0)), b = posAt(Math.min(p + .02, 1));
    return Math.atan2(b.y - a.y, b.x - a.x);
  };
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  /* ---------- 場景 ---------- */
  function drawScene(t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, C.skyTop); sky.addColorStop(1, C.skyBot);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.cloud;
    clouds.forEach(c => {
      const cx = (c.x + t * .001 * c.v) % (W + 140) - 70;
      ctx.globalAlpha = .85;
      [[0, 0, 22], [20, 4, 16], [-20, 5, 15]].forEach(([ox, oy, r]) => {
        ctx.beginPath(); ctx.arc(cx + ox * c.s, c.y + oy * c.s, r * c.s, 0, 7); ctx.fill();
      });
    });
    ctx.globalAlpha = 1;

    // 太陽最後畫,雲飄過也遮不住
    ctx.fillStyle = C.sun; ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.arc(W * .09, H * .14, 24, 0, 7); ctx.fill();
    ctx.globalAlpha = .22;
    ctx.beginPath(); ctx.arc(W * .09, H * .14, 38, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;

    // 富士山(遠眺:小、低、帶霧)
    const fx0 = W * .45, fpy = H * .46;
    ctx.globalAlpha = .8;
    ctx.fillStyle = '#c3d0de';
    ctx.beginPath();
    ctx.moveTo(fx0 - W * .16, H * .80);
    ctx.lineTo(fx0 - W * .026, fpy);
    ctx.lineTo(fx0 + W * .026, fpy);          // 平頂火山口
    ctx.lineTo(fx0 + W * .16, H * .80);
    ctx.closePath(); ctx.fill();
    // 雪帽(鋸齒雪線)
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .8;
    ctx.beginPath();
    ctx.moveTo(fx0 - W * .026, fpy);
    ctx.lineTo(fx0 + W * .026, fpy);
    ctx.lineTo(fx0 + W * .052, H * .545);
    for (let i = 0; i < 6; i++) {
      const zx = fx0 + W * .052 - (W * .104) * (i + 1) / 6;
      const zy = H * .545 + (i % 2 ? -H * .014 : H * .008);
      ctx.lineTo(zx, zy);
    }
    ctx.closePath(); ctx.fill();
    // 山腳的霧帶,把距離推遠
    const haze = ctx.createLinearGradient(0, H * .60, 0, H * .80);
    haze.addColorStop(0, 'rgba(244,249,238,0)');
    haze.addColorStop(1, 'rgba(244,249,238,.9)');
    ctx.fillStyle = haze; ctx.globalAlpha = 1;
    ctx.fillRect(0, H * .60, W, H * .22);   // 畫滿整幅,右側被岩體蓋掉即連續
    // 前景丘陵
    ctx.fillStyle = '#cfe0d2';
    ctx.beginPath();
    ctx.moveTo(0, H * .82);
    ctx.lineTo(W * .10, H * .71); ctx.lineTo(W * .22, H * .78);
    ctx.lineTo(W * .36, H * .69); ctx.lineTo(W * .50, H * .82);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7c828d'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    [[.20, .26], [.27, .21]].forEach(([fx, fy], i) => {
      const bxp = W * fx + Math.sin(t * .0006 + i) * 14;
      const byp = H * fy + Math.cos(t * .0008 + i) * 6;
      const f = Math.sin(t * .01 + i * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(bxp - 6, byp - f); ctx.quadraticCurveTo(bxp, byp + 3, bxp + 6, byp - f);
      ctx.stroke();
    });

    // 草地、小花、帳篷
    ctx.fillStyle = C.grass; ctx.fillRect(0, H * .82, W, H * .18);
    ctx.fillStyle = C.grassDark;
    for (let x = 8; x < W; x += 26) {
      const gy = H * .82 + 6 + Math.sin(x) * 3;
      ctx.beginPath();
      ctx.moveTo(x, gy + 10); ctx.quadraticCurveTo(x + 3, gy, x + 6, gy + 10); ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      const fx = W * (.04 + i * .07), fy = H * (.88 + (i % 3) * .03);
      ctx.fillStyle = ['#f4a5a5', '#f4d9a5', '#ffffff'][i % 3];
      ctx.beginPath(); ctx.arc(fx, fy, 3, 0, 7); ctx.fill();
    }
    // 露營車(左側:攀岩仔的移動基地)
    const vx = W * .22, vy = H * .875;
    shadow(vx, vy + 8, 62);
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath(); ctx.roundRect(vx - 58, vy - 46, 116, 46, 8); ctx.fill();
    ctx.fillStyle = C.tent;                       // 橘色腰線
    ctx.fillRect(vx - 58, vy - 25, 116, 8);
    ctx.fillStyle = '#bcd8e6';                    // 車窗
    ctx.beginPath(); ctx.roundRect(vx - 48, vy - 40, 28, 12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(vx - 14, vy - 40, 26, 12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(vx + 18, vy - 40, 26, 12, 3); ctx.fill();
    ctx.strokeStyle = '#9a927f'; ctx.lineWidth = 2.5;  // 車頂行李架
    ctx.beginPath(); ctx.moveTo(vx - 42, vy - 47); ctx.lineTo(vx + 42, vy - 47); ctx.stroke();
    ctx.fillStyle = '#5f7fb8';                    // 架上的 crashpad
    ctx.beginPath(); ctx.roundRect(vx - 30, vy - 56, 60, 9, 3); ctx.fill();
    ctx.strokeStyle = '#9a927f'; ctx.lineWidth = 2;    // 車門把手
    ctx.beginPath(); ctx.moveTo(vx + 24, vy - 18); ctx.lineTo(vx + 33, vy - 18); ctx.stroke();
    [[-34], [34]].forEach(([ox]) => {             // 車輪
      ctx.fillStyle = '#4a4238';
      ctx.beginPath(); ctx.arc(vx + ox, vy - 1, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#cfd4da';
      ctx.beginPath(); ctx.arc(vx + ox, vy - 1, 4, 0, 7); ctx.fill();
    });
  }

  function drawRock() {
    ctx.fillStyle = C.rock;
    ctx.beginPath();
    ctx.moveTo(edge[0].x + 14, H);
    edge.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(W, H * .12); ctx.lineTo(W, H);
    ctx.closePath(); ctx.fill();

    [[16, C.rockShade, .55], [52, C.rockDeep, .38]].forEach(([d, col, a]) => {
      ctx.fillStyle = col; ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(edge[0].x + 14 - wallOut.x * d, H);
      edge.forEach(pt => ctx.lineTo(pt.x - wallOut.x * d, pt.y - wallOut.y * d));
      ctx.lineTo(W, H * .12); ctx.lineTo(W, H);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.strokeStyle = C.rockCrack; ctx.lineWidth = 1.4; ctx.globalAlpha = .5;
    [.18, .38, .55, .72, .86].forEach((p, i) => {
      const s = posAt(p, -8);
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - wallOut.x * 30 + 8, s.y - wallOut.y * 30 + (i % 2 ? 10 : -6));
      ctx.lineTo(s.x - wallOut.x * 50 - 4, s.y - wallOut.y * 50 + 6);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // 橫向層理(屏風岩的岩層線)
    ctx.strokeStyle = C.rockShade; ctx.globalAlpha = .65; ctx.lineWidth = 1.8;
    [.10, .24, .40, .56, .72, .88].forEach((p, i) => {
      const st = posAt(p, -6);
      const ey = st.y + (W - st.x) * .05 + (i % 2 ? 9 : -7);
      ctx.beginPath(); ctx.moveTo(st.x, st.y);
      ctx.quadraticCurveTo((st.x + W) / 2, st.y + 12, W, ey);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // 岩階上的小灌木
    [[.30, 46], [.52, 78], [.70, 38], [.88, 92]].forEach(([p, d]) => {
      const st = posAt(p, -d);
      ctx.fillStyle = '#7ba05b';
      [[0, 0, 7], [6, 2, 5], [-6, 3, 5]].forEach(([ox, oy, r]) => {
        ctx.beginPath(); ctx.arc(st.x + ox, st.y + oy - 4, r, 0, 7); ctx.fill();
      });
    });

    ctx.strokeStyle = C.rockDeep; ctx.lineWidth = 2;
    ctx.beginPath();
    edge.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
    ctx.stroke();

    // 岩頂平台(慶祝用,壓低確保貓咪整隻在畫面內)
    const top = edge[edge.length - 1];
    ctx.fillStyle = C.rock;
    ctx.beginPath();
    ctx.moveTo(top.x - 4, top.y);
    ctx.lineTo(W, H * .12); ctx.lineTo(W, H * .22);
    ctx.lineTo(top.x + 34, top.y + 16);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.rockDeep; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(top.x - 4, top.y); ctx.lineTo(W, H * .12); ctx.stroke();

    // 後方第二面岩壁(右上),讓山體有轉折的立體感
    const surfY = xq => top.y + (H * .12 - top.y) * ((xq - top.x) / (W - top.x));
    const bwx = top.x + 96;
    ctx.fillStyle = C.rockShade;
    ctx.beginPath();
    ctx.moveTo(bwx, surfY(bwx));
    ctx.lineTo(bwx + (W - bwx) * .22, surfY(bwx) - H * .07);
    ctx.lineTo(bwx + (W - bwx) * .48, surfY(bwx) - H * .05);
    ctx.lineTo(bwx + (W - bwx) * .74, surfY(bwx) - H * .13);
    ctx.lineTo(W, -6);
    ctx.lineTo(W, surfY(W));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.rockDeep; ctx.globalAlpha = .28;   // 右側再深一層
    ctx.beginPath();
    ctx.moveTo(bwx + (W - bwx) * .74, surfY(bwx) - H * .13);
    ctx.lineTo(W, -6); ctx.lineTo(W, surfY(W));
    ctx.lineTo(bwx + (W - bwx) * .74, surfY(W) - 4);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.rockDeep; ctx.lineWidth = 1.8;   // 稜線
    ctx.beginPath();
    ctx.moveTo(bwx, surfY(bwx));
    ctx.lineTo(bwx + (W - bwx) * .22, surfY(bwx) - H * .07);
    ctx.lineTo(bwx + (W - bwx) * .48, surfY(bwx) - H * .05);
    ctx.lineTo(bwx + (W - bwx) * .74, surfY(bwx) - H * .13);
    ctx.lineTo(W, -6);
    ctx.stroke();
    ctx.fillStyle = '#7ba05b';                           // 一叢灌木
    [[0, 0, 6], [5, 2, 4.5]].forEach(([ox, oy, r]) => {
      ctx.beginPath();
      ctx.arc(bwx + (W - bwx) * .35 + ox, surfY(bwx) - H * .045 + oy, r, 0, 7);
      ctx.fill();
    });
  }

  function drawBolt(b, swayX = 0) {
    const hanger = posAt(b.p, -1);
    ctx.strokeStyle = C.bolt; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hanger.x, hanger.y, 3.5, 0, 7); ctx.stroke();
    // 上鉤環(扣進耳片)
    const topB = { x: hanger.x + wallOut.x * 2, y: hanger.y + 9 };
    ctx.strokeStyle = C.biner; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(topB.x, topB.y, 3.8, 5.4, .15 + swayX * .01, 0, 7); ctx.stroke();
    // 快扣帶(dogbone,加長版)
    const lower = { x: topB.x + wallOut.x * 4 + swayX, y: topB.y + 34 };
    b.lowerPt = lower;
    ctx.strokeStyle = C.sling; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(topB.x, topB.y + 4); ctx.lineTo(lower.x, lower.y - 5); ctx.stroke();
    // 下鉤環(掛繩)
    ctx.strokeStyle = C.biner; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.ellipse(lower.x, lower.y, 4.2, 6, .2 + swayX * .03, 0, 7); ctx.stroke();
  }

  function drawAnchor() {
    const top = edge[edge.length - 1];
    const surf = xq => top.y + (H * .12 - top.y) * ((xq - top.x) / (W - top.x));
    // 單棵粗壯的樹(樹幹加倍),往平台內側靠
    const tree = { x: top.x + 46, y: surf(top.x + 46) + 2 };
    shadow(tree.x + 3, tree.y + 2, 24);
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(tree.x - 10.5, tree.y - 40, 21, 40);
    ctx.fillStyle = '#4a3a28';                    // 樹幹右側陰影
    ctx.fillRect(tree.x + 4.5, tree.y - 40, 6, 40);
    ctx.fillStyle = '#6f955a';
    [[-38, 25], [-60, 19], [-79, 13]].forEach(([ty2, r]) => {
      ctx.beginPath();
      ctx.moveTo(tree.x - r, tree.y + ty2 + r);
      ctx.lineTo(tree.x, tree.y + ty2 - r);
      ctx.lineTo(tree.x + r, tree.y + ty2 + r);
      ctx.closePath(); ctx.fill();
    });
    // 繩環:繞幹後沿受力方向一直線微傾拉向受力點(不打折)
    const wrap = { x: tree.x - 11, y: tree.y - 13 };
    const sp = { x: tree.x - 30, y: surf(tree.x - 30) + 7 };
    ctx.strokeStyle = C.anchorSling; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tree.x + 11, tree.y - 11);
    ctx.lineTo(wrap.x, wrap.y);                   // 繞幹(在樹幹處自然轉向)
    ctx.moveTo(wrap.x, wrap.y);
    ctx.lineTo(sp.x, sp.y);                       // 受力段:直線
    // 雙快扣(掛在紫色繩環末端)
    ctx.stroke();
    const b1 = { x: sp.x - 4, y: sp.y + 10 };
    const b2 = { x: sp.x - 10, y: sp.y + 18 };
    [b1, b2].forEach((b, i) => {
      ctx.strokeStyle = C.anchorSling; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y + 2); ctx.lineTo(b.x, b.y - 5); ctx.stroke();
      ctx.strokeStyle = C.biner; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 4.2, 6, -.35 + i * .2, 0, 7); ctx.stroke();
    });
    return { b1, b2, tree, surf };
  }

  // 登頂/休息位置:副樹右側的平台上
  const summitSpot = a =>
    ({ x: a.tree.x + 64, y: a.surf(a.tree.x + 64) - 19 * SC });

  // 翻上平台的過渡姿勢(趴姿)
  function climberMantle(cx2, cy2, ang, t, reach) {
    shadow(cx2, cy2 + 13 * SC, 15 * SC);
    tail(cx2 - Math.cos(ang) * 12 * SC, cy2 + 4, -1, C.orange, Math.sin(t * .006) * 4);
    if (reach)                                    // 前掌伸向固定點快扣
      limb(cx2 + Math.cos(ang) * 12, cy2 + Math.sin(ang) * 12 - 4,
        reach.x, reach.y, C.orangeDark, 4.5);
    ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(ang);
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.ellipse(0, 0, 15 * SC, 10 * SC, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.orangeDark;
    [-6, 1, 8].forEach(sx => ctx.fillRect(sx * SC, -8 * SC, 3 * SC, 6 * SC));
    ctx.restore();
    limb(cx2 + Math.cos(ang) * 10, cy2 + Math.sin(ang) * 10,
      cx2 + Math.cos(ang) * 17, cy2 + 9, C.orangeDark, 4.5);
    limb(cx2 - Math.cos(ang) * 8, cy2 - Math.sin(ang) * 8,
      cx2 - Math.cos(ang) * 14, cy2 + 10, C.orange, 4.5);
    harness(cx2, cy2, ang, 20);
    catHead(cx2 + Math.cos(ang) * 17 * SC, cy2 + Math.sin(ang) * 17 * SC,
      8.5 * SC, C.orange, ang, C.helmetA);
    return { x: cx2, y: cy2 + 3 };
  }


  // 對話泡泡
  function bubble(x, y, text) {
    ctx.font = '11px "Noto Sans TC", sans-serif';
    const w = ctx.measureText(text).width + 18;
    ctx.fillStyle = 'rgba(255,255,255,.93)';
    ctx.strokeStyle = 'rgba(74,66,56,.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 26, w, 20, 9);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();                                   // 小尾巴
    ctx.moveTo(x - 3, y - 7); ctx.lineTo(x + 3, y - 7); ctx.lineTo(x, y - 1);
    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.93)'; ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 16);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  // 地面軟影
  function shadow(x, y, w) {
    ctx.fillStyle = 'rgba(70,58,38,.15)';
    ctx.beginPath(); ctx.ellipse(x, y, w, w * .26, 0, 0, 7); ctx.fill();
  }

  // ATC(側視,照實物):上寬下窄的管身外翻唇 + 鋼絲環 + 鉤環扣在吊帶
  function drawATC(cx, cy) {
    // 管身
    ctx.fillStyle = '#6b5e8f';
    ctx.beginPath();
    ctx.moveTo(cx - 4.5, cy - 6.5);
    ctx.quadraticCurveTo(cx - 7.5, cy - 8.5, cx - 6, cy - 4.5);  // 外翻唇
    ctx.lineTo(cx - 3.2, cy + 4);
    ctx.lineTo(cx + 3.2, cy + 4);
    ctx.lineTo(cx + 4.2, cy - 6.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2;  // 溝槽高光
    ctx.beginPath(); ctx.moveTo(cx - 1.5, cy - 5); ctx.lineTo(cx - .8, cy + 3); ctx.stroke();
    // 鋼絲環:從管身弧向右下
    ctx.strokeStyle = '#aeb4bf'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + 3.5, cy - 3);
    ctx.quadraticCurveTo(cx + 9, cy + 1, cx + 3.5, cy + 6.5);
    ctx.stroke();
    // 鉤環(橘)扣進吊帶
    ctx.strokeStyle = '#d9863c'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(cx + 2.5, cy + 8.5, 3.4, 4.6, .25, 0, 7); ctx.stroke();
  }

  // 一段帶垂弧的繩(微笑曲線):dip 越大垂得越深,0 = 拉直
  function smileRope(a, b, dip) {
    ctx.strokeStyle = C.rope; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + dip, b.x, b.y);
    ctx.stroke();
  }

  function rope(pts, sag = 8) {
    ctx.strokeStyle = C.rope; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.quadraticCurveTo(
        (a.x + b.x) / 2, (a.y + b.y) / 2 + Math.min(sag, d * .18), b.x, b.y);
    }
    ctx.stroke();
  }

  // 繩堆:確保貓腳邊的一圈圈繩子,amount 0~1
  function ropePile(x, y, amount) {
    if (amount <= .02) return;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    const loops = Math.max(1, Math.round(3 * amount));
    for (let i = 0; i < loops; i++) {
      ctx.strokeStyle = i % 2 ? C.ropeDark : C.rope;
      const r = (7 + i * 5) * (0.5 + amount * 0.5);
      ctx.beginPath();
      ctx.ellipse(x, y - i * 1.5, r + 4, r * .42, 0, 0, 7);
      ctx.stroke();
    }
  }

  /* ---------- 貓件庫(尺寸 × SC) ---------- */
  function catHead(x, y, r, col, lookA, helmet) {
    ctx.fillStyle = col;
    [[-.78, -.35], [.78, -.35]].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(x + ex * r, y + ey * r);
      ctx.lineTo(x + ex * r * 1.55, y + ey * r * 2.3);
      ctx.lineTo(x + ex * r * .3, y + ey * r * 1.7);
      ctx.closePath(); ctx.fill();
    });
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    // 岩盔(立體):暗面圓頂 → 亮面偏移 → 高光 → 盔沿橢圓 → 通氣孔 → 頤帶
    const hd = helmet === C.helmetA ? C.helmetAD : C.helmetBD;
    const hy = y - r * .18, hr = r * 1.08;
    ctx.fillStyle = hd;
    ctx.beginPath(); ctx.arc(x, hy, hr, Math.PI, 0); ctx.fill();
    ctx.fillStyle = helmet;
    ctx.beginPath(); ctx.arc(x - r * .14, hy - r * .07, hr * .95, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.ellipse(x - r * .42, hy - r * .55, r * .3, r * .15, -.6, 0, 7); ctx.fill();
    ctx.fillStyle = hd;                       // 盔沿:橢圓帶出從下往上看的弧度
    ctx.beginPath(); ctx.ellipse(x, hy + r * .02, hr, r * .17, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * .08, hy - r * .8); ctx.lineTo(x + r * .18, hy - r * .72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * .4, hy - r * .6); ctx.lineTo(x - r * .14, hy - r * .53); ctx.stroke();
    const lx = Math.cos(lookA) * r * .34;
    const ly = Math.max(-r * .02, Math.min(Math.sin(lookA) * r * .3, r * .3));
    const ey = y + r * .22 + ly;               // 基準下移,抬頭也不會頂到盔沿
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.arc(x - r * .32 + lx, ey, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * .32 + lx, ey, 2.2, 0, 7); ctx.fill();
  }

  function limb(x1, y1, x2, y2, col, w) {
    w = (w || 5) * SC;
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x2, y2, w * .62, 0, 7); ctx.fill();
  }

  function tail(x, y, dir, col, wag) {
    ctx.strokeStyle = col; ctx.lineWidth = 5 * SC; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dir * 6.5 * SC + wag, y + 10 * SC,
      x + dir * 11 * SC + wag * 1.2, y + 14 * SC);
    ctx.stroke();
  }

  function harness(cx, cy, ang, w) {
    w *= SC;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.strokeStyle = C.harness; ctx.lineWidth = 4.5 * SC; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w * .1, -w * .55); ctx.lineTo(-w * .1, w * .55); ctx.stroke();
    ctx.lineWidth = 3 * SC;
    ctx.beginPath(); ctx.moveTo(-w * .34, -w * .42); ctx.lineTo(-w * .12, -w * .3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w * .34, w * .42); ctx.lineTo(-w * .12, w * .3); ctx.stroke();
    ctx.restore();
    return { x: cx + Math.cos(ang) * (-w * .1), y: cy + Math.sin(ang) * (-w * .1) };
  }

  /* ---------- 橘貓:先鋒攀登 ---------- */
  function climberClimb(p, t, clipBolt) {
    const bodyC = posAt(p, 20 * SC);
    bodyC.y += 3;
    const ang = tangentA(p);
    const wob = Math.sin(t * .009) * 1.5;

    tail(bodyC.x - Math.cos(ang) * 12 * SC, bodyC.y - Math.sin(ang) * 12 * SC + 6,
      -1, C.orange, Math.sin(t * .006) * 6);

    const up1 = clipBolt ? clipBolt.lowerPt : posAt(Math.min(p + .06, 1), 1);
    const up2 = posAt(Math.min(p + .038, 1), 2);
    const dn1 = posAt(Math.max(p - .04, 0), 2);
    const dn2 = posAt(Math.max(p - .055, 0), 1);
    limb(bodyC.x + Math.cos(ang) * 10, bodyC.y + Math.sin(ang) * 10, up1.x, up1.y, C.orangeDark);
    limb(bodyC.x + Math.cos(ang) * 6, bodyC.y + Math.sin(ang) * 6, up2.x, up2.y, C.orange);
    limb(bodyC.x - Math.cos(ang) * 8, bodyC.y - Math.sin(ang) * 8, dn1.x, dn1.y, C.orange);
    limb(bodyC.x - Math.cos(ang) * 11, bodyC.y - Math.sin(ang) * 11, dn2.x, dn2.y, C.orangeDark);

    ctx.save(); ctx.translate(bodyC.x + wob * .3, bodyC.y); ctx.rotate(ang);
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.ellipse(0, 0, 16 * SC, 11 * SC, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.orangeDark;
    [-7, 0, 7].forEach(sx => ctx.fillRect(sx * SC, -9 * SC, 3 * SC, 7 * SC));
    ctx.restore();

    const tie = harness(bodyC.x, bodyC.y, ang, 22);
    catHead(bodyC.x + Math.cos(ang) * 19 * SC, bodyC.y + Math.sin(ang) * 19 * SC + wob * .4,
      9 * SC, C.orange, ang, C.helmetA);
    return tie;
  }

  /* ---------- 橘貓:懸空 lowering ---------- */
  function climberHang(cx, cy, t, sway) {
    const rot = -.20 + sway * .008;              // 只微微後仰
    tail(cx - 8 * SC, cy + 8, -1, C.orange, Math.sin(t * .007) * 4);
    // 身體:直立橢圓,像坐在吊帶裡
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * SC, 14 * SC, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.orangeDark;
    [-5, 2].forEach(sx => ctx.fillRect(sx * SC, -7 * SC, 3 * SC, 6 * SC));
    ctx.restore();
    const tie = harness(cx, cy + 4, Math.PI / 2 + rot, 18);
    // 後腿自然垂放、輕輕晃
    limb(cx - 3, cy + 10, cx - 5 + Math.sin(t * .006) * 2, cy + 22 * SC, C.orange, 4.5);
    limb(cx + 4, cy + 10, cx + 3 + Math.sin(t * .006 + 1) * 2, cy + 23 * SC, C.orangeDark, 4.5);
    // 一掌輕扶胸前的繩
    limb(cx + 3, cy - 6, cx + 5, cy - 15 * SC, C.orangeDark, 4.5);
    catHead(cx, cy - 17 * SC, 8.5 * SC, C.orange, -1.6, C.helmetA);
    return { x: cx, y: cy + 4 };
  }

  /* ---------- 灰貓:抱石確保(spot)姿勢 ---------- */
  function spotCat(x, y, lookA, t) {
    shadow(x, y + 20 * SC, 15 * SC);
    tail(x - 9 * SC, y + 2, -1, C.grey, Math.sin(t * .004) * 3);
    limb(x - 4, y + 9, x - 8, y + 19 * SC, C.greyLeg, 4.5);    // 後腿站立(深)
    limb(x + 4, y + 9, x + 8, y + 19 * SC, C.greyLeg, 4.5);
    ctx.fillStyle = C.grey;
    ctx.beginPath(); ctx.ellipse(x, y, 10 * SC, 14 * SC, 0, 0, 7); ctx.fill();
    harness(x, y + 3, Math.PI / 2, 18);
    const wob = Math.sin(t * .005) * .8;                       // 雙掌高舉,穩定戒備
    const pL = { x: x + 11 * SC, y: y - 18 * SC + wob };
    const pR = { x: x + 15 * SC, y: y - 11 * SC - wob };
    limb(x - 4, y - 8, pL.x, pL.y, C.greyArm, 4.5);
    limb(x + 5, y - 6, pR.x, pR.y, C.greyArm, 4.5);
    const dev = { x: x + 8 * SC, y: y + 6 * SC };
    drawATC(dev.x, dev.y);                                     // 確保器一直掛在吊帶上
    catHead(x + 2, y - 21 * SC, 9 * SC, C.grey, lookA, C.helmetB);
    return { pL, pR, dev };
  }

  /* ---------- 灰貓:站姿確保(隨時能反應突發狀況) ---------- */
  function belayCat(x, y, t, opt = {}) {
    const lookA = opt.lookAt
      ? Math.atan2(opt.lookAt.y - (y - 21 * SC), opt.lookAt.x - x)
      : (opt.lookA ?? -.3);
    shadow(x, y + 20 * SC, 15 * SC);
    if (opt.pile !== undefined) ropePile(x - 26 * SC, y + 16 * SC, opt.pile);
    tail(x - 9 * SC, y + 4, -1, C.grey, Math.sin(t * .004) * 3);
    limb(x - 4, y + 9, x - 8, y + 19 * SC, C.greyLeg, 4.5);    // 站立後腿(深)
    limb(x + 4, y + 9, x + 8, y + 19 * SC, C.greyLeg, 4.5);
    ctx.fillStyle = C.grey;
    ctx.beginPath(); ctx.ellipse(x, y, 10 * SC, 14 * SC, 0, 0, 7); ctx.fill();
    harness(x, y + 3, Math.PI / 2, 18);

    const device = { x: x + 8 * SC, y: y + 4 * SC };
    const f = opt.feed ?? 0;
    const slide = Math.sin(t * .010) * f;         // 給繩/收繩節奏
    const A = { x: device.x + 1, y: device.y + 5 };   // 制動端從 ATC 底部出來
    // 制動手貼在腿側(手臂短)
    const hand = { x: x + 10 * SC, y: y + 15 * SC + slide * 5 };
    ctx.strokeStyle = C.ropeDark; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(A.x, A.y);
    ctx.quadraticCurveTo(A.x + 8, (A.y + hand.y) / 2 + 6, hand.x, hand.y);
    ctx.stroke();
    // 手之後的餘繩,鬆鬆回到繩堆
    const B = { x: x - 24 * SC, y: y + 16 * SC };
    ctx.beginPath(); ctx.moveTo(hand.x, hand.y);
    ctx.quadraticCurveTo((hand.x + B.x) / 2, Math.max(hand.y, B.y) + 10, B.x, B.y);
    ctx.stroke();
    let guide = { x: device.x, y: device.y - 20 * SC };
    if (opt.handsDown) {
      // 準備下放:兩隻手都握在確保器下方的制動繩上
      guide = { x: hand.x + 1, y: (A.y + hand.y) / 2 + 3 };
    } else if (opt.ropeTo) {
      const dxr = opt.ropeTo.x - device.x, dyr = opt.ropeTo.y - device.y;
      const dl = Math.hypot(dxr, dyr) || 1;
      guide = { x: device.x + dxr / dl * 26, y: device.y + dyr / dl * 26 };
    }
    limb(x + 6, y + 5, hand.x, hand.y, C.greyArm, 4.5);   // 制動手
    limb(x + 3, y - 6, guide.x, guide.y, C.greyArm, 4.5); // 導繩手
    if (!opt.handsDown) {                                  // ATC → 導繩手的繩段
      ctx.strokeStyle = C.rope; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(device.x, device.y - 6);
      ctx.lineTo(guide.x, guide.y); ctx.stroke();
    }
    drawATC(device.x, device.y);

    catHead(x + 1, y - 21 * SC, 9.5 * SC, C.grey, lookA, C.helmetB);
    // 一般確保:主繩從導繩手出去(frame 接著畫微笑曲線到岩壁)
    // handsDown:兩手在下,主繩直接從 ATC 頂端出去
    return opt.handsDown ? { x: device.x, y: device.y - 6 }
                         : { x: guide.x, y: guide.y };
  }

  /* ---------- 坐姿貓 ---------- */
  // opt: {wave, belay, feed:0~1 給繩節奏, pile:0~1 繩堆餘量, lookAt:{x,y}}
  function sitCat(x, y, col, colD, t, opt = {}) {
    const lookA = opt.lookAt
      ? Math.atan2(opt.lookAt.y - (y - 24 * SC), opt.lookAt.x - x)
      : (opt.lookA ?? -.3);
    shadow(x, y + 15 * SC, 14 * SC);

    if (opt.pile !== undefined) ropePile(x - 30 * SC, y + 12 * SC, opt.pile);

    tail(x - 12 * SC, y + 4, -1, col, Math.sin(t * .004) * 4);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y, 13 * SC, 15 * SC, 0, 0, 7); ctx.fill();
    if (col === C.orange) {
      ctx.fillStyle = C.orangeDark;
      [-6, 1].forEach(sx => ctx.fillRect(x + sx * SC, y - 4 * SC, 3 * SC, 7 * SC));
    }
    ctx.fillStyle = colD;
    ctx.beginPath(); ctx.ellipse(x, y + 8 * SC, 9 * SC, 6 * SC, 0, 0, 7); ctx.fill();
    harness(x, y + 5 * SC, Math.PI / 2, 20);

    if (opt.wave) {
      const wa = Math.sin(t * .02) * .5;
      // 從肩膀出發,舉過頭側揮
      limb(x + 9 * SC, y - 7 * SC,
        x + 16 * SC + Math.cos(wa) * 5, y - 25 * SC + Math.sin(wa) * 5, colD, 5);
    }

    let device = { x: x + 8 * SC, y: y + 3 * SC };
    if (opt.belay) {
      const f = opt.feed ?? 0;
      const slide = Math.sin(t * .014) * .16 * f;   // 手沿繩滑動的比例
      // 制動端短繩(確保器 → 繩堆):先畫繩,再把手放到繩上
      const A = { x: device.x, y: device.y + 3 };
      const Cp = { x: device.x + 6, y: device.y + 24 };
      const B = { x: x - 24 * SC, y: y + 13 * SC };
      ctx.strokeStyle = C.ropeDark; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(A.x, A.y);
      ctx.quadraticCurveTo(Cp.x, Cp.y, B.x, B.y); ctx.stroke();
      const q = tq => {
        const s2 = 1 - tq;
        return { x: s2 * s2 * A.x + 2 * s2 * tq * Cp.x + tq * tq * B.x,
                 y: s2 * s2 * A.y + 2 * s2 * tq * Cp.y + tq * tq * B.y };
      };
      const brake = q(.45 + slide);                 // 制動手:握在制動繩上滑動
      let guide = { x: device.x, y: device.y - 20 * SC };
      if (opt.ropeTo) {                             // 導繩手:扶在攀登端繩段上
        const dxr = opt.ropeTo.x - device.x, dyr = opt.ropeTo.y - device.y;
        const dl = Math.hypot(dxr, dyr) || 1;
        guide = { x: device.x + dxr / dl * 26, y: device.y + dyr / dl * 26 };
      }
      limb(x + 5, y, brake.x, brake.y, colD, 4.5);
      limb(x + 3, y - 6, guide.x, guide.y, colD, 4.5);
      // 確保器最後畫,壓在繩與手之上
      ctx.fillStyle = '#666c78';
      ctx.beginPath(); ctx.arc(device.x, device.y, 4.5 * SC, 0, 7); ctx.fill();
      ctx.fillStyle = '#8a919e';
      ctx.beginPath(); ctx.arc(device.x, device.y, 2 * SC, 0, 7); ctx.fill();
    }

    // 頭部朝注視方向偏移;基準貼緊身體、抬頭位移設上限,不會脫離身體
    catHead(x + Math.cos(lookA) * 3.5,
      y - 22 * SC + Math.max(-1, Math.sin(lookA) * 2),
      9.5 * SC, col, lookA, col === C.orange ? C.helmetA : C.helmetB);
    return device;
  }

  function stars(x, y, t) {
    for (let i = 0; i < 3; i++) {
      const a = t * .003 + i * 2.1;
      const sx = x + Math.cos(a) * 30, sy = y + Math.sin(a) * 10;
      ctx.fillStyle = C.sun; ctx.globalAlpha = .5 + .5 * Math.sin(t * .01 + i);
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const sa = k * Math.PI * 2 / 5 - Math.PI / 2, r = k % 2 ? 2 : 4.5;
        ctx[k ? 'lineTo' : 'moveTo'](sx + Math.cos(sa) * r, sy + Math.sin(sa) * r);
      }
      ctx.fill(); ctx.globalAlpha = 1;
    }
  }

  /* ---------- 狀態機 ---------- */
  let belayOff = 0;                     // 確保貓前後位移(時間平滑,避免閃退)

  const PHASES = [
    { name: 'climb', dur: 16000 },     // 放慢,讓確保細節看得見
    { name: 'mantle', dur: 3200 },     // 翻上平台 → 扣固定點 → 走到樹旁
    { name: 'summit', dur: 3200 },
    { name: 'edge', dur: 4800 },       // 走回崖邊、坐上繩(更慢)
    { name: 'lower', dur: 8500 },
    { name: 'untie', dur: 3200 },      // 著地走回 → 解除確保
    { name: 'pull', dur: 5200 },       // 藍貓退開 → 橘貓接手抽繩 → 落繩
    { name: 'rest', dur: 2600 }
  ];
  const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);

  function frame(t) {
    drawScene(t);
    drawRock();

    let tt = t % TOTAL, phase = 'climb', u = 0;
    for (const ph of PHASES) {
      if (tt < ph.dur) { phase = ph.name; u = tt / ph.dur; break; }
      tt -= ph.dur;
    }

    // 已扣繩的快扣隨動作微晃:攀爬/下放時晃幅大,靜態階段輕微
    let pClimb = 1;
    if (phase === 'climb') {
      const st = 11, s0 = Math.max(0, (u - .11) / .89) * st, i0 = Math.floor(s0);
      pClimb = 0.10 + (i0 + ease(Math.min(s0 - i0, 1))) / st * (0.99 - 0.10);
    }
    const swayAmp = (phase === 'climb' || phase === 'lower' || phase === 'pull') ? 2.4
                  : (phase === 'mantle') ? 1.6 : .7;
    let pullK = -1;                    // 落繩進度(繩尾沿快扣下滑)
    if (phase === 'pull' && u >= .80) pullK = ease((u - .80) / .20);
    bolts.forEach((b, bi) => {
      const threaded2 = phase === 'rest' ? false
        : phase === 'climb' ? b.p <= pClimb + .015
        : phase === 'pull' ? (pullK < 0 ? true : pullK < (5 - bi) / 6)
        : true;
      drawBolt(b, threaded2 ? Math.sin(t * .0035 + b.p * 26) * swayAmp : 0);
    });

    const anchor = drawAnchor();
    const belayXY = { x: edge[0].x - 86, y: H * .885 };

    if (phase === 'climb') {
      const uc = Math.max(0, (u - .11) / .89);   // 對話說完才起攀
      const steps = 11, s = uc * steps, i = Math.floor(s);
      const p = 0.10 + (i + ease(Math.min(s - i, 1))) / steps * (0.99 - 0.10);
      const nearBolt = bolts.find(b => b.p - p > 0 && b.p - p < .06);
      const clipped = bolts.filter(b => b.p <= p + .015);
      const body = posAt(p, 20 * SC);
      const moving = Math.abs(Math.sin((s - i) * Math.PI));   // 步伐中 → 給繩
      // 扣進第一個快扣前:抱石確保(站牆邊舉掌);扣入後平滑走回確保位
      const spotK = Math.max(0, Math.min(1, (bolts[0].p + .02 - p) / .07));
      const walkIn = Math.min(1, Math.max(0, (p - .10) / .06));  // 起攀後才走過去
      const spotTarget = body.x - 34;                            // 站在攀爬貓正下方
      const bx2 = belayXY.x + (spotTarget - belayXY.x) * spotK * walkIn;
      const pileXY = { x: belayXY.x - 30 * SC, y: belayXY.y + 12 * SC };
      const lookA2 = Math.atan2(body.y - belayXY.y, body.x - bx2);
      if (spotK > .55) {
        ropePile(pileXY.x, pileXY.y, .8);
        const paws = spotCat(bx2, belayXY.y - 4, lookA2, t);
        // 繩:繩堆 → 吊帶上的 ATC → 左掌 → U 字 → 右掌 → 攀爬貓
        rope([pileXY, { x: paws.dev.x, y: paws.dev.y + 6 }], 8);
        smileRope({ x: paws.dev.x, y: paws.dev.y - 6 }, paws.pL, 6);
        smileRope(paws.pL, paws.pR, 26);                       // 兩掌間的 U 字
        rope([paws.pR, { x: body.x, y: body.y + 3 }], 18);
      } else {
        // 視狀態確保:接近快扣 → 上前一步多遞繩;剛掛好 → 後收半步收繩;其餘小幅跟繩
        const nb2 = bolts.find(b => b.p > p);
        const kn = nb2 ? Math.max(0, 1 - (nb2.p - p) / .08) : 0;
        const jb = clipped.length ? clipped[clipped.length - 1] : null;
        const kc = jb ? Math.max(0, 1 - (p - jb.p) / .07) : 0;
        belayOff += ((kn * 10 - kc * 5) - belayOff) * .04;   // 緩慢趨近,不閃退
        const device = belayCat(bx2 + belayOff, belayXY.y - 4, t, {
          feed: .12 + kn * .8 + kc * .55,
          pile: .8,
          lookAt: body,                      // 持續注視攀登者
          ropeTo: clipped.length ? clipped[0].lowerPt : { x: body.x, y: body.y + 3 }
        });
        const pts = [...clipped.map(b => b.lowerPt), { x: body.x, y: body.y + 3 }];
        // 平時垂出微笑;給繩/收繩的瞬間(kn、kc 高)繩被送出 → 瞬間拉直
        smileRope(device, pts[0], 6 + 26 * (1 - Math.max(kn, kc)));
        rope(pts, 9);
      }
      climberClimb(p, t, nearBolt);
      // 開場對話(定點顯示、最後畫 → 最上層):橘貓喊聲,灰貓回應
      if (u < .05) {
        const st0 = posAt(0.115, 20 * SC);
        bubble(st0.x - 64, st0.y - 16, '登ります');
      } else if (u < .105) {
        bubble(belayXY.x - 6, belayXY.y - 52 * SC, 'ガンバ!');
      }
    }
    else if (phase === 'mantle') {
      // 翻上崖緣 → 依序扣入固定點雙快扣 → 慢慢站起、走向樹旁
      const spot = summitSpot(anchor);
      const lipXY = { x: edge[edge.length - 1].x + 12,
                      y: anchor.surf(edge[edge.length - 1].x + 12) - 13 };
      let cx2, cy2, reach = null;
      const threaded = [];
      if (u < .18) {                               // 翻上平台
        const e = ease(u / .18);
        const start = posAt(0.99, 20 * SC);
        cx2 = start.x + (lipXY.x - start.x) * e;
        cy2 = start.y + (lipXY.y - start.y) * e - Math.sin(e * Math.PI) * 10;
      } else if (u < .52) {                        // 扣快扣一、再扣快扣二
        const uu = (u - .18) / .34;
        cx2 = lipXY.x; cy2 = lipXY.y;
        if (uu < .5) { reach = anchor.b1; }
        else { threaded.push(anchor.b1); reach = anchor.b2; }
      } else {                                     // 沿著平台走到樹旁
        threaded.push(anchor.b1, anchor.b2);
        const uu = ease((u - .52) / .48);
        cx2 = lipXY.x + (spot.x - lipXY.x) * uu;
        cy2 = anchor.surf(cx2) - 13 + Math.sin(uu * Math.PI * 4) * 1.5;  // 步伐起伏
      }
      const device = belayCat(belayXY.x, belayXY.y - 4, t, {
        feed: .25, pile: .8,
        lookAt: { x: cx2, y: cy2 }, ropeTo: bolts[0].lowerPt
      });
      const pts = [...bolts.map(b => b.lowerPt), ...threaded, { x: cx2, y: cy2 + 3 }];
      smileRope(device, pts[0], 24);
      rope(pts, 9);
      climberMantle(cx2, cy2, 0, t, reach);
    }
    else if (phase === 'summit') {
      const spot = summitSpot(anchor);
      const device = belayCat(belayXY.x, belayXY.y - 4, t, {
        feed: 0, pile: .8, lookAt: spot, ropeTo: bolts[0].lowerPt
      });
      const pts = [...bolts.map(b => b.lowerPt), anchor.b1, anchor.b2,
        { x: spot.x, y: spot.y + 6 * SC }];
      smileRope(device, pts[0], 24);
      rope(pts, 9);
      sitCat(spot.x, spot.y, C.orange, C.orangeDark, t, { wave: true, lookA: -2.6 });
      stars(spot.x + 6, spot.y - 30 * SC, t);
    }
    else if (phase === 'edge') {
      // 先說完「降ろしてください」(定點),再開始走回崖邊
      const e = ease(Math.max(0, (u - .35) / .65));
      const spot = summitSpot(anchor);
      const lipPt = { x: anchor.b2.x + wallOut.x * 6, y: anchor.b2.y + 8 };
      const cx2 = spot.x + (lipPt.x - spot.x) * e;
      const cy2 = spot.y + (lipPt.y - spot.y) * e;
      const back = e * 24;
      const device = belayCat(belayXY.x - back, belayXY.y - 4, t, {
        feed: .2, pile: .8, handsDown: true,
        lookAt: { x: cx2, y: cy2 }
      });
      const pts = [...bolts.map(b => b.lowerPt), anchor.b1, anchor.b2];
      smileRope(device, pts[0], 26 * (1 - e));       // 後退 → 微笑拉直到 0
      rope(pts, 8 - e * 6);
      climberMantle(cx2, cy2, -e * .3, t);       // 趴姿倒退,身體漸漸後傾
      rope([anchor.b2, { x: cx2, y: cy2 + 3 }], 2);
      if (u < .33) bubble(spot.x - 76, spot.y + 16, '降ろしてください');
    }
    else if (phase === 'lower') {
      const e = ease(u);
      const yTopStart = anchor.b2.y + 10;
      const y = yTopStart + (H * .862 - yTopStart) * e;
      const sway = Math.sin(u * Math.PI * 3) * 12 * (1 - u);
      const cx = anchor.b2.x + wallOut.x * 8 + sway;
      const device = belayCat(belayXY.x - 24, belayXY.y - 4, t, {
        feed: .45, pile: .8, handsDown: true,
        lookAt: { x: cx, y }
      });
      const pts = [...bolts.map(b => b.lowerPt), anchor.b1, anchor.b2];
      smileRope(device, pts[0], 0);                  // 下放:全程繃緊
      rope(pts, 1);
      const tie = climberHang(cx, y, t, sway);
      rope([anchor.b2, tie], 0);                     // 承重繩:直的
    }
    else if (phase === 'untie') {
      // 著地 → 原地解除繫入(自由端向左輕甩後靜止)→ 空手走回夥伴身邊
      // 主繩全程:繩堆 →(灰貓 ATC)→ 各快扣 → 固定點,位置連續不跳動
      const landX = anchor.b2.x + wallOut.x * 8;
      const seat = { x: belayXY.x + 52 * SC, y: belayXY.y + 2 };
      const gx = belayXY.x - 24 + 24 * ease(Math.min(1, u / .5));
      let wallStart;
      if (u < .5) {
        // 灰貓還握著:主繩經過吊帶上的 ATC
        wallStart = belayCat(gx, belayXY.y - 4, t, {
          feed: 0, pile: .55, handsDown: true,
          lookAt: { x: landX, y: H * .85 }
        });
      } else {
        // 灰貓解除:主繩直接從繩堆出發
        ropePile(belayXY.x - 26 * SC, belayXY.y + 12 * SC, .55);
        sitCat(belayXY.x, belayXY.y, C.grey, C.greyDark, t,
          { lookAt: { x: landX, y: H * .86 } });
        wallStart = { x: belayXY.x - 26 * SC, y: belayXY.y + 12 * SC };
      }
      rope([wallStart, ...bolts.map(b => b.lowerPt), anchor.b1, anchor.b2], 12);

      if (u < .35) {
        // 橘貓原地解繩:繫入端越來越鬆
        rope([anchor.b2, { x: landX, y: H * .862 + 4 }], 4 + u * 34);
        sitCat(landX, H * .862, C.orange, C.orangeDark, t, { lookA: -2.2 });
      } else {
        // 自由端解開:向左輕甩後靜止在落點;橘貓空手走回
        const fl = ease(Math.min(1, (u - .35) / .12));
        rope([anchor.b2, { x: landX + 6 - 16 * fl, y: H * .888 }], 6);
        const w = ease(Math.min(1, (u - .35) / .6));
        const ox = landX + (seat.x - landX) * w;
        const oy = H * .862 + (seat.y - H * .862) * w
          + ((w > 0 && w < 1) ? Math.sin(w * Math.PI * 5) * 1.5 : 0);
        sitCat(ox, oy, C.orange, C.orangeDark, t, { lookA: 2.6 });
      }
    }
    else if (phase === 'pull') {
      // 順序:灰貓先退遠 → 橘貓走到「穿過快扣那側」接繩 → 拉繩:
      // 外側自由端升上固定點 → 喊「ロープダウン」 → 繩尾沿快扣路徑下滑回到手邊
      const pileXY = { x: belayXY.x - 26 * SC, y: belayXY.y + 12 * SC };
      const seat = { x: belayXY.x + 52 * SC, y: belayXY.y + 2 };
      const pullSpot = { x: belayXY.x + 34, y: belayXY.y + 2 };
      const groundOut = { x: anchor.b2.x + wallOut.x * 8 - 10, y: H * .888 };  // 自由端:解繩後的落點
      const downPath = [anchor.b2, anchor.b1,
        ...bolts.map(b => b.lowerPt).reverse()];              // 固定點 → 由上而下各快扣

      const wg = ease(Math.min(1, u / .25));                  // 灰貓先退遠
      const gx = belayXY.x - 114 * wg;
      const wo = u < .25 ? 0 : ease(Math.min(1, (u - .25) / .20));  // 橘貓再走過去
      const walkBob = (wo > 0 && wo < 1) ? Math.sin(wo * Math.PI * 4) * 1.5 : 0;
      const ox = seat.x + (pullSpot.x - seat.x) * wo;
      const oy = seat.y + walkBob;
      const paw = { x: ox + 16 * SC, y: oy - 25 * SC };

      sitCat(gx, belayXY.y, C.grey, C.greyDark, t,
        { lookAt: { x: anchor.b2.x, y: anchor.b2.y } });
      sitCat(ox, oy, C.orange, C.orangeDark, t,
        { wave: u >= .45 && u < .92, lookAt: { x: anchor.b2.x, y: anchor.b2.y } });

      if (u < .80) {
        // 拉繩:外側自由端從地面升向固定點(直直上升,帶一點飄)
        const e2 = u < .45 ? 0 : ease(Math.min(1, (u - .45) / .35));
        const endPt = {
          x: groundOut.x + (anchor.b2.x - groundOut.x) * e2
             + Math.sin(t * .015) * 3 * e2 * (1 - e2) * 4,
          y: groundOut.y + (anchor.b2.y - groundOut.y) * e2
        };
        // 整條繩:自由端 → 固定點 → 各快扣(由上而下)→ 橘貓的掌 → 繩堆
        if (u < .45) {
          rope([endPt, ...downPath, pileXY], 6);   // 橘貓還沒接手:整條直接回繩堆
        } else {
          rope([endPt, ...downPath, paw], 6);      // 接手後經過掌再回繩堆
          rope([paw, pileXY], 6);
        }
        ropePile(pileXY.x, pileXY.y, .3 + e2 * .4);
      } else {
        // 落繩:繩尾沿「固定點 → 快扣 → 掌」的路徑快速下滑,快扣由上而下解除
        const k = ease((u - .80) / .20);
        const path2 = [...downPath, paw];
        const segs = []; let Ltot = 0;
        for (let i2 = 1; i2 < path2.length; i2++) {
          const d2 = Math.hypot(path2[i2].x - path2[i2 - 1].x, path2[i2].y - path2[i2 - 1].y);
          segs.push(d2); Ltot += d2;
        }
        let dist = k * Ltot * .999, idx2 = 0;
        while (idx2 < segs.length - 1 && dist > segs[idx2]) { dist -= segs[idx2]; idx2++; }
        const a2 = path2[idx2], b3 = path2[idx2 + 1];
        const endPt = { x: a2.x + (b3.x - a2.x) * dist / segs[idx2],
                        y: a2.y + (b3.y - a2.y) * dist / segs[idx2] };
        rope([endPt, ...path2.slice(idx2 + 1)], 7);
        rope([paw, pileXY], 6);
        ropePile(pileXY.x, pileXY.y, .7 + k * .08);
      }
      // 「ロープダウン」由橘貓喊(繩尾即將落下前),最後畫 → 永遠在最上層
      if (u >= .72 && u < .86)
        bubble(pullSpot.x + 6, pullSpot.y - 50 * SC, 'ロープダウン');
    }
    else { // rest:繩已收好堆在腳邊,兩隻放鬆坐著(銜接下一輪起攀)
      ropePile(belayXY.x - 26 * SC, belayXY.y + 12 * SC, .78);
      sitCat(belayXY.x, belayXY.y, C.grey, C.greyDark, t, { lookA: .3 });
      sitCat(belayXY.x + 52 * SC, belayXY.y + 2, C.orange, C.orangeDark, t, { lookA: -2.8 });
    }
  }

  resize();
  addEventListener('resize', resize);

  if (reduced) {
    frame(6500);
  } else {
    const loop = t => { frame(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
})();
