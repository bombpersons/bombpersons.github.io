// Pure plant-graph generator: builds a graph of nodes joined by stem sections,
// with leaves, flowers and fruits attached per species. No DOM here —
// plant-graph.js renders the graph, tools/test_plant_graph.mjs checks it.

export function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
}

// Sprites are [file, base width px, height/width]; each sprite's stem sits at
// its bottom centre, and that point is pinned to the node.
export const speciesConfigs = {
  apple: {
    label: 'Apple',
    sprites: {
      leaf: ['apple-leaf.png', 72, 1],
      flower: ['apple-blossom.png', 30, 1],
      fruit: ['apple-fruit.png', 34, 1.125]
    },
    stemWidth: 3.5, winterStemWidth: 3,
    growth: {
      segments: [10, 16], branchSegments: [4, 6],
      segmentLength: [36, 50], baseAngle: [-8, 12], droop: [-0.015, 0.035],
      straighten: 0.12,
      branchChance: 0.5, secondBranchChance: 0.25, branchSpread: [0.4, 0.9],
      apicalDominance: 0.75,
      maxDepth: 2, minBranchIndex: 3, maxNodes: 110
    },
    leaves: { pattern: 'alternate', size: [0.42, 0.53], splay: [30, 75] },
    flowers: { spot: 'terminal', chance: 0.8, size: [0.38, 0.48], cluster: [2, 3] },
    fruits: { spot: 'terminal', chance: 0.6, size: [0.7, 0.95], hang: true },
    winter: 'bare',
    seasonAccents: { spring: ['flower'], summer: ['flower', 'fruit'], autumn: ['fruit'], winter: [] }
  },
  bean: {
    label: 'Bean',
    sprites: {
      leaf: ['bean-leaf.png', 60, 1.2],
      flower: ['bean-flower.png', 26, 32 / 28],
      fruit: ['bean-pod.png', 26, 46 / 30]
    },
    stemWidth: 3, winterStemWidth: 2.5,
    growth: {
      segments: [8, 14], branchSegments: [3, 5],
      segmentLength: [34, 50], baseAngle: [-10, 16], droop: [-0.015, 0.035],
      straighten: 0.15,
      branchChance: 0.15, secondBranchChance: 0.03, branchSpread: [0.4, 0.95],
      apicalDominance: 0.7,
      maxDepth: 2, minBranchIndex: 4, maxNodes: 100
    },
    leaves: { pattern: 'opposite', size: [0.5, 0.95], splay: [35, 80] },
    flowers: { spot: 'axillary', chance: 0.5, size: [0.46, 0.6] },
    fruits: { spot: 'trunk-lower', chance: 0.55, size: [1.1, 1.35], hang: true, cluster: [1, 3] },
    winter: 'leafy',
    seasonAccents: { spring: ['flower'], summer: ['fruit', 'flower'], autumn: ['fruit'], winter: [] }
  },
  strawberry: {
    label: 'Strawberry',
    form: 'vine',
    sprites: {
      leaf: ['strawberry-leaf.png', 60, 1],
      flower: ['strawberry-flower.png', 24, 1],
      fruit: ['strawberry.png', 19, 1.2]
    },
    stemWidth: 2.5, winterStemWidth: 2,
    growth: {
      segments: [24, 40], branchSegments: [2, 3],
      segmentLength: [26, 38], baseAngle: [-4, 8], droop: [-0.02, 0.03],
      branchChance: 0, secondBranchChance: 0, branchSpread: [0.4, 0.8],
      maxDepth: 0, minBranchIndex: 2, maxNodes: 64,
      straighten: 0.22, apicalDominance: 1
    },
    vine: {
      edgeWidth: 26,
      daughterFirst: [3, 5], daughterEvery: [3, 5],
      petioles: [4, 6], spread: [-70, 80], spikeChance: 0.8
    },
    crown: {
      petioles: [4, 7], petioleSegments: [1, 2], petioleLength: [16, 28],
      spikes: [1, 2], spikeSegments: [2, 3], spikeLength: [22, 34],
      runners: [0, 2], runnerSegments: [3, 5], runnerLength: [20, 32],
      runnersIn: ['spring', 'summer', 'autumn'],
      daughterPetioles: [1, 3], daughterSpikeChance: 0.35, maxChildren: 11
    },
    leaves: { pattern: 'tip', size: [0.5, 0.7] },
    flowers: { spot: 'terminal', chance: 0.85, size: [0.48, 0.58] },
    fruits: { spot: 'terminal', chance: 0.8, size: [0.6, 0.78], hang: 'trail' },
    winter: 'bare',
    seasonAccents: { spring: ['flower'], summer: ['fruit', 'flower'], autumn: ['fruit'], winter: [] }
  },
  tomato: {
    label: 'Tomato',
    sprites: {
      leaf: ['tomato-leaf.png', 72, 40 / 44],
      flower: ['tomato-flower.png', 24, 1],
      fruit: ['tomato-fruit.png', 28, 1]
    },
    stemWidth: 3, winterStemWidth: 2.5,
    growth: {
      segments: [8, 13], branchSegments: [3, 5],
      segmentLength: [36, 52], baseAngle: [-8, 14], droop: [-0.02, 0.04],
      straighten: 0.14,
      branchChance: 0.18, secondBranchChance: 0.04, branchSpread: [0.4, 0.9],
      apicalDominance: 0.6,
      maxDepth: 2, minBranchIndex: 4, maxNodes: 100
    },
    leaves: { pattern: 'opposite', size: [0.95, 1.2], splay: [35, 65] },
    flowers: { spot: 'axillary', chance: 0.55, size: [0.46, 0.55], cluster: [2, 4] },
    fruits: { spot: 'axillary', chance: 0.55, size: [0.62, 0.74], hang: true, cluster: [2, 3] },
    winter: 'leafy',
    seasonAccents: { spring: ['flower'], summer: ['fruit', 'flower'], autumn: ['fruit'], winter: [] }
  },
  kale: {
    label: 'Kale',
    sprites: {
      leaf: ['kale.png', 94, 56 / 64]
    },
    stemWidth: 3, winterStemWidth: 2.5,
    growth: {
      segments: [9, 13], branchSegments: [2, 3],
      segmentLength: [26, 38], baseAngle: [-8, 12], droop: [-0.015, 0.035],
      straighten: 0.16,
      branchChance: 0.05, secondBranchChance: 0, branchSpread: [0.4, 0.8],
      apicalDominance: 0.9,
      maxDepth: 1, minBranchIndex: 4, maxNodes: 72
    },
    leaves: { pattern: 'alternate', size: [0.6, 1], splay: [35, 80] },
    winter: 'leafy',
    seasonAccents: { spring: [], summer: [], autumn: [], winter: [] }
  },
  squash: {
    label: 'Squash',
    sprites: {
      leaf: ['squash-leaf.png', 104, 64 / 74],
      flower: ['squash-flower.png', 38, 42 / 38],
      fruit: ['pumpkin.png', 52, 38 / 42],
      tendril: ['squash-tendril.png', 13, 1]
    },
    stemWidth: 4, winterStemWidth: 3,
    growth: {
      segments: [7, 12], branchSegments: [2, 3],
      segmentLength: [44, 64], baseAngle: [-28, 22], droop: [-0.045, 0.1],
      straighten: 0.06,
      branchChance: 0.12, secondBranchChance: 0.02, branchSpread: [0.5, 1],
      apicalDominance: 0.5,
      maxDepth: 1, minBranchIndex: 3, maxNodes: 84
    },
    leaves: { pattern: 'alternate', size: [0.62, 0.95], splay: [30, 70] },
    tendrils: { chance: 0.3, size: [0.9, 1.3] },
    flowers: { spot: 'axillary', chance: 0.6, size: [0.75, 0.9] },
    fruits: { spot: 'terminal', chance: 0.5, size: [1.2, 1.5], hang: 'trail' },
    winter: 'leafy',
    seasonAccents: { spring: ['flower'], summer: ['fruit', 'flower'], autumn: ['fruit'], winter: [] }
  },
  pine: {
    label: 'Pine',
    sprites: { leaf: ['pine-needles.png', 40, 1], fruit: ['pinecone.png', 16, 1] },
    growth: {
      segments: [22, 38], branchSegments: [3, 6],
      segmentLength: [30, 42], baseAngle: [-6, 6], droop: [-0.015, 0.025],
      straighten: 0.3,
      branchChance: 0.45, secondBranchChance: 0.08, branchSpread: [0.3, 0.6],
      apicalDominance: 0.85, minBranchIndex: 3, maxDepth: 1, maxNodes: 90
    },
    stemWidth: 4.5, winterStemWidth: 4.5,
    leaves: { pattern: 'opposite', size: [0.9, 1.3], splay: [45, 85] },
    fruits: { spot: 'axillary', chance: 0.14, size: [1.05, 1.3], hang: true },
    winter: 'leafy',
    seasonAccents: { spring: ['fruit'], summer: ['fruit'], autumn: ['fruit'], winter: ['fruit'] }
  }
};

export const speciesNames = Object.keys(speciesConfigs);

export function generatePlant(name, { season = 'summer', seed = 1, height = 560, width = 230, hanging = false, rootJitter = 0, wall = 0 } = {}) {
  const config = speciesConfigs[name];
  if (!config) throw new Error('Unknown species: ' + name);
  if (!(season in config.seasonAccents)) throw new Error('Unknown season: ' + season);
  const random = mulberry(seed);
  const bare = season === 'winter' && config.winter === 'bare';
  const g = config.growth;
  const scale = Math.max(0.35, Math.min(1, height / 700));
  const nodes = [];
  const attachments = [];
  const raw = new Map();
  let chainCounter = 0;

  const rand = range => range[0] + random() * (range[1] - range[0]);

  function attach(kind, node, deg, size, opts = {}) {
    const sprite = config.sprites[kind];
    if (!sprite) return;
    const [file, baseWidth, aspect] = sprite;
    const radians = deg * Math.PI / 180;
    const horizontal = aspect * Math.abs(Math.sin(radians)) + Math.abs(Math.cos(radians)) / 2;
    const ox = opts.offsetX || 0;
    const oy = opts.offsetY || 0;
    const intended = baseWidth * size;
    const maxW = (width + 40 - Math.abs(node.y + oy) - 6) / Math.max(0.5, horizontal);
    const spriteWidth = Math.floor(Math.min(intended, Math.max(maxW, intended * 0.5)));
    if (spriteWidth < 10) return;
    attachments.push({
      kind, node: node.id, file, aspect: +aspect.toFixed(4), width: spriteWidth, deg: +deg.toFixed(1),
      x: Math.round(node.x + ox), y: Math.round(node.y + oy),
      side: opts.side || 0, back: !!opts.back,
      pedicel: (ox || oy) ? { x: Math.round(node.x), y: Math.round(node.y) } : null
    });
  }

  function addLeaves(node, chainLength) {
    if (bare || config.form === 'vine') return; // runner stems stay bare; daughters carry the foliage

    const leafConfig = config.leaves;
    const climb = (node.chainIndex + 1) / (chainLength + 1);
    const shrink = 1.12 - 0.28 * climb;
    const branchDeg = node.angle * 180 / Math.PI;
    const splay = rand(leafConfig.splay);
    const sides = leafConfig.pattern === 'opposite' ? [-1, 1] : [node.chainIndex % 2 ? 1 : -1];
    if (config.tendrils && config.seasonAccents[season].length && random() < config.tendrils.chance) {
      const side = sides[0] || 1;
      attach('tendril', node, 90 + branchDeg + side * splay * 0.6, rand(config.tendrils.size), { side, back: side === -1 });
      return;
    }
    sides.forEach(side => {
      attach('leaf', node, 90 + branchDeg + side * splay, rand(leafConfig.size) * shrink * scale, { side, back: side === -1 });
    });
  }

  function addAccent(node) {
    if (bare) return;
    for (const kind of config.seasonAccents[season]) {
      const accentConfig = kind === 'flower' ? config.flowers : config.fruits;
      if (!accentConfig) continue;
      const spotOk = accentConfig.spot === 'both' || (accentConfig.spot === 'terminal' ? node.isTerminal
        : accentConfig.spot === 'trunk-lower' ? (node.depth === 0 && node.x < height * 0.55)
        : !node.isTerminal);
      if (!spotOk || random() >= accentConfig.chance) continue;
      const fruit = kind === 'fruit';
      const ox = Math.round(6 * scale);
      const oy = Math.round((fruit ? 10 : -10) * scale);
      const branchDeg = node.angle * 180 / Math.PI;
      const deg = fruit ? (accentConfig.hang === 'trail' ? 90 + branchDeg * 0.4 + (random() - 0.5) * 34 : 180 + (random() - 0.5) * 16)
        : accentConfig.spot === 'terminal' ? 90 + branchDeg + (random() - 0.5) * 40
        : (random() - 0.5) * 40;
      const count = accentConfig.cluster ? Math.max(1, Math.round(rand(accentConfig.cluster))) : 1;
      for (let i = 0; i < count; i++) {
        const spreadI = i - (count - 1) / 2;
        const degI = deg + spreadI * (fruit ? 16 : 14) + (random() - 0.5) * 8;
        const sizeI = rand(accentConfig.size) * (1 - Math.abs(spreadI) * 0.12);
        const cascade = fruit ? [0, 13, 5][i % 3] : 0;
        attach(kind, node, degI, sizeI * Math.min(1, scale * (0.9 + random() * 0.12)),
            { offsetX: ox - (fruit ? i * 9 : 0), offsetY: oy + (fruit ? cascade + (random() - 0.5) * 6 : spreadI * 4) });
      }
      return;
    }
  }

  const vertical = 0;
  let wallInner = width - 8;
  // segments the trunk still owes: branches may not eat the trunk's budget
  let trunkRemaining = 0;

  function chain(parentId, depth, x, y, angle, segmentCount, chainId, budget) {
    for (let i = 0; i < segmentCount && nodes.length < g.maxNodes; i++) {
      if (depth === 0) trunkRemaining = segmentCount - (i + 1);
      angle += rand(g.droop);
      angle += (g.straighten || 0) * (vertical - angle);
      const len = rand(g.segmentLength) * scale * (depth ? 0.72 : 1) * budget;
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
      // soft column walls: scrape the edge and growth eases back inward
      if (y < 6) { y = 6; angle += 0.08; }
      if (y > wallInner) { y = wallInner; angle -= 0.12; }
      const id = nodes.length;
      // Apical dominance: the growing tip's auxin dilutes with distance down
      // the stem and suppresses lateral buds, so young tips stay bare while
      // the mature base fills out.
      const distToTip = segmentCount - (i + 1);
      const auxin = Math.min(1, (g.apicalDominance || 0.5) / (1 + distToTip));
      const node = { id, parent: parentId, children: [], depth, chainId, chainIndex: i + 1, angle: +angle.toFixed(3), x: Math.round(x), y: Math.round(y), isTerminal: true, auxin: +auxin.toFixed(3) };
      nodes.push(node);
      if (parentId !== null) {
        nodes[parentId].children.push(id);
        nodes[parentId].isTerminal = false;
      }
      parentId = id;
      // Children per node cap at three: the straight continuation plus up
      // to two side branches (\ | /).
      let branches = 0;
      if (!bare && depth < g.maxDepth && i + 1 >= g.minBranchIndex && distToTip > 0 && nodes.length < g.maxNodes - trunkRemaining - 8) {
        if (random() < g.branchChance * (1 - auxin)) {
          branches = 1 + (auxin < 0.4 && random() < g.secondBranchChance ? 1 : 0);
        }
      }
      if (branches > 0) {
        // +y points toward the page on both sides (the right column is mirrored),
        // so buds favor opening inward.
        const firstSide = random() < 0.75 ? 1 : -1;
        for (let b = 0; b < branches; b++) {
          const side = b === 0 ? firstSide : -firstSide;
          const segs = Math.max(1, Math.round(rand(g.branchSegments)));
          const share = Math.max(0.35, Math.min(1, (height * 1.05 - node.x) / (segs * avgLen * 0.72 + 1)));
          chain(id, depth + 1, node.x, node.y, angle + side * rand(g.branchSpread), segs, ++chainCounter, share);
        }
      }
      addLeaves(node, segmentCount);
      // Settle tip status before accents: continuation is already known here.
      node.isTerminal = !(i + 1 < segmentCount && nodes.length < g.maxNodes) && branches === 0;
      addAccent(node);
    }
  }

  function rosetteChain(parentId, angle, segmentCount, segLenRange, baseTick, droop) {
    let currentParent = parentId;
    let x = nodes[currentParent].x;
    let y = nodes[currentParent].y;
    let tipId = currentParent;
    for (let i = 0; i < segmentCount && nodes.length < g.maxNodes; i++) {
      angle += droop();
      const len = rand(segLenRange) * scale;
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
      // soft column walls: scrape the edge and growth eases back inward
      if (y < 6) { y = 6; angle += 0.08; }
      if (y > wallInner) { y = wallInner; angle -= 0.12; }
      const id = nodes.length;
      const node = { id, parent: currentParent, children: [], depth: nodes[currentParent].depth + 1, chainId: ++chainCounter, chainIndex: i + 1, angle: +angle.toFixed(3), x: Math.round(x), y: Math.round(y), isTerminal: true };
      nodes.push(node);
      nodes[currentParent].children.push(id);
      nodes[currentParent].isTerminal = false;
      raw.set(id, baseTick + i);
      currentParent = id;
      tipId = id;
    }
    return tipId;
  }

  function petioleFan(parentId, count, spreadRange, sizeScale, baseTick, lenScale = 1) {
    const crownConfig = config.crown;
    for (let i = 0; i < count; i++) {
      const deg = spreadRange[0] + (i + 0.5) * (spreadRange[1] - spreadRange[0]) / count + (random() - 0.5) * 10;
      const segs = Math.max(1, Math.round(rand(crownConfig.petioleSegments)));
      const segLen = [crownConfig.petioleLength[0] * lenScale, crownConfig.petioleLength[1] * lenScale];
      const tip = rosetteChain(parentId, deg * Math.PI / 180, segs, segLen, baseTick + i * 0.6, () => (random() - 0.5) * 0.1);
      if (nodes[tip].chainIndex === 0) continue;
      if (!bare) attach('leaf', nodes[tip], 90 + deg + (random() - 0.5) * 14, rand(config.leaves.size) * sizeScale * scale, { side: 0 });
    }
  }

  function spike(parentId, baseTick, lean) {
    if (bare || !config.seasonAccents[season].length) return;
    const deg = lean + (random() - 0.5) * 12;
    const segs = Math.max(2, Math.round(rand(config.crown.spikeSegments)));
    const tip = rosetteChain(parentId, deg * Math.PI / 180, segs, config.crown.spikeLength, baseTick, () => (random() - 0.5) * 0.08);
    addAccent(nodes[tip]);
  }

  function runner(parentId, baseTick) {
    const deg = (random() < 0.25 ? -1 : 1) * rand([80, 100]);
    const segs = Math.max(3, Math.round(rand(config.crown.runnerSegments)));
    const tip = rosetteChain(parentId, deg * Math.PI / 180, segs, config.crown.runnerLength, baseTick, () => (random() - 0.5) * 0.06);
    if (nodes[tip].chainIndex === 0) return;
    const daughterBase = raw.get(tip) + 1.2;
    petioleFan(tip, Math.max(1, Math.round(rand(config.crown.daughterPetioles))), [-70, 70], 0.75, daughterBase, 0.75);
    if (random() < config.crown.daughterSpikeChance) spike(tip, daughterBase + 1.5, 0);
  }

  function buildVine() {
    const vineConfig = config.vine;
    const rootY = hanging ? 62 + rootJitter : 12;
    const trunkChain = ++chainCounter;
    nodes.push({ id: 0, parent: null, children: [], depth: 0, chainId: trunkChain, chainIndex: 0, angle: 0, x: -4, y: rootY, isTerminal: true, auxin: 0 });
    if (!hanging) wallInner = vineConfig.edgeWidth;
    const target = Math.round(height * 0.95 / avgLen * (0.95 + random() * 0.2));
    const cap = Math.max(g.segments[0], g.maxNodes - 24);
    const mainSegments = Math.round(Math.min(Math.max(target, g.segments[0]), cap));
    const budget = Math.min(1, height * 0.95 / (mainSegments * avgLen));
    const startAngle = hanging ? rand([55, 80]) : rand(g.baseAngle);
    chain(0, 0, -4, rootY, startAngle * Math.PI / 180, mainSegments, trunkChain, budget);
    if (!bare) {
      let next = Math.round(rand(vineConfig.daughterFirst));
      nodes.filter(n => n.chainId === trunkChain && n.chainIndex > 0).forEach(n => {
        if (n.chainIndex < next) return;
        next = n.chainIndex + Math.round(rand(vineConfig.daughterEvery));
        const base = 1 + n.chainIndex + 0.5;
        petioleFan(n.id, Math.max(2, Math.round(rand(vineConfig.petioles))), vineConfig.spread, 0.85, base, 0.8);
        if (random() < vineConfig.spikeChance) spike(n.id, base + 1.5, 10 + random() * 14);
      });
    }
    // inline growth ticks: the vine climbs first, daughters bud in behind it
    raw.set(0, 1);
    nodes.forEach(n => { if (n.chainId === trunkChain && n.id !== 0) raw.set(n.id, 1 + n.chainIndex); });
  }

  function buildRosette() {
    const crownConfig = config.crown;
    nodes.push({ id: 0, parent: null, children: [], depth: 0, chainId: ++chainCounter, chainIndex: 0, angle: 0, x: -6, y: Math.round(width * 0.3), isTerminal: true });
    raw.set(0, 0);
    petioleFan(0, Math.max(1, Math.round(rand(crownConfig.petioles))), [-70, 70], 1, 1);
    const spikeCount = Math.max(1, Math.round(rand(crownConfig.spikes)));
    for (let i = 0; i < spikeCount; i++) spike(0, 3 + i * 0.8, (i % 2 ? 1 : -1) * 14);
    if (crownConfig.runnersIn.includes(season)) {
      const runners = Math.round(rand(crownConfig.runners));
      for (let i = 0; i < runners; i++) runner(0, 5 + i * 2);
    }
  }

  const avgLen = (g.segmentLength[0] + g.segmentLength[1]) / 2 * scale;
  // long pages need more nodes than any static budget assumes
  g.maxNodes = Math.max(g.maxNodes, Math.ceil(height * 1.1 / avgLen) + (config.form === 'vine' ? 64 : 24));
  if (hanging) wallInner = wall > 0 ? wall : 120;
  const form = config.form || 'branching';
  if (form === 'rosette') {
    buildRosette();
  } else if (form === 'vine') {
    buildVine();
  } else {
    const target = Math.round(height * 0.95 / avgLen * (0.95 + random() * 0.2));
    const cap = Math.max(g.segments[0], g.maxNodes - 24);
    const mainSegments = Math.round(Math.min(Math.max(target, g.segments[0]), cap) * (bare && height <= 900 ? 0.6 : 1));
    const budget = Math.min(1, height * 0.95 / (mainSegments * avgLen));
    // an explicit root at the soil line so the trunk's first segment is drawn
    const rootY = Math.round(hanging ? 62 + rootJitter : width * 0.3);
    const trunkChain = ++chainCounter;
    nodes.push({ id: 0, parent: null, children: [], depth: 0, chainId: trunkChain, chainIndex: 0, angle: 0, x: -4, y: rootY, isTerminal: true, auxin: +((g.apicalDominance || 0.5) / (1 + mainSegments)).toFixed(3) });
    const startAngle = hanging ? rand([55, 80]) : rand(g.baseAngle);
    chain(0, 0, -4, rootY, startAngle * Math.PI / 180, mainSegments, trunkChain, budget);
  }

  // Growth timeline in ticks from the root, then normalized to 0..1: the main
  // chain extends first, branches stagger in after their parent node, leaves
  // sprout right behind their node, flowers and fruit arrive last. Rosette
  // forms assign their own ticks inline as the crown develops.
  if (form === 'branching') {
    nodes.filter(n => n.parent === null || nodes[n.parent].chainId !== n.chainId).forEach(starter => {
      let tick = starter.parent === null ? 1 : raw.get(starter.parent) + 1.5;
      let current = starter;
      while (current && current.chainId === starter.chainId) {
        raw.set(current.id, tick);
        tick += 1;
        current = current.children.map(id => nodes[id]).find(child => child.chainId === starter.chainId) || null;
      }
    });
  }
  const sproutTick = kind => kind === 'leaf' ? 0.5 : kind === 'flower' ? 2.2 : 3.2;
  const matureTick = kind => kind === 'leaf' ? 2.2 : kind === 'flower' ? 3.4 : 4.6;
  let maxTick = 1;
  nodes.forEach(n => { maxTick = Math.max(maxTick, raw.get(n.id)); });
  attachments.forEach(a => { maxTick = Math.max(maxTick, raw.get(a.node) + matureTick(a.kind)); });
  const norm = tick => +(tick / maxTick).toFixed(4);
  nodes.forEach(n => { n.birth = norm(raw.get(n.id)); });
  attachments.forEach(a => {
    a.birth = norm(raw.get(a.node) + sproutTick(a.kind));
    a.mature = norm(raw.get(a.node) + matureTick(a.kind));
  });

  let minX = -12, minY = -12, maxX = 12, maxY = 12;
  nodes.forEach(n => {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  });
  attachments.forEach(a => {
    minX = Math.min(minX, a.x - a.width / 2 - 4);
    maxX = Math.max(maxX, a.x + a.width / 2 + 4);
    minY = Math.min(minY, a.y - a.width * a.aspect - 4);
    maxY = Math.max(maxY, a.y + 6);
  });

  return {
    species: name, season, seed, height, width,
    stemWidth: season === 'winter' ? config.winterStemWidth : config.stemWidth,
    nodes, attachments,
    bounds: { minX: Math.round(minX), minY: Math.round(minY), maxX: Math.round(maxX), maxY: Math.round(maxY) }
  };
}
