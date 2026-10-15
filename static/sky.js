(function () {
  'use strict';

  var root = document.documentElement;
  var storageKey = 'sky-time';
  var stored = null;
  try { stored = localStorage.getItem(storageKey); } catch (e) { /* Use live time without storage. */ }
  var override = stored !== null && /^\d+$/.test(stored) && Number(stored) < 1440 ? Number(stored) : null;
  var slider, output, nowButton;

  // Local clock times, with matching endpoints for a seamless midnight.
  // Each stop is [hour, zenith, middle, horizon, cloud, cloud shade, stars, cloud opacity].
  var stops = [
    [0,  '#10172f', '#202e50', '#394563', '#64718e', '#475572', 1, 0.22],
    [4,  '#151c38', '#303c60', '#695b79', '#8c819c', '#655e7d', 0.9, 0.26],
    [6,  '#a4b3d5', '#e7b6bb', '#ffe0b0', '#fff0de', '#dfb6bd', 0, 0.65],
    [8,  '#86bde3', '#c1dfed', '#f7edce', '#fff7e7', '#c7dae6', 0, 0.78],
    [12, '#77b8e3', '#b6ddee', '#e3efdf', '#fffbed', '#bfd9e7', 0, 0.82],
    [16, '#8bbce2', '#c8dce9', '#f7e4c8', '#fff1de', '#c9cadd', 0, 0.74],
    [18, '#a5acd0', '#e5b3bd', '#ffd1a3', '#ffe1cf', '#c298af', 0, 0.65],
    [20, '#282c50', '#615074', '#bd7f8a', '#ba99b1', '#786581', 0.65, 0.38],
    [22, '#10172f', '#202e50', '#394563', '#64718e', '#475572', 1, 0.22],
    [24, '#10172f', '#202e50', '#394563', '#64718e', '#475572', 1, 0.22]
  ];

  function mixColor(a, b, amount) {
    var channels = [1, 3, 5].map(function (offset) {
      var start = parseInt(a.slice(offset, offset + 2), 16);
      return Math.round(start + (parseInt(b.slice(offset, offset + 2), 16) - start) * amount);
    });
    return 'rgb(' + channels.join(',') + ')';
  }

  function localMinutes() {
    var date = new Date();
    return date.getHours() * 60 + date.getMinutes();
  }

  function paintStars(canvas) {
    var width = canvas.width = window.innerWidth;
    var height = canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Seeded positions keep the same sky on every page and after resizing.
    var seed = 14641;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    function normal() {
      return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    }
    function bandX(y) {
      return 0.79 - y * 0.62 + Math.sin(y * 7) * 0.025;
    }
    function haze(x, y, rx, ry, color, opacity) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan(width * 0.62 / height));
      ctx.scale(rx, ry);
      var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      gradient.addColorStop(0, 'rgba(' + color + ',' + opacity + ')');
      gradient.addColorStop(0.45, 'rgba(' + color + ',' + opacity * 0.45 + ')');
      gradient.addColorStop(1, 'rgba(' + color + ',0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }

    // Overlapping, uneven wisps suggest the galactic band without a hard stripe.
    for (var cloud = 0; cloud < 16; cloud++) {
      var y = cloud / 15;
      haze(bandX(y) * width, y * height,
        Math.max(42, width * (0.05 + random() * 0.035)), height * 0.14,
        cloud % 3 === 0 ? '191,168,205' : '163,185,220', 0.045 + random() * 0.025);
    }

    // A faint, broken dust lane through the luminous band.
    for (var dust = 0; dust < 10; dust++) {
      var dy = dust / 9;
      haze((bandX(dy) + 0.015) * width, dy * height,
        Math.max(9, width * 0.018), height * 0.095, '10,17,36', 0.16);
    }

    var fieldCount = Math.min(650, Math.round(width * height / 2500));
    for (var i = 0; i < fieldCount; i++) {
      var x = Math.floor(random() * width);
      var sy = Math.floor(random() * height);
      var bright = random();
      var size = bright > 0.988 ? 2 : 1;
      ctx.fillStyle = 'rgba(233,237,248,' + (0.12 + bright * bright * 0.4) + ')';
      ctx.fillRect(x, sy, size, size);
    }

    // Most of the stars are tiny, dim points concentrated around the band.
    var bandCount = Math.min(1800, Math.round(width * height / 850));
    for (var j = 0; j < bandCount; j++) {
      var by = random();
      var bx = bandX(by) + normal() * (0.025 + 0.035 * Math.sin(by * Math.PI));
      var opacity = 0.06 + random() * 0.24;
      ctx.fillStyle = j % 7 === 0 ? 'rgba(245,229,208,' + opacity + ')' : 'rgba(212,224,247,' + opacity + ')';
      ctx.fillRect(Math.floor(bx * width), Math.floor(by * height), 1, 1);
    }
  }

  function render() {
    var minutes = override === null ? localMinutes() : override;
    var hour = minutes / 60;
    var end = 1;
    while (end < stops.length - 1 && hour >= stops[end][0]) end++;
    var a = stops[end - 1], b = stops[end];
    var blend = (hour - a[0]) / (b[0] - a[0]);
    ['--sky-top', '--sky-middle', '--sky-horizon', '--cloud-color', '--cloud-shade'].forEach(function (name, i) {
      root.style.setProperty(name, mixColor(a[i + 1], b[i + 1], blend));
    });
    root.style.setProperty('--star-opacity', (a[6] + (b[6] - a[6]) * blend).toFixed(3));
    root.style.setProperty('--cloud-opacity', (a[7] + (b[7] - a[7]) * blend).toFixed(3));
    root.dataset.theme = hour >= 6 && hour < 19 ? 'day' : 'night';
    root.dataset.sky = hour >= 4 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 22 ? 'dusk' : 'night';
    root.dataset.skyMode = override === null ? 'live' : 'preview';
    if (slider) {
      var time = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
      slider.value = String(minutes);
      slider.setAttribute('aria-valuetext', time + (override === null ? ', local time' : ', preview'));
      output.textContent = time;
      nowButton.disabled = override === null;
    }
  }

  render();

  document.addEventListener('DOMContentLoaded', function () {
    slider = document.getElementById('sky-time');
    output = document.getElementById('sky-time-value');
    nowButton = document.getElementById('sky-now');
    document.querySelector('.sky-control').hidden = false;
    slider.addEventListener('input', function () {
      override = Number(slider.value);
      try { localStorage.setItem(storageKey, String(override)); } catch (e) { /* Preview still works. */ }
      render();
    });
    nowButton.addEventListener('click', function () {
      override = null;
      try { localStorage.removeItem(storageKey); } catch (e) { /* Live time still works. */ }
      render();
    });

    var canvas = document.createElement('canvas');
    document.querySelector('.sky-stars').appendChild(canvas);
    paintStars(canvas);
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { paintStars(canvas); }, 150);
    });
    render();
  });

  setInterval(render, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) render();
  });
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', function (event) {
    if (event.key !== storageKey && event.key !== null) return;
    var value = event.newValue;
    override = value !== null && /^\d+$/.test(value) && Number(value) < 1440 ? Number(value) : null;
    render();
  });
})();
