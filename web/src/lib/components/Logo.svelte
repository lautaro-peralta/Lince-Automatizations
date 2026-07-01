<script lang="ts">
	// Logo de marca (tres rombos rust) — PNG con fondo transparente, así que se
	// ve limpio directamente sobre cualquier tema del sitio sin necesidad de
	// envoltorio/chip.
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
	<img
		src="/logo-lince-transparente.png"
		alt="lince"
		width={size}
		height={size}
		class="shrink-0 object-contain"
		style={`width:${size}px;height:${size}px`}
	/>
	lince
</span>
