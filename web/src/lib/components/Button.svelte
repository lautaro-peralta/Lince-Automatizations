<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from '$lib/utils/cx';

	type Variant = 'primary' | 'accent' | 'ghost' | 'subtle';
	type Size = 'sm' | 'md' | 'lg';

	interface BaseProps {
		variant?: Variant;
		size?: Size;
		/** Si se pasa, el botón se renderiza como <a>. */
		href?: string;
		full?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		href,
		full = false,
		class: klass = '',
		children,
		...rest
	}: BaseProps & HTMLButtonAttributes & HTMLAnchorAttributes = $props();

	const base =
		'inline-flex items-center justify-center gap-2 font-sans font-semibold ' +
		'rounded-[8px] border cursor-pointer no-underline select-none ' +
		'transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out-expo ' +
		'hover:-translate-y-px active:translate-y-0 disabled:opacity-55 disabled:pointer-events-none';

	const variants: Record<Variant, string> = {
		primary: 'bg-ink text-bg border-ink hover:bg-night',
		accent: 'bg-rust text-bg border-rust hover:bg-rust-deep',
		ghost: 'bg-transparent text-ink border-line-strong hover:border-ink',
		subtle: 'bg-surface text-ink border-line hover:bg-surface-2'
	};

	const sizes: Record<Size, string> = {
		sm: 'text-[13px] px-3.5 py-2',
		md: 'text-[15px] px-6 py-3',
		lg: 'text-base px-7 py-3.5'
	};

	const classes = $derived(cx(base, variants[variant], sizes[size], full && 'w-full', klass));
</script>

{#if href}
	<a {href} class={classes} {...rest}>{@render children()}</a>
{:else}
	<button class={classes} {...rest}>{@render children()}</button>
{/if}
