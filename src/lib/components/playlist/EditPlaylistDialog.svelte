<script lang="ts">
	import type { Playlist } from '$lib/types/api/playlist'
	import { useUpdatePlaylist } from '$lib/api/mutations/playlist.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import PrivacySelector from '$lib/components/party/edit/PrivacySelector.svelte'
	import type { PartyVisibility } from '$lib/types/visibility'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		playlist: Playlist
	}

	let { open = $bindable(false), playlist }: Props = $props()

	const updateMutation = useUpdatePlaylist()

	let title = $state('')
	let description = $state('')
	let videoUrl = $state('')
	let visibility = $state<PartyVisibility>(1)
	let error = $state<string | null>(null)

	function extractYoutubeId(url: string): string | null {
		const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
		return match?.[1] ?? null
	}

	const videoId = $derived(videoUrl ? extractYoutubeId(videoUrl) : null)
	const thumbnailUrl = $derived(videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null)

	let videoTitle = $state<string | null>(null)

	$effect(() => {
		const id = videoId
		if (!id) {
			videoTitle = null
			return
		}

		const controller = new AbortController()
		fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
			signal: controller.signal
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.title) videoTitle = data.title
			})
			.catch(() => {})

		return () => controller.abort()
	})

	function populateForm() {
		title = playlist.title
		description = playlist.description ?? ''
		videoUrl = playlist.videoUrl ?? ''
		visibility = (playlist.visibility ?? 1) as PartyVisibility
		videoTitle = null
		error = null
	}

	async function handleSave() {
		if (!title.trim()) return
		error = null

		try {
			await updateMutation.mutateAsync({
				id: playlist.id,
				slug: playlist.slug,
				title: title.trim(),
				description: description.trim() || null,
				videoUrl: videoUrl.trim() || null,
				visibility
			})
			open = false
		} catch (err) {
			error = err instanceof Error ? err.message : m.playlist_create_error()
		}
	}

	function handleCancel() {
		open = false
	}

	$effect(() => {
		if (open) populateForm()
	})
</script>

<Dialog bind:open>
	<ModalHeader
		title={m.playlist_edit()}
		description={m.playlist_edit_desc()}
	/>

	<ModalBody>
		<div class="form">
			<Input
				label={m.playlist_field_title()}
				bind:value={title}
				placeholder={m.playlist_field_title_placeholder()}
				maxLength={100}
				counter={title.length}
				contained
			/>

			<fieldset class="fieldset">
				<label class="label" for="edit-playlist-description">
					{m.playlist_field_description()}
				</label>
				<div class="textarea-wrapper">
					<textarea
						id="edit-playlist-description"
						class="textarea"
						bind:value={description}
						placeholder={m.playlist_field_description_placeholder()}
						maxlength={320}
						rows="4"
					></textarea>
					{#if 320 - description.length <= 30}
						<span class="counter" class:warning={320 - description.length <= 5}>
							{320 - description.length}
						</span>
					{/if}
				</div>
			</fieldset>

			<fieldset class="fieldset">
				<label class="label" for="edit-playlist-video-url">
					{m.playlist_field_video_url()}
				</label>
				<Input
					id="edit-playlist-video-url"
					bind:value={videoUrl}
					placeholder={m.playlist_field_video_url_placeholder()}
					contained
				/>
				{#if thumbnailUrl}
					<div class="video-preview">
						<img src={thumbnailUrl} alt={videoTitle ?? 'Video preview'} />
						{#if videoTitle}
							<p class="video-title">{videoTitle}</p>
						{/if}
					</div>
				{/if}
			</fieldset>

			<PrivacySelector bind:value={visibility} context="playlist" />

			{#if error}
				<div class="error-message">
					<p>{error}</p>
				</div>
			{/if}
		</div>
	</ModalBody>

	<ModalFooter
		onCancel={handleCancel}
		cancelDisabled={updateMutation.isPending}
		primaryAction={{
			label: updateMutation.isPending ? m.playlist_saving() : m.playlist_save(),
			onclick: handleSave,
			disabled: updateMutation.isPending || !title.trim()
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.fieldset {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		border: none;
		padding: 0;
		margin: 0;
	}

	.label {
		color: var(--text-primary);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		margin-bottom: spacing.$unit-half;
	}

	.textarea-wrapper {
		position: relative;
	}

	.textarea {
		width: 100%;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		border: none;
		border-radius: layout.$input-corner;
		font-size: typography.$font-regular;
		font-family: inherit;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		resize: vertical;
		box-sizing: border-box;

		&::placeholder {
			color: var(--text-tertiary);
			opacity: 1;
		}

		&:hover {
			background: var(--input-bound-bg-hover);
		}
	}

	.counter {
		position: absolute;
		right: spacing.$unit;
		bottom: spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		pointer-events: none;

		&.warning {
			color: $error;
		}
	}

	.video-preview {
		display: flex;
		flex-direction: row;
		gap: spacing.$unit-2x;
		align-items: center;

		img {
			display: block;
			width: 176px;
			height: 99px;
			object-fit: cover;
			border-radius: layout.$item-corner;
			flex-shrink: 0;
		}
	}

	.video-title {
		margin: 0;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.error-message {
		padding: spacing.$unit;
		background: var(--danger-bg);
		border-radius: layout.$item-corner-small;
		color: var(--danger);

		p {
			margin: 0;
			font-size: typography.$font-small;
		}
	}
</style>
