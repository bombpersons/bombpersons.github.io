// Pass the exported Farmyard class to testFarmyard in a JS runtime or browser.
// For example, from the repository root with a current Node installation:
// node --input-type=module -e "import {Farmyard} from './static/farmyard-model.js'; import {testFarmyard} from './tools/test_farmyard.mjs'; console.log(testFarmyard(Farmyard).join('\n'))"
export function testFarmyard(Farmyard) {
  const passed = [];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function seeded(seed) {
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function bounds(width) {
    const pondStart = width * 0.96 - Math.max(132, Math.min(320, width * 0.22));
    return {
      door: width * 0.03 + 27.5,
      landStart: Math.max(8, Math.min(width * 0.03 + 92, pondStart - 120)),
      landEnd: pondStart - 44,
      waterStart: pondStart + 12, waterEnd: width * 0.96 - 48, waterY: 20
    };
  }
  const create = (width = 1280, night = false, frozen = false) => new Farmyard(bounds(width), { random: seeded(90210), night, frozen });
  function run(yard, seconds, check = () => {}) {
    for (let t = 0; t < seconds; t += 0.1) { yard.step(0.1); check(yard); }
  }

  {
    const yard = create();
    assert(yard.hens.every(h => h.x === yard.bounds.door && h.opacity === 0), 'Hens must start inside the coop');
    const before = JSON.stringify(yard.hens);
    yard.resize({ ...yard.bounds });
    assert(before === JSON.stringify(yard.hens), 'Initial ResizeObserver must not teleport hens');
    const decisions = yard.hens.map(() => new Set());
    let independent = false;
    run(yard, 100, () => {
      yard.hens.forEach((h, i) => decisions[i].add(h.state));
      if (new Set(yard.hens.map(h => h.state)).size > 1) independent = true;
    });
    assert(independent && decisions.every(s => s.has('walking') && s.has('pecking')), 'Each hen must wander and peck independently');
    passed.push('independent hens leave from the doorway, wander, and peck');
  }

  {
    const yard = create();
    run(yard, 50);
    const positions = yard.hens.map(h => h.x);
    yard.setNight(true);
    assert(yard.hens.every((h, i) => h.state === 'returning' && h.x === positions[i]), 'Dusk must start a walk home, not teleport');
    yard.step(0.1);
    assert(yard.hens.every((h, i) => h.x <= positions[i]), 'Hens must walk toward the coop');
    run(yard, 60);
    assert(yard.hens.every(h => h.state === 'sleeping' && h.opacity === 0 && h.x === yard.bounds.door), 'All hens must sleep inside the coop');
    yard.setNight(false);
    run(yard, 40);
    assert(yard.hens.every(h => h.opacity === 1 && h.state !== 'sleeping'), 'Hens must come back out in daylight');
    yard.setNight(true); yard.step(0.3); yard.setNight(false);
    run(yard, 40);
    assert(yard.hens.every(h => h.opacity === 1), 'Rapid slider changes must not strand a hen');
    passed.push('dusk returns, overnight sleep, dawn release, interrupted transitions');
  }

  for (const width of [320, 375, 768, 1280, 1920]) {
    const yard = create(width);
    const modes = new Set(), states = yard.ducks.map(() => new Set());
    let tripsToPond = 0, previous = '';
    run(yard, 900, () => {
      modes.add(yard.flock.mode);
      if (yard.flock.mode === 'swimming' && previous !== 'swimming') tripsToPond++;
      previous = yard.flock.mode;
      yard.ducks.forEach((duck, i) => {
        states[i].add(duck.state);
        assert(Number.isFinite(duck.x) && Number.isFinite(duck.y), 'Coordinates must be finite');
        if (duck.inWater && !duck.jump) {
          assert(duck.x >= yard.bounds.waterStart - 0.01 && duck.x <= yard.bounds.waterEnd + 0.01, 'A swimming duck left the pond');
          assert(duck.state !== 'fallen', 'Ducks must only trip on land');
        } else if (!duck.jump) {
          assert(duck.x >= yard.bounds.landStart - 0.01 && duck.x <= yard.bounds.landEnd + 0.01, 'A land duck left the grass');
        }
      });
      if (yard.flock.mode === 'swimming') assert(yard.ducks.every(d => d.inWater), 'The whole pack must enter the pond');
    });
    assert(modes.size === 5 && tripsToPond >= 2, 'The pack must visit and leave the pond repeatedly at ' + width);
    assert(states.every(s => ['walking', 'nibbling', 'fallen', 'jumping-in', 'swimming', 'diving', 'jumping-out'].every(state => s.has(state))), 'Every duck must take part in every behaviour at ' + width);
    passed.push('complete flock behaviour and pond bounds at ' + width + 'px');
  }

  {
    const yard = create();
    yard.flock.anchor = yard.flock.target = yard.bounds.landEnd;
    yard.ducks.forEach(d => { d.x = yard.bounds.landStart; d.tripAfter = 0; });
    yard.step(0.1);
    assert(yard.ducks.every(d => d.state === 'fallen'), 'Any duck must be able to trip while walking');
    run(yard, 2);
    assert(yard.ducks.every(d => d.state !== 'fallen'), 'Fallen ducks must recover');
    passed.push('individual land trips and recovery');
  }

  for (const mode of ['roaming', 'entering', 'swimming', 'leaving']) {
    const yard = create();
    let elapsed = 0;
    while (yard.flock.mode !== mode && elapsed < 180) { yard.step(0.1); elapsed += 0.1; }
    assert(yard.flock.mode === mode, 'Did not reach ' + mode);
    yard.resize(bounds(375));
    run(yard, 100, () => {
      yard.ducks.forEach(d => {
        assert(Number.isFinite(d.x) && Number.isFinite(d.y), 'Resize broke a coordinate');
        if (d.inWater && !d.jump) assert(d.x >= yard.bounds.waterStart - 0.01 && d.x <= yard.bounds.waterEnd + 0.01, 'Resize left a duck outside the pond');
      });
    });
    passed.push('resize during ' + mode);
  }

  {
    const yard = create();
    run(yard, 30);
    yard.setReducedMotion(true);
    const before = JSON.stringify([yard.hens, yard.ducks]);
    yard.step(200);
    assert(before === JSON.stringify([yard.hens, yard.ducks]), 'Reduced motion must freeze the birds');
    yard.setNight(true);
    assert(yard.hens.every(h => h.state === 'sleeping' && h.opacity === 0), 'Reduced motion still follows nighttime');
    yard.setNight(false);
    assert(yard.hens.every(h => h.state === 'idle' && h.opacity === 1), 'Reduced motion still follows daylight');
    yard.setReducedMotion(false);
    run(yard, 40);
    assert(yard.hens.some(h => h.state !== 'idle'), 'Motion must resume when requested');
    passed.push('reduced motion, lighting changes, and resuming movement');
  }
  {
    const yard = create(375, false, true);
    run(yard, 300, () => {
      assert(yard.flock.mode === 'roaming', 'A frozen pond must not attract the flock');
      assert(yard.ducks.every(d => !d.inWater && !d.jump && d.y === 0), 'Winter ducks must stay on land');
    });
    yard.setFrozen(false);
    let visited = false;
    run(yard, 200, () => { if (yard.flock.mode === 'swimming') visited = true; });
    assert(visited, 'Ducks must resume pond visits after thawing');
    passed.push('winter land behaviour and thawing');
  }

  for (const mode of ['approaching', 'entering', 'swimming', 'leaving']) {
    const yard = create();
    let elapsed = 0;
    while (yard.flock.mode !== mode && elapsed < 180) { yard.step(0.1); elapsed += 0.1; }
    assert(yard.flock.mode === mode, 'Did not reach ' + mode + ' before winter');
    const positions = yard.ducks.map(d => [d.x, d.y]);
    yard.setFrozen(true);
    assert(yard.ducks.every((d, i) => d.x === positions[i][0] && d.y === positions[i][1]), 'Season changes must not teleport ducks');
    run(yard, 20);
    assert(yard.flock.mode === 'roaming' && yard.ducks.every(d => !d.inWater && !d.jump && d.y === 0), 'Winter must bring the whole flock back to shore');
    run(yard, 90, () => {
      assert(yard.ducks.every(d => !d.inWater && !d.jump), 'Winter ducks re-entered the frozen pond');
    });
    passed.push('freezing the pond during ' + mode);
  }
  return passed;
}
