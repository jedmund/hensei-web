<svelte:options runes={true} />

<script lang="ts">
	import type { JobSkill } from '$lib/types/api/entities'
	import type { JobSkillPayload } from '$lib/api/adapters/job.adapter'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { jobKeys } from '$lib/api/queries/job.queries'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { untrack } from 'svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		/** The job's granblue_id */
		jobId: string
		/** Existing skill to edit, or undefined for creating new */
		skill?: JobSkill
		/** Callback when skill is saved successfully */
		onSaved?: () => void
	}

	let { jobId, skill, onSaved }: Props = $props()

	const queryClient = useQueryClient()

	// Form state
	let nameEn = $state(skill?.name?.en ?? '')
	let nameJp = $state(skill?.name?.ja ?? '')
	let color = $state(skill?.color ?? 0)
	let order = $state(skill?.order ?? 0)
	let imageId = $state(skill?.imageId ?? '')
	let actionId = $state(skill?.actionId ?? 0)
	let isSaving = $state(false)
	let isDownloading = $state(false)

	// Skill type - only one can be true
	let skillType = $state<'main' | 'sub' | 'emp' | 'base'>(
		skill?.main ? 'main' : skill?.sub ? 'sub' : skill?.emp ? 'emp' : skill?.base ? 'base' : 'main'
	)

	const skillTypeOptions = [
		{ value: 'main', label: 'Main' },
		{ value: 'sub', label: 'Subskill' },
		{ value: 'emp', label: 'EMP' },
		{ value: 'base', label: 'Base' }
	]

	// Auto-generate slug from English name
	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim()
	}

	// Derive slug from English name
	const slug = $derived(generateSlug(nameEn))

	// Derive current payload
	const currentPayload = $derived<JobSkillPayload>({
		name_en: nameEn,
		name_jp: nameJp || undefined,
		slug: slug,
		color: color,
		main: skillType === 'main',
		sub: skillType === 'sub',
		emp: skillType === 'emp',
		base: skillType === 'base',
		order: order,
		image_id: imageId || undefined,
		action_id: actionId || undefined
	})

	// Derive validity
	const isValid = $derived(nameEn.trim().length > 0)

	// Handle save
	async function handleSave() {
		if (!isValid || isSaving) return

		isSaving = true
		try {
			if (skill) {
				await jobAdapter.updateSkill(jobId, skill.id, currentPayload)
			} else {
				await jobAdapter.createSkill(jobId, currentPayload)
			}

			await queryClient.invalidateQueries({ queryKey: jobKeys.skills(jobId) })
			onSaved?.()
			sidebar.close()
		} catch (error) {
			console.error('Failed to save skill:', error)
			// TODO: Show error toast
		} finally {
			isSaving = false
		}
	}

	// Handle image download
	async function handleDownloadImage() {
		if (!skill || !imageId || isDownloading) return

		isDownloading = true
		try {
			const result = await jobAdapter.downloadSkillImage(jobId, skill.id)
			if (result.success) {
				console.log('Image downloaded:', result.filename)
				// TODO: Show success toast
			} else {
				console.error('Failed to download image')
				// TODO: Show error toast
			}
		} catch (error) {
			console.error('Failed to download image:', error)
			// TODO: Show error toast
		} finally {
			isDownloading = false
		}
	}

	// Update sidebar action button when form validity changes
	$effect(() => {
		// Capture dependencies
		const valid = isValid
		const saving = isSaving

		// Use untrack to prevent setAction from triggering re-runs
		untrack(() => {
			sidebar.setAction(valid && !saving ? handleSave : undefined, saving ? 'Saving...' : 'Save', undefined, true)
		})
	})
</script>

<div class="job-skill-edit-pane">
	<DetailsSection title="Basic Info">
		<DetailItem label="Name (EN)" bind:value={nameEn} editable={true} placeholder="English name" />
		<DetailItem
			label="Name (JP)"
			bind:value={nameJp}
			editable={true}
			placeholder="Japanese name (optional)"
		/>
		<DetailItem
			label="Slug"
			value={slug || '(auto-generated from name)'}
			editable={false}
		/>
	</DetailsSection>

	<DetailsSection title="Classification">
		<DetailItem
			label="Skill Type"
			bind:value={skillType}
			editable={true}
			type="select"
			options={skillTypeOptions}
		/>
		<DetailItem label="Color" bind:value={color} editable={true} type="number" placeholder="0" />
		<DetailItem label="Order" bind:value={order} editable={true} type="number" placeholder="0" />
	</DetailsSection>

	<DetailsSection title="Game Data">
		<DetailItem
			label="Image ID"
			bind:value={imageId}
			editable={true}
			placeholder="e.g. 2710_3"
		/>
		<DetailItem
			label="Action ID"
			bind:value={actionId}
			editable={true}
			type="number"
			placeholder="e.g. 203921"
		/>
	</DetailsSection>

	{#if skill && imageId}
		<div class="download-section">
			<Button onclick={handleDownloadImage} disabled={isDownloading} variant="secondary">
				{isDownloading ? 'Downloading...' : 'Download Image'}
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.job-skill-edit-pane {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		padding: spacing.$unit-2x 0;
	}

	// Override DetailsSection styles for this pane
	.job-skill-edit-pane :global(.details-section) {
		padding: 0 spacing.$unit-2x;
	}

	.job-skill-edit-pane :global(.details-section h3) {
		padding: 0;
	}

	.download-section {
		padding: 0 spacing.$unit-2x;
		display: flex;
		justify-content: flex-start;
	}
</style>
