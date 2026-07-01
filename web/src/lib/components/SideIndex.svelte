<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';
	import IconChevronLeft from '~icons/lucide/chevron-left';
	import IconChevronRight from '~icons/lucide/chevron-right';

	// Índice lateral (scrollspy) de las secciones de la landing.
	//   - Desktop (≥ xl): riel de altura completa con etiquetas, replegable.
	//   - Mobile/tablet (< xl): barra vertical fina con línea de progreso del
	//     scroll y 3 puntos posicionados según el offsetTop de cada sección.
	const sections = [
		{ id: 'casos', key: 'nav.cases' },
		{ id: 'proceso', key: 'nav.howWeWork' },
		{ id: 'contacto', key: 'nav.contact' }
	];

	let active = $state('casos');
	let collapsed = $state(true);
	// Puntos con estado "completado" (ya se pasó por la sección).
	let done = $state<boolean[]>(sections.map(() => false));
	// El tooltip sólo aparece cuando la cabecera de la sección está cerca del
	// viewport (bajando o subiendo); si estamos ya dentro de la sección se
	// desvanece para no tapar contenido.
	let nearId = $state<string | null>(null);
	// Estado que sólo afecta al modo mobile.
	let progress = $state(0); // 0..1 del scroll de la página
	let dotPositions = $state<number[]>(sections.map(() => 0)); // top% por sección

	onMount(() => {
		const els = sections
			.map((s) => document.getElementById(s.id))
			.filter((el): el is HTMLElement => el !== null);
		if (els.length === 0) return;

		// Marca activa la sección cuyo cuerpo cruza la franja central del viewport.
		const io =
			typeof IntersectionObserver !== 'undefined'
				? new IntersectionObserver(
						(entries) => {
							const visible = entries
								.filter((e) => e.isIntersecting)
								.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
							if (visible[0]) active = visible[0].target.id;
						},
						{ rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
					)
				: null;
		for (const el of els) io?.observe(el);

		// Cálculo del layout para el modo mobile (posición vertical relativa de
		// cada sección + progreso del scroll). Se recalcula en resize y en cada
		// scroll (throttled con rAF).
		let raf = 0;
		const recalcPositions = () => {
			const docH = document.documentElement.scrollHeight - window.innerHeight;
			dotPositions = els.map((el) => {
				const t = el.offsetTop - window.innerHeight * 0.15;
				return Math.max(0, Math.min(1, t / Math.max(1, docH)));
			});
		};
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const vh = window.innerHeight;
				const docH = document.documentElement.scrollHeight - vh;
				progress = docH > 0 ? Math.max(0, Math.min(1, window.scrollY / docH)) : 0;

				// Recalcular estado de cada sección
				const doneNext: boolean[] = new Array(sections.length).fill(false);
				let bestNearIdx = -1;
				let bestDist = Infinity;
				for (let i = 0; i < els.length; i++) {
					const rect = els[i].getBoundingClientRect();
					const top = rect.top;
					const bottom = rect.bottom;
					// "Completado": el grueso de la sección ya quedó arriba del viewport.
					doneNext[i] = bottom < vh * 0.35;
					// "Cerca del borde": el top de la sección está dentro de la banda
					// alrededor del ~18% superior del viewport (aparece bajando o subiendo).
					const dist = Math.abs(top - vh * 0.18);
					if (top > -vh * 0.2 && top < vh * 0.55 && dist < bestDist) {
						bestDist = dist;
						bestNearIdx = i;
					}
				}
				done = doneNext;
				nearId = bestNearIdx >= 0 ? sections[bestNearIdx].id : null;
			});
		};

		recalcPositions();
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', recalcPositions);
		window.addEventListener('resize', onScroll);
		// El layout puede cambiar cuando cargan fuentes/imagenes; recomputo tras un tick.
		const settleTimer = setTimeout(() => {
			recalcPositions();
			onScroll();
		}, 300);

		return () => {
			io?.disconnect();
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', recalcPositions);
			window.removeEventListener('resize', onScroll);
			clearTimeout(settleTimer);
		};
	});
</script>

<!-- Riel de altura completa (desktop ≥ xl). -->
<nav
	aria-label={t('ui.onThisPage')}
	class="fixed inset-y-0 left-0 z-40 hidden flex-col justify-center border-r border-line bg-bg/70 backdrop-blur-md transition-[width] duration-300 ease-out xl:flex {collapsed
		? 'w-[68px]'
		: 'w-[224px]'}"
>
	<div class={`flex flex-col gap-3 ${collapsed ? 'items-center px-3' : 'px-4'}`}>
		<button
			type="button"
			class="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-sage transition-colors hover:text-rust {collapsed
				? ''
				: 'self-end'}"
			aria-label={collapsed ? t('ui.expandIndex') : t('ui.collapseIndex')}
			aria-expanded={!collapsed}
			onclick={() => (collapsed = !collapsed)}
		>
			{#if collapsed}<IconChevronRight class="text-[16px]" />{:else}<IconChevronLeft
					class="text-[16px]"
				/>{/if}
		</button>

		{#if !collapsed}
			<span class="kicker px-2 text-[11px] whitespace-nowrap">{t('ui.onThisPage')}</span>
		{/if}

		<ul class="flex w-full flex-col gap-1">
			{#each sections as s, i (s.id)}
				<li>
					<a
						href={`#${s.id}`}
						aria-current={active === s.id ? 'true' : undefined}
						title={t(s.key)}
						class="group relative flex items-center gap-3 rounded-[9px] py-2 transition-colors {collapsed
							? 'justify-center px-0'
							: 'px-3'} {active === s.id
							? 'text-rust'
							: done[i]
								? 'text-moss'
								: 'text-sage hover:text-ink'}"
					>
						{#if active === s.id && !collapsed}
							<span
								class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-rust"
							></span>
						{/if}
						<span
							class="h-2 w-2 shrink-0 rounded-full transition-colors {active === s.id
								? 'bg-rust'
								: done[i]
									? 'bg-moss'
									: 'bg-line-strong group-hover:bg-sage'}"
						></span>
						{#if !collapsed}<span class="text-[15px] font-semibold whitespace-nowrap"
								>{t(s.key)}</span
							>{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>

<!-- Barra fina de progreso (mobile / tablet < xl). Muestra cuánto se avanzó
     de la página y las secciones como puntos posicionados a su altura real. -->
<nav
	aria-label={t('ui.onThisPage')}
	class="mini-rail fixed top-0 bottom-0 left-0 z-40 flex flex-col items-center xl:hidden"
>
	<div class="mini-track">
		<div class="mini-fill" style={`height:${(progress * 100).toFixed(2)}%`}></div>
	</div>
	<ul class="mini-dots" aria-hidden="false">
		{#each sections as s, i (s.id)}
			<li class="mini-dot-wrap" style={`top:${(dotPositions[i] * 100).toFixed(2)}%`}>
				<a
					class="mini-dot"
					class:is-active={active === s.id}
					class:is-done={done[i] && active !== s.id}
					class:is-near={nearId === s.id}
					href={`#${s.id}`}
					aria-current={active === s.id ? 'true' : undefined}
					aria-label={t(s.key)}
				>
					<span class="mini-tip">{t(s.key)}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	/* Modo mobile: barra fina de ~18px con línea de progreso central y puntos
	   posicionados absolutamente según el offsetTop de cada sección. Sin bordes
	   ni fondo sólido: en iPhone el borde inferior fijo se veía como rectángulo,
	   así que ahora es "aire" con blur suave sólo detrás de los puntos. */
	.mini-rail {
		width: 22px;
		padding-top: calc(16px + env(safe-area-inset-top));
		padding-bottom: calc(24px + env(safe-area-inset-bottom));
		pointer-events: none;
	}
	.mini-track {
		position: relative;
		flex: 1;
		width: 2px;
		background: color-mix(in srgb, var(--color-line-strong) 70%, transparent);
		border-radius: 2px;
		margin: 4px 0;
	}
	.mini-fill {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		background: var(--color-rust);
		border-radius: 2px;
		transition: height 0.15s linear;
	}
	.mini-dots {
		position: absolute;
		top: 16px;
		bottom: 24px;
		left: 0;
		right: 0;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.mini-dot-wrap {
		position: absolute;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.mini-dot {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		text-decoration: none;
		position: relative;
		pointer-events: auto;
	}
	.mini-dot::before {
		content: '';
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--color-bg);
		border: 2px solid var(--color-line-strong);
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}
	.mini-dot.is-done::before {
		background: var(--color-moss);
		border-color: var(--color-moss);
	}
	.mini-dot.is-active::before {
		background: var(--color-rust);
		border-color: var(--color-rust);
		transform: scale(1.2);
		box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-rust) 20%, transparent);
	}
	/* Tooltip: sólo aparece cuando la sección está cerca del borde (bajando o
	   subiendo). Fondo opaco de la crema para que no tape lo que hay debajo. */
	.mini-tip {
		position: absolute;
		left: 26px;
		top: 50%;
		transform: translateY(-50%) translateX(-6px);
		padding: 5px 10px;
		border-radius: 999px;
		background: var(--color-bg);
		color: var(--color-rust-deep);
		border: 1px solid var(--color-line-strong);
		box-shadow: var(--shadow-card);
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.3s ease,
			transform 0.3s ease;
	}
	.mini-dot.is-near .mini-tip,
	.mini-dot:hover .mini-tip,
	.mini-dot:focus .mini-tip {
		opacity: 1;
		transform: translateY(-50%) translateX(0);
	}
	@media (prefers-reduced-motion: reduce) {
		.mini-fill,
		.mini-dot::before,
		.mini-tip {
			transition: none;
		}
	}
</style>
