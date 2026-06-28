import type { Action } from 'svelte/action';

interface RevealOptions {
	/** Retardo en ms antes de revelar (para escalonar). */
	delay?: number;
	/** Umbral de intersección. */
	threshold?: number;
}

/**
 * Acción de aparición al hacer scroll (reemplaza el viejo reveal.js).
 * Aplica la clase `is-visible` cuando el elemento entra en viewport.
 * Respeta prefers-reduced-motion mostrando el contenido de inmediato.
 *
 * Uso: <div class="reveal" use:reveal={{ delay: 120 }}>…</div>
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
	const prefersReduced =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReduced || typeof IntersectionObserver === 'undefined') {
		node.classList.add('is-visible');
		return;
	}

	if (options?.delay) node.style.transitionDelay = `${options.delay}ms`;

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					io.unobserve(node);
				}
			}
		},
		{ threshold: options?.threshold ?? 0.12, rootMargin: '0px 0px -40px 0px' }
	);

	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
};
