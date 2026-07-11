<script lang="ts">
	import { page } from '$app/state';
	import {
		auth,
		initAuth,
		loginErrorMessage,
		passwordUpdateErrorMessage,
		sendPasswordReset,
		updatePassword
	} from '$lib/admin/auth.svelte';
	import { supabase } from '$lib/supabase';
	import Button from '$lib/components/Button.svelte';
	import Brand from '$lib/components/Brand.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import PasswordField from '$lib/components/admin/PasswordField.svelte';
	import PasswordStrength from '$lib/components/admin/PasswordStrength.svelte';
	import { isPasswordValid } from '$lib/utils/password';
	import { t } from '$lib/i18n/index.svelte';
	import IconLogout from '~icons/lucide/log-out';

	let { children } = $props();

	initAuth();

	// Si se llegó con ?next=/startup-os/... o /teams/... (redirigido desde una
	// herramienta interna por falta de sesión), al quedar logueado lo mandamos
	// de vuelta allá. Solo rutas internas propias (evita open-redirect).
	const INTERNAL_NEXT = ['/startup-os', '/teams'];
	$effect(() => {
		if (!auth.session || typeof window === 'undefined') return;
		const next = page.url.searchParams.get('next');
		if (next && INTERNAL_NEXT.some((p) => next === p || next.startsWith(p + '/'))) {
			window.location.href = next;
		}
	});

	let email = $state('');
	let password = $state('');
	let loginError = $state('');
	let submitting = $state(false);
	let emailEl = $state<HTMLInputElement | null>(null);

	// Recuperación de contraseña
	let resetMsg = $state('');
	let resetSending = $state(false);

	// Vista "elegí una contraseña nueva" (tras llegar desde el email)
	let newPassword = $state('');
	let savingPassword = $state(false);
	let pwError = $state('');
	const pwValid = $derived(isPasswordValid(newPassword));

	const tabs = $derived([
		{ href: '/admin', label: t('admin.tabs.summary') },
		{ href: '/admin/leads', label: t('admin.tabs.leads') },
		{ href: '/admin/presupuestos', label: t('admin.tabs.budgets') },
		{ href: '/admin/resenas', label: t('admin.tabs.reviews') }
	]);

	async function onLogin(event: SubmitEvent) {
		event.preventDefault();
		loginError = '';
		resetMsg = '';
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

	async function onForgot() {
		if (!email.trim()) {
			emailEl?.focus();
			return;
		}
		loginError = '';
		resetMsg = '';
		resetSending = true;
		try {
			const { error } = await sendPasswordReset(email);
			resetMsg = error ? t('admin.login.resetError') : t('admin.login.resetSent');
		} catch {
			resetMsg = t('admin.login.resetError');
		} finally {
			resetSending = false;
		}
	}

	async function onSetPassword(event: SubmitEvent) {
		event.preventDefault();
		pwError = '';
		if (!pwValid) {
			pwError = t('admin.login.passwordWeak');
			return;
		}
		savingPassword = true;
		try {
			const { error } = await updatePassword(newPassword);
			// La política real la aplica Supabase: si rechaza (largo, complejidad,
			// "distinta de la anterior", contraseña filtrada), mostramos un mensaje
			// acorde a esta pantalla, no el de login.
			if (error) pwError = passwordUpdateErrorMessage(error);
			else newPassword = '';
			// Al limpiar auth.recovery, la vista pasa sola al panel (ya hay sesión).
		} finally {
			savingPassword = false;
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
{:else if auth.recovery}
	<!-- ELEGIR CONTRASEÑA NUEVA (llegó desde el email de recuperación) -->
	<main class="grid min-h-dvh place-items-center bg-bg px-5 py-10">
		<form
			class="w-full max-w-[380px] rounded-xl border border-line bg-surface p-7 shadow-card"
			onsubmit={onSetPassword}
		>
			<div class="mb-6 flex items-start justify-between gap-3">
				<Brand label={t('admin.brandLabel')} />
				<div class="flex items-center gap-2">
					<LangToggle />
					<ThemeToggle />
				</div>
			</div>

			<h1 class="font-display text-[20px] font-semibold">{t('admin.login.recoverTitle')}</h1>
			<p class="mb-5 text-sm text-sage">{t('admin.login.recoverSubtitle')}</p>

			<label class="text-[13px] font-semibold text-moss" for="newpass"
				>{t('admin.login.newPassword')}</label
			>
			<div class="mt-1.5">
				<PasswordField
					id="newpass"
					bind:value={newPassword}
					autocomplete="new-password"
					required
					placeholder={t('admin.login.newPasswordPh')}
					describedby="pw-rules"
					invalid={!!pwError && !pwValid}
				/>
			</div>

			<PasswordStrength id="pw-rules" value={newPassword} />

			<div class="mt-5">
				<Button type="submit" full disabled={savingPassword || !pwValid}>
					{savingPassword ? t('admin.login.savingPassword') : t('admin.login.savePassword')}
				</Button>
			</div>

			{#if pwError}
				<p class="mt-4 text-[13px] text-danger" role="alert">{pwError}</p>
			{/if}
		</form>
	</main>
{:else if !auth.session}
	<!-- LOGIN -->
	<main class="grid min-h-dvh place-items-center bg-bg px-5 py-10">
		<form
			class="w-full max-w-[380px] rounded-xl border border-line bg-surface p-7 shadow-card"
			onsubmit={onLogin}
		>
			<div class="mb-6 flex items-start justify-between gap-3">
				<Brand label={t('admin.brandLabel')} />
				<div class="flex items-center gap-2">
					<LangToggle />
					<ThemeToggle />
				</div>
			</div>

			<h1 class="mb-5 font-display text-[20px] font-semibold">{t('admin.login.subtitle')}</h1>

			<label class="text-[13px] font-semibold text-moss" for="email">{t('admin.login.email')}</label
			>
			<input
				id="email"
				bind:this={emailEl}
				class="mt-1.5 mb-3.5 w-full rounded-[8px] border border-line-strong bg-bg px-3.5 py-2.5 text-[15px] outline-none focus:border-rust focus:shadow-glow"
				bind:value={email}
				type="email"
				required
				autocomplete="email"
			/>

			<label class="text-[13px] font-semibold text-moss" for="password"
				>{t('admin.login.password')}</label
			>
			<div class="mt-1.5 mb-5">
				<PasswordField
					id="password"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
			</div>

			<Button type="submit" full disabled={submitting}>
				{submitting ? t('admin.login.submitting') : t('admin.login.submit')}
			</Button>

			<button
				type="button"
				class="mt-3 text-[13px] text-moss underline underline-offset-2 hover:text-rust disabled:opacity-60"
				onclick={onForgot}
				disabled={resetSending}
			>
				{resetSending ? t('admin.login.resetSending') : t('admin.login.forgot')}
			</button>

			{#if resetMsg}
				<p class="mt-3 text-[13px] text-sage">{resetMsg}</p>
			{/if}

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
			<Brand label={t('admin.brandLabel')} size="sm" />
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
				<a
					href="/teams/"
					class="rounded-[8px] border border-line-strong px-3 py-1.5 text-[13px] font-medium text-moss transition-colors hover:border-ink hover:text-ink"
				>
					{t('admin.teams')}
				</a>
				<a
					href="/teams/#integrations"
					class="rounded-[8px] border border-line-strong px-3 py-1.5 text-[13px] font-medium text-moss transition-colors hover:border-ink hover:text-ink"
				>
					{t('admin.integrations')}
				</a>
				<a
					href="/startup-os/"
					class="rounded-[8px] border border-line-strong px-3 py-1.5 text-[13px] font-medium text-moss transition-colors hover:border-ink hover:text-ink"
				>
					{t('admin.startupOs')}
				</a>
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
