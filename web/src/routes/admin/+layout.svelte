<script lang="ts">
	import { page } from '$app/state';
	import { auth, initAuth, loginErrorMessage } from '$lib/admin/auth.svelte';
	import { supabase, supabaseConfigured } from '$lib/supabase';
	import Button from '$lib/components/Button.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import IconLogout from '~icons/lucide/log-out';

	let { children } = $props();

	initAuth();

	let email = $state('');
	let password = $state('');
	let loginError = $state('');
	let submitting = $state(false);

	const tabs = $derived([
		{ href: '/admin', label: t('admin.tabs.summary') },
		{ href: '/admin/leads', label: t('admin.tabs.leads') },
		{ href: '/admin/presupuestos', label: t('admin.tabs.budgets') },
		{ href: '/admin/resenas', label: t('admin.tabs.reviews') }
	]);

	async function onLogin(event: SubmitEvent) {
		event.preventDefault();
		loginError = '';
		submitting = true;
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});
			if (error) loginError = loginErrorMessage(error);
			// Si todo va bien, el listener de auth actualiza la sesión y cambia la vista.
		} catch (err) {
			loginError = loginErrorMessage(err as { message?: string });
		} finally {
			submitting = false;
		}
	}

	function logout() {
		supabase.auth.signOut();
	}
</script>

<svelte:head>
	<title>{t('admin.brand')}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if !auth.ready}
	<div class="grid min-h-dvh place-items-center bg-bg text-sage">
		<p class="font-mono text-sm">{t('admin.loading')}</p>
	</div>
{:else if !auth.session}
	<!-- LOGIN -->
	<main class="grid min-h-dvh place-items-center bg-bg px-5">
		<form
			class="w-full max-w-[360px] rounded-xl border border-line bg-surface p-7 shadow-card"
			onsubmit={onLogin}
		>
			<div class="mb-5 flex items-start justify-between gap-3">
				<div>
					<h1 class="font-display text-[20px] font-semibold">{t('admin.brand')}</h1>
					<p class="text-sm text-sage">{t('admin.login.subtitle')}</p>
				</div>
				<div class="flex items-center gap-2">
					<LangToggle />
					<ThemeToggle />
				</div>
			</div>

			{#if !supabaseConfigured}
				<p
					class="mb-4 rounded-[8px] border border-danger/25 bg-danger/5 p-3 text-[13px] text-danger"
				>
					{t('admin.login.missingEnvBefore')} <code>web/.env.example</code> →
					<code>web/.env</code>
					{t('admin.login.missingEnvAfter')}
				</p>
			{/if}

			<label class="text-[13px] font-semibold text-moss" for="email">{t('admin.login.email')}</label
			>
			<input
				id="email"
				class="mt-1.5 mb-3.5 w-full rounded-[8px] border border-line-strong bg-bg px-3.5 py-2.5 text-[15px] outline-none focus:border-rust focus:shadow-glow"
				bind:value={email}
				type="email"
				required
				autocomplete="email"
			/>

			<label class="text-[13px] font-semibold text-moss" for="password"
				>{t('admin.login.password')}</label
			>
			<input
				id="password"
				class="mt-1.5 mb-5 w-full rounded-[8px] border border-line-strong bg-bg px-3.5 py-2.5 text-[15px] outline-none focus:border-rust focus:shadow-glow"
				bind:value={password}
				type="password"
				required
				autocomplete="current-password"
			/>

			<Button type="submit" full disabled={submitting}>
				{submitting ? t('admin.login.submitting') : t('admin.login.submit')}
			</Button>

			{#if loginError}
				<p class="mt-4 text-[13px] text-danger" role="alert">{loginError}</p>
			{/if}
		</form>
	</main>
{:else}
	<!-- PANEL -->
	<div class="min-h-dvh bg-bg">
		<header
			class="sticky top-0 z-40 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-bg/90 px-[clamp(16px,4vw,32px)] py-3 backdrop-blur-md"
		>
			<div class="font-display text-[18px] font-semibold">{t('admin.brand')}</div>
			<nav class="flex flex-wrap gap-1">
				{#each tabs as tab (tab.href)}
					<a
						href={tab.href}
						class="rounded-[8px] px-3 py-1.5 text-[14px] font-medium transition-colors"
						class:bg-ink={page.url.pathname === tab.href}
						class:text-bg={page.url.pathname === tab.href}
						class:text-moss={page.url.pathname !== tab.href}
						class:hover:bg-surface={page.url.pathname !== tab.href}
						aria-current={page.url.pathname === tab.href ? 'page' : undefined}
					>
						{tab.label}
					</a>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-3 text-[13px] text-sage">
				<span class="hidden sm:inline">{auth.session.user?.email}</span>
				<LangToggle />
				<ThemeToggle />
				<Button size="sm" variant="ghost" onclick={logout}>
					<IconLogout class="text-[15px]" />
					{t('admin.logout')}
				</Button>
			</div>
		</header>

		<main class="mx-auto max-w-[1100px] px-[clamp(16px,4vw,32px)] py-8">
			{@render children()}
		</main>
	</div>
{/if}
