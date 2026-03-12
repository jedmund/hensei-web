<script lang="ts">
	import { Combobox } from 'bits-ui'
	import { createQuery } from '@tanstack/svelte-query'
	import { userAdapter, type UserInfo } from '$lib/api/adapters/user.adapter'
	import { useSendInvitation } from '$lib/api/mutations/crew.mutations'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	interface Props {
		open: boolean
		crewId: string
	}

	interface UserOption {
		id: string
		username: string
		avatar?: { picture: string; element: string }
	}

	let { open = $bindable(false), crewId }: Props = $props()

	const sendMutation = useSendInvitation()

	// Query unclaimed phantoms
	const phantomsQuery = createQuery(() => ({
		...crewQueries.members('phantom'),
		enabled: open
	}))

	const unclaimedPhantoms = $derived(phantomsQuery.data?.phantoms?.filter((p) => !p.claimed) ?? [])

	const phantomOptions = $derived(
		unclaimedPhantoms.map((p) => ({
			value: p.id,
			label: p.name,
			suffix: p.granblueId ?? undefined
		}))
	)

	// State
	let searchResults = $state<UserOption[]>([])
	let selectedUserId = $state<string>('')
	let foundUser = $state<UserInfo | null>(null)
	let isLoading = $state(false)
	let selectedPhantomId = $state<string | undefined>(undefined)
	let inviteSuccess = $state(false)
	let inviteError = $state<string | null>(null)
	let searchTimeout: ReturnType<typeof setTimeout> | null = null
	let comboboxOpen = $state(false)
	let inputValue = $state('')

	const selectedPhantomName = $derived(
		unclaimedPhantoms.find((p) => p.id === selectedPhantomId)?.name
	)

	const comboboxItems = $derived(
		searchResults.map((u) => ({ value: u.id, label: u.username }))
	)

	async function searchUsers(query: string) {
		if (query.length < 2) {
			searchResults = []
			return
		}

		isLoading = true
		try {
			const users = await userAdapter.searchUsers(query)
			searchResults = users.map((u) => ({
				id: u.id,
				username: u.username,
				avatar: u.avatar
			}))
			if (searchResults.length > 0) {
				comboboxOpen = true
			}
		} catch {
			searchResults = []
		} finally {
			isLoading = false
		}
	}

	function handleInputChange(value: string) {
		inputValue = value
		if (searchTimeout) clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => searchUsers(value), 300)

		// If user clears the input, deselect
		if (!value.trim()) {
			selectedUserId = ''
			foundUser = null
		}
	}

	function handleValueChange(value: string) {
		selectedUserId = value
		if (value) {
			const match = searchResults.find((u) => u.id === value)
			if (match) {
				foundUser = {
					id: match.id,
					username: match.username,
					avatar: match.avatar ?? { picture: '', element: '' }
				} as UserInfo
				inputValue = match.username
			}
		} else {
			foundUser = null
		}
		inviteError = null
		comboboxOpen = false
	}

	// Send invitation to the found user
	async function handleInvite() {
		if (!foundUser?.id) return

		inviteError = null
		try {
			await sendMutation.mutateAsync({
				crewId,
				userId: foundUser.id,
				phantomPlayerId: selectedPhantomId
			})
			inviteSuccess = true
			setTimeout(() => {
				resetState()
				open = false
			}, 1500)
		} catch (err) {
			inviteError = err instanceof Error ? err.message : 'Failed to send invitation'
		}
	}

	function resetState() {
		searchResults = []
		selectedUserId = ''
		inputValue = ''
		foundUser = null
		selectedPhantomId = undefined
		inviteSuccess = false
		inviteError = null
		comboboxOpen = false
	}

	function clearSelection() {
		searchResults = []
		selectedUserId = ''
		inputValue = ''
		foundUser = null
		inviteError = null
	}

	function handleCancel() {
		resetState()
		open = false
	}

	$effect(() => {
		if (open) {
			resetState()
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader title="Scout Player" description="Search for a user to invite to your crew" />

	<ModalBody>
		{#if inviteSuccess}
			<div class="success-message">
				<Icon name="check-circle" size={32} />
				<p>Invitation sent to <strong>{foundUser?.username}</strong>!</p>
				{#if selectedPhantomName}
					<p class="success-detail">"{selectedPhantomName}" will be assigned when they accept.</p>
				{/if}
			</div>
		{:else}
			<div class="scout-form">
				{#if foundUser}
					<div class="selected-user">
						{#if foundUser.avatar?.picture}
							<img
								src={getAvatarSrc(foundUser.avatar.picture)}
								srcset={getAvatarSrcSet(foundUser.avatar.picture)}
								alt={foundUser.username}
								class="selected-avatar"
							/>
						{:else}
							<div class="selected-avatar-placeholder"></div>
						{/if}
						<span class="selected-username">{foundUser.username}</span>
						<button type="button" class="clear-button" onclick={clearSelection}>
							<Icon name="close" size={14} />
						</button>
					</div>
				{:else}
					<Combobox.Root
						type="single"
						bind:value={selectedUserId}
						onValueChange={handleValueChange}
						bind:open={comboboxOpen}
						bind:inputValue
						items={comboboxItems}
					>
						<div class="combobox-input-wrapper">
							<Combobox.Input
								class="combobox-input"
								placeholder="Search by username..."
								oninput={(e) => handleInputChange(e.currentTarget.value)}
							/>
							{#if isLoading}
								<span class="input-loading">
									<Icon name="loader-2" size={14} />
								</span>
							{/if}
						</div>

						<Combobox.Portal>
							<Combobox.Content class="combobox-content">
								<Combobox.Viewport>
									{#each searchResults as user (user.id)}
										<Combobox.Item value={user.id} label={user.username} class="combobox-item">
											{#snippet children({ selected })}
												{#if user.avatar?.picture}
													<img
														src={getAvatarSrc(user.avatar.picture)}
														srcset={getAvatarSrcSet(user.avatar.picture)}
														alt=""
														class="item-avatar"
													/>
												{:else}
													<div class="item-avatar-placeholder"></div>
												{/if}
												<span class="item-label">{user.username}</span>
												{#if selected}
													<span class="item-check">
														<Icon name="check" size={14} />
													</span>
												{/if}
											{/snippet}
										</Combobox.Item>
									{/each}
								</Combobox.Viewport>
							</Combobox.Content>
						</Combobox.Portal>
					</Combobox.Root>
				{/if}

				{#if foundUser}
					{#if inviteError}
						<div class="invite-error">
							<p>{inviteError}</p>
						</div>
					{/if}

					{#if unclaimedPhantoms.length > 0}
						<div class="phantom-section">
							<Select
								label="Assign to phantom"
								options={phantomOptions}
								bind:value={selectedPhantomId}
								placeholder="None"
								fullWidth
								contained
								portal
							/>
							<span class="phantom-hint">You can assign this later</span>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</ModalBody>

	{#if !inviteSuccess}
		<ModalFooter
			onCancel={handleCancel}
			primaryAction={foundUser
				? {
						label: sendMutation.isPending ? 'Sending...' : 'Send Invitation',
						onclick: handleInvite,
						disabled: sendMutation.isPending
					}
				: undefined}
		/>
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	.scout-form {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

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

	.selected-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.selected-avatar-placeholder {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--placeholder-bg);
		flex-shrink: 0;
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

	// Input wrapper — matches Input component's contained style
	.combobox-input-wrapper {
		position: relative;
	}

	:global(.combobox-input) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		background-color: var(--input-bound-bg);
		border-radius: $input-corner;
		border: 2px solid transparent;
		color: var(--text-primary);
		display: block;
		font-family: var(--font-family);
		font-size: $font-regular;
		min-height: $unit-4x;
		padding: $unit calc($unit * 1.5);
		width: 100%;
		@include smooth-transition($duration-quick, background-color);

		&::placeholder {
			color: var(--text-tertiary);
			opacity: 1;
		}

		&:hover {
			background-color: var(--input-bound-bg-hover);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.input-loading {
		position: absolute;
		right: $unit-2x;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		pointer-events: none;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	// Dropdown — matches Select component's content style
	:global(.combobox-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: var(--bits-combobox-anchor-width, var(--bits-select-anchor-width));
		max-height: 40vh;
		overflow: auto;
		z-index: $z-modal + 2;
		animation: fadeIn $duration-opacity-fade ease-out;
	}

	// Items — matches Select component's item style
	:global(.combobox-item) {
		align-items: center;
		border-radius: $item-corner-small;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit $unit-2x;
		user-select: none;
		@include smooth-transition($duration-quick, background-color);

		&:hover,
		&[data-highlighted] {
			background-color: var(--option-bg-hover);
		}

		&[data-selected] {
			font-weight: $medium;
		}
	}

	.item-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.item-avatar-placeholder {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--placeholder-bg);
		flex-shrink: 0;
	}

	.item-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-check {
		margin-left: auto;
		color: var(--accent-color);
	}

	.invite-error {
		padding: $unit;
		background: var(--danger-bg);
		border-radius: $item-corner-small;

		p {
			margin: 0;
			font-size: $font-small;
			color: var(--danger);
		}
	}

	.phantom-section {
	}

	.phantom-hint {
		display: block;
		font-size: $font-small;
		color: var(--text-secondary);
		margin-top: $unit-half;
	}

	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
		padding: $unit-4x;
		text-align: center;
		color: var(--wind-nav-selected-text);

		p {
			margin: 0;
		}

		.success-detail {
			font-size: $font-small;
			color: var(--text-secondary);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
