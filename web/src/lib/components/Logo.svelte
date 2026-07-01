<script lang="ts">
	// Logo de marca (tres rombos rust). El PNG viene con fondo crema (#f7f5f0):
	// en tema claro se funde con `--color-bg`, en oscuro queda como un chip
	// crema. Aplicamos `bg: cream` + padding + border-radius siempre para que
	// se lea como una insignia coherente en ambos temas.
	interface Props {
		/** Alto de la marca en px (aplica también al ancho). */
		size?: number;
		class?: string;
	}
	let { size = 30, class: klass = '' }: Props = $props();
</script>

<span
	class={`inline-flex items-center gap-2.5 font-display text-[21px] font-semibold text-ink ${klass}`}
>
	<span class="badge" style={`height:${size}px;width:${size}px`}>
		<img src="/logo-lince.png" alt="lince" width={size} height={size} />
	</span>
	lince
</span>

<style>
	.badge {
		display: inline-grid;
		place-items: center;
		background: var(--color-cream);
		border-radius: 7px;
		padding: 2px;
		box-sizing: border-box;
		flex-shrink: 0;
	}
	.badge img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}
</style>
