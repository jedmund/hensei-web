<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Dialog from './ui/Dialog.svelte'
	import ModalHeader from './ui/ModalHeader.svelte'
	import ModalBody from './ui/ModalBody.svelte'
	import ModalFooter from './ui/ModalFooter.svelte'
	import SegmentedControl from './ui/segmented-control/SegmentedControl.svelte'
	import Segment from './ui/segmented-control/Segment.svelte'
	import type { ElementType } from './ui/SettingsNav.svelte'
	import AccountSettings from './settings/AccountSettings.svelte'
	import ProfileSettings from './settings/ProfileSettings.svelte'
	import PrivacySettings from './settings/PrivacySettings.svelte'
	import ConfirmDialog from './ui/ConfirmDialog.svelte'
	import { users } from '$lib/api/resources/users'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { invalidateAll } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import { themeStore, type ThemePreference } from '$lib/stores/theme.svelte'
	import { localizeHref, deLocalizeHref } from '$lib/paraglide/runtime'
	import { updateSimplePortraits } from '$lib/stores/simplePortraits.svelte'

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
	let formDisplayName = $state('')
	let formEmail = $state('')
	let emailVerified = $state(false)
	let currentPassword = $state('')
	let newPassword = $state('')
	let confirmPassword = $state('')
	let bahamut = $derived(user.bahamut ?? false) // Client-side preference, kept in cookie

	// Form state - Profile section (initialized with defaults, populated from API)
	let picture = $state('')
	let element = $state<ElementType>('wind')
	let granblueId = $state('')
	let wikiProfile = $state('')
	let youtube = $state('')
	let gender = $state(0)
	let language = $state('en')
	let theme = $state('system')

	// Form state - Privacy section (initialized with defaults, populated from API)
	let collectionPrivacy = $state(1) // 1 = Everyone (1-based to avoid JS falsy 0)
	let showCrewGamertag = $state(false)
	let importWeapons = $state(true)
	let defaultImportVisibility = $state(1)
	let simplePortraits = $state(false)

	// Track whether form has been initialized from API
	let formInitialized = $state(false)

	// Store original values from API for comparison on save
	let originalLanguage = $state('')
	let originalTheme = $state('')

	let saving = $state(false)
	let usernameValid = $state(true)
	let usernameConfirmOpen = $state(false)
	let error = $state<string | null>(null)
	let contentElement: HTMLElement | undefined = $state()
	let isScrolledToBottom = $state(true)
	let isScrolledFromTop = $state(false)

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
			formDisplayName = data.displayName ?? ''
			formEmail = data.email ?? ''
			emailVerified = data.emailVerified ?? false
			// Profile
			picture = data.avatar?.picture ?? ''
			element = (data.avatar?.element as ElementType) ?? 'wind'
			granblueId = data.granblueId ?? ''
			wikiProfile = data.wikiProfile ?? ''
			youtube = data.youtube ?? ''
			gender = data.gender ?? 0
			language = data.language ?? 'en'
			theme = data.theme ?? 'system'
			// Privacy
			collectionPrivacy = data.collectionPrivacy ?? 1
			showCrewGamertag = data.showCrewGamertag ?? false
			importWeapons = data.importWeapons ?? true
			defaultImportVisibility = data.defaultImportVisibility ?? 1
			simplePortraits = data.simplePortraits ?? false
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

	// Handle section change from segmented control
	function handleSectionChange(value: string) {
		activeSection = value
	}

	// Check if scrolled to bottom
	function checkScrollPosition() {
		if (!contentElement) return
		const { scrollTop, scrollHeight, clientHeight } = contentElement
		// Consider "at bottom" if within 5px of the bottom
		isScrolledFromTop = scrollTop > 5
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
		void activeSection // Track this dependency
		if (contentElement) {
			setTimeout(checkScrollPosition, 0)
		}
	})

	// Check if username changed before saving
	function handleSaveClick() {
		if (formUsername !== username) {
			usernameConfirmOpen = true
		} else {
			handleSave()
		}
	}

	// Handle form submission
	async function handleSave() {
		usernameConfirmOpen = false
		error = null
		saving = true

		try {
			// Prepare the update data
			const updateData: Parameters<typeof users.update>[1] = {
				username: formUsername,
				displayName: formDisplayName || undefined,
				picture,
				element,
				gender,
				language,
				theme,
				granblueId: granblueId || undefined,
				wikiProfile: wikiProfile || undefined,
				youtube: youtube || undefined,
				showCrewGamertag,
				collectionPrivacy,
				importWeapons,
				defaultImportVisibility,
				simplePortraits
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
				wikiProfile: response.wikiProfile,
				youtube: response.youtube,
				showCrewGamertag: response.showCrewGamertag,
				collectionPrivacy: response.collectionPrivacy,
				importWeapons: response.importWeapons,
				defaultImportVisibility: response.defaultImportVisibility,
				simplePortraits: response.simplePortraits
			}

			// Make a request to update the cookie server-side
			// Include username so the account cookie gets updated too
			await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ...updatedUser, username: response.username })
			})

			// Update the TanStack Query cache so reopening the modal shows the saved values
			queryClient.setQueryData(
				['currentUser', 'settings'],
				(oldData: Record<string, unknown> | undefined) =>
					oldData
						? {
								...oldData,
								avatar: { ...(oldData.avatar as Record<string, unknown>), picture, element },
								granblueId,
								wikiProfile,
								youtube,
								gender,
								language,
								theme,
								collectionPrivacy,
								showCrewGamertag,
								importWeapons,
								defaultImportVisibility,
								simplePortraits
							}
						: oldData
			)

			// Apply theme change immediately without reload
			if (originalTheme !== theme) {
				themeStore.setTheme(theme as ThemePreference)
			}

			// Update simple portraits context reactively
			updateSimplePortraits(response.simplePortraits ?? false)

			// If language or bahamut mode changed, navigate to the re-localized URL
			if (originalLanguage !== language || user.bahamut !== bahamut) {
				await invalidateAll()
				const basePath = deLocalizeHref(
					window.location.pathname + window.location.search + window.location.hash
				)
				window.location.href = localizeHref(basePath, { locale: language })
			} else {
				// For other changes (element, picture, gender, theme), invalidate to refresh layout data
				await invalidateAll()
			}

			// Close the modal
			handleClose()
		} catch (err) {
			console.error('Failed to update settings:', err)
			error = m.settings_save_error()
		} finally {
			saving = false
		}
	}

	function handleClose() {
		open = false
		onOpenChange?.(false)
	}
</script>

<Dialog bind:open {...onOpenChange ? { onOpenChange } : {}} size="small" hideClose>
	<ModalHeader title={m.settings_title()}>
		<span class="header-username">@{username}</span>
	</ModalHeader>
	<ModalBody noPadding>
		<div class="settings-layout">
			<div class="settings-nav" class:scrolled={isScrolledFromTop}>
				<SegmentedControl
					value={activeSection}
					onValueChange={handleSectionChange}
					variant="background"
					size="small"
					{element}
					grow
				>
					<Segment value="profile">{m.settings_nav_profile()}</Segment>
					<Segment value="account">{m.settings_nav_account()}</Segment>
					<Segment value="privacy">{m.settings_nav_privacy()}</Segment>
				</SegmentedControl>
			</div>

			<div class="settings-content" bind:this={contentElement} onscroll={checkScrollPosition}>
				{#if error}
					<div class="error-message">{error}</div>
				{/if}
				{#if isLoading}
					<div class="loading-state">
						<div class="spinner"></div>
						<span>{m.settings_loading()}</span>
					</div>
				{:else if activeSection === 'profile'}
					<ProfileSettings
						{picture}
						{element}
						{username}
						displayName={formDisplayName}
						{granblueId}
						{wikiProfile}
						{youtube}
						{gender}
						onPictureChange={(v) => (picture = v)}
						onDisplayNameChange={(v) => (formDisplayName = v)}
						onGranblueIdChange={(v) => (granblueId = v)}
						onWikiProfileChange={(v) => (wikiProfile = v)}
						onYoutubeChange={(v) => (youtube = v)}
						onGenderChange={(v) => (gender = v)}
					/>
				{:else if activeSection === 'account'}
					<AccountSettings
						username={formUsername}
						email={formEmail}
						{emailVerified}
						{bahamut}
						{simplePortraits}
						{role}
						{element}
						{language}
						{theme}
						{currentPassword}
						{newPassword}
						{confirmPassword}
						onUsernameChange={(v) => (formUsername = v)}
						onEmailChange={(v) => (formEmail = v)}
						onBahamutChange={(v) => (bahamut = v)}
						onSimplePortraitsChange={(v) => (simplePortraits = v)}
						onUsernameValidChange={(v) => (usernameValid = v)}
						onElementChange={(v) => (element = v as ElementType)}
						onLanguageChange={(v) => (language = v)}
						onThemeChange={(v) => (theme = v)}
						onCurrentPasswordChange={(v) => (currentPassword = v)}
						onNewPasswordChange={(v) => (newPassword = v)}
						onConfirmPasswordChange={(v) => (confirmPassword = v)}
					/>
				{:else if activeSection === 'privacy'}
					<PrivacySettings
						{collectionPrivacy}
						{showCrewGamertag}
						{importWeapons}
						{defaultImportVisibility}
						{isInCrew}
						{crewGamertag}
						{element}
						onCollectionPrivacyChange={(v) => (collectionPrivacy = v)}
						onShowCrewGamertagChange={(v) => (showCrewGamertag = v)}
						onImportWeaponsChange={(v) => (importWeapons = v)}
						onDefaultImportVisibilityChange={(v) => (defaultImportVisibility = v)}
					/>
				{/if}
			</div>
		</div>
	</ModalBody>

	<ModalFooter
		onCancel={handleClose}
		cancelDisabled={saving}
		primaryAction={{
			label: saving ? m.settings_saving() : m.settings_save(),
			onclick: handleSaveClick,
			disabled: saving || isLoading || !usernameValid
		}}
		showShadow={!isScrolledToBottom}
	/>
	<ConfirmDialog
		bind:open={usernameConfirmOpen}
		title={m.settings_username_confirm_title()}
		message={m.settings_username_confirm_message()}
		confirmLabel={m.settings_username_confirm_action()}
		onconfirm={handleSave}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.header-username {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.settings-layout {
		display: flex;
		flex-direction: column;
		height: 500px;
	}

	.settings-nav {
		padding: spacing.$unit-2x spacing.$unit-3x;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
		@include effects.smooth-transition(effects.$duration-quick, box-shadow);

		&.scrolled {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

			:global([data-theme='dark']) & {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			}
		}
	}

	.error-message {
		background-color: var(--danger-bg-subtle);
		border: 1px solid var(--danger);
		border-radius: layout.$card-corner;
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
	}

	.settings-content {
		flex: 1;
		overflow-y: auto;
		padding: 0 spacing.$unit-3x;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}
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
