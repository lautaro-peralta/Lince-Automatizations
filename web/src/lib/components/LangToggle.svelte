<script lang="ts">
	import { getLocale, toggleLocale, t } from '$lib/i18n/index.svelte';

	// Mostramos el idioma al que se cambia (no el actual), que es lo que el botón hace.
	const target = $derived(getLocale() === 'es' ? 'EN' : 'ES');
	const label = $derived(getLocale() === 'es' ? t('ui.switchToEnglish') : t('ui.switchToSpanish'));
</script>

<button
	type="button"
	class="grid h-9 min-w-9 place-items-center rounded-[8px] border border-line-strong bg-transparent px-2 font-mono text-[12px] font-semibold tracking-wide text-ink transition-colors hover:border-ink"
	onclick={toggleLocale}
	aria-label={label}
	title={label}
>
	{target}
</button>
