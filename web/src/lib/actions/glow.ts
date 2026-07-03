import type { Action } from 'svelte/action';

/**
 * "Spotlight": un brillo que sigue al cursor sobre la tarjeta. A diferencia
 * del viejo tilt, NO inclina ni transforma la tarjeta (eso re-rasterizaba en
 * cada frame su contenido —los demos animados— y era la causa del laggeo).
 * Aquí sólo se mueve un blob radial fijo del `::after` con translate (trabajo
 * de compositor, sin repaint por frame) vía --gx/--gy, y se enciende con la
 * clase `.glow-active`. Sólo con puntero fino y sin prefers-reduced-motion;
 * en táctil o con movimiento reducido es un no-op y queda el hover CSS.
 *
 * El rect se cachea al entrar y se refresca ante scroll, resize o cambios de
 * tamaño del contenido (los demos cambian de alto), así el brillo no se
 * despega del cursor cuando la página se mueve.
 *
 * Consume `.glow-card::after` en app.css. Uso: <article class="glow-card" use:glow>
 */
export const glow: Action<HTMLElement> = (node) => {
	const enabled =
		typeof matchMedia !== 'undefined' &&
		matchMedia('(pointer: fine)').matches &&
		!matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (!enabled) return;

	let rect: DOMRect | null = null;
	let raf = 0;
	let active = false;
	let lastX = 0;
	let lastY = 0;

	const measure = () => {
		rect = node.getBoundingClientRect();
	};

	const paint = () => {
		raf = 0;
		if (!rect) return;
		node.style.setProperty('--gx', `${(lastX - rect.left).toFixed(1)}px`);
		node.style.setProperty('--gy', `${(lastY - rect.top).toFixed(1)}px`);
	};

	const schedule = () => {
		if (!raf) raf = requestAnimationFrame(paint);
	};

	const onEnter = (e: PointerEvent) => {
		active = true;
		lastX = e.clientX;
		lastY = e.clientY;
		measure();
		node.classList.add('glow-active');
		schedule();
	};
	const onMove = (e: PointerEvent) => {
		lastX = e.clientX;
		lastY = e.clientY;
		schedule();
	};
	const onLeave = () => {
		active = false;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		rect = null;
		node.classList.remove('glow-active');
	};

	// Scroll/resize dejan obsoleto el rect cacheado (la tarjeta se mueve o
	// cambia de tamaño bajo un puntero quieto) y el brillo se despega del
	// cursor. Refrescamos y repintamos, pero sólo mientras hay hover activo.
	const onViewportChange = () => {
		if (!active) return;
		measure();
		schedule();
	};

	// El contenido del demo (Chatbot/LiveMonitor) puede cambiar de alto mientras
	// se pasa por encima; el ResizeObserver mantiene el rect al día en ese caso.
	const ro =
		typeof ResizeObserver !== 'undefined'
			? new ResizeObserver(() => {
					if (active) measure();
				})
			: null;
	ro?.observe(node);

	node.addEventListener('pointerenter', onEnter);
	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', onLeave);
	node.addEventListener('pointercancel', onLeave);
	window.addEventListener('scroll', onViewportChange, { passive: true });
	window.addEventListener('resize', onViewportChange, { passive: true });

	return {
		destroy() {
			onLeave();
			ro?.disconnect();
			node.removeEventListener('pointerenter', onEnter);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
			node.removeEventListener('pointercancel', onLeave);
			window.removeEventListener('scroll', onViewportChange);
			window.removeEventListener('resize', onViewportChange);
		}
	};
};
