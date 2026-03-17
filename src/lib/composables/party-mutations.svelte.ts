import {
	useCreateGridWeapon,
	useCreateGridCharacter,
	useCreateGridSummon,
	useDeleteGridWeapon,
	useDeleteGridCharacter,
	useDeleteGridSummon,
	useUpdateGridWeapon,
	useUpdateGridCharacter,
	useUpdateGridSummon,
	useUpdateWeaponUncap,
	useUpdateCharacterUncap,
	useUpdateSummonUncap,
	useSwapWeapons,
	useSwapCharacters,
	useSwapSummons,
	useDuplicateGridWeapon,
	useDuplicateGridSummon,
	useSwitchCharacterStyle,
	useSyncAllPartyItems,
	useUnlinkCollectionSource,
	useUpdateQuickSummon
} from '$lib/api/mutations/grid.mutations'

import {
	useCreateParty,
	useUpdateParty,
	useDeleteParty,
	useRemixParty,
	useFavoriteParty,
	useUnfavoriteParty,
	useSharePartyWithCrew,
	useRemovePartyShare
} from '$lib/api/mutations/party.mutations'

import {
	useUpdatePartyJob,
	useUpdatePartyJobSkills,
	useRemovePartyJobSkill,
	useUpdatePartyAccessory,
	useRemovePartyAccessory
} from '$lib/api/mutations/job.mutations'

export function usePartyMutations() {
	// Grid mutations
	const createWeapon = useCreateGridWeapon()
	const createCharacter = useCreateGridCharacter()
	const createSummon = useCreateGridSummon()
	const deleteWeapon = useDeleteGridWeapon()
	const deleteCharacter = useDeleteGridCharacter()
	const deleteSummon = useDeleteGridSummon()
	const updateWeapon = useUpdateGridWeapon()
	const updateCharacter = useUpdateGridCharacter()
	const updateSummon = useUpdateGridSummon()
	const updateWeaponUncap = useUpdateWeaponUncap()
	const updateCharacterUncap = useUpdateCharacterUncap()
	const updateSummonUncap = useUpdateSummonUncap()
	const swapWeapons = useSwapWeapons()
	const swapCharacters = useSwapCharacters()
	const swapSummons = useSwapSummons()
	const duplicateWeapon = useDuplicateGridWeapon()
	const duplicateSummon = useDuplicateGridSummon()
	const switchCharacterStyle = useSwitchCharacterStyle()
	const syncAllItems = useSyncAllPartyItems()
	const unlinkCollectionSource = useUnlinkCollectionSource()
	const updateQuickSummon = useUpdateQuickSummon()

	// Party mutations
	const createParty = useCreateParty()
	const updateParty = useUpdateParty()
	const deleteParty = useDeleteParty()
	const remixParty = useRemixParty()
	const favoriteParty = useFavoriteParty()
	const unfavoriteParty = useUnfavoriteParty()
	const sharePartyWithCrew = useSharePartyWithCrew()
	const removePartyShare = useRemovePartyShare()

	// Job mutations
	const updateJob = useUpdatePartyJob()
	const updateJobSkills = useUpdatePartyJobSkills()
	const removeJobSkill = useRemovePartyJobSkill()
	const updateAccessory = useUpdatePartyAccessory()
	const removeAccessory = useRemovePartyAccessory()

	return {
		grid: {
			createWeapon,
			createCharacter,
			createSummon,
			deleteWeapon,
			deleteCharacter,
			deleteSummon,
			updateWeapon,
			updateCharacter,
			updateSummon,
			updateWeaponUncap,
			updateCharacterUncap,
			updateSummonUncap,
			swapWeapons,
			swapCharacters,
			swapSummons,
			duplicateWeapon,
			duplicateSummon,
			switchCharacterStyle,
			syncAllItems,
			unlinkCollectionSource,
			updateQuickSummon
		},
		party: {
			create: createParty,
			update: updateParty,
			delete: deleteParty,
			remix: remixParty,
			favorite: favoriteParty,
			unfavorite: unfavoriteParty,
			shareWithCrew: sharePartyWithCrew,
			removeShare: removePartyShare
		},
		job: {
			updateJob,
			updateJobSkills,
			removeJobSkill,
			updateAccessory,
			removeAccessory
		}
	}
}

export type PartyMutations = ReturnType<typeof usePartyMutations>
