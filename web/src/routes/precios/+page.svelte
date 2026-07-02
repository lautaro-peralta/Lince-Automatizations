<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { tilt } from '$lib/actions/tilt';
	import Button from '$lib/components/Button.svelte';

	const plans = [
		{ key: 'pricing.plans.p1', featured: false },
		{ key: 'pricing.plans.p2', featured: true },
		{ key: 'pricing.plans.p3', featured: false }
	];
	const feats = ['f1', 'f2', 'f3'];
</script>

<svelte:head>
	<title>{t('pricing.title')} — lince</title>
	<meta name="description" content={t('pricing.intro')} />
</svelte:head>

<main>
	<header class="wrap pt-16 pb-[clamp(28px,5vw,56px)] sm:pt-24">
		<p class="kicker mb-4">{t('hero.badge')}</p>
		<h1 class="text-[clamp(34px,5.2vw,56px)] leading-[1.05]">{t('pricing.title')}</h1>
		<p class="mt-5 max-w-[600px] text-[18px] text-sage">{t('pricing.intro')}</p>
	</header>

	<section class="wrap pb-[clamp(32px,6vw,64px)]">
		<div class="grid gap-5 md:grid-cols-3">
			{#each plans as p (p.key)}
				<!-- reveal en el wrapper y tilt en la tarjeta: cada transform tiene
				     su propio elemento y no se pisan. -->
				<div class="reveal" use:reveal>
					<article
						class="glow-card flex h-full flex-col rounded-xl border bg-surface p-7 transition-transform duration-300 {p.featured
							? 'border-rust shadow-glow'
							: 'border-line'}"
						use:tilt
					>
						{#if p.featured}
							<span class="kicker mb-3 text-rust">{t('pricing.popular')}</span>
						{/if}
						<h2 class="text-[22px]">{t(`${p.key}.name`)}</h2>
						<div class="mt-2 flex items-baseline gap-1">
							<span class="font-display text-[34px] font-medium text-ink"
								>{t(`${p.key}.price`)}</span
							>
							<span class="text-sage">{t(`${p.key}.period`)}</span>
						</div>
						<p class="mt-3 text-[15px] text-sage">{t(`${p.key}.desc`)}</p>
						<ul class="mt-5 flex flex-col gap-2.5">
							{#each feats as f (f)}
								<li class="flex items-start gap-2.5 text-[15px]">
									<svg
										class="mt-0.5 shrink-0 text-moss"
										width="18"
										height="18"
										viewBox="0 0 20 20"
										fill="none"
										aria-hidden="true"
									>
										<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4" />
										<path
											d="M6 10.5 L9 13.5 L14 7"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span>{t(`${p.key}.${f}`)}</span>
								</li>
							{/each}
						</ul>
						<div class="mt-auto pt-6">
							<Button href="/#contacto" variant={p.featured ? 'accent' : 'ghost'} full>
								{t(`${p.key}.cta`)}
							</Button>
						</div>
					</article>
				</div>
			{/each}
		</div>
	</section>

	<section class="wrap pb-[clamp(48px,8vw,88px)]">
		<p class="mx-auto max-w-[560px] text-center text-[14.5px] text-sage">{t('pricing.note')}</p>
	</section>
</main>
