// PartyShare type for party sharing with crews/groups
// Based on PartyShareBlueprint from Rails API

export interface PartyShare {
  id: string
  shareableType: string
  shareableId: string
  shareableName?: string
  createdAt: string
}
