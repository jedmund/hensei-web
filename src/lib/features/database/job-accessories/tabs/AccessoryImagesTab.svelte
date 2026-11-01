<script lang="ts">
	// The accessory's images, with downloads for editors. Downloading every size
	// queues a job; a toast follows its progress.
	import { toast } from 'svelte-sonner'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import EntityImagesTab, {
		type ImageItem
	} from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import { getAccessoryImage } from '$lib/utils/images/equipment'
	import type { RecordTabProps } from '$lib/features/database/schema/types'
	import type { JobAccessory } from '$lib/types/api/entities'

	let { record: accessory, canEdit }: RecordTabProps<JobAccessory> = $props()

	const sizes = ['grid', 'square'] as const

	const images = $derived<ImageItem[]>(
		sizes.map((variant) => ({
			url: getAccessoryImage(accessory.granblueId, variant),
			label: variant,
			variant
		}))
	)

	async function pollDownloadStatus(toastId: string | number): Promise<void> {
		for (let i = 0; i < 30; i++) {
			await new Promise((r) => setTimeout(r, 2000))
			const status = await jobAdapter.getAccessoryDownloadStatus(accessory.granblueId)

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

	async function handleDownloadImage(
		size: string,
		_transformation: string | undefined,
		force: boolean
	) {
		await jobAdapter.downloadAccessoryImage(accessory.granblueId, size, force)
		toast.success('Image downloaded')
	}

	async function handleDownloadAllImages(force: boolean) {
		const toastId = toast.loading('Queuing download…')
		try {
			await jobAdapter.downloadAccessoryImages(accessory.granblueId, { force })
			toast.loading('Downloading images…', { id: toastId })
			await pollDownloadStatus(toastId)
		} catch {
			toast.error('Failed to start download', { id: toastId })
		}
	}
</script>

<EntityImagesTab
	{images}
	{canEdit}
	onDownloadImage={canEdit ? handleDownloadImage : undefined}
	onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
/>
