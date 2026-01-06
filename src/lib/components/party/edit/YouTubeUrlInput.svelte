<script lang="ts">
	/**
	 * YouTubeUrlInput - URL input with validation and video preview
	 *
	 * Validates YouTube URLs and shows a thumbnail preview when valid.
	 */
	import { untrack } from 'svelte'
	import Input from '$lib/components/ui/Input.svelte'

	interface Props {
		/** YouTube URL value */
		value?: string | null
		/** Callback when value changes */
		onchange?: (url: string | null) => void
		/** Whether the input is disabled */
		disabled?: boolean
		/** Use contained background style */
		contained?: boolean
		/** Optional label */
		label?: string
	}

	let {
		value = $bindable(),
		onchange,
		disabled = false,
		contained = false,
		label
	}: Props = $props()

	// YouTube URL regex - matches youtube.com/watch?v= and youtu.be/ formats
	const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/

	function extractVideoId(url: string | null | undefined): string | null {
		if (!url) return null
		const match = url.match(YOUTUBE_REGEX)
		return match?.[1] ?? null
	}

	function isValidYouTubeUrl(url: string | null | undefined): boolean {
		if (!url || url.trim() === '') return true // Empty is valid (optional field)
		return YOUTUBE_REGEX.test(url)
	}

	// Local input state
	let inputValue = $state(value ?? '')
	let touched = $state(false)
	let videoTitle = $state<string | null>(null)
	let isLoadingMetadata = $state(false)

	// Derived states
	const videoId = $derived(extractVideoId(inputValue))
	const isValid = $derived(isValidYouTubeUrl(inputValue))
	const showError = $derived(touched && !isValid)
	const showPreview = $derived(videoId != null && isValid)
	const thumbnailUrl = $derived(
		videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
	)

	// Fetch video metadata when videoId changes
	$effect(() => {
		const id = videoId
		if (!id) {
			videoTitle = null
			return
		}

		isLoadingMetadata = true
		const controller = new AbortController()

		fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
			signal: controller.signal
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.title) {
					videoTitle = data.title
				}
			})
			.catch(() => {
				// Ignore fetch errors (aborted, network, etc.)
			})
			.finally(() => {
				isLoadingMetadata = false
			})

		return () => controller.abort()
	})

	// Sync from external value changes only
	$effect(() => {
		const externalValue = value
		untrack(() => {
			if (externalValue !== inputValue) {
				inputValue = externalValue ?? ''
			}
		})
	})

	function handleInput() {
		// inputValue is already updated via bind:value
		// Update bound value immediately if valid (so Save captures it)
		if (isValidYouTubeUrl(inputValue)) {
			const newValue = inputValue.trim() || null
			value = newValue
			onchange?.(newValue)
		}
	}

	function handleBlur() {
		touched = true
		// Final validation on blur - ensure value is synced
		if (isValid) {
			const newValue = inputValue.trim() || null
			value = newValue
			onchange?.(newValue)
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			;(e.target as HTMLInputElement).blur()
		}
	}

	function clearInput() {
		inputValue = ''
		touched = false
		value = null
		onchange?.(null)
	}
</script>

<div class="youtube-input-wrapper">
	<Input
		{label}
		type="url"
		placeholder="https://youtube.com/watch?v=..."
		bind:value={inputValue}
		handleInput={handleInput}
		handleBlur={handleBlur}
		{disabled}
		{contained}
		clearable
		onClear={clearInput}
		error={showError ? 'Please enter a valid YouTube URL' : undefined}
		fullWidth
	/>

	{#if showPreview && thumbnailUrl}
		<div class="preview-card">
			<a href={inputValue} target="_blank" rel="noopener noreferrer" class="preview-link">
				<img src={thumbnailUrl} alt="Video thumbnail" class="thumbnail" />
				<div class="play-overlay">
					<svg viewBox="0 0 24 24" fill="currentColor" class="play-icon">
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
			</a>
			<div class="video-info">
				{#if isLoadingMetadata}
					<span class="video-title loading">Loading...</span>
				{:else if videoTitle}
					<span class="video-title">{videoTitle}</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.youtube-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.preview-card {
		background-color: var(--input-bound-bg);
		border-radius: $page-corner;
		padding: $unit;
	}

	.preview-link {
		display: block;
		position: relative;
		aspect-ratio: 16 / 9;
		width: 100%;
		border-radius: $card-corner;
		overflow: hidden;

		&:hover .play-overlay {
			opacity: 1;
		}
	}

	.thumbnail {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.play-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		opacity: 0;
		@include smooth-transition($duration-quick, opacity);
	}

	.play-icon {
		width: 48px;
		height: 48px;
		color: white;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.video-info {
		padding: calc($unit * 1.5) $unit-2x;
	}

	.video-title {
		display: block;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		line-height: 1.3;

		// Truncate long titles to 2 lines
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;

		&.loading {
			color: var(--text-tertiary);
		}
	}
</style>
