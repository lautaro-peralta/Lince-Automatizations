<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Button from '$lib/components/Button.svelte';
	import Chatbot from '$lib/components/landing/Chatbot.svelte';
	import LiveMonitor from '$lib/components/landing/LiveMonitor.svelte';
	import Receipt from '$lib/components/landing/Receipt.svelte';
	import ContactForm from '$lib/components/landing/ContactForm.svelte';
	import lince from '$lib/assets/images/lince.png?enhanced';

	const title = 'Lince — Automatización para negocios';
	const description =
		'Diseñamos sistemas que conectan WhatsApp, planillas, reseñas y pedidos para que tu negocio responda solo, sin perder el control. Automatización para negocios de Rosario.';

	const pasos = [
		{
			n: '01',
			t: 'Diagnóstico',
			d: 'Una conversación corta para entender por dónde se está perdiendo tiempo o dinero hoy. No hace falta tener nada digitalizado todavía.'
		},
		{
			n: '02',
			t: 'Armado',
			d: 'Construimos el sistema conectando las herramientas que ya usás — WhatsApp, planillas, redes — sin pedirte que cambies de plataforma.'
		},
		{
			n: '03',
			t: 'Prueba con datos reales',
			d: 'El sistema corre en paralelo durante unos días para ajustar respuestas y reglas antes de que dependa de él el día a día.'
		},
		{
			n: '04',
			t: 'Acompañamiento',
			d: 'Una vez en marcha, monitoreamos y ajustamos. El sistema mejora con el tiempo, no se queda fijo el día que se entrega.'
		}
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta
		property="og:description"
		content="Tu negocio pierde plata en lugares que no se ven. Nosotros los encontramos."
	/>
	<meta property="og:image" content="/Imagen-lince.png" />
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
				href="#casos">Casos</a
			>
			<a
				class="hidden px-3 py-2 text-[15px] text-moss transition-colors hover:text-rust sm:inline"
				href="#proceso">Cómo trabajamos</a
			>
			<Button href="#contacto" size="sm" variant="ghost">Contacto</Button>
		</nav>
	</div>
</header>

<!-- HERO -->
<section class="relative overflow-hidden pt-16 sm:pt-24">
	<div class="wrap">
		<div class="mx-auto max-w-[760px] text-center">
			<p
				class="hero-anim kicker mb-5 inline-flex items-center justify-center gap-2.5"
				style="--d:50ms"
			>
				<span class="pulse-dot" aria-hidden="true"></span>Automatización para negocios de Rosario
			</p>
			<h1
				class="hero-anim mx-auto text-balance text-[clamp(38px,6.2vw,68px)] leading-[1.04]"
				style="--d:150ms"
			>
				Tu negocio pierde plata en lugares
				<em class="font-display text-moss italic">que no se ven</em>. Nosotros los encontramos.
			</h1>
			<p class="hero-anim mx-auto mt-6 max-w-[540px] text-[19px] text-sage" style="--d:380ms">
				Diseñamos sistemas que conectan WhatsApp, planillas, reseñas y pedidos para que tu negocio
				responda solo, sin perder el control de lo que pasa.
			</p>
			<div class="hero-anim mt-9 flex flex-wrap justify-center gap-3.5" style="--d:550ms">
				<Button href="#casos" variant="primary">Ver casos en funcionamiento</Button>
				<Button href="#contacto" variant="ghost">Contar mi caso</Button>
			</div>
		</div>
	</div>

	<!-- Lince a todo el ancho, que se disuelve en los bordes y asoma sobre la veta. -->
	<figure class="hero-lynx">
		<enhanced:img
			src={lince}
			alt="Un lince observando un valle desde una roca, atento a todo el paisaje"
			sizes="100vw"
			fetchpriority="high"
		/>
	</figure>
</section>

<div class="hatch h-[88px] border-y border-line" aria-hidden="true"></div>

<!-- CASOS -->
<section id="casos" class="border-b border-line py-[clamp(56px,9vw,88px)]">
	<div class="wrap">
		<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
			<h2 class="max-w-[16ch] text-[clamp(26px,4vw,38px)]">
				Tres formas en que esto ya está funcionando
			</h2>
			<div class="kicker text-sage">003 casos · datos simulados</div>
		</div>
		<p class="max-w-[720px] text-[16.5px] text-sage">
			Tres situaciones que cualquier negocio reconoce, con el sistema funcionando de verdad. Probá
			el primero vos mismo — respondé como si fueras el cliente y mirá lo que pasa.
		</p>

		<div class="mt-12 flex flex-col gap-7">
			<!-- Caso 1 -->
			<article class="case reveal" use:reveal>
				<div class="grid md:grid-cols-[1.1fr_1fr]">
					<div class="case-info">
						<span class="case-tag">Atención al cliente</span>
						<h3 class="mb-3 text-[26px]">El WhatsApp que nunca duerme</h3>
						<p class="case-hook">
							¿Cuántos clientes se fueron a otro lado mientras tu teléfono sonaba sin parar?
						</p>
						<p class="mb-6 text-[15px] text-sage">
							Un restaurante recibe entre 20 y 40 mensajes por día con las mismas preguntas.
							Mientras alguien cocina o atiende mesas, esos mensajes se acumulan — y algunos
							clientes se van a otro lado antes de recibir respuesta.
						</p>
						<p class="case-try">
							<span>Probalo vos mismo</span>
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
						<span class="case-tag">Reputación</span>
						<h3 class="mb-3 text-[26px]">La reseña de una estrella que nadie vio</h3>
						<p class="case-hook">
							¿Cuándo fue la última vez que miraste lo que dice Google de tu negocio?
						</p>
						<p class="mb-6 text-[15px] text-sage">
							Una peluquería tiene buena reputación en Instagram pero nunca revisa Google Maps. Una
							reseña negativa quedó sin respuesta durante tres semanas — visible para cada persona
							que buscó el negocio antes de decidir si entrar.
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
								>Ninguna reseña queda sin respuesta.
								<strong>Te enterás en minutos, no en semanas.</strong></span
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
						<span class="case-tag">Ventas</span>
						<h3 class="mb-3 text-[26px]">El presupuesto que se enfría solo</h3>
						<p class="case-hook">
							¿Cuánta plata se fue en presupuestos que mandaste y nadie volvió a tocar?
						</p>
						<p class="mb-6 text-[15px] text-sage">
							Un taller de service envía cotizaciones por WhatsApp y nunca hace seguimiento. Algunos
							clientes simplemente se olvidan de responder — y esa plata nunca vuelve a aparecer en
							ningún lado.
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
								>Cada presupuesto recibe seguimiento solo.
								<strong>La plata deja de enfriarse.</strong></span
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
				<div class="stat-num">3</div>
				<div class="text-sm text-sage">
					canales conectados por sistema en promedio (WhatsApp, planillas, reseñas)
				</div>
			</div>
			<div class="stat">
				<div class="stat-num">~2 sem.</div>
				<div class="text-sm text-sage">
					desde el primer diagnóstico hasta el sistema funcionando
				</div>
			</div>
			<div class="stat">
				<div class="stat-num">0</div>
				<div class="text-sm text-sage">
					cambios que el equipo del negocio tiene que aprender a operar
				</div>
			</div>
		</div>
	</div>
</section>

<!-- PROCESO (sección oscura: alternancia tierra clara/oscura) -->
<section id="proceso" class="hatch-light bg-night py-[clamp(56px,9vw,88px)] text-bg">
	<div class="wrap">
		<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
			<h2 class="text-[clamp(26px,4vw,38px)] text-bg">Cómo trabajamos</h2>
			<div class="kicker text-[rgba(247,245,240,0.55)]">proceso</div>
		</div>
		<ol class="flex flex-col">
			{#each pasos as step, i (step.n)}
				<li
					class="reveal grid grid-cols-[56px_1fr] gap-5 border-t border-line-light py-7 first:border-t-0 first:pt-0"
					use:reveal={{ delay: i * 80 }}
				>
					<div class="font-mono text-[15px] text-rust">{step.n}</div>
					<div>
						<h3 class="mb-1.5 text-[20px] text-bg">{step.t}</h3>
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
				<h2 class="mb-4 text-[clamp(28px,4.5vw,42px)]">¿Algo de esto te suena conocido?</h2>
				<p class="max-w-[460px] text-sage">
					Si hay una tarea que se repite todos los días en tu negocio — y que te das cuenta de que
					podría hacerse sola — esa es la conversación que queremos tener.
				</p>
				<ContactForm />
			</div>
			<div class="rounded-xl border border-line bg-surface p-7">
				<div class="kicker mb-4 text-moss">Contacto</div>
				<ul class="flex flex-col">
					<li class="flex justify-between border-b border-line py-3 text-[15px]">
						<span class="text-sage">Email</span><span>hola@lince.dev</span>
					</li>
					<li class="flex justify-between border-b border-line py-3 text-[15px]">
						<span class="text-sage">WhatsApp</span><span>Rosario, Santa Fe</span>
					</li>
					<li class="flex justify-between py-3 text-[15px]">
						<span class="text-sage">Respuesta</span><span>dentro de 24 hs</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<div class="hatch h-[64px] border-t border-line" aria-hidden="true"></div>

<footer class="py-9 text-center text-[13.5px] text-sage">
	Lince — sistemas de automatización para negocios locales. Casos ilustrativos con datos simulados.
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
