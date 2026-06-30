<script lang="ts">
	// Monitor de reseñas en vivo (demo, datos simulados). Las 4 "frames" rotan
	// con animación CSS; en prefers-reduced-motion se muestra solo la primera.
	import { t } from '$lib/i18n/index.svelte';
</script>

<div class="live-card">
	<div class="live-card-header">
		<span class="dot" aria-hidden="true"></span>{t('monitor.header')}
	</div>
	<div class="live-stage">
		<div class="live-frame">
			<div class="live-frame-label">{t('monitor.f1Label')}</div>
			<div class="live-stars" aria-label={t('monitor.f1Stars')}>★☆☆☆☆</div>
			<div class="live-quote">
				{t('monitor.f1Quote')}
			</div>
			<div class="live-meta">{t('monitor.f1Meta')}</div>
		</div>
		<div class="live-frame">
			<div class="live-frame-label">{t('monitor.f2Label')}</div>
			<div class="live-thinking" aria-hidden="true"><span></span><span></span><span></span></div>
			<div class="live-quote">
				{t('monitor.f2Quote')}
			</div>
			<div class="live-meta">{t('monitor.f2Meta')}</div>
		</div>
		<div class="live-frame">
			<div class="live-frame-label">{t('monitor.f3Label')}</div>
			<div class="live-response">
				{t('monitor.f3Response')}
			</div>
			<div class="live-meta">{t('monitor.f3Meta')}</div>
		</div>
		<div class="live-frame">
			<div class="live-frame-label">{t('monitor.f4Label')}</div>
			<div class="live-check">
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
				{t('monitor.f4Check')}
			</div>
			<div class="live-quote small">
				{t('monitor.f4Quote')}
			</div>
			<div class="live-meta">{t('monitor.f4Meta')}</div>
		</div>
	</div>
	<div class="live-dots" aria-hidden="true">
		<span></span><span></span><span></span><span></span>
	</div>
</div>

<style>
	.live-card {
		background: var(--color-bg);
		border: 1px solid var(--color-line-strong);
		border-radius: 10px;
		width: 100%;
		max-width: 320px;
		overflow: hidden;
	}
	.live-card-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 11px 16px;
		border-bottom: 1px solid var(--color-line);
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-sage);
	}
	.live-card-header .dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-rust);
		animation: pulse 2.4s ease-in-out infinite;
		flex-shrink: 0;
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
	.live-stage {
		position: relative;
		height: 196px;
	}
	.live-frame {
		position: absolute;
		inset: 0;
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		opacity: 0;
		animation: frameCycle 16s infinite;
	}
	.live-frame:nth-child(1) {
		animation-delay: 0s;
	}
	.live-frame:nth-child(2) {
		animation-delay: 4s;
	}
	.live-frame:nth-child(3) {
		animation-delay: 8s;
	}
	.live-frame:nth-child(4) {
		animation-delay: 12s;
	}
	@keyframes frameCycle {
		0% {
			opacity: 0;
			transform: translateY(8px);
		}
		3% {
			opacity: 1;
			transform: translateY(0);
		}
		22% {
			opacity: 1;
			transform: translateY(0);
		}
		27% {
			opacity: 0;
			transform: translateY(-8px);
		}
		100% {
			opacity: 0;
		}
	}
	.live-frame-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-sage);
	}
	.live-stars {
		font-size: 16px;
		color: var(--color-rust);
		letter-spacing: 2px;
	}
	.live-quote,
	.live-response {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 15.5px;
		line-height: 1.45;
		color: var(--color-ink);
	}
	.live-quote.small {
		font-size: 14px;
	}
	.live-meta {
		font-size: 12.5px;
		color: var(--color-sage);
		margin-top: auto;
	}
	.live-thinking {
		display: flex;
		gap: 5px;
		align-items: center;
		height: 8px;
	}
	.live-thinking span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-sage);
		animation: thinkBounce 1.1s ease-in-out infinite;
	}
	.live-thinking span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.live-thinking span:nth-child(3) {
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
	.live-check {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-moss);
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.live-check svg {
		flex-shrink: 0;
	}
	.live-dots {
		display: flex;
		gap: 6px;
		padding: 0 18px 16px;
	}
	.live-dots span {
		height: 3px;
		flex: 1;
		border-radius: 2px;
		background: var(--color-line-strong);
		animation: dotCycle 16s infinite;
	}
	.live-dots span:nth-child(1) {
		animation-delay: 0s;
	}
	.live-dots span:nth-child(2) {
		animation-delay: 4s;
	}
	.live-dots span:nth-child(3) {
		animation-delay: 8s;
	}
	.live-dots span:nth-child(4) {
		animation-delay: 12s;
	}
	@keyframes dotCycle {
		0%,
		100% {
			background: var(--color-line-strong);
		}
		3%,
		22% {
			background: var(--color-rust);
		}
		27% {
			background: var(--color-line-strong);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.live-card-header .dot,
		.live-thinking span,
		.live-dots span {
			animation: none;
		}
		.live-frame {
			animation: none;
		}
		.live-frame:first-child {
			opacity: 1;
			position: static;
		}
		.live-frame:not(:first-child) {
			display: none;
		}
	}
</style>
