<script lang="ts">
	/**
	 * Shared fields for the sticker new + edit pages: slug, meanings, active
	 * flag, and the English and Japanese images. Page chrome stays in the page.
	 */
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import StickerLibraryPicker from '$lib/components/database/StickerLibraryPicker.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { LibrarySticker, StickerImageLanguage } from '$lib/types/api/sticker'

	interface StickerValues {
		slug: string
		meaningEn: string
		meaningJp: string
		active: boolean
	}

	interface Props {
		values: StickerValues
		imageUrl?: string | null | undefined
		imageUrlJa?: string | null | undefined
		/** The slug names the image file, so it can't change once created */
		slugLocked?: boolean
		onSelectImage: (file: File, language: StickerImageLanguage) => void
		/** The game's sticker picked to take the images from */
		libraryId?: number | null | undefined
		/** The sticker being edited (see StickerLibraryPicker) */
		stickerId?: string | undefined
		onPickLibrary: (entry: LibrarySticker) => void
		/** Offers to remove the Japanese image (on saved stickers) */
		onRemoveImageJa?: (() => void) | undefined
	}

	let {
		values = $bindable(),
		imageUrl,
		imageUrlJa,
		slugLocked = false,
		onSelectImage,
		libraryId = null,
		stickerId,
		onPickLibrary,
		onRemoveImageJa
	}: Props = $props()
</script>

<DetailsContainer title={m.db_stickers_section_details()}>
	{#if slugLocked}
		<DetailItem label={m.db_stickers_field_slug()} value={values.slug} />
	{:else}
		<DetailItem
			label={m.db_stickers_field_slug()}
			bind:value={values.slug}
			editable={true}
			type="text"
			placeholder="full-auto"
		/>
	{/if}
	<DetailItem
		label={m.db_stickers_field_meaning_en()}
		bind:value={values.meaningEn}
		editable={true}
		type="text"
		placeholder={m.db_stickers_placeholder_meaning_en()}
	/>
	<DetailItem
		label={m.db_stickers_field_meaning_jp()}
		bind:value={values.meaningJp}
		editable={true}
		type="text"
		placeholder={m.db_stickers_placeholder_meaning_jp()}
	/>
	<DetailItem label={m.db_stickers_field_active()} editable={true}>
		<Switch bind:checked={values.active} size="small" />
	</DetailItem>
</DetailsContainer>

<DetailsContainer title={m.db_stickers_section_library()}>
	<StickerLibraryPicker selected={libraryId} {stickerId} onSelect={onPickLibrary} />
</DetailsContainer>

<DetailsContainer title={m.db_stickers_section_image()}>
	<div class="image-section">
		<p class="hint">{m.db_stickers_image_hint()}</p>
		<div class="image">
			<h3>{m.db_stickers_image_en()}</h3>
			<ImageFileField currentUrl={imageUrl} onSelect={(file) => onSelectImage(file, 'en')} />
		</div>
		<div class="image">
			<h3>{m.db_stickers_image_ja()}</h3>
			<!-- Remounted when the image changes, dropping a chosen file's preview -->
			{#key imageUrlJa}
				<ImageFileField currentUrl={imageUrlJa} onSelect={(file) => onSelectImage(file, 'ja')} />
			{/key}
			{#if imageUrlJa && onRemoveImageJa}
				<Button variant="ghost" size="small" onclick={onRemoveImageJa}>
					{m.db_stickers_image_ja_remove()}
				</Button>
			{/if}
		</div>
	</div>
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.image-section {
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
</style>
