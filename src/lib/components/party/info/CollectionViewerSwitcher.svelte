<script lang="ts">
	/**
	 * Whose collection a party's items are shown against, when it uses someone
	 * else's: the signed-in user's ("You") or the collection owner's.
	 */
	import * as m from '$lib/paraglide/messages'
	import Icon from '$lib/components/Icon.svelte'
	import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
	import { DropdownMenu, Tooltip } from 'bits-ui'
	import type { AvatarUser } from '$lib/utils/avatar'

	type Viewer = 'viewer' | 'source'

	interface Props {
		authUser: AvatarUser
		collectionSourceUser: AvatarUser
		activeCollectionUser: Viewer
		onSwitchCollectionUser: (target: Viewer) => void
	}

	let { authUser, collectionSourceUser, activeCollectionUser, onSwitchCollectionUser }: Props =
		$props()

	const options = $derived([
		{ value: 'viewer' as const, user: authUser, label: m.collection_viewer_you() },
		{ value: 'source' as const, user: collectionSourceUser, label: collectionSourceUser.username }
	])
	const active = $derived(options.find((option) => option.value === activeCollectionUser)!)
</script>

<Tooltip.Root delayDuration={200} disableHoverableContent>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="collection-switcher-trigger"
					aria-label="Switch collection view"
					{...props}
				>
					<div class="switcher-user">
						<UserAvatar user={active.user} size={20} />
						<span class="switcher-name">{active.label}</span>
					</div>
					<Icon name="chevron-down" size={10} />
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content class="collection-dropdown-content" sideOffset={6} align="end">
						<div class="dropdown-label">{m.collection_viewer_viewing_as()}</div>
						<DropdownMenu.RadioGroup
							value={activeCollectionUser}
							onValueChange={(v) => onSwitchCollectionUser(v as Viewer)}
						>
							{#each options as option (option.value)}
								<DropdownMenu.RadioItem
									value={option.value}
									class="dropdown-radio-item {option.user.avatar?.element || ''}"
								>
									<UserAvatar user={option.user} size={20} />
									<span>{option.label}</span>
									{#if activeCollectionUser === option.value}
										<span class="radio-indicator"><Icon name="check" size={14} /></span>
									{/if}
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content class="tooltip-content" sideOffset={8}>Viewing as</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	:global(.collection-switcher-trigger) {
		display: inline-flex;
		align-items: center;
		gap: $unit;
		padding: calc($unit-half + 1px) $unit;
		border-radius: $input-corner;
		background: transparent;
		color: var(--button-text);
		border: none;
		cursor: pointer;
		font-size: $font-small;
		font-weight: $medium;
		@include smooth-transition($duration-quick, background-color, color);
	}

	// Empty avatars a shade darker than the button behind them
	:global(.collection-switcher-trigger),
	:global(.dropdown-radio-item) {
		--avatar-placeholder-bg: var(--button-bg-hover);
	}

	:global(.collection-switcher-trigger:hover) {
		background: var(--button-bg);
		color: var(--button-text-hover);
	}

	:global(.collection-switcher-trigger:focus-visible) {
		box-shadow: 0 0 0 2px var(--accent-blue-focus);
	}

	.switcher-user {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.switcher-name {
		max-width: 80px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.collection-dropdown-content) {
		background-color: var(--menu-bg);
		border-radius: $input-corner;
		padding: $unit-half;
		box-shadow: var(--shadow-xl);
		z-index: $z-popover;
		min-width: calc($unit * 20);
	}

	.dropdown-label {
		padding: $unit calc($unit * 1.5);
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-tertiary);
		user-select: none;
	}

	:global(.dropdown-radio-item) {
		display: flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit calc($unit * 1.5);
		border-radius: $item-corner;
		cursor: pointer;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		outline: none;
		@include smooth-transition($duration-quick, background-color, color);
	}

	:global(.dropdown-radio-item:hover),
	:global(.dropdown-radio-item[data-highlighted]) {
		background: var(--button-bg);
	}

	:global(.dropdown-radio-item[data-state='checked']) {
		font-weight: $bold;
	}

	// The checked option in its user's element color
	@each $element in fire, water, earth, wind, light, dark {
		:global(.dropdown-radio-item[data-state='checked'].#{$element}) {
			color: var(--#{$element}-bg);
		}
	}

	.radio-indicator {
		margin-left: auto;
		display: flex;
		align-items: center;
	}
</style>
