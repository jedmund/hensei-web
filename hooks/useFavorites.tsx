import clonedeep from 'lodash.clonedeep'
import api from '~utils/api'
import { PageContextObj } from '~types'

export const useFavorites = (
  parties: Party[],
  setParties: (value: Party[]) => void
) => {
  // Methods: Favorites
  function toggleFavorite(teamId: string, favorited: boolean) {
    if (favorited) unsaveFavorite(teamId)
    else saveFavorite(teamId)
  }

  function saveFavorite(teamId: string) {
    api.saveTeam({ id: teamId }).then((response) => {
      if (response.status == 201) {
        const index = parties.findIndex((p) => p.id === teamId)
        const party = parties[index]

        party.favorited = true

        let clonedParties = clonedeep(parties)
        clonedParties[index] = party

        setParties(clonedParties)
      }
    })
  }

  function unsaveFavorite(teamId: string) {
    api.unsaveTeam({ id: teamId }).then((response) => {
      if (response.status == 200) {
        const index = parties.findIndex((p) => p.id === teamId)
        const party = parties[index]

        party.favorited = false

        let clonedParties = clonedeep(parties)
        clonedParties[index] = party

        setParties(clonedParties)
      }
    })
  }

  return {
    toggleFavorite,
  }
}
