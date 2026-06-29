/** Une clases condicionales (clsx minimalista). */
export function cx(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ');
}
