<script lang="ts">
	import '../app.css';
	// Fuentes self-host (Fontsource): eliminan el CDN de Google (bloqueante) y
	// mejoran LCP + privacidad. Fraunces con eje óptico para el look editorial.
	import '@fontsource-variable/fraunces/opsz.css';
	import '@fontsource-variable/fraunces/opsz-italic.css';
	import '@fontsource-variable/source-sans-3/index.css';
	import '@fontsource-variable/jetbrains-mono/index.css';
	import { initLocale } from '$lib/i18n/index.svelte';
	import { initTheme } from '$lib/theme.svelte';

	// Sincroniza los stores reactivos con lo que el script inline de app.html ya
	// aplicó (tema e idioma). El render inicial es el prerenderizado (es/claro);
	// si el usuario eligió otro, acá se conmuta al instante en el cliente.
	initLocale();
	initTheme();

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{@render children()}
