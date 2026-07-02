<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';
	import {
		FRAME_NAMES,
		FRAMES,
		RUN_CYCLE,
		GROUND_PATH,
		OBSTACLES,
		GROUND_Y,
		ROCK_TOP,
		ROCK_U,
		type LynxFrame
	} from './lynx-scene';

	// Lince de líneas que patrulla la franja del hero: corre (dirección primaria
	// derecha→izquierda), salta los huecos y la roca del horizonte y se da la
	// vuelta en los bordes. El prerender muestra la escena estática (lince parado
	// sobre la roca); el bucle sólo arranca en el cliente, nunca con
	// `prefers-reduced-motion`, y se pausa fuera de viewport o con la pestaña
	// oculta (mismo criterio que DotField).

	let frame = $state<LynxFrame>('stand');
	let live = $state(false);
	let facing = $state<'left' | 'right'>('left');

	let rootEl: HTMLDivElement;
	let spriteEl: HTMLDivElement;

	const FRAME_MS = 85; // ~12 fps del ciclo de carrera
	const JUMP_MS = 680;
	const HOP_MS = 620; // brinco inicial desde la roca
	const TURN_MS = 460;
	const EDGE_PAD = 10;
	const LOOKAHEAD_MS = 240; // horizonte de detección de obstáculos
	const MAX_DT = 50; // clamp del delta al volver de una pausa (no teleporta)
	const START_DELAY = 1100; // deja terminar el trazo de la línea de horizonte

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		// --- estado del actor (px; fuera de runes: lo escribe el rAF a 60 fps) ---
		let x = 0;
		let y = 0; // 0 = línea de suelo; negativo = en el aire
		let dir: -1 | 1 = -1;
		let W = 0;
		let H = 0;
		let SW = 0; // ancho del sprite
		type Mode = 'run' | 'jump' | 'turn' | 'pause';
		let mode: Mode = 'run';
		let modeT = 0;
		let frameT = 0;
		let cycleI = 0;
		let flipped = false;
		let pauseDur = 0;
		const jump = { x0: 0, x1: 0, y0: 0, y1: 0, h: 0, dur: JUMP_MS };

		let raf = 0;
		let running = false;
		let visible = true;
		let started = false;
		let lastT = 0;
		let startTimer = 0;

		const measure = () => {
			const prevW = W;
			W = rootEl.clientWidth;
			H = rootEl.clientHeight;
			SW = spriteEl.offsetWidth;
			// Mantiene la posición normalizada al redimensionar.
			if (prevW > 0 && W > 0 && prevW !== W) x = (x / prevW) * W;
		};

		const speed = () => Math.min(170, Math.max(90, W * 0.11));
		const setFrame = (f: LynxFrame) => {
			if (frame !== f) frame = f;
		};
		const apply = () => {
			spriteEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
		};

		// Obstáculo más próximo por delante (bordes en px según dirección).
		const nextObstacle = () => {
			let best: { dist: number; el: number; er: number; kind: 'gap' | 'rock' } | null = null;
			for (const ob of OBSTACLES) {
				const el = (ob.u - ob.w / 2) * W;
				const er = (ob.u + ob.w / 2) * W;
				const front = dir === -1 ? x : x + SW;
				const dist = dir === -1 ? front - er : el - front;
				if (dist > 0 && (best === null || dist < best.dist)) best = { dist, el, er, kind: ob.kind };
			}
			return best;
		};

		const startJump = (ob: { el: number; er: number; kind: 'gap' | 'rock' }) => {
			mode = 'jump';
			modeT = 0;
			jump.x0 = x;
			jump.y0 = y;
			jump.y1 = 0;
			jump.x1 = dir === -1 ? ob.el - SW - 8 : ob.er + 8;
			jump.h = (ob.kind === 'rock' ? 0.3 : 0.22) * H;
			jump.dur = ob.kind === 'rock' ? JUMP_MS * 1.1 : JUMP_MS;
		};

		const tick = (now: number) => {
			raf = 0;
			const dt = Math.min(now - lastT, MAX_DT);
			lastT = now;

			if (mode === 'run') {
				x += dir * speed() * (dt / 1000);
				frameT += dt;
				while (frameT >= FRAME_MS) {
					frameT -= FRAME_MS;
					cycleI = (cycleI + 1) % RUN_CYCLE.length;
				}
				setFrame(RUN_CYCLE[cycleI]);
				if ((dir === -1 && x <= EDGE_PAD) || (dir === 1 && x + SW >= W - EDGE_PAD)) {
					mode = 'turn';
					modeT = 0;
					flipped = false;
					setFrame('stand');
				} else {
					const ob = nextObstacle();
					if (ob && ob.dist < speed() * (LOOKAHEAD_MS / 1000)) startJump(ob);
				}
			} else if (mode === 'jump') {
				modeT += dt;
				const p = Math.min(1, modeT / jump.dur);
				if (p < 0.16) {
					setFrame('jump-crouch');
				} else if (p < 0.84) {
					const q = (p - 0.16) / 0.68;
					x = jump.x0 + (jump.x1 - jump.x0) * q;
					y = jump.y0 + (jump.y1 - jump.y0) * q - jump.h * Math.sin(Math.PI * q);
					setFrame('jump-air');
				} else {
					x = jump.x1;
					y = jump.y1;
					setFrame('jump-land');
				}
				if (p >= 1) {
					mode = 'run';
					frameT = 0;
					cycleI = 4; // retoma en el frame de impulso
				}
			} else if (mode === 'turn') {
				modeT += dt;
				if (!flipped && modeT >= TURN_MS / 2) {
					flipped = true;
					facing = facing === 'left' ? 'right' : 'left';
				}
				if (modeT >= TURN_MS) {
					dir = dir === -1 ? 1 : -1;
					modeT = 0;
					frameT = 0;
					cycleI = 0;
					// De vez en cuando se queda observando un momento.
					if (Math.random() < 0.35) {
						mode = 'pause';
						pauseDur = 700 + Math.random() * 900;
					} else {
						mode = 'run';
					}
				}
			} else {
				modeT += dt;
				if (modeT >= pauseDur) {
					mode = 'run';
					frameT = 0;
					cycleI = 0;
				}
			}

			apply();
			if (running) raf = requestAnimationFrame(tick);
		};

		const kick = () => {
			if (running || !started || !visible || document.hidden) return;
			running = true;
			lastT = performance.now();
			raf = requestAnimationFrame(tick);
		};
		const halt = () => {
			running = false;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		};

		// Arranque: el lince despierta sobre la roca y brinca al suelo.
		startTimer = window.setTimeout(() => {
			measure();
			if (W === 0) return;
			x = ROCK_U * W - SW / 2;
			y = (-(GROUND_Y - ROCK_TOP) / 100) * H;
			live = true; // el CSS pasa a `bottom` de suelo; el transform manda desde acá
			apply();
			mode = 'jump';
			modeT = 0;
			jump.x0 = x;
			jump.y0 = y;
			jump.x1 = x - Math.min(120, W * 0.12);
			jump.y1 = 0;
			jump.h = 0.1 * H;
			jump.dur = HOP_MS;
			started = true;
			kick();
		}, START_DELAY);

		const onResize = () => measure();
		const onVisibility = () => (document.hidden ? halt() : kick());
		const io =
			typeof IntersectionObserver !== 'undefined'
				? new IntersectionObserver(
						(entries) => {
							for (const en of entries) visible = en.isIntersecting;
							if (visible) kick();
							else halt();
						},
						{ threshold: 0 }
					)
				: null;

		window.addEventListener('resize', onResize);
		document.addEventListener('visibilitychange', onVisibility);
		io?.observe(rootEl);

		return () => {
			clearTimeout(startTimer);
			halt();
			window.removeEventListener('resize', onResize);
			document.removeEventListener('visibilitychange', onVisibility);
			io?.disconnect();
		};
	});
</script>

<div bind:this={rootEl} class="lynx-runner" role="img" aria-label={t('hero.lynxAlt')}>
	<svg class="ground" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
		<path class="horizon" d={GROUND_PATH} pathLength="1" vector-effect="non-scaling-stroke" />
	</svg>
	<div bind:this={spriteEl} class="sprite" class:live data-facing={facing}>
		<svg viewBox="0 0 120 78" aria-hidden="true">
			<g class="lines">
				{#each FRAME_NAMES as name (name)}
					<g class="frame" class:on={frame === name}>
						<g class="far">
							{#each FRAMES[name].far as d (d)}
								<path {d} />
							{/each}
						</g>
						{#each FRAMES[name].near as d (d)}
							<path {d} />
						{/each}
					</g>
				{/each}
			</g>
		</svg>
	</div>
</div>

<style>
	/* Franja a todo el ancho (mismo truco full-bleed del banner anterior),
	   con altura fija: cero layout shift. */
	.lynx-runner {
		position: relative;
		z-index: 1;
		margin: 48px calc(50% - 50vw) 0;
		width: 100vw;
		height: clamp(140px, 18vw, 220px);
		overflow: hidden;
	}
	@media (max-width: 860px) {
		.lynx-runner {
			margin-top: 32px;
		}
	}

	.ground {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.horizon {
		fill: none;
		stroke: color-mix(in srgb, var(--color-ink) 55%, transparent);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	/* La línea se dibuja sola al entrar (sólo con JS; el reset global de
	   prefers-reduced-motion la deja completa al instante). */
	:global(html.js) .horizon {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: groundIn 1.3s var(--ease-out-expo) 0.2s forwards;
	}
	@keyframes groundIn {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Pose SSR/estática: parado sobre la roca. En modo `live` el suelo pasa a
	   ser la base y la posición la escribe el rAF vía transform. */
	.sprite {
		position: absolute;
		left: 62%;
		bottom: 34%;
		translate: -50% 0;
		width: clamp(76px, 9.5vw, 112px);
	}
	.sprite.live {
		left: 0;
		bottom: 16%;
		translate: none;
		will-change: transform;
	}
	.sprite svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.sprite[data-facing='right'] svg {
		transform: scaleX(-1);
	}

	.lines {
		fill: none;
		stroke: var(--color-ink);
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.far {
		opacity: 0.45;
	}
	.frame {
		display: none;
	}
	.frame.on {
		display: inline;
	}
</style>
