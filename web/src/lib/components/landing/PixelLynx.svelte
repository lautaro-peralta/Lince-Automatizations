<script lang="ts">
	import { FRAME_PATHS, GRID_W, GRID_H, type LynxFrame } from './pixel-lynx';

	// Mascota pixel art. Estática y prerenderizada (sin JS en runtime); la prop
	// `frame` deja lista la puerta para animarla con más poses en FRAMES.
	let { frame = 'sit' }: { frame?: LynxFrame } = $props();

	const paths = $derived(FRAME_PATHS[frame]);
</script>

<svg viewBox="0 0 {GRID_W} {GRID_H}" shape-rendering="crispEdges" aria-hidden="true">
	{#each paths as p (p.color)}
		<path d={p.d} fill={p.color} />
	{/each}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
