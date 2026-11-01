<script lang="ts">
	// The character's art in every pose and size, with downloads for editors.
	// Poses follow the uncaps (_03 FLB, _04 ULB or transcendence); null-element
	// characters show every element, and gender variants both genders. Style
	// shifts have their own page; a base character with one shows its art too.
	import { characterAdapter, type Character } from '$lib/api/adapters/character.adapter'
	import EntityImagesTab, {
		type ImageItem
	} from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import { getCharacterImage } from '$lib/utils/images/characters'
	import { getElementLabel, ELEMENT_DISPLAY_ORDER } from '$lib/utils/element'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record: character, canEdit }: RecordTabProps<Character> = $props()

	const ulb = $derived(character.uncap?.ulb ?? false)
	const transcendence = $derived(character.uncap?.transcendence ?? false)

	// Available image sizes for characters
	const characterSizes = ['detail', 'grid', 'main', 'square']

	// Generate image items for character (variants and poses based on uncap level)
	const characterImages = $derived.by((): ImageItem[] => {
		if (!character.granblueId) return []

		const variants = ['detail', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		// Style swap characters only have a single _01_style pose
		if (character.styleSwap) {
			for (const variant of variants) {
				images.push({
					url: getCharacterImage(character.granblueId, variant, '01_style'),
					label: `${variant} (Style)`,
					variant,
					pose: '01_style',
					poseLabel: 'Style'
				})
			}
			return images
		}

		// Only include poses that are available - _04 is ULB for story characters and
		// transcendence for regular characters.
		const poses: { id: string; label: string }[] = [
			{ id: '01', label: 'Base' },
			{ id: '02', label: 'MLB' }
		]

		if (character.uncap?.flb) {
			poses.push({ id: '03', label: 'FLB' })
		}

		if (ulb || transcendence) {
			poses.push({ id: '04', label: ulb ? 'ULB' : 'Transcendence' })
		}

		const genderLabels = ['Gran', 'Djeeta'] as const

		if (character.element === 0) {
			// Null-element characters: show all 6 element variants for each pose
			for (const element of ELEMENT_DISPLAY_ORDER) {
				const elementLabel = getElementLabel(element)
				for (const pose of poses) {
					if (character.genderVariants) {
						// With gender variants: show both Gran and Djeeta for each element
						for (const [genderIdx, genderLabel] of genderLabels.entries()) {
							for (const variant of variants) {
								images.push({
									url: getCharacterImage(
										character.granblueId,
										variant,
										`${pose.id}_0${element}_${genderIdx}`
									),
									label: `${variant} (${pose.label} — ${elementLabel} — ${genderLabel})`,
									variant,
									pose: `${pose.id}-element-${element}-gender-${genderIdx}`,
									poseLabel: `${pose.label} (${elementLabel} — ${genderLabel})`
								})
							}
						}
					} else {
						// Without gender variants: element only
						for (const variant of variants) {
							images.push({
								url: getCharacterImage(character.granblueId, variant, `${pose.id}_0${element}`),
								label: `${variant} (${pose.label} — ${elementLabel})`,
								variant,
								pose: `${pose.id}-element-${element}`,
								poseLabel: `${pose.label} (${elementLabel})`
							})
						}
					}
				}
			}
		} else {
			// Non-null-element characters: base images
			for (const pose of poses) {
				for (const variant of variants) {
					images.push({
						url: getCharacterImage(character.granblueId, variant, pose.id),
						label: `${variant} (${pose.label})`,
						variant,
						pose: pose.id,
						poseLabel: pose.label
					})
				}
			}

			// Gender variants only when character has them
			if (character.genderVariants) {
				for (const pose of poses) {
					for (const [genderIdx, genderLabel] of genderLabels.entries()) {
						for (const variant of variants) {
							images.push({
								url: getCharacterImage(character.granblueId, variant, `${pose.id}_${genderIdx}`),
								label: `${variant} (${pose.label} — ${genderLabel})`,
								variant,
								pose: `${pose.id}-gender-${genderIdx}`,
								poseLabel: `${pose.label} (${genderLabel})`
							})
						}
					}
				}
			}

			// Include style swap images if this base character has style variants
			if (character.styleSwaps?.length) {
				for (const variant of variants) {
					images.push({
						url: getCharacterImage(character.granblueId, variant, '01_style'),
						label: `${variant} (Style)`,
						variant,
						pose: '01_style',
						poseLabel: 'Style'
					})
				}
			}
		}

		return images
	})

	/**
	 * Parse a pose key that may contain element and/or gender info.
	 * e.g. "01-element-2-gender-0" → { pose: "01", element: 2, gender: 0 }
	 *      "01-element-2" → { pose: "01", element: 2, gender: undefined }
	 *      "01-gender-0" → { pose: "01", element: undefined, gender: 0 }
	 *      "02" → { pose: "02", element: undefined, gender: undefined }
	 */
	function parsePoseKey(poseKey: string | undefined): {
		pose: string | undefined
		element: number | undefined
		gender: number | undefined
	} {
		if (!poseKey) return { pose: undefined, element: undefined, gender: undefined }

		// Try element (with optional gender)
		const elementMatch = poseKey.match(/^(\d+)-element-(\d+)(?:-gender-(\d+))?$/)
		if (elementMatch) {
			return {
				pose: elementMatch[1],
				element: parseInt(elementMatch[2]!, 10),
				gender: elementMatch[3] !== undefined ? parseInt(elementMatch[3], 10) : undefined
			}
		}

		// Try gender-only
		const genderMatch = poseKey.match(/^(\d+)-gender-(\d+)$/)
		if (genderMatch) {
			return {
				pose: genderMatch[1],
				element: undefined,
				gender: parseInt(genderMatch[2]!, 10)
			}
		}

		return { pose: poseKey, element: undefined, gender: undefined }
	}

	// Image download handlers
	async function handleDownloadImage(
		size: string,
		transformation: string | undefined,
		force: boolean
	) {
		if (!character.id) return
		const { pose, element, gender } = parsePoseKey(transformation)
		await characterAdapter.downloadCharacterImage(character.id, size, pose, force, element, gender)
	}

	async function handleDownloadAllPose(poseKey: string, force: boolean) {
		if (!character.id) return
		const { pose, element, gender } = parsePoseKey(poseKey)
		// Download all sizes for this pose
		for (const size of characterSizes) {
			await characterAdapter.downloadCharacterImage(
				character.id,
				size,
				pose,
				force,
				element,
				gender
			)
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!character.id) return
		await characterAdapter.downloadCharacterImages(character.id, { force })
	}
</script>

<EntityImagesTab
	images={characterImages}
	{canEdit}
	onDownloadImage={canEdit ? handleDownloadImage : undefined}
	onDownloadAllPose={canEdit ? handleDownloadAllPose : undefined}
	onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
/>
