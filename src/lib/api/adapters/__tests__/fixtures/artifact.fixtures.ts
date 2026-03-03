/**
 * Artifact adapter test fixtures
 *
 * API = what Rails sends (snake_case, from ArtifactBlueprint)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 */

import { apiMeta } from './helpers'

// What the Rails API returns
export const API = {
	listArtifacts: {
		artifacts: [{ id: 'a1', name: 'Sword' }]
	},
	listSkills: {
		artifact_skills: [{ id: 's1', name: 'ATK Up' }]
	},
	listCollectionArtifacts: {
		artifacts: [{ id: 'ca-1' }],
		meta: apiMeta()
	},
	listCollectionArtifactsAlt: {
		collection_artifacts: [{ id: 'ca-2' }],
		meta: apiMeta()
	},
	syncGridArtifact: {
		grid_artifact: { id: 'ga-1', artifact_id: 'art-1' }
	}
}

// What the adapter returns to callers
export const EXPECTED = {
	listArtifacts: [{ id: 'a1', name: 'Sword' }],
	listSkills: [{ id: 's1', name: 'ATK Up' }],
	listCollectionArtifacts: {
		results: [{ id: 'ca-1' }],
		page: 1,
		total: 1,
		totalPages: 1,
		perPage: 20
	},
	listCollectionArtifactsAlt: {
		results: [{ id: 'ca-2' }],
		page: 1,
		total: 1,
		totalPages: 1,
		perPage: 20
	},
	syncGridArtifact: { id: 'ga-1', artifactId: 'art-1' }
}
