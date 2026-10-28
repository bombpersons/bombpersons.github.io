const banner = document.querySelector('.banner');

if (banner) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const pastels = ['pink', 'peach', 'butter', 'mint', 'sky', 'lilac'];

  function mulberry(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const random = mulberry(2026);

  function starPath(d) {
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    return path;
  }

  document.querySelectorAll('.banner-carrot svg').forEach(svg => {
    svg.style.setProperty('--carrot-base', `rotate(${((random() - 0.5) * 44).toFixed(1)}deg)`);
  });

  const text = banner.querySelector('.banner-text').textContent.trim();
  const echoes = banner.querySelector('.banner-echoes');
  const echoParts = document.createDocumentFragment();
  for (let i = 0; i < 8; i++) {
    const echo = document.createElement('i');
    echo.textContent = text;
    echo.style.color = `var(--pastel-${pastels[i % pastels.length]})`;
    echo.style.opacity = (0.55 + random() * 0.3).toFixed(2);
    const rot = (i % 2 ? -1 : 1) * (1.5 + random() * 4.5);
    const scale = (0.8 + random() * 0.45).toFixed(2);
    const dx = ((random() - 0.5) * 0.24).toFixed(3);
    const dy = ((random() - 0.5) * 0.24).toFixed(3);
    echo.style.setProperty('--echo-base', `translate(${dx}em, ${dy}em) rotate(${rot.toFixed(1)}deg) scale(${scale})`);
    echo.style.setProperty('--echo-sx', (1.06 + random() * 0.08).toFixed(3));
    echo.style.setProperty('--echo-sy', (0.86 + random() * 0.08).toFixed(3));
    echo.style.setProperty('--echo-dur', (9 + random() * 5).toFixed(2) + 's');
    echo.style.setProperty('--echo-delay', (-random() * 10).toFixed(2) + 's');
    echoParts.appendChild(echo);
  }
  echoes.appendChild(echoParts);

  const sparkles = banner.querySelector('.banner-sparkles');
  const star = 'M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z';
  const anchors = [15, 50, 85];
  const sparkleParts = document.createDocumentFragment();
  for (let i = 0; i < 13; i++) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    svg.appendChild(starPath(star));
    const anchor = anchors[Math.floor(random() * anchors.length)];
    const jitter = (random() + random()) / 2 - 0.5;
    svg.style.left = (anchor + jitter * 18).toFixed(1) + '%';
    svg.style.top = (8 + random() * 87).toFixed(1) + '%';
    const size = 8 + Math.round(random() * 8);
    svg.style.width = size + 'px';
    svg.style.height = size + 'px';
    svg.style.color = `var(--pastel-${pastels[Math.floor(random() * pastels.length)]})`;
    svg.style.setProperty('--tw', (2.2 + random() * 3).toFixed(2) + 's');
    svg.style.setProperty('--tw-delay', (-random() * 6).toFixed(2) + 's');
    sparkleParts.appendChild(svg);
  }
  sparkles.appendChild(sparkleParts);
}
