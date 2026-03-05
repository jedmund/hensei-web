<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import { getJobFullImageUrl, getJobIconUrl, Gender } from '$lib/utils/jobUtils'

	interface Props {
		job?: Job
		gender?: Gender
		element?: number
		showPlaceholder?: boolean
		size?: 'small' | 'medium' | 'large'
		clickable?: boolean
		onclick?: () => void
	}

	let {
		job,
		gender = Gender.Gran,
		element,
		showPlaceholder = true,
		size = 'medium',
		clickable = false,
		onclick
	}: Props = $props()

	// Use full image URL for JobSection component
	const portraitUrl = $derived(getJobFullImageUrl(job, gender))
	const iconUrl = $derived(job ? getJobIconUrl(job.granblueId) : '')

	// Get element class for protagonist styling
	const elementClass = $derived(
		element !== undefined
			? ['null', 'wind', 'fire', 'water', 'earth', 'light', 'dark'][element] || ''
			: ''
	)

	function handleClick() {
		if (clickable && onclick) {
			onclick()
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (clickable && onclick && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault()
			onclick()
		}
	}
</script>

<div
	class="job-portrait {size} {elementClass}"
	class:empty={!job && showPlaceholder}
	class:clickable
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
	on:click={handleClick}
	on:keydown={handleKeydown}
>
	{#if job}
		<img src={portraitUrl} alt={job.name.en} class="portrait" loading="lazy" decoding="async" />
		{#if size !== 'small'}
			<img src={iconUrl} alt="{job.name.en} icon" class="icon" loading="lazy" decoding="async" />
		{/if}
	{:else if showPlaceholder}
		<div class="placeholder">
			<span>No Job</span>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.job-portrait {
		position: relative;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--placeholder-bg);
		display: flex;
		align-items: center;
		justify-content: center;

		&.clickable {
			cursor: pointer;
			transition: transform 0.2s ease, box-shadow 0.2s ease;

			&:hover {
				transform: translateY(-2px);
				box-shadow: var(--shadow-lg);
			}

			&:active {
				transform: translateY(0);
			}
		}

		&.small {
			width: 60px;
			height: 60px;

			.portrait {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		&.medium {
			width: 120px;
			height: 140px;

			.portrait {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.icon {
				position: absolute;
				bottom: 4px;
				right: 4px;
				width: 24px;
				height: 24px;
				background: rgba(0, 0, 0, 0.5);
				border-radius: 4px;
				padding: 2px;
			}
		}

		&.large {
			width: 180px;
			height: 210px;

			.portrait {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.icon {
				position: absolute;
				bottom: 8px;
				right: 8px;
				width: 32px;
				height: 32px;
				background: rgba(0, 0, 0, 0.5);
				border-radius: 4px;
				padding: 4px;
			}
		}

		&.empty {
			border: 1px solid var(--border-subtle);
			background: var(--placeholder-bg);
		}

		// Element-based borders for protagonist
		&.wind {
			border: 2px solid var(--wind-bg);
			background: var(--wind-portrait-bg);
		}

		&.fire {
			border: 2px solid var(--fire-bg);
			background: var(--fire-portrait-bg);
		}

		&.water {
			border: 2px solid var(--water-bg);
			background: var(--water-portrait-bg);
		}

		&.earth {
			border: 2px solid var(--earth-bg);
			background: var(--earth-portrait-bg);
		}

		&.light {
			border: 2px solid var(--light-bg);
			background: var(--light-portrait-bg);
		}

		&.dark {
			border: 2px solid var(--dark-bg);
			background: var(--dark-portrait-bg);
		}

		.placeholder {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			color: var(--text-tertiary);
			font-size: 12px;
			text-align: center;
		}
	}
</style>