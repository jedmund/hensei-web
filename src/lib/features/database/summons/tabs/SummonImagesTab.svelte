<script lang="ts">
	// The summon's art in every size and transformation (base, then the
	// uncap and transcendence art its id or series has), with downloads for editors
	import { summonAdapter, type Summon } from '$lib/api/adapters/summon.adapter'
	import EntityImagesTab, {
		type ImageItem
	} from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import { getSummonImage, getSummonTransformationStages } from '$lib/utils/images/summons'
	import { seriesHasUlbArt } from '$lib/utils/summonSeries'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record: summon, canEdit }: RecordTabProps<Summon> = $props()

	const sizes = ['detail', 'grid', 'main', 'tall', 'square', 'wide'] as const

	const images = $derived.by((): ImageItem[] => {
		if (!summon.granblueId) return []
		return getSummonTransformationStages(summon.granblueId, seriesHasUlbArt(summon.series)).flatMap(
			(stage) =>
				sizes.map((variant) => ({
					url: getSummonImage(summon.granblueId, variant, stage.suffix),
					label: `${variant} (${stage.label})`,
					variant,
					pose: stage.id,
					poseLabel: stage.label
				}))
		)
	})

	// '01' is the base art, which has no transformation suffix
	const transformation = (pose: string | undefined) => (pose === '01' ? undefined : pose)

	async function handleDownloadImage(size: string, pose: string | undefined, force: boolean) {
		await summonAdapter.downloadSummonImage(summon.id, size, transformation(pose), force)
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		for (const size of sizes) {
			await summonAdapter.downloadSummonImage(summon.id, size, transformation(pose), force)
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		await summonAdapter.downloadSummonImages(summon.id, { force })
	}
</script>

<EntityImagesTab
	{images}
	{canEdit}
	onDownloadImage={canEdit ? handleDownloadImage : undefined}
	onDownloadAllPose={canEdit ? handleDownloadAllPose : undefined}
	onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
/>
