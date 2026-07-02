import type { Action } from 'svelte/action';

interface TiltOptions {
	/** Rotación máxima en grados. */
	max?: number;
	/** Elevación en px mientras el cursor está encima (reemplaza al hover CSS). */
	lift?: number;
}

/**
 * Inclinación 3D sutil + brillo que sigue al cursor (vía --mx/--my, que
 * consume `.glow-card::after` en app.css). Sólo actúa con puntero fino y sin
 * prefers-reduced-motion; en táctil o con movimiento reducido es un no-op y
 * queda el hover CSS de siempre.
 *
 * El rect de la tarjeta se cachea al entrar y se refresca ante scroll, resize
 * o cambios de tamaño del contenido (los demos animados cambian de alto): si
 * no, el mapeo puntero→porcentaje se desincroniza y el brillo se despega del
 * cursor. La escritura del transform se agrupa en un rAF y, mientras el tilt
 * está activo, la clase `.tilt-active` desactiva la `transition: transform` de
 * la tarjeta (ver app.css) para que siga al puntero al instante en vez de
 * perseguirlo con retardo.
 *
 * Uso: <article class="glow-card" use:tilt>…</article>
 */
export const tilt: Action<HTMLElement, TiltOptions | undefined> = (node, options) => {
	const enabled =
		typeof matchMedia !== 'undefined' &&
		matchMedia('(pointer: fine)').matches &&
		!matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (!enabled) return;

	const max = options?.max ?? 2.5;
	const lift = options?.lift ?? 3;

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
		const px = (lastX - rect.left) / rect.width;
		const py = (lastY - rect.top) / rect.height;
		const rx = -(py - 0.5) * max;
		const ry = (px - 0.5) * max;
		node.style.transform = `perspective(900px) translateY(${-lift}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
		node.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
		node.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
	};

	const schedule = () => {
		if (!raf) raf = requestAnimationFrame(paint);
	};

	const onEnter = (e: PointerEvent) => {
		active = true;
		lastX = e.clientX;
		lastY = e.clientY;
		measure();
		node.classList.add('tilt-active');
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
		node.style.transform = '';
		node.classList.remove('tilt-active');
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
