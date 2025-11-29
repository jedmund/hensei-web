/**
 * Type utilities for handling exactOptionalPropertyTypes: true
 *
 * These utilities help work with third-party libraries and components
 * that don't properly support exactOptionalPropertyTypes.
 */

/**
 * Recursively converts optional properties from { key?: T } to { key?: T | undefined }
 * This is needed for libraries like bits-ui that don't include undefined in optional props.
 *
 * @example
 * ```ts
 * type Original = { optional?: string }
 * type Fixed = DeepAddUndefined<Original> // { optional?: string | undefined }
 * ```
 */
export type DeepAddUndefined<Type> =
	Type extends (infer Element)[]
		? DeepAddUndefined<Element>[]
		: Type extends (...args: unknown[]) => unknown
			? Type
			: Type extends object
				? {
						[Key in keyof Type]: undefined extends Type[Key]
							? never
							: DeepAddUndefined<Type[Key]>
					} & {
						[Key in keyof Type]?: undefined extends Type[Key]
							? undefined | DeepAddUndefined<Type[Key]>
							: never
					}
				: Type

/**
 * Shim function that "fixes" types for exactOptionalPropertyTypes compatibility.
 * Use this when passing props to third-party components that don't support exactOptionalPropertyTypes.
 *
 * @example
 * ```ts
 * <Dialog {...exactOptionalShim({ onOpenChange: myHandler })} />
 * ```
 */
export function exactOptionalShim<Type>(value: Type): DeepAddUndefined<Type> {
	return value as never
}

/**
 * Simple single-level optional property fixer.
 * Faster alternative to DeepAddUndefined when you don't need recursion.
 *
 * @example
 * ```ts
 * type Original = { optional?: string; required: number }
 * type Fixed = OptionalUndefined<Original> // { optional?: string | undefined; required: number }
 * ```
 */
export type OptionalUndefined<Type> = {
	[Key in keyof Type as undefined extends Type[Key] ? never : Key]: Type[Key]
} & {
	[Key in keyof Type as undefined extends Type[Key] ? Key : never]?: Type[Key] | undefined
}

/**
 * Helper to conditionally include optional properties only when they're defined.
 * This avoids assigning undefined to optional properties.
 *
 * @example
 * ```ts
 * const props = {
 *   required: 'value',
 *   ...optionalProp('optional', maybeUndefined),
 *   ...optionalProp('other', maybeOther)
 * }
 * ```
 */
export function optionalProp<K extends string, V>(
	key: K,
	value: V | undefined
): V extends undefined ? {} : { [P in K]: V } {
	if (value === undefined) {
		return {} as any
	}
	return { [key]: value } as any
}

/**
 * Helper to build objects with optional properties that are only included when defined.
 *
 * @example
 * ```ts
 * const props = optionalProps({
 *   required: 'always included',
 *   optional: maybeUndefined,  // only included if defined
 *   other: maybeOther          // only included if defined
 * })
 * ```
 */
export function optionalProps<T extends Record<string, unknown>>(
	obj: T
): Partial<T> {
	const result: Partial<T> = {}
	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined) {
			result[key as keyof T] = value
		}
	}
	return result
}
