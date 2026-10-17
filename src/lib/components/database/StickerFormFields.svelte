<script lang="ts">
	/**
	 * Shared fields for the sticker new + edit pages: slug, meanings, active
	 * flag and image. Page chrome stays in the page.
	 */
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import * as m from '$lib/paraglide/messages'

	interface StickerValues {
		slug: string
		meaningEn: string
		meaningJp: string
		active: boolean
	}

	interface Props {
		values: StickerValues
		imageUrl?: string | null | undefined
		/** The slug names the image file, so it can't change once created */
		slugLocked?: boolean
		onSelectImage: (file: File) => void
	}

	let { values = $bindable(), imageUrl, slugLocked = false, onSelectImage }: Props = $props()
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
	<DetailItem
		label={m.db_stickers_field_active()}
		bind:value={values.active}
		editable={true}
		type="checkbox"
	/>
</DetailsContainer>

<DetailsContainer title={m.db_stickers_section_image()}>
	<div class="image-section">
		<ImageFileField
			currentUrl={imageUrl}
			hint={m.db_stickers_image_hint()}
			onSelect={onSelectImage}
		/>
	</div>
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.image-section {
		padding: spacing.$unit-2x;
	}
</style>
