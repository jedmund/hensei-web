
<script lang="ts">
	import Dialog from './ui/Dialog.svelte'
	import ModalBody from './ui/ModalBody.svelte'
	import ModalFooter from './ui/ModalFooter.svelte'
	import SettingsNav, { type ElementType } from './ui/SettingsNav.svelte'
	import AccountSettings from './settings/AccountSettings.svelte'
	import ProfileSettings from './settings/ProfileSettings.svelte'
	import PrivacySettings from './settings/PrivacySettings.svelte'
	import { users } from '$lib/api/resources/users'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { invalidateAll } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import { themeStore, type ThemePreference } from '$lib/stores/theme.svelte'

	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
		username: string
		userId: string
		user: UserCookie
		role: number
	}

	let { open = $bindable(false), onOpenChange, username, userId, user, role }: Props = $props()

	const queryClient = useQueryClient()

	// Active section for navigation
	let activeSection = $state<string>('profile')

	// Form state - Account section (initialized empty, populated from API)
	let formUsername = $state(username)
	let formEmail = $state('')
	let currentPassword = $state('')
	let newPassword = $state('')
	let confirmPassword = $state('')
	let bahamut = $state(user.bahamut ?? false) // Client-side preference, kept in cookie

	// Form state - Profile section (initialized with defaults, populated from API)
	let picture = $state('')
	let element = $state<ElementType>('wind')
	let granblueId = $state('')
	let gender = $state(0)
	let language = $state('en')
	let theme = $state('system')

	// Form state - Privacy section (initialized with defaults, populated from API)
	let showGranblueId = $state(false)
	let collectionPrivacy = $state(1) // 1 = Everyone (1-based to avoid JS falsy 0)
	let showCrewGamertag = $state(false)

	// Track whether form has been initialized from API
	let formInitialized = $state(false)

	// Store original values from API for comparison on save
	let originalLanguage = $state('')
	let originalTheme = $state('')

	let saving = $state(false)
	let error = $state<string | null>(null)
	let contentElement: HTMLElement | undefined = $state()
	let isScrolledToBottom = $state(true)

	// Fetch current user data from API
	const currentUserQuery = createQuery(() => ({
		queryKey: ['currentUser', 'settings'],
		queryFn: () => userAdapter.getCurrentUser(),
		enabled: open, // Only fetch when modal is open
		staleTime: 0 // Always refetch when modal opens to ensure fresh data
	}))

	// Fetch current user's crew (for showing gamertag toggle)
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: open // Only fetch when modal is open
	}))

	const isInCrew = $derived(!!myCrewQuery.data)
	const crewGamertag = $derived(myCrewQuery.data?.gamertag ?? undefined)
	const isLoading = $derived(currentUserQuery.isPending && !formInitialized)

	// Populate form state when API returns data
	$effect(() => {
		if (currentUserQuery.data && !formInitialized) {
			const data = currentUserQuery.data
			// Account
			formEmail = data.email ?? ''
			// Profile
			picture = data.avatar?.picture ?? ''
			element = (data.avatar?.element as ElementType) ?? 'wind'
			granblueId = data.granblueId ?? ''
			gender = data.gender ?? 0
			language = data.language ?? 'en'
			theme = data.theme ?? 'system'
			// Privacy
			showGranblueId = data.showGranblueId ?? false
			collectionPrivacy = data.collectionPrivacy ?? 1
			showCrewGamertag = data.showCrewGamertag ?? false
			// Store original values for comparison
			originalLanguage = data.language ?? 'en'
			originalTheme = data.theme ?? 'system'
			formInitialized = true
		}
	})

	// Reset form initialized state when modal closes
	$effect(() => {
		if (!open) {
			formInitialized = false
		}
	})

	// Navigation items
	const navItems = [
		{ value: 'account', label: 'Account' },
		{ value: 'profile', label: 'Profile' },
		{ value: 'privacy', label: 'Privacy' }
	]

	// Check if scrolled to bottom
	function checkScrollPosition() {
		if (!contentElement) return
		const { scrollTop, scrollHeight, clientHeight } = contentElement
		// Consider "at bottom" if within 5px of the bottom
		isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 5
	}

	// Check scroll position when content element is bound or section changes
	$effect(() => {
		if (contentElement) {
			// Small delay to let content render
			setTimeout(checkScrollPosition, 0)
		}
	})

	// Re-check when section changes
	$effect(() => {
		activeSection // Track this dependency
		if (contentElement) {
			setTimeout(checkScrollPosition, 0)
		}
	})

	// Handle form submission
	async function handleSave() {
		error = null
		saving = true

		try {
			// Prepare the update data
			const updateData: Parameters<typeof users.update>[1] = {
				picture,
				element,
				gender,
				language,
				theme,
				granblueId: granblueId || undefined,
				showCrewGamertag,
				showGranblueId,
				collectionPrivacy
			}

			// Call API to update user settings
			const response = await users.update(userId, updateData)

			// Update the user cookie
			const updatedUser: UserCookie = {
				picture: response.avatar.picture,
				element: response.avatar.element,
				language: response.language,
				gender: response.gender,
				theme: response.theme,
				bahamut,
				granblueId: response.granblueId,
				showCrewGamertag: response.showCrewGamertag,
				showGranblueId: response.showGranblueId,
				collectionPrivacy: response.collectionPrivacy
			}

			// Make a request to update the cookie server-side
			await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatedUser)
			})

			// Update the TanStack Query cache so reopening the modal shows the saved values
			queryClient.setQueryData(['currentUser', 'settings'], (oldData: Record<string, unknown> | undefined) =>
				oldData
					? {
							...oldData,
							avatar: { ...(oldData.avatar as Record<string, unknown>), picture, element },
							granblueId,
							gender,
							language,
							theme,
							showGranblueId,
							collectionPrivacy,
							showCrewGamertag
						}
					: oldData
			)

			// Apply theme change immediately without reload
			if (originalTheme !== theme) {
				themeStore.setTheme(theme as ThemePreference)
			}

			// If language or bahamut mode changed, we need a full page reload
			if (originalLanguage !== language || user.bahamut !== bahamut) {
				await invalidateAll()
				window.location.reload()
			} else {
				// For other changes (element, picture, gender, theme), invalidate to refresh layout data
				await invalidateAll()
			}

			// Close the modal
			handleClose()
		} catch (err) {
			console.error('Failed to update settings:', err)
			error = 'Failed to update settings. Please try again.'
		} finally {
			saving = false
		}
	}

	function handleClose() {
		open = false
		onOpenChange?.(false)
	}
</script>

<Dialog bind:open {...onOpenChange ? { onOpenChange } : {}} size="medium" hideClose>
	{#snippet children()}
		<ModalBody noPadding>
			<div class="settings-layout">
				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<aside class="settings-sidebar">
					<div class="sidebar-header">
						<h2 class="title">Settings</h2>
						<p class="username">@{username}</p>
					</div>
					<SettingsNav
						bind:value={activeSection}
						{element}
						items={navItems}
					/>
				</aside>

				<main class="settings-content" bind:this={contentElement} onscroll={checkScrollPosition}>
					{#if isLoading}
						<div class="loading-state">
							<div class="spinner"></div>
							<span>Loading settings...</span>
						</div>
					{:else if activeSection === 'account'}
						<AccountSettings
							username={formUsername}
							email={formEmail}
							{currentPassword}
							{newPassword}
							{confirmPassword}
							{bahamut}
							{role}
							{element}
							onUsernameChange={(v) => (formUsername = v)}
							onEmailChange={(v) => (formEmail = v)}
							onCurrentPasswordChange={(v) => (currentPassword = v)}
							onNewPasswordChange={(v) => (newPassword = v)}
							onConfirmPasswordChange={(v) => (confirmPassword = v)}
							onBahamutChange={(v) => (bahamut = v)}
						/>
					{:else if activeSection === 'profile'}
						<ProfileSettings
							{picture}
							{element}
							{granblueId}
							{gender}
							{language}
							{theme}
							onPictureChange={(v) => (picture = v)}
							onElementChange={(v) => (element = v as ElementType)}
							onGranblueIdChange={(v) => (granblueId = v)}
							onGenderChange={(v) => (gender = v)}
							onLanguageChange={(v) => (language = v)}
							onThemeChange={(v) => (theme = v)}
						/>
					{:else if activeSection === 'privacy'}
						<PrivacySettings
							{showGranblueId}
							{collectionPrivacy}
							{showCrewGamertag}
							{isInCrew}
							{crewGamertag}
							{element}
							onShowGranblueIdChange={(v) => (showGranblueId = v)}
							onCollectionPrivacyChange={(v) => (collectionPrivacy = v)}
							onShowCrewGamertagChange={(v) => (showCrewGamertag = v)}
						/>
					{/if}
				</main>
			</div>
		</ModalBody>

		<ModalFooter
			onCancel={handleClose}
			cancelDisabled={saving}
			primaryAction={{
				label: saving ? 'Saving...' : 'Save Changes',
				onclick: handleSave,
				disabled: saving || isLoading
			}}
			showShadow={!isScrolledToBottom}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.settings-layout {
		display: flex;
		height: 480px;
	}

	.error-message {
		background-color: var(--danger-bg-subtle);
		border: 1px solid var(--danger);
		border-radius: layout.$card-corner;
		color: var(--danger);
		padding: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
		width: 100%;
	}

	.settings-sidebar {
		flex-shrink: 0;
		padding: spacing.$unit;
		padding-right: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.sidebar-header {
		padding: spacing.$unit spacing.$unit-2x;

		.title {
			font-size: typography.$font-large;
			font-weight: typography.$medium;
			color: var(--text-primary);
			margin: 0;
		}

		.username {
			font-size: typography.$font-small;
			color: var(--text-secondary);
			margin: 0;
			margin-top: spacing.$unit-half;
		}
	}

	.settings-content {
		flex: 1;
		overflow-y: auto;
		padding: spacing.$unit-3x;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-color);
		border-top-color: var(--text-secondary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
