// Escena del lince de líneas del hero: figura (frames de galope/salto) y línea
// de horizonte con rocas y cortes. Todo se genera de forma determinista a nivel
// de módulo, así el prerender y el cliente producen exactamente el mismo markup
// (sin mismatch de hidratación) y las posiciones de los obstáculos nunca se
// desincronizan del dibujo.

// ---------------------------------------------------------------- figura ----
// ViewBox 0 0 120 78, contacto con el suelo en y=76, mirando a la IZQUIERDA.
// Ángulos de pata: 0° = vertical hacia abajo; positivo = hacia adelante (-x).

type Vec = [number, number];
type FrontLeg = { a1: number; a2: number };
type HindLeg = { a1: number; a2: number; a3: number };

interface Pose {
	sh: Vec; // hombro
	hip: Vec; // cadera
	head: Vec; // centro de cráneo
	pitch: number; // inclinación de la cabeza
	arch: number; // arqueo del lomo (+ recogido, - estirado)
	tailA: number; // ángulo de la cola (desde horizontal, negativo = arriba)
	legs: { fn: FrontLeg; ff: FrontLeg; hn: HindLeg; hf: HindLeg };
	planted?: [boolean, boolean, boolean, boolean]; // [fn, ff, hn, hf]
}

const D2R = Math.PI / 180;
const FU = 15,
	FL = 17; // delantera: hombro→codo, codo→pata
const HU = 13,
	HM = 13,
	HL = 9; // trasera: cadera→rodilla→corvejón→pata

const pt = ([x, y]: Vec, aDeg: number, len: number): Vec => [
	x - Math.sin(aDeg * D2R) * len,
	y + Math.cos(aDeg * D2R) * len
];
const rot = ([x, y]: Vec, aDeg: number): Vec => {
	const c = Math.cos(aDeg * D2R),
		s = Math.sin(aDeg * D2R);
	return [x * c - y * s, x * s + y * c];
};
const add = ([x, y]: Vec, [dx, dy]: Vec): Vec => [x + dx, y + dy];
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const P = ([x, y]: Vec) => `${f(x)} ${f(y)}`;

// Puntos locales de la cabeza (origen = centro de cráneo): orejas con pinceles,
// ruff dentado en la mejilla y hocico corto — las señas del lince.
const HEAD: Record<string, Vec> = {
	nose: [-10.5, 2],
	snout: [-8.6, -1.6],
	brow: [-6, -3.8],
	earFB: [-4, -5],
	earFT: [-5, -12.5],
	earMid: [-0.5, -4.6],
	earBT: [3.2, -11.5],
	earBB: [3.6, -4.4],
	skull: [6.4, -1.6],
	chin: [-7.6, 5.4],
	ruff1: [-5.4, 8.6],
	ruff2: [-3.2, 7],
	ruff3: [-0.6, 10.4],
	throat: [2.4, 9],
	eye: [-6, -1]
};

function frontLeg(sh: Vec, { a1, a2 }: FrontLeg, planted: boolean): string {
	const elbow = pt(sh, a1, FU);
	const paw = pt(elbow, a2, FL);
	return `M ${P(sh)} L ${P(elbow)} L ${P(paw)}` + (planted ? ' l -3.2 0' : '');
}
function hindLeg(hip: Vec, { a1, a2, a3 }: HindLeg, planted: boolean): string {
	const knee = pt(hip, a1, HU);
	const hock = pt(knee, a2, HM);
	const paw = pt(hock, a3, HL);
	return `M ${P(hip)} L ${P(knee)} L ${P(hock)} L ${P(paw)}` + (planted ? ' l -3.4 0' : '');
}

function buildFrame(pose: Pose): { near: string[]; far: string[] } {
	const { sh, hip, head, pitch, arch } = pose;
	const h: Record<string, Vec> = {};
	for (const k in HEAD) h[k] = add(head, rot(HEAD[k], pitch));

	const shTop = add(sh, [1, -6.5]);
	const hipTop = add(hip, [-1, -7]);
	const backMid: Vec = [(shTop[0] + hipTop[0]) / 2, (shTop[1] + hipTop[1]) / 2 - arch];
	const tailBase = add(hip, [4.5, -5]);
	const tailTip = add(tailBase, [
		8.5 * Math.cos(pose.tailA * D2R),
		8.5 * Math.sin(pose.tailA * D2R)
	]);

	// Línea superior: nariz → orejas → cráneo → cuello → lomo → grupa → cola corta
	const topline =
		`M ${P(h.nose)} Q ${P(h.snout)} ${P(h.brow)}` +
		` L ${P(h.earFB)} L ${P(h.earFT)} L ${P(h.earMid)} L ${P(h.earBT)} L ${P(h.earBB)}` +
		` Q ${P(h.skull)} ${P(add(h.skull, [2.4, 2.6]))}` +
		` C ${P(add(shTop, [-7, -1]))} ${P(add(shTop, [-4, 0]))} ${P(shTop)}` +
		` Q ${P(backMid)} ${P(hipTop)}` +
		` Q ${P(add(tailBase, [0.5, -2.5]))} ${P(tailBase)}` +
		` Q ${P(add(tailBase, [3.5, -1]))} ${P(tailTip)}`;

	// Línea inferior: mentón → ruff dentado → garganta → pecho → panza → muslo
	const chest = add(sh, [-3.5, 6]);
	const bellyEnd = add(hip, [-5, 4.5]);
	const bellyMid: Vec = [
		(chest[0] + bellyEnd[0]) / 2,
		Math.max(chest[1], bellyEnd[1]) + 4 - arch * 0.4
	];
	const underline =
		`M ${P(h.chin)} L ${P(h.ruff1)} L ${P(h.ruff2)} L ${P(h.ruff3)}` +
		` Q ${P(h.throat)} ${P(add(chest, [1.5, -3]))}` +
		` Q ${P(add(chest, [0, 1.5]))} ${P(chest)}` +
		` Q ${P(bellyMid)} ${P(bellyEnd)}`;

	const eye = `M ${P(h.eye)} l -0.6 0.2`;
	const [pfn, pff, phn, phf] = pose.planted ?? [false, false, false, false];

	return {
		near: [
			topline,
			underline,
			eye,
			frontLeg(sh, pose.legs.fn, pfn),
			hindLeg(hip, pose.legs.hn, phn)
		],
		far: [
			frontLeg(add(sh, [2.5, -1]), pose.legs.ff, pff),
			hindLeg(add(hip, [1.5, -1]), pose.legs.hf, phf)
		]
	};
}

// Ciclo de galope rotatorio simplificado en 6 frames + poses de salto y quietud.
const POSES = {
	stand: {
		sh: [40, 43],
		hip: [75, 41],
		head: [27, 26],
		pitch: 0,
		arch: -1,
		tailA: -40,
		legs: {
			fn: { a1: 2, a2: -2 },
			ff: { a1: -7, a2: 5 },
			hn: { a1: 14, a2: -32, a3: 14 },
			hf: { a1: 20, a2: -38, a3: 10 }
		},
		planted: [true, true, true, true]
	},
	'run-1': {
		// extensión total (aire)
		sh: [37, 38],
		hip: [79, 36],
		head: [24, 24],
		pitch: 6,
		arch: -3,
		tailA: -18,
		legs: {
			fn: { a1: 58, a2: 32 },
			ff: { a1: 38, a2: 44 },
			hn: { a1: -62, a2: -48, a3: -38 },
			hf: { a1: -48, a2: -56, a3: -44 }
		}
	},
	'run-2': {
		// aterrizaje delantero
		sh: [38, 43],
		hip: [78, 38],
		head: [25, 28],
		pitch: 3,
		arch: -1,
		tailA: -25,
		legs: {
			fn: { a1: 12, a2: -8 },
			ff: { a1: 42, a2: 18 },
			hn: { a1: -15, a2: -58, a3: -28 },
			hf: { a1: -26, a2: -50, a3: -24 }
		},
		planted: [true, false, false, false]
	},
	'run-3': {
		// recogida (lomo arqueado)
		sh: [41, 43],
		hip: [72, 38],
		head: [27, 29],
		pitch: -2,
		arch: 4,
		tailA: -55,
		legs: {
			fn: { a1: -18, a2: 2 },
			ff: { a1: 20, a2: -60 },
			hn: { a1: 42, a2: -62, a3: -30 },
			hf: { a1: 32, a2: -52, a3: -26 }
		},
		planted: [true, false, false, false]
	},
	'run-4': {
		// aterrizaje trasero bajo el cuerpo
		sh: [42, 41],
		hip: [74, 44],
		head: [28, 27],
		pitch: -4,
		arch: 5,
		tailA: -60,
		legs: {
			fn: { a1: 40, a2: -55 },
			ff: { a1: 28, a2: -45 },
			hn: { a1: 32, a2: -30, a3: 8 },
			hf: { a1: 24, a2: -24, a3: 2 }
		},
		planted: [false, false, true, true]
	},
	'run-5': {
		// impulso
		sh: [38, 39],
		hip: [76, 42],
		head: [25, 25],
		pitch: 4,
		arch: 0,
		tailA: -30,
		legs: {
			fn: { a1: 50, a2: 30 },
			ff: { a1: 28, a2: 44 },
			hn: { a1: -20, a2: -10, a3: -5 },
			hf: { a1: -38, a2: -28, a3: -22 }
		},
		planted: [false, false, true, false]
	},
	'run-6': {
		// aire, comenzando a recoger
		sh: [36, 37],
		hip: [79, 37],
		head: [23, 24],
		pitch: 7,
		arch: -2,
		tailA: -15,
		legs: {
			fn: { a1: 64, a2: 18 },
			ff: { a1: 44, a2: 36 },
			hn: { a1: -55, a2: -38, a3: -30 },
			hf: { a1: -42, a2: -46, a3: -34 }
		}
	},
	'jump-crouch': {
		sh: [43, 50],
		hip: [72, 49],
		head: [28, 38],
		pitch: 10,
		arch: 2,
		tailA: -50,
		legs: {
			fn: { a1: -14, a2: 16 },
			ff: { a1: -20, a2: 24 },
			hn: { a1: 58, a2: -38, a3: 28 },
			hf: { a1: 50, a2: -32, a3: 22 }
		},
		planted: [true, true, true, true]
	},
	'jump-air': {
		sh: [35, 36],
		hip: [80, 42],
		head: [22, 21],
		pitch: 14,
		arch: -4,
		tailA: -10,
		legs: {
			fn: { a1: 66, a2: 32 },
			ff: { a1: 48, a2: 42 },
			hn: { a1: -72, a2: -52, a3: -42 },
			hf: { a1: -58, a2: -60, a3: -48 }
		}
	},
	'jump-land': {
		sh: [39, 45],
		hip: [76, 37],
		head: [26, 31],
		pitch: -8,
		arch: 1,
		tailA: -20,
		legs: {
			fn: { a1: 22, a2: -10 },
			ff: { a1: 10, a2: 4 },
			hn: { a1: -14, a2: -48, a3: -22 },
			hf: { a1: -24, a2: -42, a3: -18 }
		},
		planted: [true, true, false, false]
	}
} satisfies Record<string, Pose>;

export type LynxFrame = keyof typeof POSES;
export const FRAME_NAMES = Object.keys(POSES) as LynxFrame[];
export const RUN_CYCLE: LynxFrame[] = ['run-1', 'run-2', 'run-3', 'run-4', 'run-5', 'run-6'];
export const FRAMES: Record<LynxFrame, { near: string[]; far: string[] }> = Object.fromEntries(
	FRAME_NAMES.map((n) => [n, buildFrame(POSES[n])])
) as Record<LynxFrame, { near: string[]; far: string[] }>;

// ----------------------------------------------------------------- suelo ----
// ViewBox 0 0 1000 100 estirado al ancho/alto de la franja. Baseline en y=84
// (16% desde abajo). La roca sube hasta ROCK_TOP. Los obstáculos viven en
// coordenadas normalizadas u ∈ [0,1] — la misma lista dispara los saltos.

export interface Obstacle {
	u: number; // centro, normalizado
	w: number; // ancho, normalizado
	kind: 'gap' | 'rock';
}

export const OBSTACLES: Obstacle[] = [
	{ u: 0.28, w: 0.06, kind: 'gap' },
	{ u: 0.62, w: 0.05, kind: 'rock' },
	{ u: 0.85, w: 0.055, kind: 'gap' }
];

export const GROUND_Y = 84; // baseline (de 100)
export const ROCK_TOP = 66; // tope de la roca (de 100)
export const ROCK_U = 0.62; // dónde arranca parado el lince (pose SSR)

// Ondulación suave y determinista de la línea.
const wob = (x: number) => 1.5 * Math.sin(x * 0.011) + 1 * Math.sin(x * 0.029 + 2);

function span(x0: number, x1: number, hook: 'left' | 'right' | 'both' | 'none'): string {
	// Traza un tramo continuo con puntos cada ~65 unidades suavizados con Q.
	// `hook` añade un pequeño gancho hacia abajo en los bordes de los huecos.
	const pts: Vec[] = [];
	if (hook === 'left' || hook === 'both') pts.push([x0, GROUND_Y + wob(x0) + 3.2]);
	const n = Math.max(2, Math.round((x1 - x0) / 65));
	for (let i = 0; i <= n; i++) {
		const x = x0 + ((x1 - x0) * i) / n;
		pts.push([x, GROUND_Y + wob(x)]);
	}
	if (hook === 'right' || hook === 'both') pts.push([x1, GROUND_Y + wob(x1) + 3.2]);

	let d = `M ${P(pts[0])}`;
	for (let i = 1; i < pts.length - 1; i++) {
		const mid: Vec = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
		d += ` Q ${P(pts[i])} ${P(mid)}`;
	}
	d += ` L ${P(pts[pts.length - 1])}`;
	return d;
}

function rock(cx: number, halfW: number): string {
	// Peñasco de silueta simple: sube, meseta levemente inclinada, baja.
	const x0 = cx - halfW,
		x1 = cx + halfW;
	const y0 = GROUND_Y + wob(x0),
		y1 = GROUND_Y + wob(x1);
	return (
		`M ${P([x0, y0])}` +
		` L ${P([x0 + halfW * 0.35, ROCK_TOP + 3])}` +
		` Q ${P([cx - halfW * 0.25, ROCK_TOP - 1])} ${P([cx + halfW * 0.3, ROCK_TOP + 0.5])}` +
		` L ${P([x1 - halfW * 0.3, ROCK_TOP + 4])}` +
		` L ${P([x1, y1])}`
	);
}

export function buildGroundPath(): string {
	const parts: string[] = [];
	let cursor = 0;
	let leftHook = false;
	for (const ob of OBSTACLES) {
		const x0 = (ob.u - ob.w / 2) * 1000;
		const x1 = (ob.u + ob.w / 2) * 1000;
		if (ob.kind === 'gap') {
			parts.push(span(cursor, x0, leftHook ? 'both' : 'right'));
			cursor = x1;
			leftHook = true;
		} else {
			parts.push(span(cursor, x0, leftHook ? 'left' : 'none'));
			parts.push(rock(ob.u * 1000, (ob.w / 2) * 1000));
			cursor = x1;
			leftHook = false;
		}
	}
	parts.push(span(cursor, 1000, leftHook ? 'left' : 'none'));
	return parts.join(' ');
}

export const GROUND_PATH = buildGroundPath();
