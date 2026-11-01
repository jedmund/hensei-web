<script lang="ts">
	import type { UserInfo } from '$lib/api/adapters/user.adapter'
	import Icon from '$lib/components/Icon.svelte'
	import ScoutAvatar from '$lib/components/crew/scout/ScoutAvatar.svelte'

	interface Props {
		user: UserInfo
		onClear: () => void
	}

	const { user, onClear }: Props = $props()
</script>

<div class="selected-user">
	<ScoutAvatar picture={user.avatar?.picture} alt={user.username} />
	<span class="selected-username">{user.username}</span>
	<button type="button" class="clear-button" onclick={onClear}>
		<Icon name="close" size={14} />
	</button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.selected-user {
		display: flex;
		align-items: center;
		gap: $unit;
		background-color: var(--input-bound-bg);
		border-radius: $input-corner;
		border: 2px solid transparent;
		min-height: $unit-4x;
		padding: $unit;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background-color: var(--input-bound-bg-hover);
		}
	}

	.selected-username {
		flex: 1;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.clear-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: $unit-half;
		@include smooth-transition($duration-quick, background-color, color);

		&:hover {
			background: var(--surface-tertiary);
			color: var(--text-primary);
		}

		:global(svg) {
			fill: currentColor;
		}
	}
</style>
