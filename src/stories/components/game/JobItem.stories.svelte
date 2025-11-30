<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import JobItem from '$lib/components/job/JobItem.svelte'
	import { mockJob, mockJobNoUM, mockJobMultiProf } from '../../mocks/jobs'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/Game/JobItem',
		component: JobItem,
		tags: ['autodocs'],
		argTypes: {
			selected: {
				control: 'boolean',
				description: 'Whether the job is selected'
			}
		},
		args: {
			onClick: fn()
		}
	})
</script>

<script>
	let selectedJob = $state(null)
	let interactiveSelected = $state(null)
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ job: mockJob }} />

<!-- Selected -->
<Story name="Selected" args={{ job: mockJob, selected: true }} />

<!-- With Ultimate Mastery -->
<Story name="With Ultimate Mastery" asChild>
	<div style="max-width: 400px; display: flex; flex-direction: column; gap: 8px;">
		<JobItem job={mockJob} />
		<span style="font-size: 12px; color: #666;">Has UM badge</span>
	</div>
</Story>

<!-- Without Ultimate Mastery -->
<Story name="Without Ultimate Mastery" asChild>
	<div style="max-width: 400px; display: flex; flex-direction: column; gap: 8px;">
		<JobItem job={mockJobNoUM} />
		<span style="font-size: 12px; color: #666;">No UM badge</span>
	</div>
</Story>

<!-- Multi Proficiency -->
<Story name="Multi Proficiency" asChild>
	<div style="max-width: 400px; display: flex; flex-direction: column; gap: 8px;">
		<JobItem job={mockJobMultiProf} />
		<span style="font-size: 12px; color: #666;">Shows multiple proficiency icons</span>
	</div>
</Story>

<!-- Job List -->
<Story name="Job List" asChild>
	<div style="max-width: 400px; display: flex; flex-direction: column; gap: 8px;">
		<JobItem
			job={mockJob}
			selected={selectedJob === mockJob.id}
			onClick={() => (selectedJob = mockJob.id)}
		/>
		<JobItem
			job={mockJobNoUM}
			selected={selectedJob === mockJobNoUM.id}
			onClick={() => (selectedJob = mockJobNoUM.id)}
		/>
		<JobItem
			job={mockJobMultiProf}
			selected={selectedJob === mockJobMultiProf.id}
			onClick={() => (selectedJob = mockJobMultiProf.id)}
		/>
	</div>
</Story>

<!-- Interactive Selection -->
<Story name="Interactive Selection" asChild>
	<div style="max-width: 400px; display: flex; flex-direction: column; gap: 8px;">
		<p style="font-size: 12px; color: #666; margin-bottom: 8px;">Click to select a job</p>
		<JobItem
			job={mockJob}
			selected={interactiveSelected === 'job-1'}
			onClick={() => (interactiveSelected = 'job-1')}
		/>
		<JobItem
			job={mockJobNoUM}
			selected={interactiveSelected === 'job-2'}
			onClick={() => (interactiveSelected = 'job-2')}
		/>
		<JobItem
			job={mockJobMultiProf}
			selected={interactiveSelected === 'job-3'}
			onClick={() => (interactiveSelected = 'job-3')}
		/>
		<p style="font-size: 12px; margin-top: 8px;">
			Selected: {interactiveSelected ? `Job ${interactiveSelected}` : 'None'}
		</p>
	</div>
</Story>
