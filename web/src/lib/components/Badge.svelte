<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils/cx';

	type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

	let {
		tone = 'neutral',
		class: klass = '',
		children
	}: { tone?: Tone; class?: string; children: Snippet } = $props();

	const tones: Record<Tone, string> = {
		neutral: 'bg-surface text-moss border-line',
		success: 'bg-moss/12 text-moss-deep border-moss/20',
		warning: 'bg-rust/14 text-rust-deep border-rust/25',
		danger: 'bg-danger/12 text-danger border-danger/25',
		info: 'bg-moss/10 text-moss border-moss/20',
		accent: 'bg-rust text-bg border-rust'
	};
</script>

<span
	class={cx(
		'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase',
		tones[tone],
		klass
	)}
>
	{@render children()}
</span>
