<script lang="ts">
	// The awakening's icon on the edit form, with an upload that saves right
	// away (icons have their own endpoint). Character awakenings take a JPEG,
	// the rest a PNG; the API checks the format and size.
	import { useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import { awakeningAdapter } from '$lib/api/adapters/awakening.adapter'
	import { entityKeys } from '$lib/api/queries/entity.queries'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import type { Awakening } from '$lib/types/api/entities'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { getAwakeningIcon } from '$lib/utils/images/icons'
	import { localizedName } from '$lib/utils/locale'

	let { field, record: rawRecord }: InputProps = $props()

	// On the edit form only (`form: { create: false }`), so there's a record
	const record = $derived(rawRecord as Awakening)

	const queryClient = useQueryClient()
	let input = $state<HTMLInputElement>()
	let preview = $state<string | null>(null)
	let uploading = $state(false)

	function readAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = () => reject(reader.error)
			reader.readAsDataURL(file)
		})
	}

	async function upload(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0]
		if (!file) return
		uploading = true
		try {
			const dataUrl = await readAsDataUrl(file)
			// The API takes the bare base64 payload
			const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
			await awakeningAdapter.uploadAwakeningImage(record.id, base64, file.name)
			preview = dataUrl
			toast.success(m.db_awakenings_image_uploaded())
			void queryClient.invalidateQueries({ queryKey: entityKeys.allAwakenings() })
		} catch (error) {
			toast.error(extractErrorMessage(error, m.db_awakenings_image_failed()))
		} finally {
			uploading = false
			if (input) input.value = ''
		}
	}
</script>

<DetailItem label={field.label()} editable>
	<div class="image">
		<img
			class="icon"
			src={preview ?? getAwakeningIcon(record.slug)}
			alt={localizedName(record.name)}
		/>
		<Button variant="ghost" size="small" disabled={uploading} onclick={() => input?.click()}>
			{preview ? m.db_awakenings_image_change() : m.db_awakenings_image_upload()}
		</Button>
		<input bind:this={input} type="file" accept="image/png,image/jpeg" onchange={upload} hidden />
	</div>
</DetailItem>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.image {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.icon {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}
</style>
