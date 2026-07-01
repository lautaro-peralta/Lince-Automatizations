<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';
	import IconChevronLeft from '~icons/lucide/chevron-left';
	import IconChevronRight from '~icons/lucide/chevron-right';

	// Índice lateral (scrollspy) de las secciones de la landing. Sólo desktop
	// ancho; en mobile la navegación de secciones vive en el menú del header.
	const sections = [
		{ id: 'casos', key: 'nav.cases' },
		{ id: 'proceso', key: 'nav.howWeWork' },
		{ id: 'contacto', key: 'nav.contact' }
	];

	let active = $state('casos');
	let collapsed = $state(false);

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

<nav
	class="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
	aria-label={t('ui.onThisPage')}
>
	<div
		class="flex flex-col gap-0.5 rounded-xl border border-line bg-bg/70 p-1.5 shadow-card backdrop-blur-md"
	>
		<button
			type="button"
			class="grid h-7 w-7 place-items-center self-end rounded-[7px] text-sage transition-colors hover:text-rust"
			aria-label={collapsed ? t('ui.expandIndex') : t('ui.collapseIndex')}
			aria-expanded={!collapsed}
			onclick={() => (collapsed = !collapsed)}
		>
			{#if collapsed}<IconChevronRight class="text-[15px]" />{:else}<IconChevronLeft
					class="text-[15px]"
				/>{/if}
		</button>

		{#each sections as s (s.id)}
			<a
				href={`#${s.id}`}
				aria-current={active === s.id ? 'true' : undefined}
				title={t(s.key)}
				class="flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13.5px] transition-colors {active ===
				s.id
					? 'text-rust'
					: 'text-sage hover:text-ink'}"
			>
				<span
					class="h-1.5 w-1.5 shrink-0 rounded-full transition-colors {active === s.id
						? 'bg-rust'
						: 'bg-line-strong'}"
				></span>
				{#if !collapsed}<span class="whitespace-nowrap">{t(s.key)}</span>{/if}
			</a>
		{/each}
	</div>
</nav>
