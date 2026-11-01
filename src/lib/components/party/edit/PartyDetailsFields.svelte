<script lang="ts">
	/**
	 * PartyDetailsFields - The top of EditPartyPane: title, video, raid,
	 * the Evoking Solomonis row and the description.
	 *
	 * Raid, Solomonis and description open their own panes; the parent owns
	 * those panes and passes the open handlers in.
	 */
	import * as m from '$lib/paraglide/messages'
	import Input from '$lib/components/ui/Input.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import YouTubeUrlInput from '$lib/components/party/edit/YouTubeUrlInput.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { localizedName } from '$lib/utils/locale'
	import { descriptionPreview } from '$lib/utils/descriptionPreview'
	import type { Raid } from '$lib/types/api/entities'
	import type { SolomonisDetailsLink } from '$lib/features/party/partyEditValues'

	interface Props {
		name: string
		videoUrl: string | null
		raid: Raid | null
		description: string | null
		/** Shown under Raid when set */
		solomonisDetails?: SolomonisDetailsLink | undefined
		onRaidClick: () => void
		onSolomonisClick: () => void
		onDescriptionClick: () => void
	}

	let {
		name = $bindable(),
		videoUrl = $bindable(),
		raid,
		description,
		solomonisDetails,
		onRaidClick,
		onSolomonisClick,
		onDescriptionClick
	}: Props = $props()

	const raidName = $derived(raid ? localizedName(raid.name) : '')
	const raidElementClass = $derived(raid ? getElementKey(raid.element) : '')
	const descriptionPreviewText = $derived(descriptionPreview(description).text || null)
</script>

<div class="top-section">
	<h3>{m.party_details()}</h3>
	<div class="top-fields">
		<Input
			label={m.party_edit_title_label()}
			bind:value={name}
			placeholder={m.sidebar_party_title_placeholder()}
			contained
			fullWidth
		/>
		<YouTubeUrlInput label={m.party_edit_video_label()} bind:value={videoUrl} contained />
		<div class="raid-field">
			<span class="raid-label">{m.party_raid()}</span>
			<button type="button" class="raid-select-button {raidElementClass}" onclick={onRaidClick}>
				{#if raid}
					<span class="raid-name">{raidName}</span>
				{:else}
					<span class="placeholder">{m.party_select_raid()}</span>
				{/if}
				<Icon name="chevron-right" size={16} class="chevron-icon" />
			</button>
		</div>
		{#if solomonisDetails}
			<div class="raid-field">
				<span class="raid-label">{solomonisDetails.label}</span>
				<button type="button" class="raid-select-button" onclick={onSolomonisClick}>
					<span class="raid-name">{solomonisDetails.summary}</span>
					<Icon name="chevron-right" size={16} class="chevron-icon" />
				</button>
			</div>
		{/if}
		<div class="description-field">
			<span class="description-label">{m.party_description()}</span>
			<button type="button" class="description-button" onclick={onDescriptionClick}>
				{#if descriptionPreviewText}
					<span class="description-preview">{descriptionPreviewText}</span>
				{:else}
					<span class="description-placeholder">{m.sidebar_add_description()}</span>
				{/if}
				<Icon name="chevron-right" size={16} class="description-chevron" />
			</button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;

	.top-section {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit;

		h3 {
			margin: 0;
			font-size: $font-name;
			font-weight: $medium;
			color: var(--text-primary);
			padding: 0 $unit;
		}
	}

	.top-fields {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: 0 $unit;

		// Override Input label styling to match DetailRow
		:global(.label) {
			color: var(--text-secondary) !important;
			font-size: $font-regular !important;
			font-weight: normal !important;
		}
	}

	.raid-field {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		&:hover .raid-label {
			color: var(--text-primary);
		}
	}

	.raid-label {
		font-size: $font-regular;
		color: var(--text-secondary);
	}

	.raid-select-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;

		&:hover .raid-name {
			color: var(--text-primary);
		}

		&:hover .placeholder {
			color: var(--text-secondary);
		}

		&:hover :global(.chevron-icon) {
			color: var(--icon-secondary-hover);
		}
	}

	.raid-name {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.placeholder {
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	:global(.chevron-icon) {
		color: var(--icon-secondary);
		flex-shrink: 0;
	}

	.description-field {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		&:hover .description-label {
			color: var(--text-primary);
		}
	}

	.description-label {
		font-size: $font-regular;
		color: var(--text-secondary);
	}

	.description-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;

		&:hover .description-preview {
			color: var(--text-primary);
		}

		&:hover .description-placeholder {
			color: var(--text-secondary);
		}

		&:hover :global(.description-chevron) {
			color: var(--icon-secondary-hover);
		}
	}

	.description-preview {
		font-size: $font-regular;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.description-placeholder {
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	:global(.description-chevron) {
		color: var(--icon-secondary);
		flex-shrink: 0;
	}

	// Element-specific colors when raid is selected
	.raid-select-button {
		&.wind {
			.raid-name,
			:global(.chevron-icon) {
				color: $wind-text-30;
			}
			&:hover .raid-name,
			&:hover :global(.chevron-icon) {
				color: $wind-text-20;
			}
		}
		&.fire {
			.raid-name,
			:global(.chevron-icon) {
				color: $fire-text-30;
			}
			&:hover .raid-name,
			&:hover :global(.chevron-icon) {
				color: $fire-text-20;
			}
		}
		&.water {
			.raid-name,
			:global(.chevron-icon) {
				color: $water-text-30;
			}
			&:hover .raid-name,
			&:hover :global(.chevron-icon) {
				color: $water-text-20;
			}
		}
		&.earth {
			.raid-name,
			:global(.chevron-icon) {
				color: $earth-text-30;
			}
			&:hover .raid-name,
			&:hover :global(.chevron-icon) {
				color: $earth-text-20;
			}
		}
		&.dark {
			.raid-name,
			:global(.chevron-icon) {
				color: $dark-text-30;
			}
			&:hover .raid-name,
			&:hover :global(.chevron-icon) {
				color: $dark-text-20;
			}
		}
		&.light {
			.raid-name,
			:global(.chevron-icon) {
				color: $light-text-30;
			}
			&:hover .raid-name,
			&:hover :global(.chevron-icon) {
				color: $light-text-20;
			}
		}
	}
</style>
