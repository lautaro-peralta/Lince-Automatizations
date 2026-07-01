<script lang="ts">
	import { onMount } from 'svelte';

	// Verbo que cambia en dos fases, estilo terminal:
	//   1) borra la palabra anterior de derecha a izquierda (como con teclado),
	//   2) recién ahí escribe la nueva, definiendo cada carácter con un scramble.
	// Va en su propio renglón centrado, así el resto del titular no se mueve.
	interface Props {
		words: string[];
		/** ms con la palabra completa antes de borrarla y escribir la siguiente. */
		hold?: number;
		class?: string;
	}
	let { words, hold = 1800, class: klass = '' }: Props = $props();

	let live = $state<HTMLSpanElement | null>(null);

	onMount(() => {
		const node = live;
		if (!node) return;

		const prefersReduced =
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Con reduce-motion (o una sola palabra) queda estático en words[0].
		if (prefersReduced || words.length <= 1) return;

		const chars = '!<>-_\\/[]{}—=+*^?#%&';
		const esc = (c: string) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);

		let raf = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;

		const DEL_PER = 2; // frames por carácter borrado
		const TYPE_PER = 5; // frames por carácter nuevo (incluye el scramble de entrada)

		function play(word: string): Promise<void> {
			return new Promise((resolve) => {
				const prev = node!.textContent || '';
				const delFrames = prev.length * DEL_PER;
				const typeFrames = word.length * TYPE_PER;
				let frame = 0;

				const step = () => {
					if (cancelled) return;
					let out = '';
					if (frame < delFrames) {
						// Fase 1 — borrado desde la derecha (backspace).
						const shown = prev.length - Math.floor(frame / DEL_PER) - 1;
						out = prev.slice(0, Math.max(0, shown));
					} else {
						// Fase 2 — se van definiendo los caracteres: los ya escritos quedan
						// fijos y el que entra parpadea con caracteres aleatorios.
						const tf = frame - delFrames;
						const idx = Math.min(word.length, Math.floor(tf / TYPE_PER));
						out = word.slice(0, idx);
						if (idx < word.length) {
							out += `<span class="dud">${esc(chars[Math.floor(Math.random() * chars.length)])}</span>`;
						}
					}
					node!.innerHTML = out;
					if (frame >= delFrames + typeFrames) {
						node!.textContent = word; // estado final limpio
						resolve();
						return;
					}
					frame++;
					raf = requestAnimationFrame(step);
				};
				step();
			});
		}

		const wait = (ms: number) => new Promise<void>((r) => (timer = setTimeout(r, ms)));

		async function cycle() {
			let i = 0;
			while (!cancelled) {
				await wait(hold);
				if (cancelled) break;
				i = (i + 1) % words.length;
				await play(words[i]);
			}
		}

		node.classList.add('cursor-on');
		cycle();

		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			if (timer) clearTimeout(timer);
		};
	});
</script>

<span class={`scramble ${klass}`}>
	<span class="live" bind:this={live}>{words[0] ?? ''}</span>
</span>

<style>
	.scramble {
		display: inline-block;
	}
	.live {
		position: relative;
		white-space: nowrap;
	}
	/* Los caracteres aleatorios se inyectan por innerHTML → :global para saltear
	   el scope de Svelte. */
	.live :global(.dud) {
		color: var(--color-sage);
		opacity: 0.85;
	}
	.live.cursor-on::after {
		content: '▋';
		margin-left: 0.04em;
		color: currentColor;
		animation: blink 1s steps(2, start) infinite;
	}
	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		50.1%,
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.live.cursor-on::after {
			content: '';
			animation: none;
		}
	}
</style>
