/**
 * Artifact skills in the database sidebar, nested under Characters. No "New"
 * actions of its own: skills come from the game and are edit-only. Kept apart
 * from the definition: the sidebar is on every page and mustn't load it.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const artifactSkillsSection: ResourceSection = {
	label: () => m.nav_artifact_skills(),
	group: 'catalogue',
	parent: 'characters'
}
