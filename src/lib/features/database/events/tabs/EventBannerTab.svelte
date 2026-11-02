<script lang="ts">
	// The event's banners, replaced by uploading a file (editors only): the
	// English art and the Japanese art, each on its own. Without one of its
	// own, a recurring event shows its series' banner.
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import { useUploadEventImage } from '$lib/api/mutations/event.mutations'
	import type { BannerLanguage } from '$lib/api/adapters/event.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { RecordTabProps } from '$lib/features/database/schema/types'
	import type { GameEvent } from '$lib/types/api/event'

	let { record, refetch }: RecordTabProps<GameEvent> = $props()

	const upload = useUploadEventImage()

	const banners = $derived([
		{ language: 'en' as const, label: m.db_events_banner_en(), url: record.imageUrl },
		{ language: 'ja' as const, label: m.db_events_banner_ja(), url: record.imageUrlJa ?? null }
	])

	function select(file: File, language: BannerLanguage) {
		upload.mutate(
			{ id: record.id, file, language },
			{
				onSuccess: () => {
					toast.success(m.db_events_banner_uploaded())
					refetch()
				},
				onError: (err) => toast.error(extractErrorMessage(err, m.db_events_save_failed()))
			}
		)
	}
</script>

<section class="details">
	<DetailsContainer title={m.db_events_section_image()}>
		<div class="banners">
			{#each banners as banner (banner.language)}
				<div class="banner">
					<h3>{banner.label}</h3>
					<!-- A fresh field per image, so a new upload's preview starts over -->
					{#key banner.url}
						<ImageFileField
							variant="banner"
							currentUrl={banner.url}
							accept={['image/png', 'image/webp', 'image/jpeg']}
							maxBytes={2 * 1024 * 1024}
							onSelect={(file) => select(file, banner.language)}
						/>
					{/key}
				</div>
			{/each}
			<p class="hint">{m.db_events_image_hint()}</p>
		</div>
	</DetailsContainer>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/database' as database;

	.details {
		@include database.details;
	}

	.banners {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	.banner h3 {
		margin: 0 0 spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	// The format rules, once for both banners
	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
