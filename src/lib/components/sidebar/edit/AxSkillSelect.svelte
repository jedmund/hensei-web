
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import type { AugmentSkill, WeaponStatModifier } from '$lib/types/api/weaponStatModifier'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'

	const PRIMARY_AX_SLUGS = ['ax_atk', 'ax_def', 'ax_hp', 'ax_ca_dmg', 'ax_multiattack']

	interface Props {
		/** Current AX skills on the weapon (bindable) */
		currentSkills?: AugmentSkill[]
		/** Language for display */
		locale?: 'en' | 'ja'
	}

	let { currentSkills = $bindable<AugmentSkill[]>([]), locale = 'en' }: Props = $props()

	const axQuery = createQuery(() => entityQueries.axSkills())

	// Derive display values directly from the bound prop
	const selectedPrimaryId = $derived(currentSkills[0]?.modifier?.id ?? '')
	const primaryStrength = $derived(currentSkills[0]?.strength ?? 0)
	const selectedSecondaryId = $derived(currentSkills[1]?.modifier?.id ?? '')
	const secondaryStrength = $derived(currentSkills[1]?.strength ?? 0)

	const selectedPrimary = $derived(
		selectedPrimaryId
			? (axQuery.data ?? []).find((m) => m.id === selectedPrimaryId)
			: undefined
	)
	const selectedSecondary = $derived(
		selectedSecondaryId
			? (axQuery.data ?? []).find((m) => m.id === selectedSecondaryId)
			: undefined
	)

	const showSecondary = $derived(!!selectedPrimary)

	// Build primary skill options
	const primaryOptions = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [{ value: '', label: m.ax_no_skill() }]

		for (const skill of (axQuery.data ?? []).filter((s) => PRIMARY_AX_SLUGS.includes(s.slug))) {
			items.push({
				value: skill.id,
				label: locale === 'ja' ? skill.nameJp : skill.nameEn
			})
		}

		return items
	})

	// Build secondary skill options
	const secondaryOptions = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [{ value: '', label: m.ax_no_skill() }]

		for (const skill of (axQuery.data ?? []).filter((s) => !PRIMARY_AX_SLUGS.includes(s.slug))) {
			items.push({
				value: skill.id,
				label: locale === 'ja' ? skill.nameJp : skill.nameEn
			})
		}

		return items
	})

	// Get suffix for display
	function getSuffix(modifier: WeaponStatModifier | undefined): string {
		return modifier?.suffix ?? ''
	}

	function handlePrimaryChange(value: string | undefined) {
		const modifier = value ? (axQuery.data ?? []).find((m) => m.id === value) : undefined
		if (!modifier) {
			currentSkills = []
			return
		}
		currentSkills = [
			{ modifier, strength: currentSkills[0]?.strength ?? 0 },
			...(currentSkills.length > 1 ? [currentSkills[1]] : [])
		]
	}

	function handlePrimaryStrengthChange(event: Event) {
		const input = event.target as HTMLInputElement
		const val = parseFloat(input.value) || 0
		const max = selectedPrimary?.baseMax ?? 999
		const clamped = Math.min(val, max)
		if (val > max) input.value = String(clamped)
		if (currentSkills[0]) {
			currentSkills = [
				{ ...currentSkills[0], strength: clamped },
				...(currentSkills.length > 1 ? [currentSkills[1]] : [])
			]
		}
	}

	function handleSecondaryChange(value: string | undefined) {
		const modifier = value ? (axQuery.data ?? []).find((m) => m.id === value) : undefined
		if (!modifier) {
			currentSkills = currentSkills.length > 0 ? [currentSkills[0]] : []
			return
		}
		currentSkills = [
			currentSkills[0],
			{ modifier, strength: currentSkills[1]?.strength ?? 0 }
		]
	}

	function handleSecondaryStrengthChange(event: Event) {
		const input = event.target as HTMLInputElement
		const val = parseFloat(input.value) || 0
		const max = selectedSecondary?.baseMax ?? 999
		const clamped = Math.min(val, max)
		if (val > max) input.value = String(clamped)
		if (currentSkills[1]) {
			currentSkills = [currentSkills[0], { ...currentSkills[1], strength: clamped }]
		}
	}
</script>

{#if axQuery.isPending}
	<div class="ax-skill-select loading">
		<div class="skeleton"></div>
	</div>
{:else if axQuery.error}
	<div class="ax-skill-select">
		<div class="error">{m.sidebar_keys_error()}</div>
	</div>
{:else}
	<div class="ax-skill-select">
		<!-- Primary Skill -->
		<div class="skill-row">
			<div class="skill-fields">
				<div class="skill-select">
					<Select
						options={primaryOptions}
						value={selectedPrimaryId}
						onValueChange={handlePrimaryChange}
						placeholder={m.placeholder_select_skill()}
						size="medium"
						fullWidth
						contained
					/>
				</div>

				{#if selectedPrimary}
					<div class="skill-value-group">
						<div class="skill-value-input">
							<Input
								type="number"
								min={selectedPrimary.baseMin}
								max={selectedPrimary.baseMax}
								step={0.5}
								value={primaryStrength || ''}
								oninput={handlePrimaryStrengthChange}
								contained
								variant="number"
								placeholder="{selectedPrimary.baseMin}~{selectedPrimary.baseMax}"
							/>
						</div>
						<span class="suffix">{getSuffix(selectedPrimary) ?? ''}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Secondary Skill -->
		{#if showSecondary}
			<div class="skill-row">
				<div class="skill-fields">
					<div class="skill-select">
						<Select
							options={secondaryOptions}
							value={selectedSecondaryId}
							onValueChange={handleSecondaryChange}
							placeholder={m.placeholder_select_skill()}
							size="medium"
							fullWidth
							contained
						/>
					</div>

					{#if selectedSecondary}
						<div class="skill-value-group">
							<div class="skill-value-input">
								<Input
									type="number"
									min={selectedSecondary.baseMin}
									max={selectedSecondary.baseMax}
									step={0.5}
									value={secondaryStrength || ''}
									oninput={handleSecondaryStrengthChange}
									contained
									variant="number"
									placeholder="{selectedSecondary.baseMin}~{selectedSecondary.baseMax}"
								/>
							</div>
							<span class="suffix">{getSuffix(selectedSecondary) ?? ''}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.ax-skill-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		&.loading {
			min-height: 80px;
		}
	}

	.skeleton {
		height: 40px;
		background: var(--placeholder-bg);
		border-radius: layout.$item-corner-small;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.skill-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.skill-fields {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: center;
	}

	.skill-select {
		flex: 1;
		min-width: 0;
	}

	.skill-value-group {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

.suffix {
		color: var(--text-secondary);
		font-size: typography.$font-small;
		min-width: 1.5em;
		text-align: right;
	}

	.error {
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-error);
	}
</style>
