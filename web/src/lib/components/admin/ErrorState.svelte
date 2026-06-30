<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let { message, onRetry }: { message: string; onRetry?: () => void } = $props();
</script>

<div
	class="flex flex-col items-start gap-3 rounded-[10px] border border-danger/25 bg-danger/5 p-4 text-[15px] text-danger"
	role="alert"
>
	<p>{message}</p>
	{#if onRetry}
		<Button size="sm" variant="subtle" onclick={onRetry}>{t('admin.retry')}</Button>
	{/if}
</div>
