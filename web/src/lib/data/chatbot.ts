/**
 * Árbol de conversación del chatbot demo de la landing (datos simulados).
 * Portado del antiguo web/src/landing/chatbot.js, ahora tipado. La lógica de
 * render/timing vive en components/landing/Chatbot.svelte.
 */

export type ChatState = Record<string, string>;

export interface ConfirmData {
	type: string;
	rows: [string, string][];
}

export interface ChatOption {
	label: string;
	next: string;
	set?: Record<string, string>;
	userEcho?: string;
}

export interface ChatInput {
	placeholder: string;
	key: string;
	next: string;
	clean?: (v: string) => string;
	/** Nombre del validador (por defecto usa `key`). */
	validate?: string;
}

export interface ChatNode {
	user?: string;
	bot?: string[] | ((s: ChatState) => string[]);
	options?: ChatOption[];
	input?: ChatInput;
	confirm?: (s: ChatState) => ConfirmData;
	after?: string[] | ((s: ChatState) => string[]);
	end?: boolean;
	softend?: boolean;
}

export type ChatTree = Record<string, ChatNode>;

/** Capitaliza cada palabra (para nombres). */
export function capitalizar(v: string): string {
	return v
		.split(' ')
		.map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
		.join(' ');
}

/** Validadores de input: devuelven null si OK, o un string de error que responde el bot. */
export const validators: Record<string, (v: string) => string | null> = {
	nombre(v) {
		if (v.length < 2) return 'Necesito un nombre para anotar la reserva 🙂 ¿Cómo te llamás?';
		if (/[0-9]/.test(v))
			return 'Mmm, eso no parece un nombre. ¿Me decís tu nombre así anoto la reserva?';
		if (v.length > 30) return 'Con tu nombre o apodo alcanza 🙂';
		return null;
	},
	dia(v) {
		const t = v.toLowerCase();
		const dias = [
			'lunes',
			'martes',
			'miércoles',
			'miercoles',
			'jueves',
			'viernes',
			'sábado',
			'sabado',
			'domingo'
		];
		const palabras = [
			'hoy',
			'mañana',
			'manana',
			'pasado',
			'finde',
			'fin de semana',
			'semana',
			'viene',
			'próximo',
			'proximo'
		];
		const tieneDia = dias.some((d) => t.indexOf(d) !== -1);
		const tienePalabra = palabras.some((p) => t.indexOf(p) !== -1);
		const tieneFecha = /\d{1,2}([/-]\d{1,2})?/.test(t);
		if (!tieneDia && !tienePalabra && !tieneFecha) {
			return 'No me quedó claro el día 🤔 Decime un día de la semana o una fecha (ej: "sábado", "el 20", "mañana").';
		}
		return null;
	},
	zona(v) {
		if (v.length < 3) return '¿Me decís el nombre de tu barrio o zona? Así te confirmo el envío.';
		if (/^\d+$/.test(v)) return 'Necesito el nombre de la zona o barrio, no un número 🙂';
		return null;
	}
};

export const tree: ChatTree = {
	start: {
		bot: ['¡Hola! 👋 Soy el asistente de Parrilla El Fogón. ¿En qué te puedo ayudar?'],
		options: [
			{ label: 'Quiero reservar una mesa', next: 'reserva_personas' },
			{ label: 'Quiero pedir delivery', next: 'delivery_zona' },
			{ label: '¿Hasta qué hora abren?', next: 'consulta_horario' },
			{ label: '¿Tienen opciones sin TACC / veggie?', next: 'consulta_dieta' }
		]
	},

	/* ---- RESERVA ---- */
	reserva_personas: {
		user: 'Quiero reservar una mesa',
		bot: ['¡Buenísimo! ¿Para cuántas personas sería?'],
		options: [
			{ label: '2 personas', next: 'reserva_dia', set: { personas: '2 personas' } },
			{ label: '4 personas', next: 'reserva_dia', set: { personas: '4 personas' } },
			{ label: '6 o más', next: 'reserva_grupo', set: { personas: '6+ personas' } }
		]
	},
	reserva_grupo: {
		user: 'Somos 6 o más',
		bot: [
			'Para grupos grandes reservamos con un poco más de anticipación, pero no hay problema 💪 ¿Para qué día lo necesitás?'
		],
		options: [
			{ label: 'Este viernes', next: 'reserva_hora', set: { dia: 'viernes' } },
			{ label: 'Este sábado', next: 'reserva_hora', set: { dia: 'sábado' } },
			{ label: 'Otro día', next: 'reserva_dia_libre', set: {} }
		]
	},
	reserva_dia: {
		user: 'Listo',
		bot: ['Perfecto. ¿Qué día te queda cómodo?'],
		options: [
			{ label: 'Hoy', next: 'reserva_hora', set: { dia: 'hoy' } },
			{ label: 'Mañana', next: 'reserva_hora', set: { dia: 'mañana' } },
			{ label: 'Este viernes', next: 'reserva_hora', set: { dia: 'viernes' } },
			{ label: 'Este sábado', next: 'reserva_hora', set: { dia: 'sábado' } }
		]
	},
	reserva_dia_libre: {
		user: 'Otro día',
		bot: ['Decime qué día y lo vemos 👇'],
		input: { placeholder: 'Ej: jueves que viene', key: 'dia', next: 'reserva_hora' }
	},
	reserva_hora: {
		user: 'Ese día',
		bot: ['¡Anotado! ¿A qué horario?'],
		options: [
			{ label: '20:30', next: 'reserva_nombre', set: { hora: '20:30' } },
			{ label: '21:00', next: 'reserva_nombre', set: { hora: '21:00' } },
			{ label: '21:30', next: 'reserva_nombre', set: { hora: '21:30' } },
			{ label: '22:00', next: 'reserva_nombre', set: { hora: '22:00' } }
		]
	},
	reserva_nombre: {
		user: 'Ese horario',
		bot: ['¡Genial! ¿A nombre de quién hago la reserva?'],
		input: { placeholder: 'Tu nombre', key: 'nombre', next: 'reserva_confirma', clean: capitalizar }
	},
	reserva_confirma: {
		bot: (s) => ['Listo ' + (s.nombre || '') + ', dejame confirmar con vos 👇'],
		confirm: (s) => ({
			type: 'Reserva confirmada',
			rows: [
				['A nombre de', s.nombre || '—'],
				['Personas', s.personas || '—'],
				['Día', s.dia || '—'],
				['Horario', s.hora || '—']
			]
		}),
		after: (s) => [
			'Tu mesa quedó reservada, ' +
				(s.nombre || '') +
				'. Te llega un recordatorio por acá una hora antes. ¡Te esperamos! 🔥'
		],
		end: true
	},

	/* ---- DELIVERY ---- */
	delivery_zona: {
		user: 'Quiero pedir delivery',
		bot: [
			'¡Dale! Hacemos envío propio en zona Centro y alrededores, y también llegamos por PedidosYa y Rappi. ¿A qué zona sería?'
		],
		options: [
			{ label: 'Centro', next: 'delivery_plato', set: { zona: 'Centro (envío propio)' } },
			{ label: 'Pichincha', next: 'delivery_plato', set: { zona: 'Pichincha (envío propio)' } },
			{ label: 'Otra zona', next: 'delivery_zona_libre', set: {} }
		]
	},
	delivery_zona_libre: {
		user: 'Otra zona',
		bot: [
			'Decime tu barrio y te confirmo si llegamos con envío propio o te conviene por PedidosYa 👇'
		],
		input: { placeholder: 'Ej: Fisherton, Echesortu...', key: 'zona', next: 'delivery_zona_check' }
	},
	delivery_zona_check: {
		bot: (s) => [
			'¡Sí, llegamos a ' +
				(s.zona || 'tu zona') +
				'! 🛵 Para esa distancia el envío sale $1.200. ¿Qué te gustaría pedir?'
		],
		options: [
			{
				label: 'Bife de chorizo + guarnición',
				next: 'delivery_bebida',
				set: { plato: 'Bife de chorizo' }
			},
			{
				label: 'Provoleta + empanadas',
				next: 'delivery_bebida',
				set: { plato: 'Provoleta + empanadas' }
			},
			{
				label: 'Milanesa napolitana',
				next: 'delivery_bebida',
				set: { plato: 'Milanesa napolitana' }
			},
			{ label: 'Parrillada para 2', next: 'delivery_bebida', set: { plato: 'Parrillada para 2' } }
		]
	},
	delivery_plato: {
		user: 'Esa zona',
		bot: ['¿Qué te gustaría pedir? Estos son los más elegidos hoy:'],
		options: [
			{
				label: 'Bife de chorizo + guarnición',
				next: 'delivery_bebida',
				set: { plato: 'Bife de chorizo' }
			},
			{
				label: 'Provoleta + empanadas',
				next: 'delivery_bebida',
				set: { plato: 'Provoleta + empanadas' }
			},
			{
				label: 'Milanesa napolitana',
				next: 'delivery_bebida',
				set: { plato: 'Milanesa napolitana' }
			},
			{ label: 'Parrillada para 2', next: 'delivery_bebida', set: { plato: 'Parrillada para 2' } }
		]
	},
	delivery_bebida: {
		user: 'Eso quiero',
		bot: ['Buena elección 😋 ¿Sumás algo para tomar?'],
		options: [
			{ label: 'Gaseosa 1,5L', next: 'delivery_nombre', set: { bebida: 'Gaseosa 1,5L' } },
			{
				label: 'Una cerveza artesanal',
				next: 'delivery_nombre',
				set: { bebida: 'Cerveza artesanal' }
			},
			{ label: 'Solo la comida, gracias', next: 'delivery_nombre', set: { bebida: '—' } }
		]
	},
	delivery_nombre: {
		bot: ['¿A nombre de quién preparo el pedido?'],
		input: {
			placeholder: 'Tu nombre',
			key: 'nombre',
			next: 'delivery_confirma',
			clean: capitalizar
		}
	},
	delivery_confirma: {
		bot: (s) => ['¡Gracias ' + (s.nombre || '') + '! Confirmamos el pedido 👇'],
		confirm: (s) => ({
			type: 'Pedido confirmado',
			rows: [
				['A nombre de', s.nombre || '—'],
				['Pedido', s.plato || '—'],
				['Para tomar', s.bebida || '—'],
				['Entrega', s.zona || '—'],
				['Tiempo estimado', '35–45 min'],
				['Pago', 'al recibir']
			]
		}),
		after: (s) => [
			'¡Listo ' +
				(s.nombre || '') +
				'! Tu pedido entró a la cocina. Te avisamos por acá cuando salga para tu dirección. 🛵'
		],
		end: true
	},

	/* ---- CONSULTAS -> derivan a acción ---- */
	consulta_horario: {
		user: '¿Hasta qué hora abren?',
		bot: [
			'Hoy atendemos de 20:00 a 00:00 🕗 (y al mediodía de 12 a 15). Estamos en San Martín 1234, Rosario.',
			'¿Querés que te reserve una mesa así no esperás?'
		],
		options: [
			{ label: 'Sí, reservame una mesa', next: 'reserva_personas' },
			{ label: 'Mejor pido delivery', next: 'delivery_zona' },
			{ label: 'No, solo era la consulta', next: 'consulta_cierre' }
		]
	},
	consulta_dieta: {
		user: '¿Tienen opciones sin TACC / veggie?',
		bot: [
			'¡Sí! 🌱 Tenemos provoleta, ensaladas, papas y guarniciones sin TACC, y opciones veggie a la parrilla. Avisanos al pedir y la cocina lo prepara aparte.',
			'¿Querés reservar o pedir delivery?'
		],
		options: [
			{ label: 'Reservar una mesa', next: 'reserva_personas' },
			{ label: 'Pedir delivery', next: 'delivery_zona' },
			{ label: 'Solo era la consulta', next: 'consulta_cierre' }
		]
	},
	consulta_cierre: {
		user: 'Solo era eso, gracias',
		bot: ['¡De nada! Cualquier cosa escribinos por acá cuando quieras. ¡Que tengas buen día! ☀️'],
		after: [],
		end: true,
		softend: true
	}
};
