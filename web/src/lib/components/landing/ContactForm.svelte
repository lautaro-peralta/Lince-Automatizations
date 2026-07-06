<script lang="ts">
	import { apiFetch, type ApiError } from '$lib/api';
	import Button from '$lib/components/Button.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let name = $state('');
	let email = $state('');
	let telefono = $state('');
	let message = $state('');
	let website = $state(''); // honeypot

	let loading = $state(false);
	let wasValidated = $state(false);
	let feedback = $state<{ text: string; kind: 'ok' | 'err' | '' }>({ text: '', kind: '' });

	let formEl: HTMLFormElement;

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		wasValidated = true;

		if (!formEl.checkValidity()) {
			feedback = { text: t('form.invalid'), kind: 'err' };
			return;
		}

		// Revisión cross-field: al menos email o teléfono debe estar presente.
		if (email.trim() === '' && telefono.trim() === '') {
			feedback = { text: t('form.requireEmailOrPhone') || 'Por favor ingresá un email o un teléfono.', kind: 'err' };
			return;
		}

		// Trampa anti-bots: un humano nunca completa este campo oculto.
		if (website.trim() !== '') {
			feedback = { text: t('form.botThanks'), kind: 'ok' };
			reset();
			return;
		}

		loading = true;
		feedback = { text: t('form.sending'), kind: '' };

		try {
			// Enviar a /api/prospects para que active el webhook n8n (y use rate-limit/validación del endpoint).
			await apiFetch('/api/prospects', {
				method: 'POST',
				body: {
					nombre: name.trim(),
					email: email.trim(),
					telefono: telefono.trim(),
					mensaje: message.trim(),
					website,
				},
			});
			reset();
			wasValidated = false;
			feedback = {
				text: t('form.success'),
				kind: 'ok',
			};
		} catch (e) {
			const err = e as ApiError;
			const msg = err.status === 0 ? t('errors.networkRetry') : err.message || t('errors.generic');
			feedback = { text: msg, kind: 'err' };
		} finally {
			loading = false;
		}
	}

	function reset() {
		name = email = telefono = message = website = '';
	}

	const fieldClass =
		'w-full rounded-[8px] border border-line-strong bg-bg px-3.5 py-2.5 text-[15px] text-ink ' +
		'outline-none transition-[border-color,box-shadow] focus:border-rust focus:shadow-glow ' +
		"data-[invalid=true]:border-danger";
	const labelClass = 'text-[13px] font-semibold text-moss';
</script>

<form
	bind:this={formEl}
	class="mt-7 flex max-w-[460px] flex-col gap-3.5"
	novalidate
	onsubmit={onSubmit}
>
	<div class="flex flex-col gap-1.5">
		<label class={labelClass} for="lead-name">{t('form.name')}</label>
		<input
			id="lead-name"
			class={fieldClass}
			data-invalid={wasValidated && !name.trim()}
			bind:value={name}
			type="text"
			required
			maxlength="80"
			autocomplete="name"
			placeholder={t('form.namePh')}
		/>
	</div>

	<div class="flex flex-col gap-1.5">
		<label class={labelClass} for="lead-email">{t('form.email')}</label>
		<input
			id="lead-email"
			class={fieldClass}
			data-invalid={wasValidated && email.trim() === '' && telefono.trim() === ''}
			bind:value={email}
			type="email"
			maxlength="200"
			placeholder={t('form.emailPh')}
			autocomplete="email"
		/>
	</div>

	<div class="flex flex-col gap-1.5">
		<label class={labelClass} for="lead-phone">{t('form.phone')}</label>
		<input
			id="lead-phone"
			class={fieldClass}
			data-invalid={wasValidated && email.trim() === '' && telefono.trim() === ''}
			bind:value={telefono}
			type="tel"
			maxlength="30"
			placeholder={t('form.phonePh')}
			autocomplete="tel"
		/>
	</div>

	<div class="flex flex-col gap-1.5">
		<label class={labelClass} for="lead-message">{t('form.message')}</label>
		<textarea
			id="lead-message"
			class="{fieldClass} resize-y"
			data-invalid={wasValidated && !message.trim()}
			bind:value={message}
			required
			maxlength="1000"
			rows="3"
			placeholder={t('form.messagePh')}></textarea>
	</div>

	<!-- Honeypot anti-spam: invisible para humanos; si viene lleno, se descarta. -->
	<input
		class="absolute left-[-9999px] h-px w-px overflow-hidden"
		bind:value={website}
		type="text"
		name="website"
		tabindex="-1"
		autocomplete="off"
		aria-hidden="true"
	/>

	<Button type="submit" disabled={loading} class="self-start">
		{loading ? t('form.submitting') : t('form.submit')}
	</Button>

	<p
		class="min-h-[20px] text-sm"
		class:text-moss={feedback.kind === 'ok'}
		class:text-danger={feedback.kind === 'err'}
		role="status"
		aria-live="polite"
	>
		{feedback.text}
	</p>
</form>
