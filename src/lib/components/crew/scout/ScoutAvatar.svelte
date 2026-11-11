<script lang="ts">
	import { avatarBackground, getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	interface Props {
		/** Avatar picture key; a blank circle without one */
		picture?: string | undefined
		/** The owner's element, shown behind the picture */
		element?: string | undefined
		alt: string
	}

	const { picture, element, alt }: Props = $props()
</script>

{#if picture}
	<img
		src={getAvatarSrc(picture)}
		srcset={getAvatarSrcSet(picture)}
		{alt}
		class="avatar"
		style:background-color={avatarBackground(element)}
	/>
{:else}
	<div class="avatar-placeholder"></div>
{/if}

<style lang="scss">
	.avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.avatar-placeholder {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--placeholder-bg);
		flex-shrink: 0;
	}
</style>
