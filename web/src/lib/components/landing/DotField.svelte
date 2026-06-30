<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'light' | 'dark';

	interface Props {
		/** Superficie sobre la que se monta: define color y peso de los puntos. */
		theme?: Theme;
		/** Separación entre puntos (px). */
		gap?: number;
		/** Radio de influencia del cursor (px). */
		radius?: number;
		/** Radio base del punto (lejos del cursor). */
		base?: number;
		/** Radio máximo del punto (bajo el cursor). */
		max?: number;
		/** Clases extra para el contenedor. */
		class?: string;
	}

	let {
		theme = 'light',
		gap = 22,
		radius = 180,
		base = 1.1,
		max = 3.2,
		class: klass = ''
	}: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);

	// Paleta por tema: color lejano (base) → cercano (rust), con sus opacidades.
	// Lejos los puntos son tenues; cerca del cursor crecen y viran al rust de marca.
	const PALETTE: Record<
		Theme,
		{ from: [number, number, number]; to: [number, number, number]; fromA: number; toA: number }
	> = {
		// moss #3d5a45 → rust #c9622e sobre fondo claro (#f7f5f0)
		light: { from: [61, 90, 69], to: [201, 98, 46], fromA: 0.14, toA: 0.85 },
		// arena #f7f5f0 → rust #c9622e sobre fondo oscuro (bg-night #14211a)
		dark: { from: [247, 245, 240], to: [201, 98, 46], fromA: 0.12, toA: 0.9 }
	};

	onMount(() => {
		const cv = canvas;
		if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;

		const pal = PALETTE[theme];
		const prefersReduced =
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

		let dpr = 1;
		let cols = 0;
		let rows = 0;
		let ox = 0;
		let oy = 0;
		let visible = true;
		let raf = 0;
		let running = false;

		// Objetivo del cursor y posición suavizada (el "rastro": sigue con leve retardo).
		const target = { x: -9999, y: -9999 };
		const smooth = { x: -9999, y: -9999 };

		const resize = () => {
			dpr = window.devicePixelRatio || 1;
			const w = cv.clientWidth;
			const h = cv.clientHeight;
			if (w === 0 || h === 0) return;
			cv.width = Math.round(w * dpr);
			cv.height = Math.round(h * dpr);
			cols = Math.max(1, Math.floor(w / gap));
			rows = Math.max(1, Math.floor(h / gap));
			ox = (w - (cols - 1) * gap) / 2;
			oy = (h - (rows - 1) * gap) / 2;
		};

		const paint = (mx: number, my: number) => {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
			const [fr, fg, fb] = pal.from;
			const [tr, tg, tb] = pal.to;
			for (let i = 0; i < cols; i++) {
				for (let j = 0; j < rows; j++) {
					const px = ox + i * gap;
					const py = oy + j * gap;
					// t = 1 pegado al cursor, 0 fuera del radio de influencia.
					const t = Math.max(0, 1 - Math.hypot(px - mx, py - my) / radius);
					const r = base + (max - base) * t;
					const cr = Math.round(fr + (tr - fr) * t);
					const cg = Math.round(fg + (tg - fg) * t);
					const cb = Math.round(fb + (tb - fb) * t);
					const a = pal.fromA + (pal.toA - pal.fromA) * t;
					ctx.beginPath();
					ctx.arc(px, py, r, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a})`;
					ctx.fill();
				}
			}
		};

		const draw = () => {
			smooth.x += (target.x - smooth.x) * 0.15;
			smooth.y += (target.y - smooth.y) * 0.15;
			paint(smooth.x, smooth.y);
			const settled =
				Math.abs(target.x - smooth.x) < 0.5 && Math.abs(target.y - smooth.y) < 0.5;
			// Al estabilizarse (o si la sección dejó de verse) snap al destino y frenamos
			// el bucle: sólo se reanuda con el próximo movimiento del cursor o un resize.
			if (settled || !visible) {
				smooth.x = target.x;
				smooth.y = target.y;
				paint(smooth.x, smooth.y);
				running = false;
			} else {
				raf = requestAnimationFrame(draw);
			}
		};

		const kick = () => {
			if (running || prefersReduced || !visible) return;
			running = true;
			raf = requestAnimationFrame(draw);
		};

		const onMove = (e: PointerEvent) => {
			const rect = cv.getBoundingClientRect();
			target.x = e.clientX - rect.left;
			target.y = e.clientY - rect.top;
			kick();
		};
		// El cursor salió de la página/ventana: los puntos vuelven a su estado base.
		const onLeave = () => {
			target.x = -9999;
			target.y = -9999;
			kick();
		};

		const onResize = () => {
			resize();
			paint(smooth.x, smooth.y);
		};

		// Sólo corre el efecto cuando la sección está en viewport (ahorra CPU/batería).
		const io =
			typeof IntersectionObserver !== 'undefined'
				? new IntersectionObserver(
						(entries) => {
							for (const en of entries) visible = en.isIntersecting;
							if (!visible) {
								cancelAnimationFrame(raf);
								running = false;
							} else {
								kick();
							}
						},
						{ threshold: 0 }
					)
				: null;

		resize();
		paint(smooth.x, smooth.y); // frame base inicial (también el render estático)

		if (prefersReduced) {
			// Estático: sin seguimiento del cursor ni bucle; sólo recentra en resize.
			window.addEventListener('resize', onResize);
			return () => window.removeEventListener('resize', onResize);
		}

		window.addEventListener('resize', onResize);
		window.addEventListener('pointermove', onMove);
		document.addEventListener('mouseleave', onLeave);
		window.addEventListener('blur', onLeave);
		io?.observe(cv);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('pointermove', onMove);
			document.removeEventListener('mouseleave', onLeave);
			window.removeEventListener('blur', onLeave);
			io?.disconnect();
		};
	});
</script>

<div class={`dotfield ${klass}`} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.dotfield {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}
	.dotfield canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
