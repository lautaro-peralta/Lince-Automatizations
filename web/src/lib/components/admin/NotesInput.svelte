<script lang="ts">
	import { cx } from '$lib/utils/cx';
	import { t } from '$lib/i18n/index.svelte';

	interface Props {
		value: string;
		/** Guarda el texto (PATCH). Debe lanzar si falla. */
		save: (value: string) => Promise<void>;
	}

	let { value, save }: Props = $props();

	type SaveState = 'idle' | 'saving' | 'saved' | 'error';

	let current = $state(value);
	let original = value;
	let saveState = $state<SaveState>('idle');
	let timer: ReturnType<typeof setTimeout>;

	async function onBlur() {
		if (current === original) return;
		saveState = 'saving';
		try {
			await save(current);
			original = current;
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

<input
	bind:value={current}
	onblur={onBlur}
	placeholder={t('admin.notesPh')}
	aria-label={t('admin.notesAria')}
	class={cx(
		'w-full min-w-[140px] rounded-[7px] border bg-bg px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-rust',
		ring[saveState]
	)}
/>
