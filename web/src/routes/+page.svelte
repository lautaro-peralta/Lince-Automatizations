<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Button from '$lib/components/Button.svelte';
	import Chatbot from '$lib/components/landing/Chatbot.svelte';
	import LiveMonitor from '$lib/components/landing/LiveMonitor.svelte';
	import Receipt from '$lib/components/landing/Receipt.svelte';
	import ContactForm from '$lib/components/landing/ContactForm.svelte';
	import DotField from '$lib/components/landing/DotField.svelte';
	import ScrambleWord from '$lib/components/landing/ScrambleWord.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import lince from '$lib/assets/images/lince-transparente.png?enhanced';

	const verbs = $derived([t('hero.verbs.v1'), t('hero.verbs.v2'), t('hero.verbs.v3')]);

	const pasos = $derived([
		{ n: '01', t: t('process.steps.s1.t'), d: t('process.steps.s1.d') },
		{ n: '02', t: t('process.steps.s2.t'), d: t('process.steps.s2.d') },
		{ n: '03', t: t('process.steps.s3.t'), d: t('process.steps.s3.d') },
		{ n: '04', t: t('process.steps.s4.t'), d: t('process.steps.s4.d') }
	]);
</script>

<svelte:head>
	<title>{t('meta.title')}</title>
	<meta name="description" content={t('meta.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={t('meta.title')} />
	<meta property="og:description" content={t('meta.ogDescription')} />
	<meta property="og:image" content="/og-lince.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<main class="rail-safe">
	<!-- HERO -->
	<section class="relative overflow-hidden pt-16 sm:pt-24">
		<DotField theme="light" />
		<div class="wrap relative z-10">
			<div class="mx-auto max-w-[760px] text-center">
				<p
					class="hero-anim kicker mb-5 inline-flex items-center justify-center gap-2.5"
					style="--d:50ms"
				>
					<span class="pulse-dot" aria-hidden="true"></span>{t('hero.badge')}
				</p>
				<h1
					class="hero-anim mx-auto text-balance text-[clamp(38px,6.2vw,68px)] leading-[1.04]"
					style="--d:150ms"
				>
					{t('hero.titleA')}
					<em class="font-display text-moss italic">{t('hero.titleEm')}</em>{t('hero.titleB')}
					<span class="hero-verb block text-rust">
						<ScrambleWord words={verbs} />
					</span>
				</h1>
				<p class="hero-anim mx-auto mt-6 max-w-[540px] text-[19px] text-sage" style="--d:380ms">
					{t('hero.subtitle')}
				</p>
				<div class="hero-anim mt-9 flex flex-wrap justify-center gap-3.5" style="--d:550ms">
					<Button href="#casos" variant="primary">{t('hero.ctaPrimary')}</Button>
					<Button href="#contacto" variant="ghost">{t('hero.ctaSecondary')}</Button>
				</div>
			</div>
		</div>

		<!-- Lince a todo el ancho: la imagen tiene fondo blanco plano (no alpha real),
		     así que se mezcla con `multiply` para que el blanco se funda con la crema
		     de fondo y sobresalgan las montañas y el lince. -->
		<figure class="hero-lynx relative z-10">
			<enhanced:img src={lince} alt={t('hero.lynxAlt')} sizes="100vw" fetchpriority="high" />
		</figure>
	</section>

	<div class="hatch h-[88px] border-y border-line" aria-hidden="true"></div>

	<!-- CASOS -->
	<section id="casos" class="border-b border-line py-[clamp(56px,9vw,88px)]">
		<div class="wrap">
			<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
				<h2 class="max-w-[16ch] text-[clamp(26px,4vw,38px)]">
					{t('cases.title')}
				</h2>
				<div class="kicker text-sage">{t('cases.meta')}</div>
			</div>
			<p class="max-w-[720px] text-[16.5px] text-sage">
				{t('cases.intro')}
			</p>

			<div class="mt-12 flex flex-col gap-7">
				<!-- Caso 1 -->
				<article class="case reveal" use:reveal>
					<div class="grid md:grid-cols-[1.1fr_1fr]">
						<div class="case-info">
							<span class="case-tag">{t('cases.case1.tag')}</span>
							<h3 class="mb-3 text-[26px]">{t('cases.case1.title')}</h3>
							<p class="case-hook">
								{t('cases.case1.hook')}
							</p>
							<p class="mb-6 text-[15px] text-sage">
								{t('cases.case1.body')}
							</p>
							<p class="case-try">
								<span>{t('cases.case1.try')}</span>
								<svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true">
									<path
										d="M2 10 H22 M16 4 L22 10 L16 16"
										stroke="#C9622E"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</p>
						</div>
						<div class="case-demo"><Chatbot /></div>
					</div>
				</article>

				<!-- Caso 2 -->
				<article class="case reveal" use:reveal>
					<div class="grid md:grid-cols-[1.1fr_1fr]">
						<div class="case-info">
							<span class="case-tag">{t('cases.case2.tag')}</span>
							<h3 class="mb-3 text-[26px]">{t('cases.case2.title')}</h3>
							<p class="case-hook">
								{t('cases.case2.hook')}
							</p>
							<p class="mb-6 text-[15px] text-sage">
								{t('cases.case2.body')}
							</p>
							<p class="case-result">
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<circle cx="10" cy="10" r="9" stroke="#3D5A45" stroke-width="1.5" />
									<path
										d="M6 10.5 L9 13.5 L14 7"
										stroke="#3D5A45"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<span
									>{t('cases.case2.result')}
									<strong>{t('cases.case2.resultStrong')}</strong></span
								>
							</p>
						</div>
						<div class="case-demo"><LiveMonitor /></div>
					</div>
				</article>

				<!-- Caso 3 -->
				<article class="case reveal" use:reveal>
					<div class="grid md:grid-cols-[1.1fr_1fr]">
						<div class="case-info">
							<span class="case-tag">{t('cases.case3.tag')}</span>
							<h3 class="mb-3 text-[26px]">{t('cases.case3.title')}</h3>
							<p class="case-hook">
								{t('cases.case3.hook')}
							</p>
							<p class="mb-6 text-[15px] text-sage">
								{t('cases.case3.body')}
							</p>
							<p class="case-result">
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<circle cx="10" cy="10" r="9" stroke="#3D5A45" stroke-width="1.5" />
									<path
										d="M6 10.5 L9 13.5 L14 7"
										stroke="#3D5A45"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<span
									>{t('cases.case3.result')}
									<strong>{t('cases.case3.resultStrong')}</strong></span
								>
							</p>
						</div>
						<div class="case-demo"><Receipt /></div>
					</div>
				</article>
			</div>

			<!-- Stats -->
			<div class="stats reveal mt-12" use:reveal>
				<div class="stat">
					<div class="stat-num">{t('cases.stats.s1num')}</div>
					<div class="text-sm text-sage">
						{t('cases.stats.s1')}
					</div>
				</div>
				<div class="stat">
					<div class="stat-num">{t('cases.stats.s2num')}</div>
					<div class="text-sm text-sage">
						{t('cases.stats.s2')}
					</div>
				</div>
				<div class="stat">
					<div class="stat-num">{t('cases.stats.s3num')}</div>
					<div class="text-sm text-sage">
						{t('cases.stats.s3')}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- PROCESO (sección oscura en AMBOS temas: usa `text-cream` fijo, no `text-bg`,
	     que se invertiría a oscuro en el tema oscuro). -->
	<section id="proceso" class="relative overflow-hidden bg-night py-[clamp(56px,9vw,88px)] text-cream">
		<DotField theme="dark" />
		<div class="wrap relative z-10">
			<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
				<h2 class="text-[clamp(26px,4vw,38px)] text-cream">{t('process.title')}</h2>
				<div class="kicker text-[rgba(247,245,240,0.55)]">{t('process.kicker')}</div>
			</div>
			<ol class="flex flex-col">
				{#each pasos as step, i (step.n)}
					<li
						class="reveal grid grid-cols-[56px_1fr] gap-5 border-t border-line-light py-7 first:border-t-0 first:pt-0"
						use:reveal={{ delay: i * 80 }}
					>
						<div class="font-mono text-[15px] text-rust">{step.n}</div>
						<div>
							<h3 class="mb-1.5 text-[20px] text-cream">{step.t}</h3>
							<p class="max-w-[680px] text-[15.5px] text-[rgba(247,245,240,0.7)]">{step.d}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<!-- CONTACTO -->
	<section id="contacto" class="py-[clamp(64px,10vw,104px)]">
		<div class="wrap">
			<div class="mb-10 max-w-[720px]">
				<h2 class="mb-4 text-[clamp(28px,4.5vw,42px)]">{t('contact.title')}</h2>
				<p class="text-[18px] text-sage">{t('contact.subtitle')}</p>
			</div>

			<div class="reveal grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]" use:reveal>
				<div class="rounded-2xl border border-line bg-surface p-7 sm:p-9">
					<ContactForm />
				</div>

				<aside class="flex flex-col gap-4">
					<div class="rounded-2xl border border-line bg-surface p-7">
						<div class="kicker mb-1 text-moss">{t('contact.infoTitle')}</div>
						<p class="mb-5 text-[14.5px] text-sage">{t('contact.infoIntro')}</p>
						<ul class="flex flex-col gap-1.5">
							<li>
								<a
									class="channel-row"
									href={`mailto:${t('contact.emailValue')}`}
									aria-label={`${t('contact.emailLabel')}: ${t('contact.emailValue')}`}
								>
									<span class="channel-icon" aria-hidden="true">
										<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
									</span>
									<span class="channel-body">
										<span class="channel-label">{t('contact.emailLabel')}</span>
										<span class="channel-value">{t('contact.emailValue')}</span>
									</span>
								</a>
							</li>
							<li>
								<a
									class="channel-row"
									href={`https://wa.me/${t('contact.whatsappValue').replace(/[^0-9]/g, '')}`}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`${t('contact.whatsappLabel')}: ${t('contact.whatsappValue')}`}
								>
									<span class="channel-icon" aria-hidden="true">
										<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
									</span>
									<span class="channel-body">
										<span class="channel-label">{t('contact.whatsappLabel')}</span>
										<span class="channel-value">{t('contact.whatsappValue')}</span>
									</span>
								</a>
							</li>
							<li>
								<a
									class="channel-row"
									href={`https://instagram.com/${t('contact.instagramValue').replace(/^@/, '')}`}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`${t('contact.instagramLabel')}: ${t('contact.instagramValue')}`}
								>
									<span class="channel-icon" aria-hidden="true">
										<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
									</span>
									<span class="channel-body">
										<span class="channel-label">{t('contact.instagramLabel')}</span>
										<span class="channel-value">{t('contact.instagramValue')}</span>
									</span>
								</a>
							</li>
						</ul>
					</div>

					<p class="reply-note kicker">
						<span class="reply-dot" aria-hidden="true"></span>
						{t('contact.replyValue')}
					</p>
				</aside>
			</div>
		</div>
	</section>

	<div class="hatch h-[64px] border-t border-line" aria-hidden="true"></div>
</main>

<style>
	/* Entrada escalonada del hero (usa la variable --d como retardo). */
	.hero-anim {
		opacity: 0;
		animation: heroIn 0.9s var(--ease-out-expo) forwards;
		animation-delay: var(--d, 0ms);
	}
	@keyframes heroIn {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.pulse-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-rust);
		animation: pulse 2.4s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.8);
		}
	}

	/* Lince full-bleed. La imagen tiene fondo blanco plano (no alpha real), así
	   que se pinta la crema del sitio como fondo del contenedor y se aplica
	   `mix-blend-mode: multiply` sobre esa capa: el blanco del cielo se funde
	   con la crema y quedan sobresaliendo las montañas y el lince, sin editar
	   el archivo. `isolation: isolate` limita el blend a este contenedor para
	   que no afecte al DotField ni al hero. */
	.hero-lynx {
		position: relative;
		z-index: 1;
		margin: 48px calc(50% - 50vw) -26px;
		height: clamp(220px, 42vw, 600px);
		overflow: hidden;
		isolation: isolate;
		background: var(--color-bg);
	}
	.hero-lynx :global(img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center bottom;
		display: block;
		opacity: 0;
		mix-blend-mode: multiply;
		animation: lynxIn 1.4s var(--ease-out-expo) 0.3s forwards;
	}
	:global([data-theme='dark']) .hero-lynx {
		/* En oscuro cambiamos a `screen` sobre el carbón: el blanco satura al
		   fondo (no aparece un cuadro blanco) y las montañas y el lince se
		   leen recortadas contra el mismo. */
		background: var(--color-bg);
	}
	:global([data-theme='dark']) .hero-lynx :global(img) {
		mix-blend-mode: screen;
	}
	@keyframes lynxIn {
		from {
			opacity: 0;
			transform: scale(1.04);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@media (max-width: 860px) {
		.hero-lynx {
			height: clamp(180px, 44vw, 340px);
			margin-top: 32px;
		}
	}

	/* Tarjetas de caso. */
	.case {
		border: 1px solid var(--color-line-strong);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-bg);
		transition:
			transform 0.3s var(--ease-out-expo),
			box-shadow 0.3s ease;
	}
	.case:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-card);
	}
	.case-info {
		padding: 36px;
		display: flex;
		flex-direction: column;
		border-bottom: 1px solid var(--color-line);
	}
	@media (min-width: 768px) {
		.case-info {
			border-bottom: none;
			border-right: 1px solid var(--color-line);
		}
	}
	.case-tag {
		font-family: var(--font-mono);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-moss);
		background: var(--color-surface);
		border: 1px solid var(--color-line);
		border-radius: 5px;
		padding: 4px 10px;
		width: fit-content;
		margin-bottom: 16px;
	}
	.case-hook {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 16.5px;
		line-height: 1.5;
		color: var(--color-ink);
		border-left: 2px solid var(--color-rust);
		padding-left: 14px;
		margin-bottom: 22px;
	}
	.case-try {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 500;
		font-size: 23px;
		line-height: 1.2;
		color: var(--color-rust);
		margin-top: auto;
		display: inline-flex;
		align-items: center;
		gap: 11px;
	}
	.case-try svg {
		flex-shrink: 0;
		animation: nudge 1.6s ease-in-out infinite;
	}
	@keyframes nudge {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(5px);
		}
	}
	.case-result {
		margin-top: auto;
		padding-top: 20px;
		border-top: 1px solid var(--color-line);
		display: flex;
		align-items: center;
		gap: 11px;
		font-size: 15px;
		color: var(--color-ink);
	}
	.case-result svg {
		flex-shrink: 0;
	}
	.case-result strong {
		font-weight: 600;
		color: var(--color-moss);
	}
	.case-demo {
		padding: 36px;
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Franja de stats. */
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: var(--color-line-strong);
		border: 1px solid var(--color-line-strong);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	@media (max-width: 600px) {
		.stats {
			grid-template-columns: 1fr;
		}
	}
	.stat {
		background: var(--color-bg);
		padding: 28px;
	}
	.stat-num {
		font-family: var(--font-display);
		font-size: 38px;
		font-weight: 500;
		color: var(--color-moss);
		line-height: 1;
		margin-bottom: 8px;
	}

	/* Reserva espacio a la izquierda para que el índice lateral no tape el contenido. */
	.rail-safe {
		padding-left: 36px;
	}
	@media (min-width: 640px) {
		.rail-safe {
			padding-left: 48px;
		}
	}

	/* Verbo animado del hero: se muestra en su propio renglón centrado, con el
	   color rust — el ancho lo reserva `ScrambleWord` con su ghost interno. */
	.hero-verb {
		margin-top: 0.2em;
	}

	/* Filas de canal (Email / WhatsApp / Instagram) en la card de contacto.
	   Todo el bloque es clickeable; el icono vira a rust al pasar el mouse. */
	.channel-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 10px;
		border-radius: 10px;
		color: var(--color-ink);
		text-decoration: none;
		transition: background-color 0.15s ease, color 0.15s ease;
	}
	.channel-row:hover {
		background: var(--color-bg);
	}
	.channel-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		border-radius: 8px;
		background: var(--color-bg);
		border: 1px solid var(--color-line);
		color: var(--color-moss);
		transition: color 0.15s ease, border-color 0.15s ease;
	}
	.channel-row:hover .channel-icon {
		color: var(--color-rust);
		border-color: var(--color-rust);
	}
	.channel-body {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.channel-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-sage);
	}
	.channel-value {
		font-size: 15px;
		font-weight: 500;
		color: var(--color-ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.reply-note {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		align-self: flex-start;
		padding: 8px 14px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: var(--color-bg);
		color: var(--color-sage);
	}
	.reply-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-moss);
	}
</style>
