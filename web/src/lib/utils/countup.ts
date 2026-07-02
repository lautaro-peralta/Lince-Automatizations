// Parseo de los valores de las estadísticas para animarlos como contador.
// Sólo el PRIMER token numérico del string anima; prefijo y sufijo quedan
// estáticos ('~2 sem.' → prefix '~', target 2, suffix ' sem.'). Un string sin
// número (target null) nunca anima y se muestra tal cual.

export interface StatParts {
	prefix: string;
	target: number | null;
	decimals: number;
	suffix: string;
	raw: string;
}

const NUM = /-?\d+(?:[.,]\d+)?/;

export function parseStat(raw: string): StatParts {
	const m = NUM.exec(raw);
	if (!m) return { prefix: '', target: null, decimals: 0, suffix: '', raw };
	const token = m[0];
	const decimals = token.includes(',') || token.includes('.') ? token.split(/[.,]/)[1].length : 0;
	return {
		prefix: raw.slice(0, m.index),
		target: parseFloat(token.replace(',', '.')),
		decimals,
		suffix: raw.slice(m.index + token.length),
		raw
	};
}

// Formatea el valor intermedio respetando los decimales y el separador del
// token original (es-AR usa coma).
export function formatStat(value: number, parts: StatParts): string {
	const sep = parts.raw.match(NUM)?.[0].includes(',') ? ',' : '.';
	return value.toFixed(parts.decimals).replace('.', sep);
}
