<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import Button from '$lib/components/Button.svelte';

	const qs = ['q1', 'q2', 'q3', 'q4', 'q5'];
</script>

<svelte:head>
	<title>{t('faq.title')} — lince</title>
	<meta name="description" content={t('faq.intro')} />
</svelte:head>

<main>
	<header class="wrap pt-16 pb-[clamp(28px,5vw,56px)] sm:pt-24">
		<p class="kicker mb-4">{t('hero.badge')}</p>
		<h1 class="max-w-[16ch] text-[clamp(34px,5.2vw,56px)] leading-[1.05]">{t('faq.title')}</h1>
		<p class="mt-5 max-w-[600px] text-[18px] text-sage">{t('faq.intro')}</p>
	</header>

	<section class="wrap pb-[clamp(48px,8vw,88px)]">
		<div class="mx-auto max-w-[760px] border-y border-line">
			{#each qs as q (q)}
				<details class="faq border-b border-line last:border-b-0">
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-medium text-ink"
					>
						{t(`faq.items.${q}.q`)}
						<span class="faq-icon shrink-0 text-[22px] leading-none text-rust transition-transform"
							>+</span
						>
					</summary>
					<p class="pb-5 text-[15.5px] leading-relaxed text-sage">{t(`faq.items.${q}.a`)}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="border-t border-line py-[clamp(40px,7vw,72px)]">
		<div class="wrap flex flex-wrap items-center justify-between gap-6">
			<h2 class="text-[clamp(22px,3.4vw,32px)]">{t('faq.ctaTitle')}</h2>
			<Button href="/#contacto" variant="primary">{t('faq.cta')}</Button>
		</div>
	</section>
</main>

<style>
	/* Acordeón nativo: sin JS, prerenderizable. */
	.faq summary::-webkit-details-marker {
		display: none;
	}
	.faq[open] .faq-icon {
		transform: rotate(45deg);
	}
</style>
