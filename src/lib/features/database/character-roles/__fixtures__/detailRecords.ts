/** Role records (the role JSON, camelCased) for the detail and form tests */
import type { Role } from '$lib/types/api/party'

export const detailRecords = {
	// Both names and an uploaded icon
	full: {
		id: '8bbd9870-a997-4ece-adf2-e845b39da9f7',
		nameEn: 'Attacker',
		nameJp: 'アタッカー',
		sortOrder: 1,
		iconKey: 'images/grid_character_roles/8bbd9870-a997-4ece-adf2-e845b39da9f7.png?v=1761955200'
	},
	// No Japanese name and no icon, as most production rows have no icon
	empty: {
		id: '85518f3e-ee24-4ba6-bc86-9b9bcf82eb0e',
		nameEn: 'Healer',
		sortOrder: 5,
		iconKey: null
	}
} satisfies Record<string, Role>
