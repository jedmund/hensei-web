
<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import {
		getJobPortraitUrl,
		getJobFullImageUrl,
		getJobIconUrl,
		getJobWideImageUrl,
		Gender
	} from '$lib/utils/jobUtils'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import { localizedName } from '$lib/utils/locale'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	interface Props {
		job: Job
	}

	let { job }: Props = $props()

	// Gender toggle state - use string value for SegmentedControl
	let selectedGenderValue = $state<string>('gran')

	// Convert string value to Gender enum
	const selectedGender = $derived(selectedGenderValue === 'djeeta' ? Gender.Djeeta : Gender.Gran)

	// Compute image URLs based on selected gender
	const images = $derived({
		portrait: getJobPortraitUrl(job, selectedGender),
		full: getJobFullImageUrl(job, selectedGender),
		icon: getJobIconUrl(job.granblueId),
		wide: getJobWideImageUrl(job, selectedGender)
	})

	function handleGenderChange(value: string) {
		selectedGenderValue = value
	}
</script>

<div class="images-tab">
	<div class="gender-toggle">
		<SegmentedControl value={selectedGenderValue} onValueChange={handleGenderChange}>
			<Segment value="gran">Gran</Segment>
			<Segment value="djeeta">Djeeta</Segment>
		</SegmentedControl>
	</div>

	<div class="images-grid">
		<div class="image-item">
			<a href={images.portrait} target="_blank" rel="noopener noreferrer" class="image-container portrait">
				<img src={images.portrait} alt="{localizedName(job.name)} Portrait" loading="lazy" />
			</a>
			<span class="image-label">Portrait</span>
		</div>

		<div class="image-item">
			<a href={images.full} target="_blank" rel="noopener noreferrer" class="image-container full">
				<img src={images.full} alt="{localizedName(job.name)} Full" loading="lazy" />
			</a>
			<span class="image-label">Full</span>
		</div>

		<div class="image-item">
			<a href={images.icon} target="_blank" rel="noopener noreferrer" class="image-container icon">
				<img src={images.icon} alt="{localizedName(job.name)} Icon" loading="lazy" />
			</a>
			<span class="image-label">Icon</span>
			<span class="image-sublabel">(No gender variant)</span>
		</div>

		<div class="image-item wide-item">
			<a href={images.wide} target="_blank" rel="noopener noreferrer" class="image-container wide">
				<img src={images.wide} alt="{localizedName(job.name)} Wide" loading="lazy" />
			</a>
			<span class="image-label">Wide Banner</span>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.images-tab {
		padding: spacing.$unit-2x;
	}

	.gender-toggle {
		margin-bottom: spacing.$unit-2x;
		display: flex;
		justify-content: center;
	}

	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: spacing.$unit-2x;
	}

	.image-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
	}

	.wide-item {
		grid-column: span 2;
	}

	.image-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		background: var(--background);
		border-radius: layout.$item-corner;
		overflow: hidden;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.02);
		}

		img {
			display: block;
			max-width: 100%;
			max-height: 100%;
			width: auto;
			height: auto;
			object-fit: contain;
		}
	}

	.portrait,
	.full {
		aspect-ratio: 1;
	}

	.icon {
		aspect-ratio: 1;
		max-width: 100px;
	}

	.wide {
		aspect-ratio: 2.5 / 1;
	}

	.image-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		text-align: center;
	}

	.image-sublabel {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
