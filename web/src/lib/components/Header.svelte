<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { t } from '$lib/i18n/index.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import IconMenu from '~icons/lucide/menu';
	import IconClose from '~icons/lucide/x';

	// Páginas del sitio (rutas). El índice lateral cubre las secciones de la landing.
	const pages = [
		{ href: '/servicios', key: 'nav.services' },
		{ href: '/precios', key: 'nav.pricing' },
		{ href: '/nosotros', key: 'nav.about' },
		{ href: '/preguntas', key: 'nav.faq' }
	];

	let open = $state(false);
	const isActive = (href: string) => page.url.pathname === href;

	// Cerrar el menú mobile al navegar.
	afterNavigate(() => (open = false));
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') open = false;
	}}
/>

<!-- Navbar translúcido (bg-bg/60 + blur) sobre el fondo de puntos del hero.
     view-transition-name: queda quieto durante el fundido entre páginas. -->
<header
	class="sticky top-0 z-50 border-b border-line/70 bg-bg/60 backdrop-blur-md"
	style="view-transition-name: site-header"
>
	<div class="wrap flex items-center justify-between py-4">
		<a href="/" class="no-underline" aria-label={t('nav.home')}><Logo /></a>

		<nav class="flex items-center gap-1 sm:gap-2">
			<!-- Enlaces de página (desktop) -->
			<div class="hidden items-center gap-0.5 md:flex">
				{#each pages as p (p.href)}
					<a
						href={p.href}
						aria-current={isActive(p.href) ? 'page' : undefined}
						class="px-3 py-2 text-[15px] transition-colors hover:text-rust {isActive(p.href)
							? 'text-rust'
							: 'text-moss'}">{t(p.key)}</a
					>
				{/each}
			</div>

			<Button href="/#contacto" size="sm" variant="ghost" class="hidden sm:inline-flex">
				{t('nav.contact')}
			</Button>
			<LangToggle />
			<ThemeToggle />

			<!-- Botón de menú (mobile) -->
			<button
				type="button"
				class="grid h-9 w-9 place-items-center rounded-[8px] border border-line-strong bg-transparent text-ink transition-colors hover:border-ink md:hidden"
				aria-label={open ? t('ui.closeMenu') : t('ui.openMenu')}
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				{#if open}<IconClose class="text-[18px]" />{:else}<IconMenu class="text-[18px]" />{/if}
			</button>
		</nav>
	</div>

	<!-- Panel de navegación (mobile). Sólo páginas del sitio: las anclas de sección
	     de la landing viven en la barra fina lateral (ver SideIndex). -->
	{#if open}
		<div class="border-t border-line/70 bg-bg/95 backdrop-blur-md md:hidden">
			<nav class="wrap flex flex-col py-3" aria-label={t('nav.home')}>
				<a href="/" class="px-2 py-2.5 text-[16px] text-moss transition-colors hover:text-rust"
					>{t('nav.home')}</a
				>
				{#each pages as p (p.href)}
					<a
						href={p.href}
						aria-current={isActive(p.href) ? 'page' : undefined}
						class="px-2 py-2.5 text-[16px] transition-colors hover:text-rust {isActive(p.href)
							? 'text-rust'
							: 'text-moss'}">{t(p.key)}</a
					>
				{/each}
				<a
					href="/#contacto"
					class="px-2 py-2.5 text-[16px] text-moss transition-colors hover:text-rust"
					>{t('nav.contact')}</a
				>
			</nav>
		</div>
	{/if}
</header>
