// Pass the exported plant-graph model pieces to testPlantGraph in Node or a browser.
// For example, from the repository root with a current Node installation:
// node --input-type=module -e "import {generatePlant, speciesNames, speciesConfigs} from './static/plant-graph-model.js'; import {testPlantGraph} from './tools/test_plant_graph.mjs'; console.log(testPlantGraph({generatePlant, speciesNames, speciesConfigs}).join('\n'))"
export function testPlantGraph({ generatePlant, speciesNames, speciesConfigs }) {
  const passed = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const WIDTH = 230;

  for (const species of speciesNames) {
    for (const season of seasons) {
      for (const height of [200, 560, 900]) {
        const a = generatePlant(species, { season, seed: 1234, height, width: WIDTH });
        const b = generatePlant(species, { season, seed: 1234, height, width: WIDTH });
        assert(JSON.stringify(a) === JSON.stringify(b), 'same seed must reproduce the same plant');
        assert(a.nodes.every(n => n.children.length <= ((speciesConfigs[species].crown || {}).maxChildren || speciesConfigs[species].growth.maxChildren || 3)), 'no node may exceed its species child cap');
        assert(a.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)), 'node coordinates must be finite');
        assert(a.nodes.every(n => n.x >= -75 && n.x <= height + 60), 'stems must stay near the height budget at ' + height);
        assert(a.nodes.every(n => Math.abs(n.y) <= WIDTH + 220), 'stems must stay near the column width');
        assert(a.attachments.every(t => t.width >= 10), 'sprites too small to read must be dropped, not kept tiny');
        assert(a.attachments.every(t => Math.abs(t.y) <= WIDTH + 40), 'sprites must stay near the column width');
        const allowed = new Set(speciesConfigs[species].seasonAccents[season]);
        a.attachments.forEach(t => {
          if (t.kind !== 'leaf' && t.kind !== 'tendril') assert(allowed.has(t.kind), species + ' in ' + season + ' must not show a ' + t.kind);
        });
        if (season === 'winter' && speciesConfigs[species].winter === 'bare') {
          assert(a.attachments.length === 0, 'bare winter plants must carry nothing');
        }
        a.attachments.forEach(t => {
          assert(Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.deg), 'attachment geometry must be finite');
        });
        // auxin: builds toward each tip, and buds only activate where it is weak
        // (branching form only — rosette crowns radiate and vines bud on a schedule)
        const form = speciesConfigs[species].form || 'branching';
        if (form === 'branching') {
          a.nodes.forEach(n => {
            const parent = n.parent === null ? null : a.nodes[n.parent];
            if (parent && parent.chainId === n.chainId) {
              assert(n.auxin >= parent.auxin, 'auxin must build toward the tip along a chain');
            }
            if (parent) {
              n.children.filter(c => a.nodes[c].chainId !== n.chainId).forEach(() => {
                assert(n.auxin < 0.85, 'branches may only leave auxin-suppressed nodes');
              });
            }
          });
          a.nodes.filter(n => n.children.filter(c => a.nodes[c].chainId !== n.chainId).length >= 2)
            .forEach(n => assert(n.auxin < 0.45, 'double forks need strongly suppressed auxin'));
        }
      }
    }
  }
  passed.push('determinism, branch cap, auxin gating, bounds across species x seasons x heights');

  {
    for (const species of ['apple', 'tomato', 'kale', 'squash', 'strawberry', 'pine']) {
      for (const height of [560, 900, 1600, 3559]) {
        for (let seed = 1; seed <= 6; seed++) {
          const plant = generatePlant(species, { season: 'summer', seed, height, width: WIDTH });
          const top = Math.max(...plant.nodes.map(n => n.x));
          assert(top >= 0.75 * height, species + ' at height ' + height + ' must reach most of its budget (got ' + (top / height).toFixed(2) + ')');
          assert(plant.nodes.every(n => Math.abs(n.y) <= WIDTH + 220), 'a tall ' + species + ' must stay inside its column');
        }
      }
    }
  }
  passed.push('tall column plants reach the top of their budget, even on very long pages');

  {
    // foliage must follow the trunk all the way up: no bare stretches, no
    // shrunken high-up leaves from the column clamp
    const plant = generatePlant('tomato', { season: 'summer', seed: 11, height: 3559, width: WIDTH });
    const trunkChain = plant.nodes[0].chainId;
    const leavesByNode = new Set(plant.attachments.filter(a => a.kind === 'leaf').map(a => a.node));
    const high = plant.nodes.filter(n => n.chainId === trunkChain && n.chainIndex > 0 && n.x >= 0.5 * 3559);
    assert(high.length >= 20, 'a 3559px tomato must have a long trunk (got ' + high.length + ' high nodes)');
    high.forEach(n => assert(leavesByNode.has(n.id), 'trunk foliage must continue above half height (node ' + n.id + ' at ' + Math.round(n.x) + ' is bare)'));
    const sizes = high.map(n => plant.attachments.find(a => a.node === n.id && a.kind === 'leaf').width);
    const lowSize = Math.min(...plant.attachments.filter(a => a.kind === 'leaf' && plant.nodes[a.node].x < 0.3 * 3559).map(a => a.width));
    sizes.forEach(w => assert(w >= lowSize * 0.55, 'high leaves must not miniaturize (got ' + w + ' vs low ' + lowSize + ')'));
  }
  passed.push('tomato foliage follows the trunk to the top of a 3559px page');

  {
    // plants favor the page side of their column: across a corpus, branch
    // openings and outer-edge scrapes stay rare
    let inward = 0, outward = 0, floor = 0;
    for (const species of speciesNames.filter(s => (speciesConfigs[s].form || 'branching') === 'branching')) {
      for (let seed = 1; seed <= 24; seed++) {
        const a = generatePlant(species, { season: 'summer', seed, height: 800, width: WIDTH });
        floor += a.nodes.filter(n => n.y < 6).length;
        a.nodes.forEach(n => {
          const parent = n.parent === null ? null : a.nodes[n.parent];
          if (parent && n.chainId !== parent.chainId && n.depth === 1) {
            (n.y >= parent.y ? inward++ : outward++);
          }
        });
      }
    }
    assert(inward > outward * 2, 'first branches must favor the page-inward side');
    assert(floor <= 2, 'nodes must not pile up on the outer column floor');
  }
  passed.push('growth leans into the page, not off the edge');

  {
    const plant = generatePlant('apple', { season: 'summer', seed: 7, height: 560 });
    plant.attachments.filter(t => t.kind === 'leaf').forEach(t => {
      const node = plant.nodes[t.node];
      assert(t.side === (node.chainIndex % 2 ? 1 : -1), 'alternate leaves must switch sides along the chain');
    });
    const leavesPerNode = new Map();
    plant.attachments.filter(t => t.kind === 'leaf').forEach(t => {
      leavesPerNode.set(t.node, (leavesPerNode.get(t.node) || 0) + 1);
    });
    assert([...leavesPerNode.values()].every(count => count === 1), 'alternate plants carry one leaf per node');
  }
  {
    const plant = generatePlant('kale', { season: 'summer', seed: 7, height: 560 });
    assert(plant.attachments.some(t => t.kind === 'leaf'), 'kale must grow leaves in summer');
    plant.attachments.filter(t => t.kind === 'leaf').forEach(t => {
      const node = plant.nodes[t.node];
      assert(t.side === (node.chainIndex % 2 ? 1 : -1), 'kale leaves must alternate along the chain');
    });
  }
  {
    const plant = generatePlant('bean', { season: 'summer', seed: 7, height: 560 });
    const sidesByNode = new Map();
    plant.attachments.filter(t => t.kind === 'leaf').forEach(t => {
      if (!sidesByNode.has(t.node)) sidesByNode.set(t.node, new Set());
      sidesByNode.get(t.node).add(t.side);
    });
    assert(sidesByNode.size > 0, 'bean must grow leaves in summer');
    sidesByNode.forEach((sides, node) => {
      assert(sides.size === 2, 'opposite plants must leaf both sides of node ' + node);
    });
  }
  passed.push('alternate and opposite leaf patterns');

  for (const species of speciesNames) {
    for (const season of seasons) {
      const plant = generatePlant(species, { season, seed: 99, height: 560 });
      const isTip = id => plant.nodes[id].isTerminal;
      [['flowers', 'flower'], ['fruits', 'fruit']].forEach(([pair, kind]) => {
        const cfg = speciesConfigs[species][pair];
        if (!cfg) return;
        plant.attachments.filter(t => t.kind === kind).forEach(t => {
          if (cfg.spot === 'terminal') assert(isTip(t.node), species + ' ' + kind + ' must sit on chain tips');
          if (cfg.spot === 'axillary') assert(!isTip(t.node), species + ' ' + kind + ' must sit beside leaves, not on tips');
        });
      });
    }
  }
  passed.push('terminal/axillary accent placement');

  {
    const spring = generatePlant('apple', { season: 'spring', seed: 5, height: 560 });
    assert(!spring.attachments.some(t => t.kind === 'fruit'), 'apple spring must have no fruit');
    const autumn = generatePlant('apple', { season: 'autumn', seed: 5, height: 560 });
    assert(!autumn.attachments.some(t => t.kind === 'flower'), 'apple autumn must have no blossoms');
    const winter = generatePlant('apple', { season: 'winter', seed: 5, height: 560 });
    assert(winter.attachments.length === 0, 'apple winter must be bare');
    assert(winter.nodes.length > 0, 'apple winter must still grow stems');
  }
  passed.push('seasonal gating for apple');

  {
    let branched = false, leafy = false;
    for (let seed = 0; seed < 40 && !(branched && leafy); seed++) {
      const plant = generatePlant('apple', { season: 'summer', seed, height: 560 });
      if (plant.nodes.some(n => n.children.filter(c => plant.nodes[c].chainId !== n.chainId).length >= 2)) branched = true;
      if (plant.attachments.filter(t => t.kind === 'leaf').length >= 4) leafy = true;
    }
    assert(branched, 'full three-way forks must be reachable');
    assert(leafy, 'plants must grow several leaves');
  }
  passed.push('branching and leafiness reachable');

  {
    const summer = generatePlant('strawberry', { season: 'summer', seed: 9, height: 1600 });
    const root = summer.nodes[0];
    assert(root.parent === null && root.y <= 14, 'the vine must root on the outer page edge');
    assert(Math.max(...summer.nodes.map(n => n.y)) <= 60, 'the vine must hug the edge of the page');
    const trunkChain = root.chainId;
    const daughters = summer.nodes.filter(n => n.chainId !== trunkChain && n.parent !== null && summer.nodes[n.parent].chainId === trunkChain);
    assert(daughters.length >= 3, 'strawberries must re-grow along the side of the page (got ' + daughters.length + ' daughters)');
    const descend = id => {
      const out = [id];
      summer.nodes[id].children.forEach(c => out.push(...descend(c)));
      return out;
    };
    const clumps = new Map();
    daughters.forEach(d => clumps.set(d.parent, [...(clumps.get(d.parent) || []), d]));
    assert(clumps.size >= 3, 'strawberries must re-grow along the side of the page (got ' + clumps.size + ' clumps)');
    [...clumps.values()].forEach(petioles => {
      const reaches = petioles.some(d => descend(d.id).some(i => summer.nodes[i].y > root.y + 8));
      assert(reaches, 'each clump must grip the edge yet reach foliage into the page');
    });
    const berries = summer.attachments.filter(a => a.kind === 'fruit').length;
    assert(berries >= 2, 'summer strawberries must hang fruit along the vine');
    assert(Math.max(...summer.nodes.map(n => n.x)) >= 0.75 * 1600, 'the vine must climb most of the page');
    assert(summer.nodes.every(n => n.parent === null || n.birth > summer.nodes[n.parent].birth), 'vine growth timeline must be monotonic');
    const winter = generatePlant('strawberry', { season: 'winter', seed: 4, height: 1600 });
    assert(winter.attachments.length === 0, 'no strawberries in winter: the vine climbs bare');
    assert(Math.max(...winter.nodes.map(n => n.x)) >= 0.75 * 1600, 'the bare winter vine still climbs the page');
  }
  passed.push('strawberry vine: climbs the edge, daughters along the page, nothing in winter');

  {
    // accent habits must stay put: these broke silently once already
    const t = speciesConfigs.tomato;
    assert(t.fruits.spot === 'axillary' && t.fruits.cluster, 'tomato fruits must truss on the vine');
    assert(t.flowers.cluster, 'tomato flowers must cluster');
    assert(speciesConfigs.bean.fruits.spot === 'trunk-lower' && speciesConfigs.bean.fruits.cluster, 'bean pods must grow from the lower trunk');
    assert(speciesConfigs.apple.flowers.cluster, 'apple blossoms must cluster');
    assert(speciesConfigs.strawberry.fruits.hang === 'trail' && speciesConfigs.squash.fruits.hang === 'trail', 'basket fruits must trail');
    const trusses = generatePlant('tomato', { season: 'summer', seed: 5, height: 1200, width: WIDTH });
    const perNode = new Map();
    trusses.attachments.filter(a => a.kind === 'fruit').forEach(a => perNode.set(a.node, (perNode.get(a.node) || 0) + 1));
    assert([...perNode.values()].filter(c => c >= 2).length >= 3, 'tomato trusses must actually cluster fruit');
    const pods = generatePlant('bean', { season: 'summer', seed: 5, height: 1200, width: WIDTH });
    const podNodes = pods.attachments.filter(a => a.kind === 'fruit').map(a => pods.nodes[a.node]);
    assert(podNodes.length >= 2 && podNodes.every(n => n.depth === 0 && n.x < 0.55 * 1200), 'bean pods must hang off the lower trunk');
  }
  passed.push('accent habits: trusses, trunk pods, blossom clusters, trailing basket fruit');

  {
    // hanging planters: rooted in the basket soil, arcing over the rim, then down
    for (const rootJitter of [0, 8]) {
      const p = generatePlant('strawberry', { season: 'summer', seed: 21, height: 900, width: WIDTH, hanging: true, rootJitter });
      assert(p.nodes[0].y === 62 + rootJitter, 'hanging strawberry must root in the basket soil');
      const first = p.nodes[1];
      const inward = Math.atan2(first.y - p.nodes[0].y, first.x - p.nodes[0].x);
      assert(inward > 0.5, 'hanging plants must arc outward over the rim before descending (got ' + inward.toFixed(2) + ')');
      assert(Math.max(...p.nodes.map(n => Math.abs(n.y))) <= 92 + 40, 'hanging clumps must drape around the basket, not the page edge');
      const top = Math.max(...p.nodes.map(n => n.x));
      assert(top >= 0.6 * 900, 'a hanging plant must still trail most of its budget');
      const berries = p.attachments.filter(a => a.kind === 'fruit').length;
      assert(berries >= 2, 'hanging strawberries must fruit');
    }
    const sq = generatePlant('squash', { season: 'summer', seed: 21, height: 900, width: WIDTH, hanging: true });
    assert(sq.nodes[0].y === 62, 'hanging squash roots under the basket mouth');
    const inward = Math.atan2(sq.nodes[1].y - sq.nodes[0].y, sq.nodes[1].x - sq.nodes[0].x);
    assert(inward > 0.5, 'hanging squash must arc over the rim');
  }
  passed.push('hanging planters: soil roots, rim arc, inward drape');
  return passed;
}
