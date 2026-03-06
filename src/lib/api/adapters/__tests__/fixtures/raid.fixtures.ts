/**
 * Raid adapter test fixtures
 *
 * API = what Rails sends (snake_case, from RaidBlueprint)
 * EXPECTED = what callers receive (camelCase, post-BaseAdapter transform)
 */

// What the Rails API returns
export const API = {
	downloadStatus: {
		status: 'completed',
		progress: 100,
		images_downloaded: 4,
		images_total: 4,
		raid_id: 'raid-1',
		slug: 'proto-bahamut',
		updated_at: '2024-01-01T00:00:00Z'
	}
}

// What the adapter returns to callers
export const EXPECTED = {
	downloadStatus: {
		status: 'completed',
		progress: 100,
		imagesDownloaded: 4,
		imagesTotal: 4,
		raidId: 'raid-1',
		slug: 'proto-bahamut',
		updatedAt: '2024-01-01T00:00:00Z'
	}
}
