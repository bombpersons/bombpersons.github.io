// Renders a plant graph from plant-graph-model.js into the DOM, reusing the
// side-plant classes (.edge-plant, .plant-growth, .plant-stem, .leafy).
// Everything is built once; the returned element carries setGrowth(t) so a
// growth timeline can animate stems and sprites without rebuilding the DOM.

import { mulberry } from './plant-graph-model.js';

const plantBase = new URL('./images/plants/', import.meta.url);
const svgNS = 'http://www.w3.org/2000/svg';

const setVisible = (el, on) => { el.style.display = on ? '' : 'none'; };

export function renderPlant(plant, parent, growth = 1) {
  const plantEl = document.createElement('div');
  plantEl.className = 'edge-plant species-' + plant.species;
  plantEl.style.width = plant.height + 'px';

  const growthEl = document.createElement('div');
  growthEl.className = 'plant-growth';
  const sway = mulberry((plant.seed ^ 0x9E37) + plant.nodes.length);
  growthEl.style.setProperty('--swd', (8 + sway() * 5).toFixed(2) + 's');
  growthEl.style.setProperty('--sway-delay', (-sway() * 10).toFixed(2) + 's');
  plantEl.appendChild(growthEl);

  const b = plant.bounds;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'plant-stem');
  svg.setAttribute('viewBox', `${b.minX} ${b.minY} ${b.maxX - b.minX} ${b.maxY - b.minY}`);
  svg.setAttribute('focusable', 'false');
  svg.style.left = b.minX + 'px';
  svg.style.top = b.minY + 'px';
  svg.style.width = (b.maxX - b.minX) + 'px';
  svg.style.height = (b.maxY - b.minY) + 'px';
  growthEl.appendChild(svg);

  const stemPath = document.createElementNS(svgNS, 'path');
  stemPath.setAttribute('stroke-width', plant.stemWidth);
  svg.appendChild(stemPath);
  const highlight = document.createElementNS(svgNS, 'path');
  highlight.setAttribute('class', 'stem-highlight');
  highlight.setAttribute('stroke-width', 1);
  highlight.setAttribute('transform', 'translate(0,-1)');
  svg.appendChild(highlight);

  // stem joints appear once their segment is fully grown
  const joints = [];
  plant.nodes.forEach(node => {
    if (node.parent === null) return;
    const p = plant.nodes[node.parent];
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', node.x - 2);
    rect.setAttribute('y', node.y - 2);
    rect.setAttribute('width', 4);
    rect.setAttribute('height', 4);
    rect.setAttribute('class', 'stem-node');
    setVisible(rect, false);
    svg.appendChild(rect);
    let snow = null;
    if (plant.season === 'winter') {
      snow = document.createElementNS(svgNS, 'path');
      snow.setAttribute('d', `M${node.x - 5} ${node.y - 3}h8`);
      snow.setAttribute('class', 'stem-snow');
      setVisible(snow, false);
      svg.appendChild(snow);
    }
    joints.push({ node, p, rect, snow, shown: false });
  });

  // sprites are created once at final size and revealed/scaled by setGrowth
  const sprites = plant.attachments.map(a => {
    if (a.pedicel) {
      const pedicel = document.createElementNS(svgNS, 'path');
      pedicel.setAttribute('d', `M${a.pedicel.x} ${a.pedicel.y} L${a.x} ${a.y}`);
      pedicel.setAttribute('stroke-width', 2);
      setVisible(pedicel, false);
      svg.appendChild(pedicel);
      var pedicelEl = pedicel;
    }
    const image = document.createElement('img');
    image.className = 'leafy' + (a.kind === 'leaf' ? '' : ' plant-accent') + (a.back ? ' leafy-back' : '');
    image.dataset.kind = a.kind;
    image.src = new URL(a.file, plantBase).href;
    image.alt = '';
    image.draggable = false;
    image.style.animationDelay = (-(sway() * 12)).toFixed(2) + 's';
    setVisible(image, false);
    growthEl.appendChild(image);
    return { a, pedicel: pedicelEl, image, shown: false };
  });

  function setGrowth(t) {
    t = Math.max(0, Math.min(1, t));
    let stems = '';
    joints.forEach(j => {
      const parentBirth = j.p.parent === null ? 0 : j.p.birth;
      const frac = Math.max(0, Math.min(1, (t - parentBirth) / ((j.node.birth - parentBirth) || 1)));
      if (frac <= 0) return;
      const x = j.p.x + (j.node.x - j.p.x) * frac;
      const y = j.p.y + (j.node.y - j.p.y) * frac;
      stems += ` M${j.p.x} ${j.p.y} L${Math.round(x)} ${Math.round(y)}`;
      const full = frac >= 1;
      if (full !== j.shown) {
        setVisible(j.rect, full);
        if (j.snow) setVisible(j.snow, full);
        j.shown = full;
      }
    });
    if (stems) {
      stemPath.setAttribute('d', stems);
      highlight.setAttribute('d', stems);
    }
    sprites.forEach(s => {
      if (!s.image.isConnected) return;
      const a = s.a;
      if (t < a.birth) {
        if (s.shown) { setVisible(s.image, false); if (s.pedicel) setVisible(s.pedicel, false); s.shown = false; }
        return;
      }
      const maturity = Math.min(1, (t - a.birth) / ((a.mature - a.birth) || 1));
      const width = Math.max(1, Math.round(a.width * maturity));
      if (width < 4) {
        if (s.shown) { setVisible(s.image, false); if (s.pedicel) setVisible(s.pedicel, false); s.shown = false; }
        return;
      }
      s.image.width = width;
      s.image.style.left = (a.x - width / 2) + 'px';
      s.image.style.top = (a.y - width * a.aspect) + 'px';
      s.image.style.transform = `rotate(${a.deg.toFixed(1)}deg)`;
      if (!s.shown) { setVisible(s.image, true); if (s.pedicel) setVisible(s.pedicel, true); s.shown = true; }
    });
  }

  plantEl.setGrowth = setGrowth;
  setGrowth(growth);
  parent.appendChild(plantEl);
  return plantEl;
}
