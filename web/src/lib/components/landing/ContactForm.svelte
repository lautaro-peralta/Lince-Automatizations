<script lang="ts">
	import { apiFetch, type ApiError } from '$lib/api';
	import Button from '$lib/components/Button.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let name = $state('');
	let email = $state('');
	let empresa = $state('');
	let telefono = $state('');
	let message = $state('');
	let website = $state(''); // honeypot

	let loading = $state(false);
	let wasValidated = $state(false);
	let feedback = $state<{ text: string; kind: 'ok' | 'err' | '' }>({ text: '', kind: '' });

	let formEl: HTMLFormElement;

	// Límite por dispositivo: evita que desde una misma computadora se envíen
	// cientos de formularios. Es una barrera de UX (localStorage se puede borrar);
	// el tope real y a prueba de manipulación vive en /api/prospects (por IP).
	const SUBMIT_LIMIT = 5; // envíos permitidos por navegador…
	const SUBMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // …cada 24 h.
	const SUBMIT_KEY = 'lince_lead_submits';

	function recentSubmits(): number[] {
		try {
			const raw = localStorage.getItem(SUBMIT_KEY);
			const arr = raw ? JSON.parse(raw) : [];
			const cutoff = Date.now() - SUBMIT_WINDOW_MS;
			return Array.isArray(arr) ? arr.filter((t) => typeof t === 'number' && t > cutoff) : [];
		} catch {
			return []; // localStorage no disponible: el límite del servidor sigue vigente.
		}
	}

	function recordSubmit() {
		try {
			const arr = recentSubmits();
			arr.push(Date.now());
			localStorage.setItem(SUBMIT_KEY, JSON.stringify(arr));
		} catch {
			/* Sin localStorage no guardamos nada; el servidor sigue limitando por IP. */
		}
	}

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		wasValidated = true;

		if (!formEl.checkValidity()) {
			feedback = { text: t('form.invalid'), kind: 'err' };
			return;
		}

		// Revisión cross-field: al menos email o teléfono debe estar presente.
		if (email.trim() === '' && telefono.trim() === '') {
			feedback = { text: t('form.requireEmailOrPhone'), kind: 'err' };
			return;
		}

		// Trampa anti-bots: un humano nunca completa este campo oculto.
		if (website.trim() !== '') {
			feedback = { text: t('form.botThanks'), kind: 'ok' };
			reset();
			return;
		}

		// Límite por dispositivo: si ya se enviaron varios desde este navegador en
		// las últimas 24 h, no molestamos al servidor y avisamos amablemente.
		if (recentSubmits().length >= SUBMIT_LIMIT) {
			feedback = { text: t('form.rateLimited'), kind: 'err' };
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
					empresa: empresa.trim(),
					telefono: telefono.trim(),
					mensaje: message.trim(),
					website
				}
			});
			recordSubmit();
			reset();
			wasValidated = false;
			feedback = {
				text: t('form.success'),
				kind: 'ok'
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
		name = email = empresa = telefono = message = website = '';
	}

	const fieldClass =
		'w-full rounded-[8px] border border-line-strong bg-bg px-3.5 py-2.5 text-[15px] text-ink ' +
		'outline-none transition-[border-color,box-shadow] focus:border-rust focus:shadow-glow ' +
		'data-[invalid=true]:border-danger';
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
		<label class={labelClass} for="lead-business">
			{t('form.business')} <span class="text-sm font-normal">{t('form.businessOptional')}</span>
		</label>
		<input
			id="lead-business"
			class={fieldClass}
			bind:value={empresa}
			type="text"
			maxlength="120"
			placeholder={t('form.businessPh')}
			autocomplete="organization"
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

	<!-- Deber de información de la Ley 25.326: la política queda a un clic
	     del punto exacto donde se entregan los datos. -->
	<p class="text-[12.5px] text-sage">
		{t('form.privacyPre')}
		<a class="underline transition-colors hover:text-rust" href="/legal/privacidad"
			>{t('form.privacyLink')}</a
		>.
	</p>

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
