<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		getChatbot,
		type ChatNode,
		type ChatOption,
		type ChatInput,
		type ChatState,
		type ConfirmData
	} from '$lib/data/chatbot';
	import { t, getLocale, type Locale } from '$lib/i18n/index.svelte';

	// Árbol y validadores del idioma actual (reactivo): cambiar de idioma
	// reconstruye la conversación al instante.
	const chatbot = $derived(getChatbot(getLocale()));

	type Msg =
		| { kind: 'msg'; who: 'bot' | 'user'; text: string; time: string }
		| { kind: 'confirm'; data: ConfirmData };

	type Controls =
		| { kind: 'none' }
		| { kind: 'options'; options: ChatOption[] }
		| { kind: 'input'; cfg: ChatInput }
		| { kind: 'restart'; soft: boolean };

	let messages = $state<Msg[]>([]);
	let typing = $state(false);
	let status = $state(t('chat.online'));
	let controls = $state<Controls>({ kind: 'none' });
	let inputValue = $state('');

	let conv: ChatState = {};
	let bodyEl: HTMLDivElement;
	let inputEl = $state<HTMLInputElement | null>(null);
	let rootEl: HTMLDivElement;

	let destroyed = false;
	const timers: ReturnType<typeof setTimeout>[] = [];
	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timers.push(setTimeout(r, ms));
		});
	}

	function now(): string {
		const d = new Date();
		return (
			d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
		);
	}

	async function scrollDown() {
		await tick();
		if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
	}

	function addMsg(text: string, who: 'bot' | 'user') {
		messages.push({ kind: 'msg', who, text, time: now() });
		scrollDown();
	}

	function resolveMsgs(field: ChatNode['bot'] | ChatNode['after']): string[] {
		if (!field) return [];
		if (typeof field === 'function') return field(conv).slice();
		return field.slice();
	}

	async function goTo(key: string) {
		const node = chatbot.tree[key];
		if (!node) return;
		status = t('chat.typing');
		typing = true;
		scrollDown();
		await sleep(650);
		if (destroyed) return;
		typing = false;
		status = t('chat.online');

		const msgs = resolveMsgs(node.bot);
		for (let i = 0; i < msgs.length; i++) {
			addMsg(msgs[i], 'bot');
			if (i < msgs.length - 1) await sleep(560);
			if (destroyed) return;
		}

		if (node.confirm) {
			await sleep(450);
			if (destroyed) return;
			messages.push({ kind: 'confirm', data: node.confirm(conv) });
			scrollDown();
			const afterMsgs = resolveMsgs(node.after);
			if (afterMsgs.length) {
				await sleep(650);
				if (destroyed) return;
				addMsg(afterMsgs[0], 'bot');
				await sleep(450);
			} else {
				await sleep(700);
			}
			if (destroyed) return;
			controls = { kind: 'restart', soft: false };
			return;
		}

		if (node.input) {
			await sleep(200);
			if (destroyed) return;
			controls = { kind: 'input', cfg: node.input };
			focusInput();
			return;
		}
		if (node.options) {
			controls = { kind: 'options', options: node.options };
			return;
		}
		if (node.end) {
			controls = { kind: 'restart', soft: !!node.softend };
		}
	}

	function chooseOption(opt: ChatOption) {
		addMsg(opt.userEcho || opt.label, 'user');
		if (opt.set) Object.assign(conv, opt.set);
		controls = { kind: 'none' };
		goTo(opt.next);
	}

	async function submitInput() {
		if (controls.kind !== 'input') return;
		const cfg = controls.cfg;
		const val = inputValue.trim();
		if (!val) return;
		addMsg(val, 'user');
		inputValue = '';

		const validate = chatbot.validators[cfg.validate || cfg.key];
		const err = validate ? validate(val) : null;
		if (err) {
			controls = { kind: 'none' };
			status = t('chat.typing');
			typing = true;
			scrollDown();
			await sleep(600);
			if (destroyed) return;
			typing = false;
			status = t('chat.online');
			addMsg(err, 'bot');
			await sleep(250);
			if (destroyed) return;
			controls = { kind: 'input', cfg };
			focusInput();
			return;
		}

		conv[cfg.key] = cfg.clean ? cfg.clean(val) : val;
		controls = { kind: 'none' };
		goTo(cfg.next);
	}

	async function focusInput() {
		await tick();
		inputEl?.focus();
	}

	function start() {
		// Cancela timers en vuelo: si había un `goTo` esperando un `sleep`, su
		// promesa nunca se resuelve y la cadena vieja queda detenida sin inyectar
		// mensajes en la conversación nueva (clave al reiniciar por cambio de idioma).
		timers.forEach(clearTimeout);
		timers.length = 0;
		conv = {};
		messages = [];
		typing = false;
		status = t('chat.online');
		controls = { kind: 'none' };
		const node = chatbot.tree.start;
		const first = Array.isArray(node.bot) ? node.bot[0] : '';
		addMsg(first, 'bot');
		timers.push(
			setTimeout(() => {
				if (node.options) controls = { kind: 'options', options: node.options };
			}, 350)
		);
	}

	// Flags no reactivos: solo queremos que el efecto de abajo reaccione al idioma.
	let begun = false;
	let activeLocale: Locale | null = null;

	// Reinicia la conversación en el nuevo idioma cuando el usuario cambia el idioma
	// (pero no en el primer render: ahí solo registramos el idioma activo).
	$effect(() => {
		const locale = getLocale();
		if (!begun) {
			activeLocale = locale;
			return;
		}
		if (locale !== activeLocale) {
			activeLocale = locale;
			start();
		}
	});

	onMount(() => {
		const begin = () => {
			if (begun) return;
			begun = true;
			activeLocale = getLocale();
			start();
		};
		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => {
					for (const e of entries) {
						if (e.isIntersecting) {
							begin();
							io.disconnect();
						}
					}
				},
				{ threshold: 0.4 }
			);
			io.observe(rootEl);
			return () => {
				destroyed = true;
				io.disconnect();
				timers.forEach(clearTimeout);
			};
		}
		begin();
		return () => {
			destroyed = true;
			timers.forEach(clearTimeout);
		};
	});
</script>

<div class="wa" bind:this={rootEl}>
	<div class="wa-header">
		<div class="wa-avatar" aria-hidden="true">
			<svg width="18" height="18" viewBox="0 0 40 40" fill="none">
				<path
					d="M20 5 L33 13 L33 27 L20 35 L7 27 L7 13 Z"
					stroke="#fff"
					stroke-width="2"
					fill="none"
				/>
				<path
					d="M14 18 L20 23 L26 18"
					stroke="#fff"
					stroke-width="2"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
		<div>
			<div class="wa-name">{t('chat.businessName')}</div>
			<div class="wa-status">{status}</div>
		</div>
	</div>

	<div
		class="wa-body"
		bind:this={bodyEl}
		role="log"
		aria-live="polite"
		aria-label={t('chat.logAria')}
	>
		{#each messages as msg, i (i)}
			{#if msg.kind === 'msg'}
				<div class="wa-msg {msg.who}">
					{msg.text}<span class="wa-time">{msg.time}</span>
				</div>
			{:else}
				<div class="wa-confirm">
					<div class="wa-confirm-head">
						<svg width="14" height="14" viewBox="0 0 20 20" fill="none">
							<circle cx="10" cy="10" r="9" stroke="#3D5A45" stroke-width="1.6" />
							<path
								d="M6 10.5 L9 13.5 L14 7"
								stroke="#3D5A45"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						{msg.data.type}
					</div>
					{#each msg.data.rows as row (row[0])}
						<div class="wa-confirm-row"><span>{row[0]}</span><span>{row[1]}</span></div>
					{/each}
				</div>
			{/if}
		{/each}

		{#if typing}
			<div class="wa-typing" aria-label={t('chat.typingAria')}>
				<span></span><span></span><span></span>
			</div>
		{/if}
	</div>

	<div class="wa-options">
		{#if controls.kind === 'options'}
			{#each controls.options as opt (opt.label)}
				<button class="wa-opt" onclick={() => chooseOption(opt)}>{opt.label}</button>
			{/each}
		{:else if controls.kind === 'input'}
			<div class="wa-input-row">
				<input
					bind:this={inputEl}
					bind:value={inputValue}
					type="text"
					maxlength="40"
					placeholder={controls.cfg.placeholder}
					onkeydown={(e) => e.key === 'Enter' && submitInput()}
					aria-label={t('chat.inputAria')}
				/>
				<button
					class="wa-send"
					onclick={submitInput}
					disabled={!inputValue.trim()}
					aria-label={t('chat.sendAria')}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<path d="M4 12 L20 4 L13 20 L11 13 Z" fill="#fff" />
					</svg>
				</button>
			</div>
		{:else if controls.kind === 'restart'}
			<button class="wa-restart" onclick={start}>
				{controls.soft ? t('chat.restartSoft') : t('chat.restartHard')}
			</button>
		{/if}
	</div>
</div>

<style>
	.wa {
		width: 100%;
		max-width: 330px;
		background: #ece5dd;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 14px 32px -20px rgba(27, 43, 35, 0.45);
		display: flex;
		flex-direction: column;
		height: 460px;
	}
	/* El chatbot imita una pantalla de WhatsApp (clara), así que sus colores de
	   contraste se fijan en hex de marca y NO se invierten en el tema oscuro. */
	.wa-header {
		background: #1b2b23;
		color: #fff;
		padding: 11px 14px;
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}
	.wa-avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--color-rust);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.wa-name {
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 600;
		line-height: 1.2;
	}
	.wa-status {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.7);
	}
	.wa-body {
		flex: 1;
		overflow-y: auto;
		padding: 14px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		scroll-behavior: smooth;
	}
	.wa-msg {
		max-width: 82%;
		padding: 7px 11px;
		border-radius: 9px;
		font-size: 13.5px;
		line-height: 1.42;
		font-family: var(--font-sans);
		position: relative;
		animation: waPop 0.32s var(--ease-out-expo);
		white-space: pre-line;
	}
	@keyframes waPop {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	.wa-msg.bot {
		align-self: flex-start;
		background: #fff;
		color: #1b2b23;
		border-top-left-radius: 2px;
	}
	.wa-msg.user {
		align-self: flex-end;
		background: #dcf8c6;
		color: #102a13;
		border-top-right-radius: 2px;
	}
	.wa-time {
		display: block;
		font-size: 9.5px;
		color: rgba(27, 43, 35, 0.4);
		text-align: right;
		margin-top: 3px;
	}
	.wa-typing {
		align-self: flex-start;
		background: #fff;
		padding: 9px 13px;
		border-radius: 9px;
		border-top-left-radius: 2px;
		display: flex;
		gap: 4px;
	}
	.wa-typing span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #5a6f62;
		animation: thinkBounce 1.1s ease-in-out infinite;
	}
	.wa-typing span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.wa-typing span:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes thinkBounce {
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-3px);
		}
	}
	.wa-options {
		flex-shrink: 0;
		padding: 10px 12px;
		background: #ece5dd;
		border-top: 1px solid rgba(27, 43, 35, 0.08);
		display: flex;
		flex-direction: column;
		gap: 7px;
		min-height: 8px;
	}
	.wa-opt {
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		text-align: left;
		padding: 9px 13px;
		border-radius: 8px;
		border: 1px solid rgba(27, 43, 35, 0.22);
		background: #fff;
		color: #1b2b23;
		cursor: pointer;
		transition:
			transform 0.12s,
			border-color 0.12s,
			background 0.12s;
		animation: waPop 0.3s var(--ease-out-expo);
	}
	.wa-opt:hover {
		border-color: var(--color-rust);
		background: #fff7f2;
		transform: translateY(-1px);
	}
	.wa-restart {
		font-family: var(--font-mono);
		font-size: 12px;
		color: #3d5a45;
		background: none;
		border: none;
		cursor: pointer;
		padding: 9px;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.wa-restart:hover {
		color: var(--color-rust);
	}
	.wa-confirm {
		align-self: stretch;
		background: #fff;
		border: 1px solid #3d5a45;
		border-radius: 9px;
		padding: 12px 14px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: #1b2b23;
		animation: waPop 0.4s var(--ease-out-expo);
	}
	.wa-confirm-head {
		display: flex;
		align-items: center;
		gap: 7px;
		font-weight: 500;
		color: #3d5a45;
		margin-bottom: 9px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 11px;
	}
	.wa-confirm-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 5px;
	}
	.wa-confirm-row span:first-child {
		color: #5a6f62;
	}
	.wa-confirm-row span:last-child {
		text-align: right;
	}
	.wa-input-row {
		display: flex;
		gap: 7px;
		align-items: center;
		animation: waPop 0.3s var(--ease-out-expo);
	}
	.wa-input-row input {
		flex: 1;
		font-family: var(--font-sans);
		font-size: 13px;
		padding: 9px 13px;
		border-radius: 8px;
		border: 1px solid rgba(27, 43, 35, 0.22);
		background: #fff;
		color: #1b2b23;
		outline: none;
		transition: border-color 0.12s;
	}
	.wa-input-row input:focus {
		border-color: var(--color-rust);
	}
	.wa-send {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: none;
		background: #3d5a45;
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.12s,
			background 0.12s;
	}
	.wa-send:hover {
		background: var(--color-rust);
		transform: scale(1.05);
	}
	.wa-send:disabled {
		opacity: 0.4;
		cursor: default;
		transform: none;
	}
</style>
