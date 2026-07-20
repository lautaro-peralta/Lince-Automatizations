<!-- Documento legal: se publica sólo en español, que es el idioma de
     referencia del texto (no pasa por i18n a propósito). -->
<svelte:head>
	<title>Política de privacidad — lince</title>
	<meta
		name="description"
		content="Cómo Lince Automatizaciones trata los datos personales conforme a la Ley 25.326."
	/>
</svelte:head>

<main>
	<header class="wrap pt-16 pb-[clamp(28px,5vw,56px)] sm:pt-24">
		<p class="kicker mb-4">Legal</p>
		<h1 class="max-w-[16ch] text-[clamp(34px,5.2vw,56px)] leading-[1.05]">
			Política de privacidad
		</h1>
		<p class="mt-5 max-w-[600px] text-[18px] text-sage">Última actualización: 20 de julio de 2026</p>
	</header>

	<section class="wrap pb-[clamp(48px,8vw,88px)]">
		<div class="legal mx-auto max-w-[760px]">
			<h2>1. Quiénes somos</h2>
			<p>
				<strong>Lince Automatizaciones</strong> ("Lince", "nosotros"), con base en Rosario, provincia
				de Santa Fe, República Argentina, es responsable del tratamiento de los datos personales que
				se recolectan a través de este sitio y de sus canales de contacto. Podés escribirnos por
				cualquier tema de privacidad a
				<a href="mailto:lince.automatizaciones@gmail.com">lince.automatizaciones@gmail.com</a>.
			</p>

			<h2>2. Qué datos recolectamos</h2>
			<ul>
				<li>
					<strong>Formulario de contacto:</strong> nombre, email y/o teléfono, nombre del negocio
					(opcional) y el mensaje que nos escribís. Entregarlos es voluntario; sin un medio de
					contacto no podremos responderte.
				</li>
				<li>
					<strong>Canales directos:</strong> si nos escribís por email, WhatsApp o Instagram,
					guardamos esa conversación y los datos de contacto que nos compartas.
				</li>
				<li>
					<strong>Datos técnicos mínimos:</strong> registros estándar del servidor (por ejemplo, la
					dirección IP) usados sólo para seguridad y para limitar el abuso del formulario.
				</li>
				<li>
					<strong>Demo del chatbot:</strong> los mensajes que escribas en la demo se guardan de forma
					anónima para que la conversación funcione y para mejorarla. No ingreses datos personales
					en la demo.
				</li>
				<li>
					<strong>Usuarios del panel interno:</strong> si tenés una cuenta del equipo (creada por un
					administrador), tratamos tu email y tu rol para autenticarte.
				</li>
			</ul>

			<h2>3. Para qué los usamos</h2>
			<p>
				Usamos tus datos para: responder tu consulta y elaborar propuestas; gestionar la relación
				comercial en nuestro sistema interno; mantener la seguridad del sitio; y, sólo si nos lo
				pedís o lo aceptás, enviarte información sobre nuestros servicios. La base del tratamiento
				es tu consentimiento (al enviar el formulario o escribirnos) y las medidas previas a un
				posible contrato. <strong>No vendemos ni cedemos tus datos a terceros</strong> con fines
				publicitarios.
			</p>

			<h2>4. Dónde se alojan y quiénes los procesan</h2>
			<p>
				Para operar el sitio usamos proveedores de infraestructura que procesan datos por encargo
				nuestro: <strong>Cloudflare</strong> (publicación del sitio), <strong>Render</strong>
				(servidor de la API) y <strong>Supabase</strong> (base de datos y autenticación). Estos
				proveedores pueden alojar la información fuera de la Argentina (típicamente en Estados
				Unidos o la Unión Europea); esa transferencia internacional se realiza al amparo de los
				acuerdos de tratamiento de datos y salvaguardas contractuales de cada proveedor, conforme el
				art. 12 de la Ley 25.326.
			</p>

			<h2>5. Cuánto tiempo los conservamos</h2>
			<p>
				Conservamos los datos de contacto mientras gestionamos tu consulta o dure la relación
				comercial, y luego por el tiempo necesario para cumplir obligaciones legales (por ejemplo,
				fiscales). Podés pedir la supresión en cualquier momento (ver punto 7).
			</p>

			<h2>6. Cookies y almacenamiento local</h2>
			<p>
				Este sitio <strong>no usa cookies de seguimiento ni analítica de terceros</strong>. Sólo
				guardamos en tu navegador (localStorage) tus preferencias de tema e idioma y un contador
				local para evitar envíos repetidos del formulario. Esa información no sale de tu navegador.
			</p>

			<h2>7. Tus derechos</h2>
			<p>
				Como titular de los datos podés ejercer en cualquier momento los derechos de
				<strong>acceso, rectificación, actualización y supresión</strong> (arts. 14 a 16, Ley
				25.326) escribiendo a
				<a href="mailto:lince.automatizaciones@gmail.com">lince.automatizaciones@gmail.com</a>. El
				derecho de acceso es gratuito a intervalos no inferiores a seis meses, salvo que acredites
				un interés legítimo. También podés pedir en cualquier momento la baja de comunicaciones
				comerciales (art. 27).
			</p>
			<p>
				La <strong>AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA (AAIP)</strong>, en su carácter de
				Órgano de Control de la Ley N.º 25.326, tiene la atribución de atender las denuncias y
				reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de
				las normas vigentes en materia de protección de datos personales.
			</p>

			<h2>8. Menores de edad</h2>
			<p>
				El sitio y los servicios están dirigidos a negocios y personas mayores de 18 años; no
				recolectamos deliberadamente datos de menores.
			</p>

			<h2>9. Cambios a esta política</h2>
			<p>
				Si modificamos esta política publicaremos la nueva versión en esta misma página, con su
				fecha de actualización. Los cambios sustanciales se comunicarán de forma destacada.
			</p>
		</div>
	</section>
</main>

<style>
	/* Tipografía de documento largo, con las variables de la paleta del sitio. */
	.legal h2 {
		margin-top: 2.4em;
		margin-bottom: 0.6em;
		font-size: clamp(19px, 2.4vw, 24px);
	}
	.legal p,
	.legal li {
		font-size: 15.5px;
		line-height: 1.75;
		color: var(--color-sage);
	}
	.legal p + p {
		margin-top: 0.9em;
	}
	.legal ul {
		display: flex;
		flex-direction: column;
		gap: 0.7em;
		padding-left: 1.2em;
		list-style: disc;
	}
	.legal strong {
		color: var(--color-ink);
	}
	.legal a {
		color: var(--color-rust);
	}
</style>
