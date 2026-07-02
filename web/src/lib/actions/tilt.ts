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
	let last: PointerEvent | null = null;

	const paint = () => {
		raf = 0;
		if (!rect || !last) return;
		const px = (last.clientX - rect.left) / rect.width;
		const py = (last.clientY - rect.top) / rect.height;
		const rx = -(py - 0.5) * max;
		const ry = (px - 0.5) * max;
		node.style.transform = `perspective(900px) translateY(${-lift}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
		node.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
		node.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
	};

	const onEnter = () => {
		rect = node.getBoundingClientRect();
		node.classList.add('tilt-active');
	};
	const onMove = (e: PointerEvent) => {
		last = e;
		if (!raf) raf = requestAnimationFrame(paint);
	};
	const onLeave = () => {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		rect = null;
		last = null;
		node.style.transform = '';
		node.classList.remove('tilt-active');
	};

	node.addEventListener('pointerenter', onEnter);
	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', onLeave);
	node.addEventListener('pointercancel', onLeave);

	return {
		destroy() {
			onLeave();
			node.removeEventListener('pointerenter', onEnter);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
			node.removeEventListener('pointercancel', onLeave);
		}
	};
};
