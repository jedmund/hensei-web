/**
 * The registered resources' names, kept apart from their definitions: the
 * `resource` param matcher runs in the app's entry chunk on every page, so it
 * mustn't import the definitions (zod, field options). The registry's type
 * keeps this list and the definitions in step.
 */
export const RESOURCE_NAMES = ['weapons', 'characters', 'raids', 'raid-groups', 'events'] as const

export type ResourceName = (typeof RESOURCE_NAMES)[number]

export function isResourceName(name: string): name is ResourceName {
	return (RESOURCE_NAMES as readonly string[]).includes(name)
}
