<svelte:options runes={true} />

<script lang="ts">
	import Dialog from './ui/Dialog.svelte'
	import ModalHeader from './ui/ModalHeader.svelte'
	import ModalBody from './ui/ModalBody.svelte'
	import ModalFooter from './ui/ModalFooter.svelte'
	import Select from './ui/Select.svelte'
	import Switch from './ui/switch/Switch.svelte'
	import Button from './ui/Button.svelte'
	import Input from './ui/Input.svelte'
	import { pictureData, type Picture } from '$lib/utils/pictureData'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { users } from '$lib/api/resources/users'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { setUserCookie } from '$lib/auth/cookies'
	import { invalidateAll } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { userAdapter } from '$lib/api/adapters/user.adapter'

	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
		username: string
		userId: string
		user: UserCookie
		role: number
	}

	let { open = $bindable(false), onOpenChange, username, userId, user, role }: Props = $props()

	// Form state - fields from cookie (can use immediately)
	let picture = $state(user.picture)
	let element = $state(user.element)
	let gender = $state(user.gender)
	let language = $state(user.language)
	let theme = $state(user.theme)
	let bahamut = $state(user.bahamut ?? false)

	// Form state - fields that are also in cookie (use cookie as initial value)
	let granblueId = $state(user.granblueId ?? '')
	let showCrewGamertag = $state(user.showCrewGamertag ?? false)

	let saving = $state(false)
	let error = $state<string | null>(null)

	// Fetch current user data from API (to sync with latest database values)
	const currentUserQuery = createQuery(() => ({
		queryKey: ['currentUser', 'settings'],
		queryFn: () => userAdapter.getCurrentUser(),
		enabled: open, // Only fetch when modal is open
		staleTime: 5 * 60 * 1000 // Cache for 5 minutes
	}))

	// Fetch current user's crew (for showing gamertag toggle)
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: open // Only fetch when modal is open
	}))

	const isInCrew = $derived(!!myCrewQuery.data)
	const crewGamertag = $derived(myCrewQuery.data?.gamertag)

	// Sync form state when API returns fresher data than cookie
	$effect(() => {
		if (currentUserQuery.data) {
			granblueId = currentUserQuery.data.granblueId ?? ''
			showCrewGamertag = currentUserQuery.data.showCrewGamertag ?? false
		}
	})

	// Get current locale from user settings
	const locale = $derived(user.language as 'en' | 'ja')

	// Prepare options for selects
	const pictureOptions = $derived(
		pictureData
			.sort((a, b) => a.name.en.localeCompare(b.name.en))
			.map((p) => ({
				value: p.filename,
				label: p.name[locale] || p.name.en,
				image: getAvatarSrc(p.filename)
			}))
	)

	const genderOptions = [
		{ value: 0, label: 'Gran' },
		{ value: 1, label: 'Djeeta' }
	]

	const languageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'ja', label: '日本語' }
	]

	const themeOptions = [
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	]

	// Element colors for circle indicators
	const elementColors: Record<string, string> = {
		wind: '#3ee489',
		fire: '#fa6d6d',
		water: '#6cc9ff',
		earth: '#fd9f5b',
		dark: '#de7bff',
		light: '#e8d633'
	}

	// Create SVG circle data URL for element color
	function getElementCircle(element: string): string {
		const color = elementColors[element] || '#888'
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="${color}"/></svg>`
		return `data:image/svg+xml,${encodeURIComponent(svg)}`
	}

	const elementOptions = [
		{ value: 'wind', label: 'Wind', image: getElementCircle('wind') },
		{ value: 'fire', label: 'Fire', image: getElementCircle('fire') },
		{ value: 'water', label: 'Water', image: getElementCircle('water') },
		{ value: 'earth', label: 'Earth', image: getElementCircle('earth') },
		{ value: 'dark', label: 'Dark', image: getElementCircle('dark') },
		{ value: 'light', label: 'Light', image: getElementCircle('light') }
	]

	// Get current picture data
	const currentPicture = $derived(pictureData.find((p) => p.filename === picture))

	// Handle form submission
	async function handleSave() {
		error = null
		saving = true

		try {
			// Prepare the update data
			const updateData = {
				picture,
				element,
				gender,
				language,
				theme,
				granblueId: granblueId || undefined,
				showCrewGamertag
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
				showCrewGamertag: response.showCrewGamertag
			}

			// Save to cookie (we'll need to handle this server-side)
			// For now, we'll just update the local state
			const expires = new Date()
			expires.setDate(expires.getDate() + 60)

			// Make a request to update the cookie server-side
			await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatedUser)
			})

			// If language, theme, or bahamut mode changed, we need a full page reload
			if (user.language !== language || user.theme !== theme || user.bahamut !== bahamut) {
				await invalidateAll()
				window.location.reload()
			} else {
				// For other changes (element, picture, gender), invalidate to refresh layout data
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

<Dialog bind:open {...onOpenChange ? { onOpenChange } : {}}>
	{#snippet children()}
		<ModalHeader title="Account settings" description="@{username}" />

		<ModalBody>
			<div class="settings-form">
				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<div class="form-fields">
					<!-- Picture Selection with Preview -->
					<div class="picture-section">
						<div class="current-avatar">
							<img
								src={getAvatarSrc(picture)}
								srcset={getAvatarSrcSet(picture)}
								alt={currentPicture?.name[locale] || ''}
								class="avatar-preview element-{element}"
							/>
						</div>
						<Select
							bind:value={picture}
							options={pictureOptions}
							label="Avatar"
							placeholder="Select an avatar"
							fullWidth
							contained
						/>
					</div>

					<!-- Element Selection -->
					<Select
						bind:value={element}
						options={elementOptions}
						label="Element"
						placeholder="Select an element"
						fullWidth
						contained
					/>

					<!-- Granblue ID -->
					<Input
						bind:value={granblueId}
						label="Granblue ID"
						placeholder="Enter your Granblue ID"
						contained
						fullWidth
					/>

					<!-- Show Crew Gamertag (only if in a crew with a gamertag) -->
					{#if isInCrew && crewGamertag}
						<div class="inline-switch">
							<label for="show-gamertag">
								<span>Show crew tag on profile</span>
								<Switch bind:checked={showCrewGamertag} name="show-gamertag" element={element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined} />
							</label>
							<p class="field-hint">Display "{crewGamertag}" next to your name</p>
						</div>
					{/if}

					<hr class="separator" />

					<!-- Gender Selection -->
					<Select
						bind:value={gender}
						options={genderOptions}
						label="Gender"
						placeholder="Select gender"
						fullWidth
						contained
					/>

					<!-- Language Selection -->
					<Select
						bind:value={language}
						options={languageOptions}
						label="Language"
						placeholder="Select language"
						fullWidth
						contained
					/>

					<!-- Theme Selection -->
					<Select
						bind:value={theme}
						options={themeOptions}
						label="Theme"
						placeholder="Select theme"
						fullWidth
						contained
					/>

					<!-- Bahamut Mode (only for admins) -->
					{#if role === 9}
						<hr class="separator" />
						<div class="switch-field">
							<label for="bahamut-mode">
								<span>Bahamut Mode</span>
								<Switch bind:checked={bahamut} name="bahamut-mode" element={element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined} />
							</label>
						</div>
					{/if}
				</div>
			</div>
		</ModalBody>

		<ModalFooter
			onCancel={handleClose}
			cancelDisabled={saving}
			primaryAction={{
				label: saving ? 'Saving...' : 'Save Changes',
				onclick: handleSave,
				disabled: saving
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.settings-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.error-message {
		background-color: rgba(colors.$error, 0.1);
		border: 1px solid colors.$error;
		border-radius: layout.$card-corner;
		color: colors.$error;
		padding: spacing.$unit-2x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.separator {
		border: none;
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
		margin: 0;
	}

	.inline-switch {
		label {
			display: flex;
			align-items: center;
			justify-content: space-between;

			span {
				font-size: typography.$font-regular;
				color: var(--text-primary);
			}
		}

		.field-hint {
			margin: spacing.$unit-half 0 0;
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.picture-section {
		display: flex;
		gap: spacing.$unit-3x;
		align-items: center;

		.current-avatar {
			flex-shrink: 0;
			width: 80px;
			height: 80px;

			.avatar-preview {
				width: 100%;
				height: 100%;
				object-fit: contain;
				border-radius: layout.$full-corner;
				padding: spacing.$unit;
				background-color: var(--placeholder-bg);

				&.element-fire {
					background-color: colors.$fire-bg-20;
				}
				&.element-water {
					background-color: colors.$water-bg-20;
				}
				&.element-earth {
					background-color: colors.$earth-bg-20;
				}
				&.element-wind {
					background-color: colors.$wind-bg-20;
				}
				&.element-light {
					background-color: colors.$light-bg-20;
				}
				&.element-dark {
					background-color: colors.$dark-bg-20;
				}
			}
		}
	}

	.switch-field {
		label {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: spacing.$unit-2x;
			background-color: var(--input-bound-bg);
			border-radius: layout.$card-corner;

			span {
				font-size: typography.$font-regular;
				color: var(--text-primary);
			}
		}
	}

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
