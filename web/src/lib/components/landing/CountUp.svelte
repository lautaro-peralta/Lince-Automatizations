<script lang="ts">
	import { onMount } from 'svelte';
	import { formatStat, parseStat } from '$lib/utils/countup';

	// Contador que sube de 0 al valor cuando entra en viewport. El markup SSR
	// (y no-JS / prefers-reduced-motion) muestra el string final directamente:
	// `shown === null` significa "renderizá el valor traducido tal cual", así el
	// prerender es correcto sin ramas y el toggle de idioma posterior a la
	// animación sigue vivo (vuelve a `value`, que viene de t()).

	let { value, duration = 1100 }: { value: string; duration?: number } = $props();

	const parts = $derived(parseStat(value));
	let shown = $state<number | null>(null);
	let el: HTMLSpanElement;

	const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (typeof IntersectionObserver === 'undefined') return;

		let raf = 0;
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((en) => en.isIntersecting)) return;
				io.disconnect();
				if (parts.target === null) return;
				const target = parts.target;
				const t0 = performance.now();
				const step = (now: number) => {
					const p = Math.min(1, (now - t0) / duration);
					shown = target * easeOutCubic(p);
					// Al terminar, el render vuelve al string traducido vivo.
					if (p >= 1) shown = null;
					else raf = requestAnimationFrame(step);
				};
				raf = requestAnimationFrame(step);
			},
			{ threshold: 0.4 }
		);
		io.observe(el);

		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
		};
	});
</script>

<span bind:this={el} class="tabular-nums">
	{#if shown === null}{value}{:else}{parts.prefix}{formatStat(shown, parts)}{parts.suffix}{/if}
</span>
