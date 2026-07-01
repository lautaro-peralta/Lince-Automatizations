<script lang="ts">
	import { apiFetch, type ApiError } from '$lib/api';
	import Button from '$lib/components/Button.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let name = $state('');
	let business = $state('');
	let contact = $state('');
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

		// Trampa anti-bots: un humano nunca completa este campo oculto.
		if (website.trim() !== '') {
			feedback = { text: t('form.botThanks'), kind: 'ok' };
			reset();
			return;
		}

		loading = true;
		feedback = { text: t('form.sending'), kind: '' };

		try {
			await apiFetch('/api/leads', {
				method: 'POST',
				body: {
					name: name.trim(),
					business: business.trim(),
					contact: contact.trim(),
					message: message.trim(),
					website
				}
			});
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
		name = business = contact = message = website = '';
	}

	const fieldClass =
		'w-full rounded-[8px] border border-line-strong bg-bg px-3.5 py-2.5 text-[15px] text-ink ' +
		'outline-none transition-[border-color,box-shadow] focus:border-rust focus:shadow-glow ' +
		'data-[invalid=true]:border-danger';
	const labelClass = 'text-[13px] font-semibold text-moss';
</script>

<form bind:this={formEl} class="mt-7 flex flex-col gap-3.5" novalidate onsubmit={onSubmit}>
	<div class="grid gap-3.5 sm:grid-cols-2">
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
			<label class={labelClass} for="lead-business">
				{t('form.business')} <span class="font-normal text-sage">{t('form.businessOptional')}</span>
			</label>
			<input
				id="lead-business"
				class={fieldClass}
				bind:value={business}
				type="text"
				maxlength="120"
				autocomplete="organization"
				placeholder={t('form.businessPh')}
			/>
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
		<label class={labelClass} for="lead-contact">{t('form.contact')}</label>
		<input
			id="lead-contact"
			class={fieldClass}
			data-invalid={wasValidated && !contact.trim()}
			bind:value={contact}
			type="text"
			required
			maxlength="120"
			placeholder={t('form.contactPh')}
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
