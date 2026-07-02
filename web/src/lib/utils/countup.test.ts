import { describe, expect, it } from 'vitest';
import { formatStat, parseStat } from './countup';

describe('parseStat', () => {
	it('parsea un entero pelado (stat actual "3")', () => {
		expect(parseStat('3')).toEqual({
			prefix: '',
			target: 3,
			decimals: 0,
			suffix: '',
			raw: '3'
		});
	});

	it('parsea prefijo y sufijo (stat actual "~2 sem.")', () => {
		expect(parseStat('~2 sem.')).toEqual({
			prefix: '~',
			target: 2,
			decimals: 0,
			suffix: ' sem.',
			raw: '~2 sem.'
		});
	});

	it('parsea el equivalente en inglés "~2 wks"', () => {
		const p = parseStat('~2 wks');
		expect(p.prefix).toBe('~');
		expect(p.target).toBe(2);
		expect(p.suffix).toBe(' wks');
	});

	it('un cero es un objetivo válido (stat actual "0")', () => {
		expect(parseStat('0').target).toBe(0);
	});

	it('sólo anima el primer token numérico ("24/7")', () => {
		const p = parseStat('24/7');
		expect(p.target).toBe(24);
		expect(p.suffix).toBe('/7');
	});

	it('maneja signo y porcentaje ("-70%", "+30%")', () => {
		expect(parseStat('-70%')).toMatchObject({ prefix: '', target: -70, suffix: '%' });
		expect(parseStat('+30%')).toMatchObject({ prefix: '+', target: 30, suffix: '%' });
	});

	it('decimales con coma (es-AR)', () => {
		const p = parseStat('4,5 hs');
		expect(p.target).toBe(4.5);
		expect(p.decimals).toBe(1);
		expect(formatStat(4.5, p)).toBe('4,5');
	});

	it('sin número → target null (nunca anima)', () => {
		expect(parseStat('gratis').target).toBeNull();
	});
});

describe('formatStat', () => {
	it('respeta los decimales del token original', () => {
		const p = parseStat('2.50');
		expect(formatStat(1.2345, p)).toBe('1.23');
	});

	it('enteros sin decimales', () => {
		const p = parseStat('3');
		expect(formatStat(1.7, p)).toBe('2');
	});
});
