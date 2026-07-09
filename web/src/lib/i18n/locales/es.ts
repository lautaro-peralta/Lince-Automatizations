/**
 * Diccionario base (español) — idioma por defecto del sitio.
 *
 * Es la fuente de verdad de la estructura: `en.ts` se tipa como `typeof es`,
 * así el compilador avisa si falta o sobra una clave en la traducción.
 * Todas las hojas son strings (interpolación con `{param}`), lo que mantiene
 * `t()` uniforme y la búsqueda por punto (`t('hero.titleEm')`) simple.
 */
export const es = {
	nav: {
		home: 'Inicio',
		cases: 'Casos',
		howWeWork: 'Cómo trabajamos',
		services: 'Servicios',
		pricing: 'Precios',
		about: 'Nosotros',
		faq: 'Preguntas',
		contact: 'Contacto'
	},

	hero: {
		badge: 'Sistemas de automatización a medida',
		titleA: 'Tu negocio pierde plata en lugares',
		titleEm: 'que no se ven',
		titleB: '. Nosotros los',
		verbs: {
			v1: 'encontramos',
			v2: 'solucionamos',
			v3: 'automatizamos'
		},
		subtitle:
			'Diseñamos sistemas que conectan WhatsApp, planillas, reseñas y pedidos para que tu negocio responda solo, sin perder el control de lo que pasa.',
		ctaPrimary: 'Ver casos en funcionamiento',
		ctaSecondary: 'Contar mi caso'
	},

	cases: {
		title: 'Tres formas en que esto ya está funcionando',
		meta: '003 casos · datos simulados',
		intro:
			'Tres situaciones que cualquier negocio reconoce, con el sistema funcionando de verdad. Probá el primero vos mismo — respondé como si fueras el cliente y mirá lo que pasa.',
		case1: {
			tag: 'Atención al cliente',
			title: 'El WhatsApp que nunca duerme',
			hook: '¿Cuántos clientes se fueron a otro lado mientras tu teléfono sonaba sin parar?',
			body: 'Un restaurante recibe entre 20 y 40 mensajes por día con las mismas preguntas. Mientras alguien cocina o atiende mesas, esos mensajes se acumulan — y algunos clientes se van a otro lado antes de recibir respuesta.',
			try: 'Probalo vos mismo'
		},
		case2: {
			tag: 'Reputación',
			title: 'La reseña de una estrella que nadie vio',
			hook: '¿Cuándo fue la última vez que miraste lo que dice Google de tu negocio?',
			body: 'Una peluquería tiene buena reputación en Instagram pero nunca revisa Google Maps. Una reseña negativa quedó sin respuesta durante tres semanas — visible para cada persona que buscó el negocio antes de decidir si entrar.',
			result: 'Ninguna reseña queda sin respuesta.',
			resultStrong: 'Te enterás en minutos, no en semanas.'
		},
		case3: {
			tag: 'Ventas',
			title: 'El presupuesto que se enfría solo',
			hook: '¿Cuánta plata se fue en presupuestos que mandaste y nadie volvió a tocar?',
			body: 'Un taller de service envía cotizaciones por WhatsApp y nunca hace seguimiento. Algunos clientes simplemente se olvidan de responder — y esa plata nunca vuelve a aparecer en ningún lado.',
			result: 'Cada presupuesto recibe seguimiento solo.',
			resultStrong: 'La plata deja de enfriarse.'
		},
		stats: {
			s1num: '3',
			s1: 'canales conectados por sistema en promedio (WhatsApp, planillas, reseñas)',
			s2num: '~2 sem.',
			s2: 'desde el primer diagnóstico hasta el sistema funcionando',
			s3num: '0',
			s3: 'cambios que el equipo del negocio tiene que aprender a operar'
		}
	},

	services: {
		title: 'Servicios',
		intro:
			'Sistemas de automatización armados a medida sobre las herramientas que tu negocio ya usa. Estos son los frentes donde más rápido se recupera tiempo y plata.',
		items: {
			whatsapp: {
				t: 'Atención automática por WhatsApp',
				d: 'Un asistente que responde las preguntas de siempre, toma pedidos y deriva a una persona cuando hace falta — sin que se te escape ningún mensaje.'
			},
			reviews: {
				t: 'Monitoreo de reseñas',
				d: 'Te avisamos apenas aparece una reseña nueva en Google, con una respuesta sugerida lista para enviar. Ninguna queda colgada semanas.'
			},
			quotes: {
				t: 'Seguimiento de presupuestos',
				d: 'Cada cotización enviada recibe recordatorios automáticos hasta que el cliente responde. La plata deja de enfriarse sola.'
			},
			integrations: {
				t: 'Integraciones y planillas',
				d: 'Conectamos WhatsApp, redes, planillas y tu sistema de pedidos para que los datos fluyan solos, sin cargar nada dos veces.'
			}
		},
		ctaTitle: '¿No estás seguro de por dónde empezar?',
		ctaText: 'En una charla corta detectamos la tarea que más te conviene automatizar primero.',
		cta: 'Contar mi caso'
	},

	pricing: {
		title: 'Precios',
		intro:
			'Planes pensados para negocios locales. Empezás por lo que más duele y sumás cuando lo necesitás, sin ataduras.',
		popular: 'Más elegido',
		plans: {
			p1: {
				name: 'Diagnóstico',
				price: 'Gratis',
				period: '',
				desc: 'Una charla para entender dónde se pierde tiempo o plata y qué conviene automatizar primero.',
				f1: 'Relevamiento de tu operación',
				f2: 'Propuesta priorizada',
				f3: 'Sin compromiso',
				cta: 'Reservar diagnóstico'
			},
			p2: {
				name: 'Sistema',
				price: 'A medida',
				period: '',
				desc: 'Armado del sistema conectando tus herramientas actuales, con prueba en datos reales antes de arrancar.',
				f1: 'Un frente automatizado (WhatsApp, reseñas o presupuestos)',
				f2: 'Puesta en marcha y ajustes',
				f3: 'Capacitación al equipo',
				cta: 'Pedir cotización'
			},
			p3: {
				name: 'Acompañamiento',
				price: 'Mensual',
				period: '/mes',
				desc: 'Monitoreo y mejora continua una vez en marcha. El sistema evoluciona con tu negocio.',
				f1: 'Monitoreo y soporte',
				f2: 'Ajustes y nuevas automatizaciones',
				f3: 'Reportes de resultados',
				cta: 'Hablar con nosotros'
			}
		},
		note: 'Los valores se definen según el alcance de cada caso. El diagnóstico siempre es gratuito.'
	},

	about: {
		title: 'Nosotros',
		intro:
			'Lince nació en Rosario con una idea simple: la tecnología tiene que trabajar para el negocio, no al revés.',
		bodyTitle: 'Cómo pensamos',
		body: 'No creemos en cambiar todo de golpe ni en obligarte a aprender plataformas nuevas. Nos metemos en cómo funciona tu negocio hoy, encontramos las tareas que se repiten y las que se escapan, y armamos sistemas que corren solos sobre las herramientas que ya usás.',
		values: {
			v1: {
				t: 'Sin fricción',
				d: 'Nada de migrar de plataforma. Trabajamos sobre WhatsApp, planillas y redes que ya usás.'
			},
			v2: {
				t: 'Con datos reales',
				d: 'Todo se prueba en paralelo antes de que dependas de ello. Cero sorpresas el día de la entrega.'
			},
			v3: {
				t: 'Cerca',
				d: 'Somos de Rosario. Respondemos rápido y acompañamos después de la puesta en marcha.'
			}
		},
		cta: 'Trabajemos juntos'
	},

	faq: {
		title: 'Preguntas frecuentes',
		intro: 'Lo que más nos preguntan antes de empezar.',
		items: {
			q1: {
				q: '¿Necesito tener algo digitalizado para empezar?',
				a: 'No. Arrancamos con un diagnóstico y trabajamos sobre lo que ya usás, aunque sea sólo WhatsApp y una planilla.'
			},
			q2: {
				q: '¿Tengo que cambiar de plataforma o de sistema?',
				a: 'No. Nos adaptamos a tus herramientas actuales. La idea es sumar automatización, no obligarte a re-aprender todo.'
			},
			q3: {
				q: '¿Cuánto tarda en estar funcionando?',
				a: 'La mayoría de los casos están en marcha en alrededor de dos semanas desde el diagnóstico, según el alcance.'
			},
			q4: {
				q: '¿Qué pasa si algo falla o el cliente quiere hablar con una persona?',
				a: 'El sistema deriva a una persona cuando hace falta. Vos mantenés el control; la automatización se ocupa de lo repetitivo.'
			},
			q5: {
				q: '¿Trabajan sólo en Rosario?',
				a: 'Estamos en Rosario, pero trabajamos con negocios de cualquier lado. Todo se coordina de forma remota.'
			}
		},
		ctaTitle: '¿Tenés otra pregunta?',
		cta: 'Escribinos'
	},

	process: {
		title: 'Cómo trabajamos',
		kicker: 'proceso',
		steps: {
			s1: {
				t: 'Diagnóstico',
				d: 'Una conversación corta para entender por dónde se está perdiendo tiempo o dinero hoy. No hace falta tener nada digitalizado todavía.'
			},
			s2: {
				t: 'Armado',
				d: 'Construimos el sistema conectando las herramientas que ya usás — WhatsApp, planillas, redes — sin pedirte que cambies de plataforma.'
			},
			s3: {
				t: 'Prueba con datos reales',
				d: 'El sistema corre en paralelo durante unos días para ajustar respuestas y reglas antes de que dependa de él el día a día.'
			},
			s4: {
				t: 'Acompañamiento',
				d: 'Una vez en marcha, monitoreamos y ajustamos. El sistema mejora con el tiempo, no se queda fijo el día que se entrega.'
			}
		}
	},

	contact: {
		title: '¿Algo de esto te suena conocido?',
		subtitle:
			'Si hay una tarea que se repite todos los días en tu negocio — y que te das cuenta de que podría hacerse sola — esa es la conversación que queremos tener.',
		infoTitle: 'Otras vías',
		infoIntro: 'Escribinos también por el canal que te resulte más cómodo.',
		emailLabel: 'Email',
		emailValue: 'lince.automatizaciones@gmail.com',
		whatsappLabel: 'WhatsApp',
		whatsappValue: '+54 9 341 000 0000',
		instagramLabel: 'Instagram',
		instagramValue: '@linceautomatizaciones',
		replyLabel: 'Respuesta',
		replyValue: 'Respondemos dentro de 24 hs.'
	},

	footer: {
		tagline:
			'Sistemas de automatización a medida para negocios locales. Casos ilustrativos con datos simulados.',
		exploreLabel: 'Explorar',
		contactLabel: 'Contacto',
		hours: 'Respondemos en menos de 24 hs',
		location: 'Rosario · Santa Fe · Argentina',
		rights: 'Todos los derechos reservados.'
	},

	meta: {
		title: 'Lince — Automatización para negocios',
		description:
			'Diseñamos sistemas que conectan WhatsApp, planillas, reseñas y pedidos para que tu negocio responda solo, sin perder el control. Automatización para negocios de Rosario.',
		ogDescription: 'Tu negocio pierde plata en lugares que no se ven. Nosotros los encontramos.'
	},

	form: {
		name: 'Tu nombre',
		namePh: 'Cómo te llamás',
		business: 'Tu negocio',
		businessOptional: '(opcional)',
		businessPh: 'Nombre del local o rubro',
		contact: 'Email o WhatsApp',
		contactPh: 'Por dónde te respondemos',
		email: 'Tu email',
		emailPh: 'nombre@correo.com',
		message: '¿Qué tarea se repite todos los días?',
		messagePh: 'Contanos brevemente tu caso',
		phone: 'Teléfono',
		phonePh: 'Número o WhatsApp',
		submit: 'Contar mi caso',
		submitting: 'Enviando…',
		invalid: 'Revisá los campos marcados, por favor.',
		requireEmailOrPhone: 'Dejanos un email o un teléfono para poder responderte.',
		sending: 'Enviando…',
		success: '¡Listo! Recibimos tu mensaje. Te respondemos dentro de 24 hs.',
		botThanks: '¡Gracias! Te vamos a contactar.',
		rateLimited:
			'Ya nos enviaste varios mensajes desde este dispositivo. Si es urgente, escribinos por WhatsApp.'
	},

	receipt: {
		title: 'Seguimiento de presupuestos',
		sub: 'Taller Ríos · últimos 30 días',
		sent: 'Presupuestos enviados',
		noReply: 'Sin respuesta a las 48 hs',
		recovered: 'Recuperados con recordatorio',
		recoveredIncome: 'Ingreso recuperado'
	},

	monitor: {
		header: 'Monitor en vivo · Estudio Marrón',
		f1Label: 'Reseña detectada · Google Maps',
		f1Stars: '1 de 5 estrellas',
		f1Quote: '"Esperé 40 minutos pasado mi turno y nadie me avisó nada. Una falta de respeto."',
		f1Meta: 'hace 8 minutos · sin responder',
		f2Label: 'Analizando tono',
		f2Quote:
			'Cliente molesto por demora. Riesgo alto: menciona falta de respeto y puede influir a otros.',
		f2Meta: 'prioridad: urgente',
		f3Label: 'Respuesta sugerida',
		f3Response:
			'"Lamentamos mucho la demora, Ana. No es la experiencia que queremos dar. Nos encantaría compensarte en tu próxima visita — te escribimos por privado."',
		f3Meta: 'tono: cercano · listo para enviar',
		f4Label: 'Resuelto',
		f4Check: 'Respondida en 12 minutos',
		f4Quote: 'El dueño recibió un aviso al instante. La reseña ya no quedó colgada tres semanas.',
		f4Meta: 'tiempo promedio de respuesta: 14 min'
	},

	chat: {
		businessName: 'Parrilla El Fogón',
		online: 'en línea',
		typing: 'escribiendo...',
		logAria: 'Conversación de demostración',
		typingAria: 'Escribiendo',
		inputAria: 'Tu respuesta',
		sendAria: 'Enviar',
		restartHard: '↺ Empezar otra conversación',
		restartSoft: '↺ Probar de nuevo'
	},

	ui: {
		theme: 'Tema',
		toLight: 'Cambiar a tema claro',
		toDark: 'Cambiar a tema oscuro',
		language: 'Idioma',
		switchToEnglish: 'Switch to English',
		switchToSpanish: 'Cambiar a español',
		openMenu: 'Abrir menú',
		closeMenu: 'Cerrar menú',
		onThisPage: 'En esta página',
		collapseIndex: 'Replegar índice',
		expandIndex: 'Desplegar índice',
		whatsapp: 'Chatear por WhatsApp',
		whatsappMsg: 'Hola, me gustaría automatizar mi negocio con Lince.'
	},

	admin: {
		brand: 'Lince · Panel',
		loading: 'Cargando panel…',
		login: {
			subtitle: 'Acceso para el equipo',
			email: 'Email',
			password: 'Contraseña',
			submit: 'Entrar',
			submitting: 'Entrando…',
			forgot: '¿Olvidaste tu contraseña?',
			resetSending: 'Enviando…',
			resetSent: 'Si ese email tiene una cuenta, te enviamos un enlace para restablecerla.',
			resetError: 'No pudimos enviar el email. Reintentá en un momento.',
			recoverTitle: 'Elegí una contraseña nueva',
			recoverSubtitle: 'Ingresá tu nueva contraseña para terminar.',
			newPassword: 'Contraseña nueva',
			newPasswordPh: 'Mínimo 8 caracteres',
			savePassword: 'Guardar contraseña',
			savingPassword: 'Guardando…',
			passwordSaved: 'Listo, tu contraseña quedó actualizada.',
			passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.'
		},
		tabs: {
			summary: 'Resumen',
			leads: 'Leads',
			budgets: 'Presupuestos',
			reviews: 'Reseñas'
		},
		userEmailFallback: '',
		logout: 'Salir',
		teams: 'Teams ↗',
		startupOs: 'Startup OS ↗',
		summary: {
			title: 'Resumen',
			subtitle: 'Una mirada rápida del estado del negocio.',
			error: 'No pudimos cargar las métricas.',
			leads: 'Leads',
			budgets: 'Presupuestos',
			reviews: 'Reseñas',
			leadsNew: 'Nuevos',
			leadsInConvo: 'En conversación',
			leadsWon: 'Ganados',
			budgetsSent: 'Enviados',
			budgetsNoReply: 'Sin respuesta',
			budgetsWon: 'Ganados',
			reviewsNew: 'Nuevas',
			reviewsAnalyzing: 'Analizando',
			reviewsAnswered: 'Respondidas'
		},
		leads: {
			title: 'Leads recibidos',
			subtitle: 'Contactos que llegaron desde el formulario de la landing.',
			searchPh: 'Buscar nombre, negocio, contacto…',
			allStatuses: 'Todos los estados',
			exportCsv: 'Exportar CSV',
			error: 'No pudimos cargar los leads.',
			empty: 'No hay leads para este filtro.',
			count: '{n} lead(s).',
			colDate: 'Fecha',
			colName: 'Nombre',
			colBusiness: 'Negocio',
			colContact: 'Contacto',
			colMessage: 'Mensaje',
			colStatus: 'Estado',
			colNotes: 'Notas'
		},
		budgets: {
			title: 'Presupuestos',
			subtitle: 'Cotizaciones enviadas y su seguimiento.',
			error: 'No pudimos cargar los presupuestos.',
			empty: 'Todavía no hay presupuestos.',
			count: '{n} presupuesto(s).',
			customer: 'Cliente',
			contact: 'Email o WhatsApp',
			amount: 'Monto',
			description: 'Descripción',
			add: 'Agregar presupuesto',
			adding: 'Agregando…',
			added: 'Agregado ✓',
			saveError: 'No se pudo guardar.',
			exportCsv: 'Exportar CSV',
			colSent: 'Enviado',
			colCustomer: 'Cliente',
			colContact: 'Contacto',
			colAmount: 'Monto',
			colDescription: 'Descripción',
			colFollowups: 'Recordatorios',
			colStatus: 'Estado'
		},
		reviews: {
			title: 'Reseñas',
			subtitle: 'Reseñas detectadas para gestionar y responder.',
			error: 'No pudimos cargar las reseñas.',
			empty: 'No hay reseñas cargadas.',
			count: '{n} reseña(s).',
			anon: 'Anónimo',
			starsAria: '{n} de 5',
			suggestedLabel: 'Sugerida:',
			suggest: 'Sugerir respuesta',
			generating: 'Generando…'
		},
		csv: {
			date: 'Fecha',
			name: 'Nombre',
			business: 'Negocio',
			contact: 'Contacto',
			message: 'Mensaje',
			status: 'Estado',
			notes: 'Notas',
			sent: 'Enviado',
			customer: 'Cliente',
			amount: 'Monto',
			description: 'Descripción',
			followups: 'Recordatorios'
		},
		status: {
			lead: {
				nuevo: 'nuevo',
				contactado: 'contactado',
				en_conversacion: 'en conversación',
				ganado: 'ganado',
				descartado: 'descartado'
			},
			budget: {
				enviado: 'enviado',
				sin_respuesta: 'sin respuesta',
				recordado: 'recordado',
				ganado: 'ganado',
				perdido: 'perdido'
			},
			review: {
				nueva: 'nueva',
				analizando: 'analizando',
				respondida: 'respondida'
			},
			priority: {
				urgente: 'urgente',
				media: 'media',
				baja: 'baja'
			}
		},
		notesPh: 'Notas…',
		notesAria: 'Notas internas',
		statusAria: 'Cambiar estado',
		notSaved: 'no se guardó',
		retry: 'Reintentar'
	},

	errors: {
		network: 'No pudimos conectar con el servidor. Reintentá en un momento.',
		networkRetry: 'No pudimos conectar con el servidor. Probá de nuevo en un minuto.',
		generic: 'Algo salió mal. Intentá otra vez.',
		genericServer: 'Error {status}',
		load403:
			'Iniciaste sesión, pero tu usuario no tiene rol admin. Promovelo (ver supabase/README.md).',
		load401: 'Tu sesión expiró o es inválida. Volvé a entrar.',
		auth: {
			invalidLogin: 'Email o contraseña incorrectos.',
			emailNotConfirmed:
				'Tu email todavía no está confirmado en Supabase (Authentication → Users → confirmar).',
			network:
				'No pudimos conectar con Supabase. Revisá PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.',
			genericWith: 'No pudimos iniciar sesión: {message}',
			generic: 'No pudimos iniciar sesión.'
		}
	}
};

export type Dictionary = typeof es;
