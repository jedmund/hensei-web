<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import { DropdownMenu, Tooltip } from 'bits-ui'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	type AvatarUser = {
		username?: string
		avatar?: {
			picture?: string | null
			element?: string | null
		} | null
	}

	interface Props {
		authUser: AvatarUser
		collectionSourceUser: AvatarUser
		activeCollectionUser: 'viewer' | 'source'
		onSwitchCollectionUser: (target: 'viewer' | 'source') => void
	}

	let { authUser, collectionSourceUser, activeCollectionUser, onSwitchCollectionUser }: Props =
		$props()

	const activeUser = $derived(
		activeCollectionUser === 'source' ? collectionSourceUser : authUser
	)
	const activeAvatarSrc = $derived(getAvatarSrc(activeUser?.avatar?.picture))
	const activeAvatarSrcSet = $derived(getAvatarSrcSet(activeUser?.avatar?.picture))

	const authElement = $derived(authUser?.avatar?.element || '')
	const sourceElement = $derived(collectionSourceUser?.avatar?.element || '')
</script>

<Tooltip.Root delayDuration={200} disableHoverableContent>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="collection-switcher-trigger" aria-label="Switch collection view" {...props}>
					<div class="switcher-user">
						<div class="switcher-avatar {activeUser?.avatar?.element || ''}">
							{#if activeUser?.avatar?.picture}
								<img
									class="avatar"
									alt={`Avatar of ${activeUser?.username}`}
									src={activeAvatarSrc}
									srcset={activeAvatarSrcSet}
									width="20"
									height="20"
								/>
							{:else}
								<div class="avatar-placeholder" aria-hidden="true"></div>
							{/if}
						</div>
						<span class="switcher-name">{activeCollectionUser === 'viewer' ? 'You' : activeUser?.username}</span>
					</div>
					<Icon name="chevron-down" size={10} />
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content class="collection-dropdown-content" sideOffset={6} align="end">
						<div class="dropdown-label">Viewing as</div>
						<DropdownMenu.RadioGroup value={activeCollectionUser} onValueChange={(v) => onSwitchCollectionUser(v as 'viewer' | 'source')}>
							<DropdownMenu.RadioItem value="viewer" class="dropdown-radio-item {authElement}">
								<div class="switcher-avatar {authElement}">
									{#if authUser?.avatar?.picture}
										<img
											class="avatar"
											alt={`Avatar of ${authUser?.username}`}
											src={getAvatarSrc(authUser?.avatar?.picture)}
											srcset={getAvatarSrcSet(authUser?.avatar?.picture)}
											width="20"
											height="20"
										/>
									{:else}
										<div class="avatar-placeholder" aria-hidden="true"></div>
									{/if}
								</div>
								<span>You</span>
								{#if activeCollectionUser === 'viewer'}
									<span class="radio-indicator"><Icon name="check" size={14} /></span>
								{/if}
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="source" class="dropdown-radio-item {sourceElement}">
								<div class="switcher-avatar {sourceElement}">
									{#if collectionSourceUser?.avatar?.picture}
										<img
											class="avatar"
											alt={`Avatar of ${collectionSourceUser?.username}`}
											src={getAvatarSrc(collectionSourceUser?.avatar?.picture)}
											srcset={getAvatarSrcSet(collectionSourceUser?.avatar?.picture)}
											width="20"
											height="20"
										/>
									{:else}
										<div class="avatar-placeholder" aria-hidden="true"></div>
									{/if}
								</div>
								<span>{collectionSourceUser?.username}</span>
								{#if activeCollectionUser === 'source'}
									<span class="radio-indicator"><Icon name="check" size={14} /></span>
								{/if}
							</DropdownMenu.RadioItem>
						</DropdownMenu.RadioGroup>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content class="tooltip-content" sideOffset={8}>
			Viewing as
		</Tooltip.Content>
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

	.switcher-avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		overflow: hidden;
		background: var(--button-bg);
		flex-shrink: 0;
	}

	.switcher-name {
		max-width: 80px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: var(--button-bg-hover);
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

	:global(.dropdown-radio-item[data-state='checked'].fire) { color: var(--fire-bg); }
	:global(.dropdown-radio-item[data-state='checked'].water) { color: var(--water-bg); }
	:global(.dropdown-radio-item[data-state='checked'].earth) { color: var(--earth-bg); }
	:global(.dropdown-radio-item[data-state='checked'].wind) { color: var(--wind-bg); }
	:global(.dropdown-radio-item[data-state='checked'].light) { color: var(--light-bg); }
	:global(.dropdown-radio-item[data-state='checked'].dark) { color: var(--dark-bg); }

	.radio-indicator {
		margin-left: auto;
		display: flex;
		align-items: center;
	}
</style>
