<script lang="ts">
	import { getTheme, toggleTheme } from '$lib/theme.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import IconSun from '~icons/lucide/sun';
	import IconMoon from '~icons/lucide/moon';

	const isDark = $derived(getTheme() === 'dark');
	const label = $derived(isDark ? t('ui.toLight') : t('ui.toDark'));
</script>

<button
	type="button"
	class="grid h-9 w-9 place-items-center rounded-[8px] border border-line-strong bg-transparent text-ink transition-colors hover:border-ink"
	onclick={toggleTheme}
	aria-label={label}
	title={label}
>
	{#if isDark}
		<IconSun class="text-[17px]" />
	{:else}
		<IconMoon class="text-[17px]" />
	{/if}
</button>
