<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { reveal } from '$lib/actions/reveal';
	import Button from '$lib/components/Button.svelte';

	const items = [
		'services.items.whatsapp',
		'services.items.reviews',
		'services.items.quotes',
		'services.items.integrations'
	];
</script>

<svelte:head>
	<title>{t('services.title')} — lince</title>
	<meta name="description" content={t('services.intro')} />
</svelte:head>

<main>
	<header class="wrap pt-16 pb-[clamp(28px,5vw,56px)] sm:pt-24">
		<p class="kicker mb-4">{t('hero.badge')}</p>
		<h1 class="max-w-[18ch] text-[clamp(34px,5.2vw,56px)] leading-[1.05]">{t('services.title')}</h1>
		<p class="mt-5 max-w-[600px] text-[18px] text-sage">{t('services.intro')}</p>
	</header>

	<section class="wrap pb-[clamp(48px,8vw,88px)]">
		<div class="grid gap-5 sm:grid-cols-2">
			{#each items as key (key)}
				<article class="reveal rounded-xl border border-line bg-surface p-7" use:reveal>
					<h2 class="mb-2 text-[21px]">{t(`${key}.t`)}</h2>
					<p class="text-[15.5px] text-sage">{t(`${key}.d`)}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="border-t border-line py-[clamp(48px,8vw,80px)]">
		<div class="wrap text-center">
			<h2 class="mx-auto max-w-[20ch] text-[clamp(24px,3.6vw,34px)]">{t('services.ctaTitle')}</h2>
			<p class="mx-auto mt-4 max-w-[520px] text-sage">{t('services.ctaText')}</p>
			<div class="mt-7 flex justify-center">
				<Button href="/#contacto" variant="primary">{t('services.cta')}</Button>
			</div>
		</div>
	</section>
</main>
