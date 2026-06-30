<script lang="ts">
	import { cx } from '$lib/utils/cx';
	import { t } from '$lib/i18n/index.svelte';

	interface Props {
		value: string;
		options: readonly string[];
		/** Guarda el nuevo valor (PATCH). Debe lanzar si falla. */
		save: (value: string) => Promise<void>;
		/** Etiquetas traducidas por valor; si falta, se muestra el valor "humanizado". */
		labels?: Record<string, string>;
		class?: string;
	}

	let { value, options, save, labels, class: klass = '' }: Props = $props();

	type SaveState = 'idle' | 'saving' | 'saved' | 'error';

	let current = $state(value);
	let saveState = $state<SaveState>('idle');
	let timer: ReturnType<typeof setTimeout>;

	async function onChange(next: string) {
		current = next;
		saveState = 'saving';
		try {
			await save(next);
			saveState = 'saved';
			clearTimeout(timer);
			timer = setTimeout(() => (saveState = 'idle'), 1400);
		} catch {
			saveState = 'error';
		}
	}

	const ring: Record<SaveState, string> = {
		idle: 'border-line-strong',
		saving: 'border-sage',
		saved: 'border-moss bg-moss/8',
		error: 'border-danger bg-danger/8'
	};
</script>

<select
	bind:value={current}
	onchange={(e) => onChange(e.currentTarget.value)}
	class={cx(
		'rounded-[7px] border bg-bg px-2.5 py-1.5 font-mono text-[12.5px] text-ink outline-none transition-colors',
		ring[saveState],
		klass
	)}
	aria-label={t('admin.statusAria')}
>
	{#each options as o (o)}
		<option value={o}>{labels?.[o] ?? o.replace(/_/g, ' ')}</option>
	{/each}
</select>
{#if saveState === 'error'}
	<span class="ml-1.5 font-mono text-[11px] text-danger">{t('admin.notSaved')}</span>
{/if}
