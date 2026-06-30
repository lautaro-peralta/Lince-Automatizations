<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Button from '$lib/components/Button.svelte';
	import Chatbot from '$lib/components/landing/Chatbot.svelte';
	import LiveMonitor from '$lib/components/landing/LiveMonitor.svelte';
	import Receipt from '$lib/components/landing/Receipt.svelte';
	import ContactForm from '$lib/components/landing/ContactForm.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import lince from '$lib/assets/images/lince.png?enhanced';

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

<!-- HEADER -->
<header class="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
	<div class="wrap flex items-center justify-between py-4">
		<a class="flex items-center gap-2.5 font-display text-[21px] font-semibold" href="/">
			<svg
				class="h-[30px] w-[30px] shrink-0"
				viewBox="0 0 40 40"
				fill="none"
				role="img"
				aria-label="Lince"
			>
				<path
					d="M20 4 L34 13 L34 27 L20 36 L6 27 L6 13 Z"
					stroke="#1B2B23"
					stroke-width="1.6"
					fill="none"
				/>
				<path
					d="M14 17 L20 23 L26 17"
					stroke="#C9622E"
					stroke-width="1.8"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<circle cx="14" cy="14" r="1.6" fill="#1B2B23" />
				<circle cx="26" cy="14" r="1.6" fill="#1B2B23" />
			</svg>
			Lince
		</a>
		<nav class="flex items-center gap-1 sm:gap-2">
			<a
				class="hidden px-3 py-2 text-[15px] text-moss transition-colors hover:text-rust sm:inline"
				href="#casos">{t('nav.cases')}</a
			>
			<a
				class="hidden px-3 py-2 text-[15px] text-moss transition-colors hover:text-rust sm:inline"
				href="#proceso">{t('nav.howWeWork')}</a
			>
			<Button href="#contacto" size="sm" variant="ghost">{t('nav.contact')}</Button>
			<LangToggle />
			<ThemeToggle />
		</nav>
	</div>
</header>

<main>
	<!-- HERO -->
	<section class="relative overflow-hidden pt-16 sm:pt-24">
		<div class="wrap">
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

		<!-- Lince a todo el ancho, que se disuelve en los bordes y asoma sobre la veta. -->
		<figure class="hero-lynx">
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
	<section id="proceso" class="hatch-light bg-night py-[clamp(56px,9vw,88px)] text-cream">
		<div class="wrap">
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
			<div class="reveal grid items-start gap-12 md:grid-cols-[1.3fr_1fr]" use:reveal>
				<div>
					<h2 class="mb-4 text-[clamp(28px,4.5vw,42px)]">{t('contact.title')}</h2>
					<p class="max-w-[460px] text-sage">
						{t('contact.subtitle')}
					</p>
					<ContactForm />
				</div>
				<div class="rounded-xl border border-line bg-surface p-7">
					<div class="kicker mb-4 text-moss">{t('contact.infoTitle')}</div>
					<ul class="flex flex-col">
						<li class="flex justify-between border-b border-line py-3 text-[15px]">
							<span class="text-sage">{t('contact.emailLabel')}</span><span
								>{t('contact.emailValue')}</span
							>
						</li>
						<li class="flex justify-between border-b border-line py-3 text-[15px]">
							<span class="text-sage">{t('contact.whatsappLabel')}</span><span
								>{t('contact.whatsappValue')}</span
							>
						</li>
						<li class="flex justify-between py-3 text-[15px]">
							<span class="text-sage">{t('contact.replyLabel')}</span><span
								>{t('contact.replyValue')}</span
							>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<div class="hatch h-[64px] border-t border-line" aria-hidden="true"></div>
</main>

<footer class="py-9 text-center text-[13.5px] text-sage">
	{t('footer')}
</footer>

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

	/* Lince full-bleed con bordes difuminados, asomando sobre la veta. */
	.hero-lynx {
		position: relative;
		z-index: 1;
		margin: 48px calc(50% - 50vw) -26px;
		height: clamp(200px, 40vw, 560px);
		overflow: hidden;
		-webkit-mask-image:
			linear-gradient(to right, transparent 0, #000 15%, #000 85%, transparent 100%),
			linear-gradient(to bottom, transparent 0, #000 9%, #000 100%);
		-webkit-mask-composite: source-in;
		mask-image:
			linear-gradient(to right, transparent 0, #000 15%, #000 85%, transparent 100%),
			linear-gradient(to bottom, transparent 0, #000 9%, #000 100%);
		mask-composite: intersect;
	}
	.hero-lynx :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 58% 4%;
		display: block;
		opacity: 0;
		animation: lynxIn 1.4s var(--ease-out-expo) 0.3s forwards;
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
</style>
