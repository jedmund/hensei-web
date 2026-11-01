<script lang="ts">
	// The event's banner, replaced by uploading a file (editors only). Without
	// one of its own, a recurring event shows its series' banner.
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import { useUploadEventImage } from '$lib/api/mutations/event.mutations'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { RecordTabProps } from '$lib/features/database/schema/types'
	import type { GameEvent } from '$lib/types/api/event'

	let { record, refetch }: RecordTabProps<GameEvent> = $props()

	const upload = useUploadEventImage()

	function select(file: File) {
		upload.mutate(
			{ id: record.id, file },
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
		<div class="banner">
			<ImageFileField
				variant="banner"
				currentUrl={record.imageUrl}
				accept={['image/png', 'image/webp', 'image/jpeg']}
				maxBytes={2 * 1024 * 1024}
				hint={m.db_events_image_hint()}
				onSelect={select}
			/>
		</div>
	</DetailsContainer>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/database' as database;

	.details {
		@include database.details;
	}

	.banner {
		padding: spacing.$unit-2x;
	}
</style>
