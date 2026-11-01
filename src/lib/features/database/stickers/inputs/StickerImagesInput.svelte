<script lang="ts">
	// The sticker's English and Japanese images on the edit form. Uploading,
	// and removing the Japanese image, save right away (they have their own
	// endpoints). While a game sticker is picked on the form, its images show
	// instead: saving takes them.
	import { untrack } from 'svelte'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
	import { adminKeys } from '$lib/api/queries/admin.queries'
	import { stickerKeys, stickerQueries } from '$lib/api/queries/sticker.queries'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import type { Sticker, StickerImageLanguage } from '$lib/types/api/sticker'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { getHostedImageUrl } from '$lib/utils/images/core'

	let { form, record: rawRecord }: InputProps = $props()

	// On the edit form only (`form: { create: false }`), so there's a record
	const record = $derived(rawRecord as Sticker)

	const MAX_BYTES = 512 * 1024
	const queryClient = useQueryClient()
	const libraryQuery = createQuery(() => stickerQueries.library())

	// The saved images, updated by each upload or removal
	let saved = $state(untrack(() => ({ en: record.imageUrl, ja: record.imageUrlJa })))
	// Bumped after each request, so a chosen file's preview gives way to the result
	let version = $state(0)
	let busy = $state(false)

	const pickedId = $derived(form.values.library_id as number | null | undefined)
	const picked = $derived(
		pickedId ? libraryQuery.data?.find((entry) => entry.id === pickedId) : undefined
	)

	async function run(request: () => Promise<Sticker>, success: string) {
		busy = true
		try {
			const sticker = await request()
			saved = { en: sticker.imageUrl, ja: sticker.imageUrlJa }
			toast.success(success)
			void queryClient.invalidateQueries({ queryKey: stickerKeys.all })
			void queryClient.invalidateQueries({ queryKey: adminKeys.lists('stickers') })
		} catch (error) {
			toast.error(extractErrorMessage(error, m.db_stickers_image_failed()))
		} finally {
			busy = false
			version++
		}
	}

	function upload(file: File, language: StickerImageLanguage) {
		if (busy) return
		void run(
			() => stickerAdapter.uploadImage(record.id, file, file.name, language),
			m.db_stickers_image_uploaded()
		)
	}

	function removeJapanese() {
		if (busy) return
		void run(() => stickerAdapter.removeJapaneseImage(record.id), m.db_stickers_image_removed())
	}
</script>

<div class="images">
	<p class="hint">
		{picked ? m.db_stickers_image_from_library() : m.db_stickers_image_hint()}
	</p>
	{#each ['en', 'ja'] as const as language (language)}
		<div class="image">
			<h3>{language === 'en' ? m.db_stickers_image_en() : m.db_stickers_image_ja()}</h3>
			{#if picked}
				{@const url = language === 'en' ? picked.imageUrl : picked.imageUrlJa}
				<div class="preview">
					{#if url}<img src={getHostedImageUrl(url)} alt="" />{/if}
				</div>
			{:else}
				{#key `${version}/${saved[language]}`}
					<ImageFileField
						currentUrl={saved[language]}
						maxBytes={MAX_BYTES}
						onSelect={(file) => upload(file, language)}
					/>
				{/key}
				{#if language === 'ja' && saved.ja}
					<Button variant="ghost" size="small" disabled={busy} onclick={removeJapanese}>
						{m.db_stickers_image_ja_remove()}
					</Button>
				{/if}
			{/if}
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.images {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	// The format rules, once for both images
	.hint {
		grid-column: 1 / -1;
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.image h3 {
		margin: 0 0 spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.preview {
		width: 64px;
		height: 64px;
		background: var(--input-bound-bg);
		border-radius: layout.$item-corner;
		overflow: hidden;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}
</style>
