import { timingSafeEqual } from 'node:crypto'

/** Constant-time string comparison for secrets and tokens. */
export function secureEquals(a: string, b: string): boolean {
	const left = Buffer.from(a)
	const right = Buffer.from(b)
	return left.length === right.length && timingSafeEqual(left, right)
}
