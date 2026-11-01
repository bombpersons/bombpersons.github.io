import { generatePlant, mulberry } from './plant-graph-model.js';
import { renderPlant } from './plant-graph.js';

const root = document.documentElement;

// Each side grows one column plant, rooted on the farmyard ground line and
// climbing the full height of the page.
const seasons = {
  spring: ['apple', 'bean', 'strawberry'],
  summer: ['apple', 'bean', 'strawberry', 'tomato', 'kale', 'squash'],
  autumn: ['apple', 'strawberry', 'tomato', 'kale', 'squash'],
  winter: ['pine', 'apple']
};
const HANGERS = ['strawberry', 'squash'];
const seasonNames = Object.keys(seasons);

// a fresh plant identity per page load, kept across season/resize regrows
const seeds = { l: 1 + Math.floor(Math.random() * 1e6), r: 1 + Math.floor(Math.random() * 1e6) };
const animations = { l: 0, r: 0 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const freezeT = new URLSearchParams(location.search).get('freeze');
// ?raf=1: headless browsers never fire rAF, so let timers drive it to test the
// real animation path with --virtual-time-budget
if (new URLSearchParams(location.search).has('raf')) {
  window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = id => clearTimeout(id);
}

function groundLine() {
  const ground = document.querySelector('.ground-surface') || document.querySelector('.ground');
  if (ground) return Math.round(ground.getBoundingClientRect().top + window.scrollY);
  return Math.max(420, document.documentElement.scrollHeight - 140);
}

function grow(side, plants, column, hanging, groundY) {
  const els = [];
  let skip = 0;
  if (hanging) {
    const basket = document.createElement('img');
    basket.src = '/images/plants/basket.png';
    basket.className = 'plant-basket';
    basket.alt = '';
    basket.draggable = false;
    basket.decoding = 'async';
    column.appendChild(basket);
    plants.forEach(plant => {
      const plantEl = renderPlant(plant, column, 0);
      plantEl.dataset.hanging = '1';
      // rotate(90deg) maps the root (y = 62..70) to -62..-70, so the right side
      // anchors at 100% to land the plant under the basket instead of mid-air
      plantEl.style.left = side === 'l' ? '0' : '100%';
      plantEl.style.top = '26px';
      plantEl.style.transformOrigin = '0 0';
      plantEl.style.transform = side === 'l' ? 'scaleX(-1) rotate(90deg)' : 'rotate(90deg)';
      els.push(plantEl);
    });
  } else {
    plants.forEach(plant => {
      const plantEl = renderPlant(plant, column, 0);
      plantEl.dataset.hanging = '0';
      plantEl.style.left = side === 'l' ? '0' : '100%';
      plantEl.style.top = groundY + 'px';
      plantEl.style.transformOrigin = '0 0';
      plantEl.style.transform = side === 'l' ? 'rotate(-90deg)' : 'scaleX(-1) rotate(-90deg)';
      els.push(plantEl);
    });
    // skip ahead so the tip already pokes up from the bottom edge of the screen
    const visible = Math.max(0, groundY - window.innerHeight);
    skip = 0.9;
    plants.forEach(plant => plant.nodes.forEach(n => { if (n.x >= visible && n.birth < skip) skip = n.birth; }));
    skip = Math.min(skip, 0.92);
  }
  if (reducedMotion) {
    els.forEach(el => el.setGrowth(1));
    return;
  }
  if (freezeT !== null) {
    els.forEach(el => el.setGrowth(parseFloat(freezeT)));
    return;
  }
  cancelAnimationFrame(animations[side]);
  const start = performance.now();
  const duration = 20000;
  const tick = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    els.forEach(el => el.setGrowth(skip + (1 - skip) * eased));
    if (t < 1) animations[side] = requestAnimationFrame(tick);
  };
  animations[side] = requestAnimationFrame(tick);
}

function plantSides() {
  // a fresh round of plants sweeps any fallen fruit off the grass
  while (fallen.length) fallen.pop().remove();
  const season = seasons[root.dataset.season] ? root.dataset.season : 'summer';
  const width = Math.max(120, Math.min(230, (window.innerWidth - 800) / 2 - 20));
  const groundY = groundLine();
  const forced = new URLSearchParams(location.search).get('plant');
  ['l', 'r'].forEach((side, index) => {
    const column = document.querySelector('.vines-' + side);
    if (!column) return;
    column.replaceChildren();
    if (window.innerWidth < 1000) return;
    const picker = mulberry(seeds[side] + index * 1013 + seasonNames.indexOf(season) * 7919);
    const available = seasons[season];
    const name = forced || available[Math.floor(picker() * available.length)];
    const hanging = HANGERS.includes(name);
    // trailers reach the ground on big pages too: full document span from the basket
    const height = hanging
      ? Math.max(380, groundY - 80)
      : Math.max(420, groundY);
    const seedBase = (seeds[side] + index * 3457) % 1e6;
    // multiple basket plants start evenly spaced across the soil and each gets
    // its own lateral band (wall) so together they fill the column instead of
    // stacking on the same inner wall
    const bands = name === 'strawberry'
      ? [{ offset: -32, wall: 62 }, { offset: 33, wall: 121 }]
      : [{ offset: 0, wall: 120 }];
    const plants = bands.map((band, i) => generatePlant(name, {
      season,
      seed: (seedBase + i * 997) % 1e6,
      height,
      width,
      hanging,
      rootJitter: band.offset,
      wall: band.wall
    }));
    grow(side, plants, column, hanging, groundY);
  });
}

// ?plucktest=1: synthetically pluck the first visible leaf after load and log
// the outcome, so the interaction pipeline can be verified headlessly
if (new URLSearchParams(location.search).has('plucktest')) {
  window.__plucktest = true;
  window.setTimeout(() => {
    const pondEl = document.querySelector('.pond');
    if (!pondEl) { console.error('POND-TEST FAIL: no pond'); return; }
    const fruit = document.querySelector('.vines img[data-kind="fruit"]');
    if (!fruit || getComputedStyle(fruit).display === 'none') { console.error('POND-TEST FAIL: no visible fruit'); return; }
    const pr = pondEl.getBoundingClientRect();
    const r = fruit.getBoundingClientRect();
    const cx = Math.round(pr.left + pr.width / 2);
    fruit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 4, clientY: r.top + 4 }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: cx, clientY: Math.round(r.top - 40) }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: cx, clientY: Math.round(r.top - 40) }));
    console.error('POND-TEST released fruit over the pond');
  }, 15500);
  window.setTimeout(() => {
    let img = null;
    const docH = document.documentElement.scrollHeight;
    for (const leaf of document.querySelectorAll('.vines img.leafy')) {
      const r = leaf.getBoundingClientRect();
      // prefer a low leaf so the bottom-of-page hit-test path gets exercised
      if (r.width > 8 && r.top > docH * 0.6) { img = leaf; break; }
    }
    if (!img) {
      for (const leaf of document.querySelectorAll('.vines img.leafy')) {
        if (leaf.getBoundingClientRect().width > 8) { img = leaf; break; }
      }
    }
    if (!img) { console.error('PLUCKTEST FAIL: no visible leaf'); return; }
    const rr = img.getBoundingClientRect();
    const hit = document.elementFromPoint(rr.left + rr.width / 2, rr.top + rr.height / 2);
    console.error('PLUCKTEST hit-test →', hit === img ? 'the leaf ✓' : hit ? hit.tagName + ' (NOT the leaf!)' : 'NULL');
    const rect = img.getBoundingClientRect();
    const down = new PointerEvent('pointerdown', { bubbles: true, clientX: rect.left + 4, clientY: rect.top + 4 });
    img.dispatchEvent(down);
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + 60, clientY: rect.top + 30 }));
    setTimeout(() => {
      const flying = document.querySelector('.plucked-layer canvas');
      let lit = 0;
      if (flying) {
        const d = flying.getContext('2d').getImageData(0, 0, flying.width, flying.height).data;
        for (let i = 3; i < d.length; i += 97) lit += d[i];
      }
      console.error('PLUCKTEST ' + (flying && lit > 0 ? 'LIFTED pixels ' + lit : 'FAIL: nothing lifted'));
      window.dispatchEvent(new PointerEvent('pointerup', {}));
      setTimeout(() => {
        const still = document.querySelector('.plucked-layer canvas');
        console.error('PLUCKTEST ' + (still ? 'ANIMATING (float/fall)' : 'SETTLED'));
      }, 400);
    }, 120);
  }, 9000);
}

// ----- plucking: grab leaves, flowers and fruit off the plants -----
// sprites lift into a fixed overlay at their on-screen spot, follow the
// pointer while held, then either float down like the background leaves or
// fall heavy and land on the grass.
const pluckLayer = document.createElement('div');
pluckLayer.className = 'plucked-layer';
document.body.appendChild(pluckLayer);
const fallen = [];

function liftSprite(img) {
  // snapshot the sprite exactly as displayed: the plant container's linear
  // transform (rotate + mirror, origin 0 0) composed with the sprite's own
  // animated tilt, sized so the redraw fills the same on-screen bounding box
  const rect = img.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const snap = document.createElement('canvas');
  snap.width = Math.max(1, Math.round(rect.width * dpr));
  snap.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = snap.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let A = 1, B = 0, C = 0, D = 1;
  const plant = img.closest('.edge-plant');
  if (plant) {
    const ps = getComputedStyle(plant).transform;
    if (ps && ps !== 'none') {
      const pm = new DOMMatrixReadOnly(ps);
      A = pm.a; B = pm.b; C = pm.c; D = pm.d;
    }
  }
  const is = getComputedStyle(img).transform;
  const own = new DOMMatrixReadOnly(is && is !== 'none' ? is : undefined);
  const ownAngle = Math.atan2(own.b, own.a);
  // solve the sprite's unrotated on-screen size from its rotated bounding box
  const aw = Math.abs(A), ah = Math.abs(D), bw = Math.abs(B), ch = Math.abs(C);
  const den = aw * ah - bw * ch;
  let w0 = rect.width, h0 = rect.height;
  if (Math.abs(den) > 1e-4) {
    const sw = (rect.width * ah - rect.height * ch) / den;
    const sh = (rect.height * aw - rect.width * bw) / den;
    if (sw > 1 && sh > 1 && Number.isFinite(sw) && Number.isFinite(sh)) { w0 = sw; h0 = sh; }
  }
  ctx.translate(snap.width / 2, snap.height / 2);
  ctx.scale(dpr, dpr);
  ctx.transform(A, B, C, D, 0, 0);
  ctx.rotate(ownAngle);
  ctx.drawImage(img, -w0 / 2, -h0 / 2, w0, h0);
  if (window.location.search.includes('plucktest')) {
    const probe = ctx.getImageData(0, 0, snap.width, snap.height).data;
    let lit = 0;
    for (let i = 3; i < probe.length; i += 97) lit += probe[i];
    console.error('VINES', JSON.stringify(document.querySelector('.vines').getBoundingClientRect()), 'SIDE', JSON.stringify(document.querySelector('.vines-side').getBoundingClientRect()), 'bodyH', document.body.getBoundingClientRect().height);
    console.error('LIFT rect', Math.round(rect.width) + 'x' + Math.round(rect.height), 'ACBD', A.toFixed(2), B.toFixed(2), C.toFixed(2), D.toFixed(2), 'own', ownAngle.toFixed(2), 'w0h0', Math.round(w0) + 'x' + Math.round(h0), 'lit', lit);
  }
  snap.className = 'plucked';
  snap.alt = '';
  snap.dataset.kind = img.dataset.kind || 'leaf';
  snap.style.width = rect.width + 'px';
  pluckLayer.appendChild(snap);
  img.remove();
  return { el: snap, rect };
}

let drag = null;

function place(d, x, y, tilt) {
  d.el.style.transform = tilt ? `translate(${x}px, ${y}px) rotate(${tilt}deg)` : `translate(${x}px, ${y}px)`;
}

window.addEventListener('pointerdown', e => {
  const img = e.target instanceof Element && e.target.closest('.vines img');
  if (!img || img.classList.contains('plant-basket') || drag) return;
  if (img.getBoundingClientRect().width < 4) return;
  e.preventDefault();
  const { el, rect, matrix } = liftSprite(img);
  drag = {
    el,
    kind: el.dataset.kind,
    ox: e.clientX - rect.left,
    oy: e.clientY - rect.top,
    x: rect.left,
    y: rect.top
  };
  place(drag, drag.x, drag.y);
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd, { once: true });
  window.addEventListener('pointercancel', onDragEnd, { once: true });
});

function onDragMove(e) {
  if (!drag) return;
  drag.x = e.clientX - drag.ox;
  drag.y = e.clientY - drag.oy;
  place(drag, drag.x, drag.y);
}

function onDragEnd() {
  window.removeEventListener('pointermove', onDragMove);
  const d = drag;
  drag = null;
  if (!d) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (d.kind === 'fruit') releaseFruit(d, reduce);
  else releaseFloat(d, reduce);
}

function releaseFruit(d, reduce) {
  const pond = pondBox(d);
  let vy = reduce ? 1600 : 90;
  let last = performance.now();
  const step = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    d.y += vy * dt;
    vy += (reduce ? 2600 : 2400) * dt;
    place(d, d.x, d.y);
    const stop = pond ? pond.waterScreen : groundLine() - d.el.offsetHeight;
    if (d.y >= stop) {
      if (pond) { landInPond(d, pond); return; }
      d.el.className = 'fallen-fruit';
      d.el.style.position = 'absolute';
      d.el.style.left = (d.x + window.scrollX) + 'px';
      d.el.style.top = (groundLine() - d.el.offsetHeight * 0.7) + 'px';
      d.el.style.transformOrigin = '50% 50%';
      d.el.style.transform = 'rotate(' + (Math.random() * 24 - 12).toFixed(1) + 'deg)';
      document.body.appendChild(d.el);
      fallen.push(d.el);
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// the pond, in document coords, if the drop lands over its water
function pondBox(d) {
  const el = document.querySelector('.pond');
  if (!el) return null;
  const pr = el.getBoundingClientRect();
  const x = d.x + window.scrollX;
  if (x < pr.left + window.scrollX + 16 || x > pr.right + window.scrollX - 16) return null;
  return { el, left: pr.left + window.scrollX, right: pr.right + window.scrollX, top: pr.top + window.scrollY, waterScreen: pr.top + 20 };
}

// bobbing, drifting fruit; ducks shove it around
const floaters = [];
let floatRaf = 0;

function landInPond(d, pond) {
  const el = d.el;
  const w = parseFloat(el.style.width) || el.offsetWidth;
  const h = parseFloat(el.style.height) || el.offsetHeight;
  const wrap = document.createElement('span');
  wrap.className = 'in-pond';
  wrap.style.position = 'absolute';
  wrap.style.left = (d.x + window.scrollX - pond.left) + 'px';
  wrap.style.top = (pond.waterScreen + window.scrollY - pond.top - h * 0.45) + 'px';
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';
  el.className = '';
  el.style.position = 'absolute';
  el.style.left = '0';
  el.style.top = '0';
  el.style.transformOrigin = '50% 50%';
  el.style.transform = 'none';
  wrap.appendChild(el);
  const water = pond.el.querySelector('.pond-water');
  if (water && water.nextSibling) pond.el.insertBefore(wrap, water.nextSibling);
  else pond.el.appendChild(wrap);
  floaters.push({ el: wrap, w, cx: d.x - pond.left, vx: 0, drift: Math.random() * 8 - 4, t0: performance.now(), phase: Math.random() * 6.28, pond });
  if (window.__plucktest) console.error('POND-TEST floating, fruit bobbing in the pond');
  bobLoop();
}

function bobLoop() {
  if (floatRaf) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();
  const step = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const ducks = reduce ? [] : [...document.querySelectorAll('.runner')].map(r => r.getBoundingClientRect());
    for (const f of floaters) {
      const fx = f.pond.left + f.cx + f.w / 2;
      for (const dr of ducks) {
        const dcx = dr.left + dr.width / 2 + window.scrollX;
        if (Math.abs(dcx - fx) < 34 && dr.bottom > f.pond.top + 20) f.vx += (dcx < fx ? 1 : -1) * 90 * dt;
      }
      f.vx += (f.drift - f.vx) * Math.min(1, dt * 0.8);
      f.cx += f.vx * dt;
      const minX = 18, maxX = f.pond.right - f.pond.left - f.w - 18;
      if (f.cx < minX || f.cx > maxX) { f.cx = Math.max(minX, Math.min(maxX, f.cx)); f.vx *= -0.4; }
      if (reduce) continue;
      const t = (now - f.t0) / 1000;
      f.el.style.transform = 'translate(0,' + (Math.sin(t * 2.1 + f.phase) * 2.5).toFixed(2) + 'px) rotate(' + (Math.sin(t * 1.6 + f.phase) * 7).toFixed(2) + 'deg)';
    }
    floatRaf = floaters.length ? requestAnimationFrame(step) : 0;
  };
  floatRaf = requestAnimationFrame(step);
}

function releaseFloat(d, reduce) {
  const t0 = performance.now();
  const phase = Math.random() * 6.28;
  const speed = reduce ? 500 : 85;
  const swing = reduce ? 0 : 26;
  const step = now => {
    const t = (now - t0) / 1000;
    const x = d.x + Math.sin(t * 2.1 + phase) * swing;
    const y = d.y + speed * t;
    place(d, x, y, Math.sin(t * 3 + phase) * 18);
    if (y < window.innerHeight + 60) requestAnimationFrame(step);
    else d.el.remove();
  };
  requestAnimationFrame(step);
}

plantSides();
let resizeTimer;
const regrow = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(plantSides, 120);
};
window.addEventListener('resize', regrow);
// content settling during load (webfonts reflowing) shifts the ground line
// without resizing body — re-anchor on load, fonts, and a short settle check
window.addEventListener('load', regrow);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(regrow);
const settle = setInterval(() => {
  const el = [...document.querySelectorAll('.edge-plant')].find(e => e.dataset.hanging !== '1');
  if (el && Math.abs(parseFloat(el.style.top) - groundLine()) > 4) plantSides();
}, 400);
setTimeout(() => clearInterval(settle), 10000);
new MutationObserver(plantSides).observe(root, { attributes: true, attributeFilter: ['data-season'] });
