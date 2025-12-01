import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import { gridAdapter } from '$lib/api/adapters/grid.adapter'

/**
 * Global party store for reactive access to party data
 * Used to bridge party data between the Party component and components rendered outside the party context (like DetailsSidebar)
 */
class PartyStore {
	party = $state<Party | null>(null)

	setParty(party: Party | null) {
		this.party = party
	}

	get shortcode(): string | undefined {
		return this.party?.shortcode
	}

	getCharacter(id: string | number): GridCharacter | undefined {
		return this.party?.characters?.find((c) => String(c.id) === String(id))
	}

	getWeapon(id: string | number): GridWeapon | undefined {
		return this.party?.weapons?.find((w) => String(w.id) === String(id))
	}

	getSummon(id: string | number): GridSummon | undefined {
		return this.party?.summons?.find((s) => String(s.id) === String(id))
	}

	getItem(
		type: 'character' | 'weapon' | 'summon',
		id: string | number
	): GridCharacter | GridWeapon | GridSummon | undefined {
		switch (type) {
			case 'character':
				return this.getCharacter(id)
			case 'weapon':
				return this.getWeapon(id)
			case 'summon':
				return this.getSummon(id)
		}
	}

	/**
	 * Update a character in the party (optimistically updates local state and calls API)
	 */
	async updateCharacter(id: string, updates: Partial<GridCharacter>): Promise<GridCharacter> {
		// Optimistically update local state
		if (this.party?.characters) {
			this.party = {
				...this.party,
				characters: this.party.characters.map((c) =>
					String(c.id) === String(id) ? { ...c, ...updates } : c
				)
			}
		}

		// Call API
		const updated = await gridAdapter.updateCharacter(id, updates)

		// Update with server response
		if (this.party?.characters) {
			this.party = {
				...this.party,
				characters: this.party.characters.map((c) =>
					String(c.id) === String(id) ? updated : c
				)
			}
		}

		return updated
	}

	/**
	 * Update a weapon in the party (optimistically updates local state and calls API)
	 */
	async updateWeapon(id: string, updates: Partial<GridWeapon>): Promise<GridWeapon> {
		// Optimistically update local state
		if (this.party?.weapons) {
			this.party = {
				...this.party,
				weapons: this.party.weapons.map((w) =>
					String(w.id) === String(id) ? { ...w, ...updates } : w
				)
			}
		}

		// Call API
		const updated = await gridAdapter.updateWeapon(id, updates)

		// Update with server response
		if (this.party?.weapons) {
			this.party = {
				...this.party,
				weapons: this.party.weapons.map((w) =>
					String(w.id) === String(id) ? updated : w
				)
			}
		}

		return updated
	}

	clear() {
		this.party = null
	}
}

export const partyStore = new PartyStore()
