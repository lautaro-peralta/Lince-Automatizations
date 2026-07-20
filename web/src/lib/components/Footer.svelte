<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import Logo from '$lib/components/Logo.svelte';
</script>

<footer class="site-footer border-t border-line bg-surface">
	<div class="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
		<div>
			<a class="no-underline" href="/" aria-label={t('nav.home')}><Logo /></a>
			<p class="mt-4 max-w-[36ch] text-[14.5px] text-sage">
				{t('footer.tagline')}
			</p>
		</div>

		<div>
			<div class="kicker mb-3 text-moss">{t('footer.exploreLabel')}</div>
			<ul class="flex flex-col gap-2 text-[14.5px]">
				<li><a class="footer-link" href="/servicios">{t('nav.services')}</a></li>
				<li><a class="footer-link" href="/precios">{t('nav.pricing')}</a></li>
				<li><a class="footer-link" href="/nosotros">{t('nav.about')}</a></li>
				<li><a class="footer-link" href="/preguntas">{t('nav.faq')}</a></li>
			</ul>
		</div>

		<div>
			<div class="kicker mb-3 text-moss">{t('footer.contactLabel')}</div>
			<ul class="flex flex-col gap-2 text-[14.5px]">
				<li>
					<a class="footer-link" href="mailto:linceautomatizaciones@gmail.com"
						>linceautomatizaciones@gmail.com</a
					>
				</li>
				<li class="text-sage">{t('contact.whatsappValue')}</li>
				<li class="text-sage">{t('footer.hours')}</li>
			</ul>
		</div>
	</div>

	<div
		class="wrap flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-[12.5px] text-sage"
	>
		<span>© {new Date().getFullYear()} Lince Automatizaciones · {t('footer.rights')}</span>
		<span class="flex flex-wrap gap-4">
			<a class="footer-link" href="/legal/privacidad">{t('footer.privacy')}</a>
			<a class="footer-link" href="/legal/terminos">{t('footer.terms')}</a>
		</span>
		<span class="font-mono">{t('footer.location')}</span>
	</div>
</footer>

<style>
	.footer-link {
		color: var(--color-ink);
		text-decoration: none;
		transition: color 0.15s;
	}
	.footer-link:hover {
		color: var(--color-rust);
	}
</style>
