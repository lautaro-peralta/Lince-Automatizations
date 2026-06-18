/**
 * Mejora estética de la landing: un destello difuso (sin forma definida) que
 * viaja en línea recta descendiendo por la página a medida que se hace scroll,
 * dejando una leve estela luminosa.
 *
 * Es puramente decorativo: pointer-events:none, no roba foco ni clicks, y se
 * desactiva por completo cuando el usuario pide menos movimiento
 * (prefers-reduced-motion).
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

  // --- SVG con la estela del destello ---
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'sky-svg');
  svg.setAttribute('preserveAspectRatio', 'none');

  var defs = document.createElementNS(SVG_NS, 'defs');
  // Degradé para que la estela se desvanezca hacia atrás.
  var grad = document.createElementNS(SVG_NS, 'linearGradient');
  grad.setAttribute('id', 'sky-trail-grad');
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  var stops = [
    ['0%', 'rgba(201,98,46,0)'],
    ['60%', 'rgba(201,98,46,0.14)'],
    ['100%', 'rgba(240,170,90,0.7)'],
  ];
  stops.forEach(function (s) {
    var stop = document.createElementNS(SVG_NS, 'stop');
    stop.setAttribute('offset', s[0]);
    stop.setAttribute('stop-color', s[1]);
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Estela luminosa que sigue al destello.
  var trail = document.createElementNS(SVG_NS, 'path');
  trail.setAttribute('class', 'sky-trail');
  trail.setAttribute('fill', 'none');
  trail.setAttribute('stroke', 'url(#sky-trail-grad)');
  svg.appendChild(trail);

  sky.appendChild(svg);

  // --- El destello: solo un resplandor difuso, sin forma definida ---
  var glow = document.createElement('div');
  glow.className = 'sky-glow';
  sky.appendChild(glow);

  document.body.appendChild(sky);

  // --- Trayectoria: línea recta diagonal que baja por el viewport ---
  var pathEl = document.createElementNS(SVG_NS, 'path');
  var W = 0,
    H = 0,
    total = 0;

  // Extremos de la recta (fracciones del viewport).
  var X0 = 0.28,
    Y0 = -0.06,
    X1 = 0.66,
    Y1 = 1.06;

  function buildPath() {
    W = window.innerWidth;
    H = window.innerHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    grad.setAttribute('x1', W * X0);
    grad.setAttribute('y1', H * Y0);
    grad.setAttribute('x2', W * X1);
    grad.setAttribute('y2', H * Y1);

    var d =
      'M ' + W * X0 + ' ' + H * Y0 + ' L ' + W * X1 + ' ' + H * Y1;
    pathEl.setAttribute('d', d);
    trail.setAttribute('d', d);
    total = pathEl.getTotalLength();
  }
  buildPath();

  var TRAIL_LEN = 130; // largo visible de la estela en px de trayectoria

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

    glow.style.transform =
      'translate(' + p.x + 'px,' + p.y + 'px) translate(-50%,-50%)';

    // La estela: un segmento de la recta que termina en el destello.
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
})();
