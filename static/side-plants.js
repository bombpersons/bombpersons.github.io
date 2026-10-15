const root = document.documentElement;
const plantBase = new URL('./images/plants/', import.meta.url);
const svgNS = 'http://www.w3.org/2000/svg';

// Each stem belongs to one species. Entries are [file, width, height/width].
const species = {
  apple: { leaf: ['apple-leaf.png', 72, 1], flower: ['apple-blossom.png', 30, 1], fruit: ['apple-fruit.png', 34, 1.125] },
  bean: { leaf: ['bean-leaf.png', 60, 1.2], flower: ['bean-flower.png', 26, 32 / 28], fruit: ['bean-pod.png', 26, 46 / 30] },
  strawberry: { leaf: ['strawberry-leaf.png', 60, 1], flower: ['strawberry-flower.png', 24, 1], fruit: ['strawberry.png', 19, 1.2] },
  tomato: { leaf: ['tomato-leaf.png', 72, 40 / 44], flower: ['tomato-flower.png', 24, 1], fruit: ['tomato-fruit.png', 28, 1] },
  kale: { leaf: ['kale.png', 94, 56 / 64] },
  squash: { leaf: ['squash-leaf.png', 104, 64 / 74], flower: ['squash-flower.png', 38, 42 / 38], fruit: ['pumpkin.png', 52, 38 / 42] }
};
const seasons = {
  spring: ['apple', 'bean', 'strawberry'],
  summer: ['apple', 'bean', 'strawberry', 'tomato', 'kale', 'squash'],
  autumn: ['apple', 'strawberry', 'tomato', 'kale', 'squash'],
  winter: ['apple']
};

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svgElement(name, attributes) {
  const element = document.createElementNS(svgNS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function makePlant(name, season, reach, random) {
  const winter = season === 'winter';
  const plant = document.createElement('div');
  plant.className = 'edge-plant species-' + name;
  plant.style.width = reach + 'px';
  const growth = document.createElement('div');
  growth.className = 'plant-growth';
  growth.style.setProperty('--swd', (8 + random() * 5).toFixed(2) + 's');
  growth.style.setProperty('--sway-delay', (-random() * 10).toFixed(2) + 's');
  plant.appendChild(growth);

  const svg = svgElement('svg', { class: 'plant-stem', viewBox: `0 -110 ${reach} 220`, focusable: 'false' });
  growth.appendChild(svg);
  const scale = Math.min(1, reach / 180);
  const length = reach * (winter ? 0.4 + random() * 0.5 : 0.3 + random() * 0.38);
  const count = Math.max(2, Math.round(length / (30 * scale)));
  // Grow gently upward; project the length so the stems reach less far inward.
  const tilt = 0.3 + random() * 0.18;
  const slope = -Math.tan(tilt);
  const bend = (random() - 0.5) * 12 * scale;
  const nodes = [];
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    nodes.push({
      x: Math.round(-8 + (length + 8) * Math.cos(tilt) * t),
      y: Math.round(-(length + 8) * Math.sin(tilt) * t + Math.sin(t * Math.PI) * bend)
    });
  }
  plant.dataset.length = length.toFixed(1);
  let path = 'M-8 0';
  nodes.forEach(node => { path += ` L${node.x} ${node.y}`; });
  svg.appendChild(svgElement('path', { d: path, 'stroke-width': winter ? 3 : 3.5 }));
  svg.appendChild(svgElement('path', { d: path, class: 'stem-highlight', 'stroke-width': 1, transform: 'translate(0,-1)' }));

  function petiole(from, to) {
    svg.appendChild(svgElement('path', { d: `M${from.x} ${from.y} L${to.x} ${to.y}`, 'stroke-width': 2 }));
  }
  function attach(parent, pick, node, angle, size, kind, offsetX = 0, offsetY = 0) {
    const radians = angle * Math.PI / 180;
    const horizontal = pick[2] * Math.abs(Math.sin(radians)) + Math.abs(Math.cos(radians)) / 2;
    const width = Math.floor(Math.min(pick[1] * size, (reach - node.x - offsetX - 4) / Math.max(0.5, horizontal)));
    if (width < 10) return;
    const image = document.createElement('img');
    image.className = 'leafy' + (kind === 'leaf' ? '' : ' plant-accent');
    image.dataset.attachment = kind;
    image.src = new URL(pick[0], plantBase).href;
    image.width = width;
    image.alt = '';
    image.draggable = false;
    image.style.left = (offsetX - width / 2) + 'px';
    image.style.top = (offsetY - width * pick[2]) + 'px';
    // Every source sprite has its stem at the bottom; that point is the node.
    image.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    parent.appendChild(image);
  }

  nodes.forEach((node, index) => {
    const joint = document.createElement('span');
    joint.className = 'plant-node';
    joint.style.left = node.x + 'px';
    joint.style.top = node.y + 'px';
    growth.appendChild(joint);
    svg.appendChild(svgElement('rect', { x: node.x - 2, y: node.y - 2, width: 4, height: 4, class: 'stem-node' }));

    if (winter) {
      const direction = index % 2 ? 1 : -1;
      const tip = { x: node.x + 5 + random() * 10, y: node.y + direction * (10 + random() * 12) };
      petiole(node, tip);
      svg.appendChild(svgElement('path', { d: `M${node.x - 5} ${node.y - 3}h8`, class: 'stem-snow' }));
      return;
    }

    const leaf = species[name].leaf;
    const upper = 35 + random() * 26;
    const lower = 122 + random() * 24;
    attach(joint, leaf, node, index === count - 1 ? 90 + Math.atan(slope) * 180 / Math.PI : upper,
      scale * (0.75 + random() * 0.2), 'leaf');
    attach(joint, leaf, node, lower, scale * (0.55 + random() * 0.2), 'leaf');

    // Flowers and hanging fruit share leaf nodes, on short visible pedicels.
    let kind = null;
    if (season === 'spring' && species[name].flower && random() < 0.4) kind = 'flower';
    if (season === 'summer' && random() < 0.3) kind = random() < 0.6 ? 'fruit' : 'flower';
    if (season === 'autumn' && random() < 0.45) kind = 'fruit';
    if (kind && species[name][kind]) {
      const offset = { x: Math.round(7 * scale), y: Math.round((kind === 'fruit' ? 9 : -9) * scale) };
      petiole(node, { x: node.x + offset.x, y: node.y + offset.y });
      attach(joint, species[name][kind], node, kind === 'fruit' ? 180 + (random() - 0.5) * 16 : (random() - 0.5) * 40,
        Math.min(1, scale * (0.9 + random() * 0.12)), kind, offset.x, offset.y);
    }
  });
  return plant;
}

function plantSides() {
  const season = seasons[root.dataset.season] ? root.dataset.season : 'summer';
  const reach = Math.max(56, Math.min(220, (window.innerWidth - 800) / 2 - 32));
  const spacing = season === 'winter' ? 125 : 100;
  const count = Math.ceil(window.innerHeight / spacing) + 2;
  const seed = { spring: 11, summer: 22, autumn: 33, winter: 44 }[season];
  ['l', 'r'].forEach((side, index) => {
    const column = document.querySelector('.vines-' + side);
    if (!column) return;
    column.replaceChildren();
    if (window.innerWidth < 1000) return;
    const random = mulberry(seed * 100 + index * 7 + count);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const available = seasons[season];
      const name = available[Math.floor(random() * available.length)];
      const plant = makePlant(name, season, reach, random);
      plant.style.top = Math.round(i * spacing - 35 + random() * 26) + 'px';
      fragment.appendChild(plant);
    }
    column.appendChild(fragment);
  });
}

plantSides();
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(plantSides, 150);
});
new MutationObserver(plantSides).observe(root, { attributes: true, attributeFilter: ['data-season'] });
