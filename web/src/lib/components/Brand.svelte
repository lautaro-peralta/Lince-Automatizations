<script lang="ts">
	// Marca unificada de los módulos internos (Panel, Startup OS, Teams, …).
	// Tres rombos rust + el logotipo "lince" + un chip con el nombre del módulo.
	// Es el mismo lockup que usa Startup OS (web/static/startup-os): así todos
	// los módulos comparten identidad y sólo cambia la etiqueta del chip.
	interface Props {
		/** Nombre del módulo que va en el chip (ej. "Panel", "Startup OS"). */
		label?: string;
		/** Tamaño del lockup. */
		size?: 'sm' | 'md';
		class?: string;
	}
	let { label, size = 'md', class: klass = '' }: Props = $props();
</script>

<span class="brand {size} {klass}">
	<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
	<span class="brand-name">lince</span>
	{#if label}<span class="brand-chip">{label}</span>{/if}
</span>

<style>
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	.brand-mark {
		display: flex;
		gap: 3px;
		align-items: center;
	}

	.brand-mark i {
		width: 9px;
		height: 9px;
		background: var(--color-rust);
		transform: rotate(45deg);
		border-radius: 1.5px;
	}
	.brand-mark i:nth-child(2) {
		width: 11px;
		height: 11px;
	}
	.brand-mark i:nth-child(3) {
		opacity: 0.55;
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 600;
		line-height: 1;
		color: var(--color-ink);
	}

	.brand-chip {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-cream);
		background: var(--color-moss);
		border-radius: 999px;
		padding: 3px 8px;
		white-space: nowrap;
	}

	/* En oscuro el moss se aclara: el texto del chip pasa a tinta oscura para
	   mantener el contraste (mismo criterio que Startup OS). */
	:global(:root[data-theme='dark']) .brand-chip {
		color: var(--color-night);
	}

	/* Variante compacta (headers densos / mobile). */
	.brand.sm {
		gap: 8px;
	}
	.brand.sm .brand-name {
		font-size: 16px;
	}
	.brand.sm .brand-mark i {
		width: 7px;
		height: 7px;
	}
	.brand.sm .brand-mark i:nth-child(2) {
		width: 9px;
		height: 9px;
	}
</style>
