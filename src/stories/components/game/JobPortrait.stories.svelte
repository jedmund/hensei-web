<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import JobPortrait from '$lib/components/job/JobPortrait.svelte'
	import { Gender } from '$lib/utils/jobUtils'
	import { mockJob, mockJobNoUM, mockJobMultiProf } from '../../mocks/jobs'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/Game/JobPortrait',
		component: JobPortrait,
		tags: ['autodocs'],
		argTypes: {
			size: {
				control: 'select',
				options: ['small', 'medium', 'large'],
				description: 'Portrait size'
			},
			gender: {
				control: {
					type: 'select',
					labels: {
						[Gender.Gran]: 'Gran',
						[Gender.Djeeta]: 'Djeeta'
					}
				},
				options: [Gender.Gran, Gender.Djeeta],
				description: 'Character gender'
			},
			element: {
				control: {
					type: 'select',
					labels: {
						1: 'Wind',
						2: 'Fire',
						3: 'Water',
						4: 'Earth',
						5: 'Light',
						6: 'Dark'
					}
				},
				options: [undefined, 1, 2, 3, 4, 5, 6],
				description: 'Element for border color'
			},
			showPlaceholder: {
				control: 'boolean',
				description: 'Show placeholder when no job'
			},
			clickable: {
				control: 'boolean',
				description: 'Enable click interaction'
			}
		},
		args: {
			onclick: fn()
		}
	})
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ job: mockJob, size: 'medium' }} />

<!-- All Sizes -->
<Story name="All Sizes" asChild>
	<div style="display: flex; gap: 24px; align-items: flex-end;">
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} size="small" />
			<span style="font-size: 12px; color: #666;">Small</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} size="medium" />
			<span style="font-size: 12px; color: #666;">Medium</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} size="large" />
			<span style="font-size: 12px; color: #666;">Large</span>
		</div>
	</div>
</Story>

<!-- Gender Options -->
<Story name="Gender Options" asChild>
	<div style="display: flex; gap: 24px;">
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} gender={Gender.Gran} />
			<span style="font-size: 12px; color: #666;">Gran</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} gender={Gender.Djeeta} />
			<span style="font-size: 12px; color: #666;">Djeeta</span>
		</div>
	</div>
</Story>

<!-- Element Borders -->
<Story name="Element Borders" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 16px;">
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} element={1} />
			<span style="font-size: 12px; color: #666;">Wind</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} element={2} />
			<span style="font-size: 12px; color: #666;">Fire</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} element={3} />
			<span style="font-size: 12px; color: #666;">Water</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} element={4} />
			<span style="font-size: 12px; color: #666;">Earth</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} element={5} />
			<span style="font-size: 12px; color: #666;">Light</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} element={6} />
			<span style="font-size: 12px; color: #666;">Dark</span>
		</div>
	</div>
</Story>

<!-- Empty / Placeholder -->
<Story name="Placeholder" asChild>
	<div style="display: flex; gap: 24px;">
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait showPlaceholder={true} />
			<span style="font-size: 12px; color: #666;">With Placeholder</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait showPlaceholder={false} />
			<span style="font-size: 12px; color: #666;">No Placeholder</span>
		</div>
	</div>
</Story>

<!-- Clickable -->
<Story name="Clickable" asChild>
	<div style="display: flex; gap: 24px;">
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} clickable onclick={() => alert('Clicked!')} />
			<span style="font-size: 12px; color: #666;">Clickable (hover to see effect)</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} />
			<span style="font-size: 12px; color: #666;">Non-clickable</span>
		</div>
	</div>
</Story>

<!-- Different Jobs -->
<Story name="Different Jobs" asChild>
	<div style="display: flex; gap: 24px;">
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJob} />
			<span style="font-size: 12px; color: #666;">{mockJob.name.en}</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJobNoUM} />
			<span style="font-size: 12px; color: #666;">{mockJobNoUM.name.en}</span>
		</div>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
			<JobPortrait job={mockJobMultiProf} />
			<span style="font-size: 12px; color: #666;">{mockJobMultiProf.name.en}</span>
		</div>
	</div>
</Story>
