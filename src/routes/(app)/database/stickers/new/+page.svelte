<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import StickerFormFields from '$lib/components/database/StickerFormFields.svelte'
	import {
		uploadImages,
		useCreateSticker,
		useUploadStickerImage
	} from '$lib/api/mutations/sticker-catalogue.mutations'
	import type { StickerImageLanguage } from '$lib/types/api/sticker'
	import { useAsyncAction } from '$lib/utils/asyncAction.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'

	const createMut = useCreateSticker()
	const uploadMut = useUploadStickerImage()

	let values = $state({ slug: '', meaningEn: '', meaningJp: '', active: true })
	// Chosen images, uploaded once the sticker is created
	let imageFiles = $state<Partial<Record<StickerImageLanguage, File>>>({})
	let saveError = $state<string | null>(null)

	const SLUG = /^[a-z0-9][a-z0-9_-]*$/
	const canSave = $derived(
		SLUG.test(values.slug.trim()) &&
			values.meaningEn.trim() !== '' &&
			values.meaningJp.trim() !== ''
	)

	const saveAction = useAsyncAction(
		async () => {
			if (!canSave) return
			saveError = null
			const sticker = await createMut.mutateAsync({
				slug: values.slug.trim(),
				meaningEn: values.meaningEn.trim(),
				meaningJp: values.meaningJp.trim(),
				active: values.active
			})
			await uploadImages(uploadMut, sticker.id, imageFiles)
			goto(localizeHref('/database/stickers'))
		},
		m.db_stickers_save_failed(),
		{ onError: (_, message) => (saveError = message) }
	)
</script>

<PageMeta
	title={m.page_title_db_new({ type: m.db_stickers_type() })}
	description={m.page_desc_home()}
/>

<div class="page">
	<DatabaseFormHeader
		title={m.db_stickers_new()}
		onCancel={() => goto(localizeHref('/database/stickers'))}
		onSave={saveAction.run}
		isSaving={saveAction.busy}
		disabled={!canSave}
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<StickerFormFields
			bind:values
			onSelectImage={(file, language) => (imageFiles[language] = file)}
		/>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}
</style>
