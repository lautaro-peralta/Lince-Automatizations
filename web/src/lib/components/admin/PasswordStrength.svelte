<script lang="ts">
	import IconCheck from '~icons/lucide/check';
	import { t } from '$lib/i18n/index.svelte';
	import { passwordChecks, passwordScore, passwordRules } from '$lib/utils/password';

	interface Props {
		value: string;
		/** ID para que el input lo referencie con aria-describedby. */
		id?: string;
	}
	let { value, id }: Props = $props();

	const checks = $derived(passwordChecks(value));
	const score = $derived(passwordScore(value));
	const total = passwordRules.length;

	// Etiqueta y color del medidor según cuántas reglas se cumplen.
	const meter = $derived.by(() => {
		if (!value) return { label: '', tone: 'sage', filled: 0 };
		if (score <= 2) return { label: t('admin.login.strengthWeak'), tone: 'danger', filled: score };
		if (score < total)
			return { label: t('admin.login.strengthMedium'), tone: 'warning', filled: score };
		return { label: t('admin.login.strengthStrong'), tone: 'success', filled: score };
	});

	const toneClass = {
		sage: 'bg-sage',
		danger: 'bg-danger',
		warning: 'bg-warning',
		success: 'bg-success'
	};
	const textToneClass = {
		sage: 'text-sage',
		danger: 'text-danger',
		warning: 'text-warning',
		success: 'text-success'
	};
</script>

<div {id} class="mt-3">
	<!-- Medidor: N segmentos que se van llenando y coloreando. -->
	<div class="flex items-center gap-2">
		<div class="flex flex-1 gap-1" aria-hidden="true">
			{#each passwordRules as rule, i (rule.key)}
				<span
					class="h-1.5 flex-1 rounded-full transition-colors duration-300 {i < meter.filled
						? toneClass[meter.tone as keyof typeof toneClass]
						: 'bg-line-strong'}"
				></span>
			{/each}
		</div>
		{#if meter.label}
			<span
				class="text-[12px] font-semibold {textToneClass[meter.tone as keyof typeof textToneClass]}"
				>{meter.label}</span
			>
		{/if}
	</div>

	<!-- Checklist en vivo de los requisitos. -->
	<ul class="mt-3 grid gap-1.5">
		{#each checks as check (check.key)}
			<li
				class="flex items-center gap-2 text-[13px] transition-colors {check.ok
					? 'text-moss'
					: 'text-sage'}"
			>
				<span
					class="grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors {check.ok
						? 'border-success bg-success text-bg'
						: 'border-line-strong text-transparent'}"
				>
					<IconCheck class="text-[10px]" />
				</span>
				{t(`admin.login.rule${check.key}`)}
			</li>
		{/each}
	</ul>
</div>
