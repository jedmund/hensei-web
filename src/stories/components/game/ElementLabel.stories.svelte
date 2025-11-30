<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'

	const { Story } = defineMeta({
		title: 'Components/Game/ElementLabel',
		component: ElementLabel,
		tags: ['autodocs'],
		argTypes: {
			element: {
				control: {
					type: 'select',
					labels: {
						0: 'Null',
						1: 'Wind',
						2: 'Fire',
						3: 'Water',
						4: 'Earth',
						5: 'Dark',
						6: 'Light'
					}
				},
				options: [0, 1, 2, 3, 4, 5, 6],
				description: 'Element type (0=Null, 1=Wind, 2=Fire, 3=Water, 4=Earth, 5=Dark, 6=Light)'
			},
			size: {
				control: 'select',
				options: ['small', 'medium', 'large', 'xlarge', 'natural'],
				description: 'Icon size'
			}
		}
	})

	const elements = [
		{ id: 1, name: 'Wind' },
		{ id: 2, name: 'Fire' },
		{ id: 3, name: 'Water' },
		{ id: 4, name: 'Earth' },
		{ id: 5, name: 'Dark' },
		{ id: 6, name: 'Light' }
	]
</script>

<!-- Default - Interactive single component for autodocs (args-only, no children) -->
<Story name="Default" args={{ element: 1, size: 'large' }} />

<!-- All Elements (custom layout - uses asChild to prevent double render) -->
<Story name="All Elements" asChild>
	<div style="display: flex; gap: 16px; align-items: center;">
		{#each elements as el}
			<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
				<ElementLabel element={el.id} />
				<span style="font-size: 12px; color: #666;">{el.name}</span>
			</div>
		{/each}
	</div>
</Story>

<!-- Size Comparison (custom layout) -->
<Story name="Size Comparison" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Small:</span>
			{#each elements as el}
				<ElementLabel element={el.id} size="small" />
			{/each}
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Medium:</span>
			{#each elements as el}
				<ElementLabel element={el.id} size="medium" />
			{/each}
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Large:</span>
			{#each elements as el}
				<ElementLabel element={el.id} size="large" />
			{/each}
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">X-Large:</span>
			{#each elements as el}
				<ElementLabel element={el.id} size="xlarge" />
			{/each}
		</div>
	</div>
</Story>
