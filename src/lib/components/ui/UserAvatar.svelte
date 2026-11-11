<script lang="ts">
	/**
	 * A user's avatar: their picture in a circle, or an empty circle without
	 * one, on their element's color. Containers can set
	 * --avatar-placeholder-bg for the empty circle.
	 */
	import {
		avatarBackground,
		getAvatarSrc,
		getAvatarSrcSet,
		type AvatarUser
	} from '$lib/utils/avatar'

	interface Props {
		user: AvatarUser
		size?: number
	}

	let { user, size = 24 }: Props = $props()
</script>

<div
	class="avatar-wrapper"
	style:--avatar-size="{size}px"
	style:background-color={user.avatar?.picture ? avatarBackground(user.avatar.element) : undefined}
>
	{#if user.avatar?.picture}
		<img
			class="avatar"
			alt={`Avatar of ${user.username}`}
			src={getAvatarSrc(user.avatar.picture)}
			srcset={getAvatarSrcSet(user.avatar.picture)}
			width={size}
			height={size}
		/>
	{:else}
		<div class="avatar-placeholder" aria-hidden="true"></div>
	{/if}
</div>

<style lang="scss">
	.avatar-wrapper {
		width: var(--avatar-size);
		height: var(--avatar-size);
		border-radius: 50%;
		overflow: hidden;
		background: var(--button-bg);
		flex-shrink: 0;
	}

	.avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: var(--avatar-placeholder-bg, var(--button-bg));
	}
</style>
