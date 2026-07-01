<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';

	interface Section {
		id: string;
		label: string;
	}

	const sections: Section[] = $derived([
		{ id: 'casos', label: t('nav.cases') },
		{ id: 'proceso', label: t('nav.howWeWork') },
		{ id: 'contacto', label: t('nav.contact') }
	]);

	let activeIndex = $state(-1);
	let done = $state<boolean[]>([false, false, false]);
	let showLabel = $state(false);
	let labelText = $state('');

	onMount(() => {
		const els = sections.map((s) => document.getElementById(s.id));
		let raf = 0;

		function update() {
			const vh = window.innerHeight;
			const doneNext: boolean[] = [false, false, false];
			let currentIdx = -1;
			let nearIdx = -1;
			let nearScore = Infinity;

			for (let i = 0; i < els.length; i++) {
				const el = els[i];
				if (!el) continue;
				const rect = el.getBoundingClientRect();
				const top = rect.top;
				const bottom = rect.bottom;

				// The section is "completed" once its content is mostly above the viewport.
				doneNext[i] = bottom < vh * 0.35;

				// The section is the "current" one as long as its top has crossed above
				// the 45% mark and its bottom has not left yet.
				if (top < vh * 0.45 && bottom > vh * 0.2) currentIdx = i;

				// The section boundary is "near" when the top of the section is close
				// to the top of the viewport (approaching either from above or below).
				// A negative rect.top means we already crossed it while scrolling up.
				const distanceFromTop = Math.abs(top - vh * 0.18);
				const withinBand = top > -vh * 0.18 && top < vh * 0.55;
				if (withinBand && distanceFromTop < nearScore) {
					nearScore = distanceFromTop;
					nearIdx = i;
				}
			}

			activeIndex = currentIdx;
			done = doneNext;

			if (nearIdx >= 0) {
				labelText = sections[nearIdx].label;
				showLabel = true;
			} else {
				showLabel = false;
			}
		}

		function onScroll() {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				update();
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		update();

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	});
</script>

<aside class="rail" aria-hidden="true">
	<ul class="rail-dots">
		{#each sections as section, i (section.id)}
			<li class="dot-row">
				<span class="dot-label" class:show={showLabel && activeIndex === i}>{section.label}</span>
				<a
					href={`#${section.id}`}
					class="dot"
					class:active={activeIndex === i}
					class:done={done[i] && activeIndex !== i}
					aria-label={section.label}
				>
					<span class="dot-mark"></span>
				</a>
			</li>
		{/each}
	</ul>
</aside>

<style>
	.rail {
		position: fixed;
		right: max(10px, env(safe-area-inset-right));
		top: 50%;
		transform: translateY(-50%);
		z-index: 40;
		pointer-events: none;
	}

	.rail-dots {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 4px 0;
		margin: 0;
	}

	.dot-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
	}

	.dot-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-rust-deep);
		background: var(--color-bg);
		border: 1px solid var(--color-line-strong);
		padding: 5px 10px;
		border-radius: 999px;
		white-space: nowrap;
		box-shadow: var(--shadow-card);
		opacity: 0;
		transform: translateX(6px);
		pointer-events: none;
		transition:
			opacity 0.35s var(--ease-out-expo),
			transform 0.35s var(--ease-out-expo);
	}
	.dot-label.show {
		opacity: 1;
		transform: translateX(0);
	}

	.dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		pointer-events: auto;
	}

	.dot-mark {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: transparent;
		border: 1.5px solid var(--color-line-strong);
		transition:
			background 0.35s var(--ease-out-expo),
			border-color 0.35s var(--ease-out-expo),
			transform 0.35s var(--ease-out-expo);
	}

	.dot:hover .dot-mark {
		border-color: var(--color-rust);
	}

	.dot.done .dot-mark {
		background: var(--color-moss);
		border-color: var(--color-moss);
	}

	.dot.active .dot-mark {
		background: var(--color-rust);
		border-color: var(--color-rust);
		transform: scale(1.35);
		box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-rust) 22%, transparent);
	}

	@media (max-width: 640px) {
		.rail {
			right: max(8px, env(safe-area-inset-right));
		}
		.dot-label {
			font-size: 10.5px;
			padding: 4px 9px;
		}
		.dot {
			width: 20px;
			height: 20px;
		}
		.dot-mark {
			width: 7px;
			height: 7px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-label,
		.dot-mark {
			transition: none;
		}
	}
</style>
