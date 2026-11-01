<script lang="ts">
	// The weapon's art at every size, with downloads for editors.
	// Weapons have transformations: Base (no suffix), Transcendence Stage 1 (_02),
	// Transcendence Stage 5 (_03). Element-changeable weapons (element 0) show
	// every element at every size.
	import { toast } from 'svelte-sonner'
	import { weaponAdapter, type Weapon } from '$lib/api/adapters/weapon.adapter'
	import EntityImagesTab, {
		type ImageItem
	} from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import {
		getWeaponImage,
		getWeaponTransformationStages,
		getWeaponFallbackImage
	} from '$lib/utils/images/weapons'
	import { getElementLabel, ELEMENT_DISPLAY_ORDER } from '$lib/utils/element'
	import { seriesHasTranscendenceArt } from '$lib/utils/weaponSeries'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record: weapon, canEdit }: RecordTabProps<Weapon> = $props()

	// Available image sizes for weapons
	const weaponSizes = ['base', 'grid', 'main', 'square']

	const weaponImages = $derived.by((): ImageItem[] => {
		if (!weapon.granblueId) return []

		const variants = ['base', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		if (weapon.element === 0) {
			// Element 0 (Null) has no base art, so show a placeholder there
			const elements = [0, ...ELEMENT_DISPLAY_ORDER]
			for (const element of elements) {
				const elementLabel = getElementLabel(element)
				for (const variant of variants) {
					if (element === 0 && variant === 'base') {
						images.push({
							url: '',
							label: `${variant} (${elementLabel})`,
							variant,
							pose: `element-${element}`,
							poseLabel: elementLabel,
							placeholder: true
						})
					} else {
						images.push({
							url: getWeaponImage(
								weapon.granblueId,
								variant,
								element,
								undefined,
								weapon.elementVariantIds
							),
							label: `${variant} (${elementLabel})`,
							variant,
							pose: `element-${element}`,
							poseLabel: elementLabel,
							fallbackUrl:
								element === 0 ? getWeaponFallbackImage(weapon.granblueId, variant) : undefined
						})
					}
				}
			}
		} else {
			const transformations = getWeaponTransformationStages(
				seriesHasTranscendenceArt(weapon.series)
			)

			for (const transformation of transformations) {
				for (const variant of variants) {
					images.push({
						url: getWeaponImage(weapon.granblueId, variant, undefined, transformation.suffix),
						label: `${variant} (${transformation.label})`,
						variant,
						pose: transformation.id,
						poseLabel: transformation.label
					})
				}
			}
		}

		return images
	})

	// Poll the batch download status until it completes or fails
	async function pollDownloadStatus(weaponId: string, toastId: string | number): Promise<void> {
		const maxAttempts = 60
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((r) => setTimeout(r, 2000))
			const status = await weaponAdapter.getWeaponDownloadStatus(weaponId)

			if (status.status === 'processing') {
				const downloaded = status.imagesDownloaded ?? 0
				const total = status.imagesTotal ?? 0
				toast.loading(`Downloading images… ${downloaded}/${total}`, { id: toastId })
			}

			if (status.status === 'completed') {
				toast.success(`Downloaded ${status.imagesDownloaded ?? ''} images`, { id: toastId })
				return
			}
			if (status.status === 'failed') {
				toast.error(status.error ?? 'Download failed', { id: toastId })
				return
			}
		}
		toast.error('Download timed out', { id: toastId })
	}

	// Kick off batch download and poll for completion
	async function batchDownload(weaponId: string, options: { force?: boolean; size?: string }) {
		const toastId = toast.loading('Queuing download…')
		try {
			await weaponAdapter.downloadWeaponImages(weaponId, options)
			toast.loading('Downloading images…', { id: toastId })
			await pollDownloadStatus(weaponId, toastId)
		} catch {
			toast.error('Failed to start download', { id: toastId })
		}
	}

	async function handleDownloadImage(
		size: string,
		transformation: string | undefined,
		force: boolean
	) {
		if (!weapon.id) return

		if (weapon.element === 0) {
			await batchDownload(weapon.id, { force, size })
		} else {
			const trans = transformation === '01' ? undefined : transformation
			await weaponAdapter.downloadWeaponImage(weapon.id, size, trans, force)
			toast.success('Image downloaded')
		}
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!weapon.id) return

		if (weapon.element === 0) {
			await batchDownload(weapon.id, { force })
		} else {
			const trans = pose === '01' ? undefined : pose
			for (const size of weaponSizes) {
				await weaponAdapter.downloadWeaponImage(weapon.id, size, trans, force)
			}
			toast.success('Images downloaded')
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!weapon.id) return
		await batchDownload(weapon.id, { force })
	}
</script>

<EntityImagesTab
	images={weaponImages}
	{canEdit}
	onDownloadImage={canEdit ? handleDownloadImage : undefined}
	onDownloadAllPose={canEdit ? handleDownloadAllPose : undefined}
	onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
/>
