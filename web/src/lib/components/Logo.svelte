<script lang="ts">
	// Logo de marca. La marca (SVG) es un PLACEHOLDER: cuando el usuario suba la
	// imagen real, se reemplaza sólo acá. La tinta usa `currentColor` (sigue el
	// color de texto → se adapta al tema claro/oscuro) y el acento usa el rust.
	interface Props {
		/** Alto de la marca en px. */
		size?: number;
		class?: string;
	}
	let { size = 30, class: klass = '' }: Props = $props();
</script>

<span
	class={`inline-flex items-center gap-2.5 font-display text-[21px] font-semibold text-ink ${klass}`}
>
	<svg
		style={`height:${size}px;width:${size}px`}
		class="shrink-0"
		viewBox="0 0 40 40"
		fill="none"
		role="img"
		aria-label="lince"
	>
		<path
			d="M20 4 L34 13 L34 27 L20 36 L6 27 L6 13 Z"
			stroke="currentColor"
			stroke-width="1.6"
			fill="none"
		/>
		<path
			d="M14 17 L20 23 L26 17"
			stroke="var(--color-rust)"
			stroke-width="1.8"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<circle cx="14" cy="14" r="1.6" fill="currentColor" />
		<circle cx="26" cy="14" r="1.6" fill="currentColor" />
	</svg>
	lince
</span>
