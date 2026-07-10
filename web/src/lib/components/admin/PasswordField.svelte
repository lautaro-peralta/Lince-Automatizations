<script lang="ts">
	import IconEye from '~icons/lucide/eye';
	import IconEyeOff from '~icons/lucide/eye-off';
	import { t } from '$lib/i18n/index.svelte';

	interface Props {
		id: string;
		value: string;
		autocomplete?: 'current-password' | 'new-password';
		placeholder?: string;
		required?: boolean;
		/** ID de un texto de ayuda/checklist que describe el campo (a11y). */
		describedby?: string;
		/** Marca visualmente el campo como inválido (aria-invalid). */
		invalid?: boolean;
	}
	let {
		id,
		value = $bindable(),
		autocomplete = 'current-password',
		placeholder = '',
		required = false,
		describedby,
		invalid = false
	}: Props = $props();

	let shown = $state(false);
</script>

<div class="relative">
	<input
		{id}
		class="w-full rounded-[8px] border bg-bg px-3.5 py-2.5 pr-11 text-[15px] outline-none transition-colors focus:border-rust focus:shadow-glow {invalid
			? 'border-danger'
			: 'border-line-strong'}"
		bind:value
		type={shown ? 'text' : 'password'}
		{required}
		{autocomplete}
		{placeholder}
		aria-describedby={describedby}
		aria-invalid={invalid || undefined}
	/>
	<button
		type="button"
		class="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[8px] text-sage transition-colors hover:text-ink focus-visible:text-ink"
		onclick={() => (shown = !shown)}
		aria-label={shown ? t('admin.login.hidePassword') : t('admin.login.showPassword')}
		aria-pressed={shown}
		tabindex="-1"
	>
		{#if shown}
			<IconEyeOff class="text-[17px]" />
		{:else}
			<IconEye class="text-[17px]" />
		{/if}
	</button>
</div>
