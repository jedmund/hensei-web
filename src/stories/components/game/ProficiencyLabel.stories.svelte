<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'

	const { Story } = defineMeta({
		title: 'Components/Game/ProficiencyLabel',
		component: ProficiencyLabel,
		tags: ['autodocs'],
		argTypes: {
			proficiency: {
				control: {
					type: 'select',
					labels: {
						1: 'Sabre',
						2: 'Dagger',
						3: 'Axe',
						4: 'Spear',
						5: 'Staff',
						6: 'Gun',
						7: 'Melee',
						8: 'Bow',
						9: 'Harp',
						10: 'Katana'
					}
				},
				options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				description:
					'Proficiency type (1=Sabre, 2=Dagger, 3=Axe, 4=Spear, 5=Staff, 6=Gun, 7=Melee, 8=Bow, 9=Harp, 10=Katana)'
			},
			size: {
				control: 'select',
				options: ['small', 'medium', 'large', 'xlarge', 'natural'],
				description: 'Icon size'
			}
		}
	})

	const proficiencies = [
		{ id: 1, name: 'Sabre' },
		{ id: 2, name: 'Dagger' },
		{ id: 3, name: 'Axe' },
		{ id: 4, name: 'Spear' },
		{ id: 5, name: 'Staff' },
		{ id: 6, name: 'Gun' },
		{ id: 7, name: 'Melee' },
		{ id: 8, name: 'Bow' },
		{ id: 9, name: 'Harp' },
		{ id: 10, name: 'Katana' }
	]
</script>

<!-- Default - Interactive single component for autodocs (args-only, no children) -->
<Story name="Default" args={{ proficiency: 1, size: 'large' }} />

<!-- All Proficiencies (custom layout - uses asChild to prevent double render) -->
<Story name="All Proficiencies" asChild>
	<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">
		{#each proficiencies as prof}
			<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
				<ProficiencyLabel proficiency={prof.id} />
				<span style="font-size: 12px; color: #666;">{prof.name}</span>
			</div>
		{/each}
	</div>
</Story>

<!-- Size Comparison (custom layout) -->
<Story name="Size Comparison" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Small:</span>
			{#each proficiencies.slice(0, 5) as prof}
				<ProficiencyLabel proficiency={prof.id} size="small" />
			{/each}
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Medium:</span>
			{#each proficiencies.slice(0, 5) as prof}
				<ProficiencyLabel proficiency={prof.id} size="medium" />
			{/each}
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Large:</span>
			{#each proficiencies.slice(0, 5) as prof}
				<ProficiencyLabel proficiency={prof.id} size="large" />
			{/each}
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">X-Large:</span>
			{#each proficiencies.slice(0, 5) as prof}
				<ProficiencyLabel proficiency={prof.id} size="xlarge" />
			{/each}
		</div>
	</div>
</Story>

<!-- In Context - Character Proficiencies -->
<Story name="In Context - Character Info" asChild>
	<div
		style="display: inline-flex; flex-direction: column; gap: 8px; padding: 16px; background: #f5f5f5; border-radius: 8px;"
	>
		<span style="font-weight: 600; margin-bottom: 4px;">Proficiencies</span>
		<div style="display: flex; align-items: center; gap: 8px;">
			<ProficiencyLabel proficiency={1} size="medium" />
			<span style="font-size: 14px;">Sabre</span>
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<ProficiencyLabel proficiency={10} size="medium" />
			<span style="font-size: 14px;">Katana</span>
		</div>
	</div>
</Story>

<!-- Dual Proficiency Display -->
<Story name="Dual Proficiency Display" asChild>
	<div style="display: flex; align-items: center; gap: 4px;">
		<ProficiencyLabel proficiency={1} size="medium" />
		<ProficiencyLabel proficiency={10} size="medium" />
	</div>
</Story>
