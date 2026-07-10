import { describe, expect, it } from 'vitest';
import { isPasswordValid, passwordScore, passwordChecks } from './password';

describe('isPasswordValid', () => {
	it('rechaza una contraseña corta aunque tenga variedad', () => {
		expect(isPasswordValid('Ab1!')).toBe(false);
	});

	it('rechaza si falta la mayúscula', () => {
		expect(isPasswordValid('abcdef1!')).toBe(false);
	});

	it('rechaza si falta el número', () => {
		expect(isPasswordValid('Abcdefg!')).toBe(false);
	});

	it('rechaza si falta el carácter especial', () => {
		expect(isPasswordValid('Abcdefg1')).toBe(false);
	});

	it('acepta una contraseña que cumple todas las reglas', () => {
		expect(isPasswordValid('Abcdef1!')).toBe(true);
	});
});

describe('passwordScore', () => {
	it('cuenta 0 reglas para una cadena vacía', () => {
		expect(passwordScore('')).toBe(0);
	});

	it('cuenta las 5 reglas para una contraseña fuerte', () => {
		expect(passwordScore('Abcdef1!')).toBe(5);
	});
});

describe('passwordChecks', () => {
	it('reporta cada regla con su estado', () => {
		const checks = passwordChecks('abc');
		expect(checks.find((c) => c.key === 'Lowercase')?.ok).toBe(true);
		expect(checks.find((c) => c.key === 'Uppercase')?.ok).toBe(false);
		expect(checks.find((c) => c.key === 'Length')?.ok).toBe(false);
	});
});
