const modelScript = document.querySelector('script[data-farmyard-model]');
const modelUrl = new URL('./farmyard-model.js', import.meta.url);
// Older cached pages may not yet carry the explicit model URL.
modelUrl.search = new URL(import.meta.url).search;
const { Farmyard } = await import(modelScript ? modelScript.dataset.farmyardModel : modelUrl.href);

const scene = document.querySelector('.scene');
if (scene) {
  const root = document.documentElement;
  const hens = [...scene.querySelectorAll('.hen-flock')];
  const ducks = [...scene.querySelectorAll('.runner')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function measure() {
    const rect = scene.getBoundingClientRect();
    const coop = scene.querySelector('.coop').getBoundingClientRect();
    const pond = scene.querySelector('.pond').getBoundingClientRect();
    const pondStart = pond.left - rect.left;
    return {
      door: coop.left - rect.left + 27.5,
      landStart: Math.max(8, Math.min(coop.right - rect.left + 8, pondStart - 120)),
      landEnd: pondStart - 44,
      waterStart: pondStart + 12,
      waterEnd: pond.right - rect.left - 48,
      waterY: 20
    };
  }
  const yard = new Farmyard(measure(), {
    night: root.dataset.theme === 'night', frozen: root.dataset.season === 'winter'
  });
  yard.setReducedMotion(motion.matches);

  // last-value cache keeps idle frames from touching the DOM at all
  const splashes = ducks.map(d => d.querySelector('.rd-splash'));
  const cache = hens.concat(ducks).map(() => ({}));
  function paint() {
    scene.dataset.flock = yard.flock.mode;
    yard.hens.forEach((hen, i) => {
      const element = hens[i], c = cache[i];
      if (c.state !== hen.state) {
        element.dataset.state = hen.state;
        element.disabled = hen.state === 'sleeping' || hen.state === 'returning';
        c.state = hen.state;
      }
      if (c.face !== hen.face) { element.style.setProperty('--face', hen.face); c.face = hen.face; }
      const opacity = hen.opacity.toFixed(2);
      if (c.opacity !== opacity) { element.style.opacity = opacity; c.opacity = opacity; }
      const tx = `translate3d(${hen.x.toFixed(2)}px,0,0)`;
      if (c.tx !== tx) { element.style.transform = tx; c.tx = tx; }
    });
    yard.ducks.forEach((duck, i) => {
      const element = ducks[i], c = cache[hens.length + i];
      if (c.state !== duck.state) { element.dataset.state = duck.state; c.state = duck.state; }
      if (c.face !== duck.face) { element.style.setProperty('--face', duck.face); c.face = duck.face; }
      const angle = duck.angle.toFixed(1) + 'deg';
      if (c.angle !== angle) { element.style.setProperty('--dive-angle', angle); c.angle = angle; }
      const tx = `translate3d(${duck.x.toFixed(2)}px,${duck.y.toFixed(2)}px,0)`;
      if (c.tx !== tx) { element.style.transform = tx; c.tx = tx; }
      const splashOpacity = (duck.splash / 0.65).toFixed(2);
      if (c.splash !== splashOpacity) { splashes[i].style.opacity = splashOpacity; c.splash = splashOpacity; }
      const st = `translateY(${(yard.bounds.waterY - duck.y).toFixed(2)}px) scale(${(1.5 - duck.splash / 1.3).toFixed(2)})`;
      if (c.st !== st) { splashes[i].style.transform = st; c.st = st; }
    });
  }

  scene.dataset.ready = 'true';
  paint();
  let frame = 0, last = 0, visible = false;
  function tick(now) {
    frame = 0;
    if (last) yard.step(Math.min((now - last) / 1000, 0.1));
    last = now;
    paint();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (visible && !document.hidden && !motion.matches) {
      if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { rootMargin: '100px' }).observe(scene);
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(() => {
    yard.setNight(root.dataset.theme === 'night');
    yard.setFrozen(root.dataset.season === 'winter');
    paint();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-season'] });
  new ResizeObserver(() => { yard.resize(measure()); paint(); }).observe(scene);
  motion.addEventListener('change', () => {
    yard.setReducedMotion(motion.matches);
    paint();
    schedule();
  });
}
