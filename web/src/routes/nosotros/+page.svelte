<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { reveal } from '$lib/actions/reveal';
	import Button from '$lib/components/Button.svelte';

	const values = ['about.values.v1', 'about.values.v2', 'about.values.v3'];
</script>

<svelte:head>
	<title>{t('about.title')} — lince</title>
	<meta name="description" content={t('about.intro')} />
</svelte:head>

<main>
	<header class="wrap pt-16 pb-[clamp(28px,5vw,56px)] sm:pt-24">
		<p class="kicker mb-4">{t('hero.badge')}</p>
		<h1 class="max-w-[16ch] text-[clamp(34px,5.2vw,56px)] leading-[1.05]">{t('about.title')}</h1>
		<p class="mt-5 max-w-[620px] text-[19px] text-sage">{t('about.intro')}</p>
	</header>

	<section class="wrap pb-[clamp(40px,7vw,72px)]">
		<div class="max-w-[720px]">
			<h2 class="mb-3 text-[clamp(22px,3vw,28px)]">{t('about.bodyTitle')}</h2>
			<p class="text-[17px] leading-relaxed text-sage">{t('about.body')}</p>
		</div>
	</section>

	<section class="border-t border-line py-[clamp(40px,7vw,72px)]">
		<div class="wrap grid gap-8 sm:grid-cols-3">
			{#each values as key (key)}
				<article class="reveal" use:reveal>
					<h3 class="mb-2 text-[19px] text-moss">{t(`${key}.t`)}</h3>
					<p class="text-[15px] text-sage">{t(`${key}.d`)}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="border-t border-line py-[clamp(40px,7vw,72px)]">
		<div class="wrap flex flex-wrap items-center justify-between gap-6">
			<h2 class="max-w-[18ch] text-[clamp(22px,3.4vw,32px)]">{t('contact.title')}</h2>
			<Button href="/#contacto" variant="primary">{t('about.cta')}</Button>
		</div>
	</section>
</main>
