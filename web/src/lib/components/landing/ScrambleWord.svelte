<script lang="ts">
	import { onMount } from 'svelte';

	// Verbo que cambia estilo terminal, en dos fases:
	//   1) borra la palabra anterior de derecha a izquierda (como con teclado),
	//   2) escribe la nueva letra por letra (máquina de escribir, ritmo realista).
	// Entre cambios queda estático y legible `hold` ms. El cursor de bloque (cmd)
	// parpadea siempre. Va en su propio renglón centrado: el resto del titular no
	// se mueve.
	interface Props {
		words: string[];
		/** ms que la palabra queda quieta y legible antes de borrarla. */
		hold?: number;
		class?: string;
	}
	let { words, hold = 5000, class: klass = '' }: Props = $props();

	let live = $state<HTMLSpanElement | null>(null);

	onMount(() => {
		const node = live;
		if (!node) return;

		const prefersReduced =
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Con reduce-motion (o una sola palabra) queda estático en words[0].
		if (prefersReduced || words.length <= 1) return;

		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;
		const sleep = (ms: number) => new Promise<void>((r) => (timer = setTimeout(r, ms)));

		// Ritmos (con leve variación para que el tipeo se sienta humano).
		const typeDelay = () => 95 + Math.random() * 85; // ~95–180 ms por letra
		const delDelay = () => 45 + Math.random() * 35; // ~45–80 ms por borrado

		async function erase(prev: string) {
			for (let i = prev.length; i > 0 && !cancelled; i--) {
				node!.textContent = prev.slice(0, i - 1);
				await sleep(delDelay());
			}
		}

		async function type(word: string) {
			for (let i = 1; i <= word.length && !cancelled; i++) {
				node!.textContent = word.slice(0, i);
				await sleep(typeDelay());
			}
		}

		async function cycle() {
			let i = 0;
			while (!cancelled) {
				await sleep(hold);
				if (cancelled) break;
				await erase(node!.textContent || '');
				i = (i + 1) % words.length;
				await type(words[i]);
			}
		}

		node.classList.add('cursor-on');
		cycle();

		return () => {
			cancelled = true;
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
	/* Cursor de bloque tipo terminal, siempre parpadeando. Blanco (no hereda el
	   rust del verbo) para el look de consola. */
	.live.cursor-on::after {
		content: '▋';
		margin-left: 0.04em;
		color: #fff;
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
