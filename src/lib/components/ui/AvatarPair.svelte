
<script lang="ts">
	import { getAvatarSrc } from '$lib/utils/avatar'

	interface AvatarUser {
		username?: string
		avatar?: {
			picture?: string | null
			element?: string | null
		} | null
	}

	interface Props {
		back: AvatarUser
		front: AvatarUser
		size?: number
	}

	let { back, front, size = 24 }: Props = $props()

	const backSrc = $derived(getAvatarSrc(back.avatar?.picture))
	const frontSrc = $derived(getAvatarSrc(front.avatar?.picture))
	const offset = $derived(size * 0.6)
</script>

<div class="avatar-pair" style:width="{offset + size}px" style:height="{size}px">
	<div
		class="avatar-slot back {back.avatar?.element || ''}"
		style:width="{size}px"
		style:height="{size}px"
	>
		{#if back.avatar?.picture}
			<img src={backSrc} alt={back.username ?? ''} width={size} height={size} />
		{:else}
			<div class="placeholder" aria-hidden="true"></div>
		{/if}
	</div>
	<div
		class="avatar-slot front {front.avatar?.element || ''}"
		style:width="{size}px"
		style:height="{size}px"
		style:left="{offset}px"
	>
		{#if front.avatar?.picture}
			<img src={frontSrc} alt={front.username ?? ''} width={size} height={size} />
		{:else}
			<div class="placeholder" aria-hidden="true"></div>
		{/if}
	</div>
</div>

<style lang="scss">
	.avatar-pair {
		position: relative;
		flex-shrink: 0;
	}

	.avatar-slot {
		position: absolute;
		top: 0;
		border-radius: 50%;
		overflow: hidden;
		background: var(--button-bg);

		&.front {
			box-shadow: -2px 0 0 0 white;
		}

		&.back {
			left: 0;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.placeholder {
		width: 100%;
		height: 100%;
		background: var(--button-bg);
	}
</style>
