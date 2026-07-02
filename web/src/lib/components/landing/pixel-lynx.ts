// Lince pixel art de la barra rayada. La fuente de verdad es una matriz de
// píxeles editable (1 char = 1 píxel) pensada para animarse después: cada pose
// futura es una entrada más en FRAMES con la misma grilla y leyenda.
//
// La matriz se compila a nivel de módulo (determinista → prerender = cliente)
// a un <path> por color con un subpath rectangular por run horizontal: DOM
// mínimo (~7 paths) en vez de ~600 <rect>.

// Paleta fija del pixel art (no cambia con el tema: es la piel del personaje).
export const PALETTE: Record<string, string> = {
	k: '#141414', // contorno negro
	t: '#c9976a', // tostado
	l: '#ecd2ab', // claro (pecho, hocico)
	d: '#8a5836', // marrón oscuro (manchas, nariz)
	s: '#b0784f', // tostado sombra
	y: '#f3c64e', // amarillo (ojos)
	p: '#f7e2a4' // amarillo pálido (bajo del ojo)
};

// Leyenda: . = transparente. Grilla 32×35.
export const FRAMES = {
	sit: [
		'.....k....................k.....',
		'.....kk..................kk.....',
		'......k..................k......',
		'......ktk..............ktk......',
		'.....kttk..............kttk.....',
		'....ktdttk............kttdtk....',
		'....ktdtttk..........ktttdtk....',
		'...kltdttttk........kttttdtlk...',
		'...klttttttkkkkkkkkkkttttttlk...',
		'...kttttttttttttddttttttttttk...',
		'..ktttttttttttttddttttttttttk...',
		'..ktttttkkkkkttddttkkkkktttttk..',
		'..ktttttkyykkttddttkkyyktttttk..',
		'..ktttttkpppkllddllkpppktttttk..',
		'..kttttttllllldkkdlllllttttttk..',
		'..ktttttslllllllllllllstttttk...',
		'...ktttttllllkkkkkkllllttttk....',
		'...kkttttllllllllllllllttttkk...',
		'.....kttttllllllllllllttttk.....',
		'....kttttttllllllllllttttttk....',
		'...kttttttttllllllllttttttttk...',
		'...kttttddttlllllltttkktttttk...',
		'..kttttttttttllllllttttttttttk..',
		'..ktttddddttttllllttttttddtttk..',
		'.kttdttttdttttllllttttttttttttk.',
		'.ktdtttttdttttllllttttkkttttttk.',
		'.ktdtttttdttttllllttttttttttttk.',
		'.kttdtttddttkttttkttttttttttttk.',
		'.ktttddddtttkttttktttttddtttttk.',
		'.kttttttttttkttttkttttttttttttk.',
		'.kttttttttttkttttkttttttttttttk.',
		'kkkkkkkkkttttkttttkttttttttttkk.',
		'kddtttttkttttkttttkttttttttttk..',
		'kddtttttkttktkttktkttkttkttttk..',
		'kkkkkkkkkkkkkkkkkkkkkkkkkkkkk...'
	]
} satisfies Record<string, string[]>;

export type LynxFrame = keyof typeof FRAMES;

export const GRID_W = 32;
export const GRID_H = FRAMES.sit.length;

// Sangrado sub-píxel para que los runs adyacentes no dejen costuras al
// escalar a tamaños no enteros (los colores son opacos: el solape no se ve).
const BLEED = 0.015;

function compile(rows: string[]): { color: string; d: string }[] {
	const byColor = new Map<string, string[]>();
	rows.forEach((row, y) => {
		let x = 0;
		while (x < row.length) {
			const ch = row[x];
			if (ch === '.') {
				x++;
				continue;
			}
			let end = x;
			while (end < row.length && row[end] === ch) end++;
			const run = `M${x - BLEED} ${y - BLEED}h${end - x + BLEED * 2}v${1 + BLEED * 2}h${-(end - x + BLEED * 2)}z`;
			const list = byColor.get(ch);
			if (list) list.push(run);
			else byColor.set(ch, [run]);
			x = end;
		}
	});
	return [...byColor.entries()].map(([ch, runs]) => ({ color: PALETTE[ch], d: runs.join('') }));
}

export const FRAME_PATHS: Record<LynxFrame, { color: string; d: string }[]> = {
	sit: compile(FRAMES.sit)
};
