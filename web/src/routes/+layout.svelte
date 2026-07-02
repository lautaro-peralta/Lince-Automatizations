<script lang="ts">
	import '../app.css';
	// Fuentes self-host (Fontsource): eliminan el CDN de Google (bloqueante) y
	// mejoran LCP + privacidad. Fraunces con eje óptico para el look editorial.
	import '@fontsource-variable/fraunces/opsz.css';
	import '@fontsource-variable/fraunces/opsz-italic.css';
	import '@fontsource-variable/source-sans-3/index.css';
	import '@fontsource-variable/jetbrains-mono/index.css';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { initLocale } from '$lib/i18n/index.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SideIndex from '$lib/components/SideIndex.svelte';
	import WhatsAppButton from '$lib/components/WhatsAppButton.svelte';

	// Sincroniza los stores reactivos con lo que el script inline de app.html ya
	// aplicó (tema e idioma). El render inicial es el prerenderizado (es/claro);
	// si el usuario eligió otro, acá se conmuta al instante en el cliente.
	initLocale();
	initTheme();

	let { children } = $props();

	// Fundido suave entre páginas con la View Transitions API. Mejora
	// progresiva: sin soporte del navegador o con prefers-reduced-motion la
	// navegación es la de siempre. Nunca corre en la carga inicial.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// El chrome público (header/footer/índice) no se muestra sobre el panel
	// /admin, que trae su propio layout. El índice lateral es sólo de la landing.
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
	const isLanding = $derived(page.url.pathname === '/');
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
</svelte:head>

{#if !isAdmin}
	<Header />
{/if}

{#if isLanding}
	<SideIndex />
{/if}

{@render children()}

{#if !isAdmin}
	<Footer />
	<WhatsAppButton />
{/if}
