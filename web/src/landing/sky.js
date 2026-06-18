/**
 * Mejora estética de la landing: una estrella brillosa que desciende por una
 * trayectoria curva mientras se recorre la página, con una cola tipo cometa,
 * y un campo de partículas/destellos que le dan vida al fondo.
 *
 * Todo es puramente decorativo: pointer-events:none, no roba foco ni clicks,
 * y se desactiva por completo cuando el usuario pide menos movimiento
 * (prefers-reduced-motion) o en pantallas chicas donde estorbaría.
 */
(function () {
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // --- Contenedor fijo que cubre el viewport (el contenido scrollea detrás) ---
  var sky = document.createElement('div');
  sky.className = 'sky';
  sky.setAttribute('aria-hidden', 'true');

  // --- SVG con la curva guía + la cola del cometa ---
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'sky-svg');
  svg.setAttribute('preserveAspectRatio', 'none');

  var defs = document.createElementNS(SVG_NS, 'defs');
  // Degradé para que la cola se desvanezca hacia atrás.
  var grad = document.createElementNS(SVG_NS, 'linearGradient');
  grad.setAttribute('id', 'sky-trail-grad');
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  var stops = [
    ['0%', 'rgba(201,98,46,0)'],
    ['55%', 'rgba(201,98,46,0.18)'],
    ['100%', 'rgba(240,170,90,0.85)'],
  ];
  stops.forEach(function (s) {
    var stop = document.createElementNS(SVG_NS, 'stop');
    stop.setAttribute('offset', s[0]);
    stop.setAttribute('stop-color', s[1]);
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Curva tenue de fondo (la "ruta" que insinúa el recorrido completo).
  var guide = document.createElementNS(SVG_NS, 'path');
  guide.setAttribute('class', 'sky-guide');
  guide.setAttribute('fill', 'none');
  svg.appendChild(guide);

  // Cola brillosa que sigue a la estrella.
  var trail = document.createElementNS(SVG_NS, 'path');
  trail.setAttribute('class', 'sky-trail');
  trail.setAttribute('fill', 'none');
  trail.setAttribute('stroke', 'url(#sky-trail-grad)');
  svg.appendChild(trail);

  sky.appendChild(svg);

  // --- La estrella en sí (HTML para poder darle glow + destello con CSS) ---
  var star = document.createElement('div');
  star.className = 'sky-star';
  star.innerHTML =
    '<span class="sky-star-glow"></span>' +
    '<svg class="sky-star-shape" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 0 C12.7 7 17 11.3 24 12 C17 12.7 12.7 17 12 24 C11.3 17 7 12.7 0 12 C7 11.3 11.3 7 12 0 Z"/>' +
    '</svg>';
  sky.appendChild(star);

  document.body.appendChild(sky);

  // --- Trayectoria: curva en "S" suave que recorre el alto del viewport ---
  var pathEl = document.createElementNS(SVG_NS, 'path');
  var W = 0,
    H = 0,
    total = 0;

  function buildPath() {
    W = window.innerWidth;
    H = window.innerHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    grad.setAttribute('x1', 0);
    grad.setAttribute('y1', 0);
    grad.setAttribute('x2', 0);
    grad.setAttribute('y2', H);

    // Entra desde arriba a la izquierda y baja serpenteando hasta abajo.
    var d =
      'M ' + W * 0.16 + ' ' + -60 +
      ' C ' + W * 0.95 + ' ' + H * 0.22 +
      ', ' + W * 0.05 + ' ' + H * 0.42 +
      ', ' + W * 0.78 + ' ' + H * 0.6 +
      ' S ' + W * 0.2 + ' ' + (H + 60) +
      ', ' + W * 0.6 + ' ' + (H + 140);
    pathEl.setAttribute('d', d);
    guide.setAttribute('d', d);
    trail.setAttribute('d', d);
    total = pathEl.getTotalLength();
  }
  buildPath();

  var TRAIL_LEN = 150; // largo visible de la cola en px de trayectoria

  var ticking = false;
  function update() {
    ticking = false;
    var scrollable = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    var progress = Math.min(1, Math.max(0, window.scrollY / scrollable));

    var dist = progress * total;
    var p = pathEl.getPointAtLength(dist);

    // Orientación de la estrella según el rumbo de la curva (para que "mire"
    // hacia donde va y la cola salga por detrás).
    var ahead = pathEl.getPointAtLength(Math.min(total, dist + 1));
    var angle = (Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180) / Math.PI;

    star.style.transform =
      'translate(' + p.x + 'px,' + p.y + 'px) translate(-50%,-50%)';
    star.style.setProperty('--spin', angle + 'deg');

    // La cola: un segmento de la curva que termina en la estrella.
    var start = Math.max(0, dist - TRAIL_LEN);
    trail.setAttribute('stroke-dasharray', dist - start + ' ' + total);
    trail.setAttribute('stroke-dashoffset', -start);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    buildPath();
    update();
  });
  update();

  // --- Campo de partículas / destellos que flotan suavemente ---
  var COUNT = window.innerWidth < 720 ? 14 : 26;
  var dustLayer = document.createElement('div');
  dustLayer.className = 'sky-dust';
  dustLayer.setAttribute('aria-hidden', 'true');
  var frag = document.createDocumentFragment();
  for (var i = 0; i < COUNT; i++) {
    var d = document.createElement('span');
    d.className = 'sky-mote';
    var size = (Math.random() * 3 + 1.5).toFixed(1);
    d.style.left = (Math.random() * 100).toFixed(2) + 'vw';
    d.style.bottom = '-' + (Math.random() * 20).toFixed(0) + 'px';
    d.style.width = size + 'px';
    d.style.height = size + 'px';
    d.style.setProperty('--dur', (Math.random() * 16 + 16).toFixed(1) + 's');
    d.style.setProperty('--delay', (-Math.random() * 24).toFixed(1) + 's');
    d.style.setProperty('--drift', (Math.random() * 60 - 30).toFixed(0) + 'px');
    // Mezcla de tonos cálidos y verdes de la paleta.
    d.style.setProperty(
      '--tone',
      Math.random() > 0.55 ? 'rgba(201,98,46,0.55)' : 'rgba(110,133,121,0.5)'
    );
    frag.appendChild(d);
  }
  dustLayer.appendChild(frag);
  document.body.appendChild(dustLayer);
})();
