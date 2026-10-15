import { Farmyard } from './farmyard-model.js';

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
  const yard = new Farmyard(measure(), { night: root.dataset.theme === 'night' });
  yard.setReducedMotion(motion.matches);

  function paint() {
    scene.dataset.flock = yard.flock.mode;
    yard.hens.forEach((hen, i) => {
      const element = hens[i];
      element.dataset.state = hen.state;
      element.style.transform = `translate3d(${hen.x.toFixed(2)}px,0,0)`;
      element.style.setProperty('--face', hen.face);
      element.style.opacity = hen.opacity.toFixed(2);
      element.disabled = hen.state === 'sleeping' || hen.state === 'returning';
    });
    yard.ducks.forEach((duck, i) => {
      const element = ducks[i];
      element.dataset.state = duck.state;
      element.style.transform = `translate3d(${duck.x.toFixed(2)}px,${duck.y.toFixed(2)}px,0)`;
      element.style.setProperty('--face', duck.face);
      element.style.setProperty('--dive-angle', duck.angle.toFixed(1) + 'deg');
      const splash = element.querySelector('.rd-splash');
      splash.style.opacity = (duck.splash / 0.65).toFixed(2);
      splash.style.transform = `translateY(${(yard.bounds.waterY - duck.y).toFixed(2)}px) scale(${(1.5 - duck.splash / 1.3).toFixed(2)})`;
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
    paint();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(() => { yard.resize(measure()); paint(); }).observe(scene);
  motion.addEventListener('change', () => {
    yard.setReducedMotion(motion.matches);
    paint();
    schedule();
  });
}
