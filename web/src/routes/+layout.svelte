<script lang="ts">
	import '../app.css';
	// Fuentes self-host (Fontsource): eliminan el CDN de Google (bloqueante) y
	// mejoran LCP + privacidad. Fraunces con eje óptico para el look editorial.
	import '@fontsource-variable/fraunces/opsz.css';
	import '@fontsource-variable/fraunces/opsz-italic.css';
	import '@fontsource-variable/source-sans-3/index.css';
	import '@fontsource-variable/jetbrains-mono/index.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{@render children()}
