<script lang="ts">
	import { onMount } from 'svelte';

	// Verbo que cambia con efecto "scramble" (caracteres aleatorios) + cursor de
	// terminal, ciclando entre las palabras dadas. Basado en el efecto adjunto.
	// El ancho lo reservan los "ghost" (la palabra más ancha), así el texto queda
	// centrado y estable: el resto del titular no se mueve.
	interface Props {
		words: string[];
		/** ms con la palabra completa antes de pasar a la siguiente. */
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
		let frameReq = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;
		let queue: { from: string; to: string; start: number; end: number; char: string }[] = [];
		let frame = 0;
		let resolveFn: (() => void) | null = null;

		function setText(newText: string): Promise<void> {
			const oldText = node!.textContent || '';
			const length = Math.max(oldText.length, newText.length);
			const promise = new Promise<void>((res) => (resolveFn = res));
			queue = [];
			for (let i = 0; i < length; i++) {
				queue.push({ from: oldText[i] || '', to: newText[i] || '', start: i * 8, end: i * 8 + 8, char: '' });
			}
			cancelAnimationFrame(frameReq);
			frame = 0;
			update();
			return promise;
		}

		function update() {
			let out = '';
			let complete = 0;
			for (const item of queue) {
				if (frame >= item.end) {
					complete++;
					out += item.to;
				} else if (frame >= item.start) {
					if (!item.char || Math.random() < 0.28) {
						item.char = chars[Math.floor(Math.random() * chars.length)];
					}
					out += `<span class="dud">${item.char}</span>`;
				} else {
					out += item.from;
				}
			}
			node!.innerHTML = out;
			if (complete === queue.length) {
				resolveFn?.();
			} else {
				frame++;
				frameReq = requestAnimationFrame(update);
			}
		}

		const wait = (ms: number) => new Promise<void>((r) => (timer = setTimeout(r, ms)));

		async function cycle() {
			let i = 0;
			while (!cancelled) {
				await wait(hold);
				if (cancelled) break;
				i = (i + 1) % words.length;
				await setText(words[i]);
			}
		}

		node.classList.add('cursor-on');
		cycle();

		return () => {
			cancelled = true;
			cancelAnimationFrame(frameReq);
			if (timer) clearTimeout(timer);
		};
	});
</script>

<span class={`scramble ${klass}`}>
	{#each words as w (w)}<span class="ghost" aria-hidden="true">{w}</span>{/each}
	<span class="live" bind:this={live}>{words[0] ?? ''}</span>
</span>

<style>
	.scramble {
		display: inline-grid;
	}
	/* Los ghost y el texto vivo se apilan en la misma celda: la celda mide lo que
	   la palabra más ancha, así el centro no se mueve al cambiar de palabra. */
	.scramble > * {
		grid-area: 1 / 1;
		text-align: center;
		white-space: nowrap;
	}
	.ghost {
		visibility: hidden;
	}
	.live {
		position: relative;
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
