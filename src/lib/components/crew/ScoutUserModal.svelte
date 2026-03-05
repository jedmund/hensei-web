<svelte:options runes={true} />

<script lang="ts">
	import { userAdapter, type UserInfo } from '$lib/api/adapters/user.adapter'
	import { useSendInvitation } from '$lib/api/mutations/crew.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	interface Props {
		open: boolean
		crewId: string
	}

	let { open = $bindable(false), crewId }: Props = $props()

	const sendMutation = useSendInvitation()

	// State
	let usernameInput = $state('')
	let isSearching = $state(false)
	let searchError = $state<string | null>(null)
	let foundUser = $state<UserInfo | null>(null)
	let inviteSuccess = $state(false)
	let inviteError = $state<string | null>(null)

	// Search for user by username
	async function handleSearch() {
		if (!usernameInput.trim()) return

		isSearching = true
		searchError = null
		foundUser = null
		inviteSuccess = false
		inviteError = null

		try {
			const user = await userAdapter.getInfo(usernameInput.trim())
			foundUser = user
		} catch (err) {
			searchError = 'User not found'
		} finally {
			isSearching = false
		}
	}

	// Send invitation to the found user
	async function handleInvite() {
		if (!foundUser?.id) return

		inviteError = null
		try {
			await sendMutation.mutateAsync({ crewId, userId: foundUser.id })
			inviteSuccess = true
			// Reset after success
			setTimeout(() => {
				resetState()
				open = false
			}, 1500)
		} catch (err) {
			inviteError = err instanceof Error ? err.message : 'Failed to send invitation'
		}
	}

	function resetState() {
		usernameInput = ''
		foundUser = null
		searchError = null
		inviteSuccess = false
		inviteError = null
	}

	function handleCancel() {
		resetState()
		open = false
	}

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			resetState()
		}
	})

	// Handle Enter key in search input
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && usernameInput.trim() && !isSearching) {
			handleSearch()
		}
	}
</script>

<Dialog bind:open>
	<ModalHeader
		title="Scout Player"
		description="Search for a user to invite to your crew"
	/>

	<ModalBody>
		{#if inviteSuccess}
			<div class="success-message">
				<Icon name="check-circle" size={32} />
				<p>Invitation sent to <strong>{foundUser?.username}</strong>!</p>
			</div>
		{:else}
			<!-- Search input -->
			<div class="search-section">
				<div class="search-input-container">
					<input
						type="text"
						bind:value={usernameInput}
						placeholder="Enter username..."
						class="search-input"
						onkeydown={handleKeydown}
						disabled={isSearching}
					/>
					<Button
						variant="secondary"
						size="small"
						onclick={handleSearch}
						disabled={!usernameInput.trim() || isSearching}
					>
						{isSearching ? 'Searching...' : 'Search'}
					</Button>
				</div>

				{#if searchError}
					<p class="error-text">{searchError}</p>
				{/if}
			</div>

			<!-- Found user display -->
			{#if foundUser}
				<div class="user-result">
					<div class="user-info">
						{#if foundUser.avatar?.picture}
							<img
								src={getAvatarSrc(foundUser.avatar.picture)}
								srcset={getAvatarSrcSet(foundUser.avatar.picture)}
								alt={foundUser.username}
								class="user-avatar"
								width="48"
								height="48"
							/>
						{:else}
							<div class="user-avatar-placeholder"></div>
						{/if}
						<div class="user-details">
							<span class="username">{foundUser.username}</span>
						</div>
					</div>

					{#if inviteError}
						<div class="invite-error">
							<p>{inviteError}</p>
						</div>
					{/if}
				</div>
			{/if}
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
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.search-section {
		margin-bottom: spacing.$unit-2x;
	}

	.search-input-container {
		display: flex;
		gap: spacing.$unit;
	}

	.search-input {
		flex: 1;
		padding: spacing.$unit spacing.$unit-2x;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: typography.$font-regular;
		background: var(--input-bg, white);
		color: var(--text-primary);

		&:focus {
			outline: none;
			border-color: var(--accent-color, #3366ff);
			box-shadow: 0 0 0 2px var(--focus-ring-light, rgba(51, 102, 255, 0.1));
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&::placeholder {
			color: var(--text-secondary);
		}
	}

	.error-text {
		margin: spacing.$unit 0 0;
		font-size: typography.$font-small;
		color: colors.$error;
	}

	.user-result {
		background: var(--surface-secondary, #f9fafb);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: spacing.$unit-2x;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-avatar-placeholder {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--placeholder-bg);
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-quarter;
	}

	.username {
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.invite-error {
		margin-top: spacing.$unit;
		padding: spacing.$unit;
		background: colors.$error--bg--light;
		border-radius: 4px;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: colors.$error;
		}
	}

	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: colors.$wind-text-20;

		p {
			margin: 0;
		}
	}
</style>
