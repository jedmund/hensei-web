import type { MentionType } from './types'

/** Which secondary content a surface renders under a mention's name. */
export type MentionSecondary = 'character-tags' | 'skill-meta' | 'none'

export interface MentionDescriptor {
	type: MentionType
	/** Whether the read-only renderer wraps the chip in a gbf.wiki link. */
	links: boolean
	/** Secondary content (dropdown row + tooltip pick their own layout from this). */
	secondary: MentionSecondary
}

export const mentionDescriptors: Record<MentionType, MentionDescriptor> = {
	character: { type: 'character', links: true, secondary: 'character-tags' },
	weapon: { type: 'weapon', links: true, secondary: 'none' },
	summon: { type: 'summon', links: true, secondary: 'none' },
	skill: { type: 'skill', links: false, secondary: 'skill-meta' }
}

/** Safe fallback so unknown/legacy token types render as a plain linked chip rather than throwing. */
const DEFAULT_DESCRIPTOR: MentionDescriptor = {
	type: 'character',
	links: true,
	secondary: 'none'
}

export function descriptorFor(type: string | undefined): MentionDescriptor {
	return mentionDescriptors[type as MentionType] ?? DEFAULT_DESCRIPTOR
}
