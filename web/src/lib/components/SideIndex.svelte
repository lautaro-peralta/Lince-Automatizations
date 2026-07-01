<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';
	import IconChevronLeft from '~icons/lucide/chevron-left';
	import IconChevronRight from '~icons/lucide/chevron-right';

	// Índice lateral (scrollspy) de las secciones de la landing, como riel de
	// altura completa a la izquierda. Sólo en pantallas anchas (xl); en mobile la
	// navegación de secciones vive en el menú del header.
	const sections = [
		{ id: 'casos', key: 'nav.cases' },
		{ id: 'proceso', key: 'nav.howWeWork' },
		{ id: 'contacto', key: 'nav.contact' }
	];

	let active = $state('casos');
	// Arranca replegado (riel fino de puntos) para no tapar el contenido; el
	// usuario lo despliega para ver las etiquetas.
	let collapsed = $state(true);

	onMount(() => {
		const els = sections
			.map((s) => document.getElementById(s.id))
			.filter((el): el is HTMLElement => el !== null);
		if (typeof IntersectionObserver === 'undefined' || els.length === 0) return;

		// Marca activa la sección cuyo cuerpo cruza la franja central del viewport.
		const io = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (visible[0]) active = visible[0].target.id;
			},
			{ rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
		);
		for (const el of els) io.observe(el);
		return () => io.disconnect();
	});
</script>

<!-- Riel fijo de alto completo. El contenido va centrado verticalmente para no
     chocar con el header sticky (que queda por encima, z superior). -->
<nav
	aria-label={t('ui.onThisPage')}
	class="fixed inset-y-0 left-0 z-40 hidden flex-col justify-center border-r border-line bg-bg/70 backdrop-blur-md transition-[width] duration-300 ease-out xl:flex {collapsed
		? 'w-[68px]'
		: 'w-[224px]'}"
>
	<div class={`flex flex-col gap-3 ${collapsed ? 'items-center px-3' : 'px-4'}`}>
		<button
			type="button"
			class="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-sage transition-colors hover:text-rust {collapsed
				? ''
				: 'self-end'}"
			aria-label={collapsed ? t('ui.expandIndex') : t('ui.collapseIndex')}
			aria-expanded={!collapsed}
			onclick={() => (collapsed = !collapsed)}
		>
			{#if collapsed}<IconChevronRight class="text-[16px]" />{:else}<IconChevronLeft
					class="text-[16px]"
				/>{/if}
		</button>

		{#if !collapsed}
			<span class="kicker px-2 text-[11px] whitespace-nowrap">{t('ui.onThisPage')}</span>
		{/if}

		<ul class="flex w-full flex-col gap-1">
			{#each sections as s (s.id)}
				<li>
					<a
						href={`#${s.id}`}
						aria-current={active === s.id ? 'true' : undefined}
						title={t(s.key)}
						class="group relative flex items-center gap-3 rounded-[9px] py-2 transition-colors {collapsed
							? 'justify-center px-0'
							: 'px-3'} {active === s.id ? 'text-rust' : 'text-sage hover:text-ink'}"
					>
						{#if active === s.id && !collapsed}
							<span
								class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-rust"
							></span>
						{/if}
						<span
							class="h-2 w-2 shrink-0 rounded-full transition-colors {active === s.id
								? 'bg-rust'
								: 'bg-line-strong group-hover:bg-sage'}"
						></span>
						{#if !collapsed}<span class="text-[15px] font-semibold whitespace-nowrap"
							>{t(s.key)}</span
						>{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>
