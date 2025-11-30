<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte';

	const { Story } = defineMeta({
		title: 'Components/Game/UncapIndicator',
		component: UncapIndicator,
		tags: ['autodocs'],
		argTypes: {
			type: {
				control: 'select',
				options: ['character', 'weapon', 'summon'],
				description: 'Type of unit'
			},
			uncapLevel: {
				control: { type: 'range', min: 0, max: 6, step: 1 },
				description: 'Current uncap level (number of filled stars)'
			},
			transcendenceStage: {
				control: { type: 'range', min: 0, max: 5, step: 1 },
				description: 'Transcendence stage (0-5)',
				if: { arg: 'transcendence', eq: true }
			},
			flb: {
				control: 'boolean',
				description: 'Has FLB (4th star available)'
			},
			ulb: {
				control: 'boolean',
				description: 'Has ULB (5th star available)',
				if: { arg: 'flb', eq: true }
			},
			transcendence: {
				control: 'boolean',
				description: 'Has transcendence (6th star available)',
				if: { arg: 'ulb', eq: true }
			},
			special: {
				control: 'boolean',
				description: 'Special character (Story SRs - 3 base stars)',
				if: { arg: 'type', eq: 'character' }
			},
			editable: {
				control: 'boolean',
				description: 'Allow interactive editing'
			}
		}
	});
</script>

<script>
	let editableUncap = $state(2);
	let editableTrans = $state(0);
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ type: 'character', uncapLevel: 4 }} />

<!-- Character - MLB (4 stars) -->
<Story name="Character - MLB" args={{ type: 'character', uncapLevel: 4 }} />

<!-- Character - FLB (5 stars) -->
<Story name="Character - FLB" args={{ type: 'character', flb: true, uncapLevel: 5 }} />

<!-- Character - With Transcendence -->
<Story name="Character - Transcendence" args={{ type: 'character', flb: true, ulb: true, transcendence: true, uncapLevel: 5, transcendenceStage: 3 }} />

<!-- Character - Special (Story SRs) -->
<Story name="Character - Special (Story SR)" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">3★ MLB:</span>
			<UncapIndicator type="character" special uncapLevel={3} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">4★ FLB:</span>
			<UncapIndicator type="character" special flb uncapLevel={4} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">5★ ULB:</span>
			<UncapIndicator type="character" special flb ulb uncapLevel={5} />
		</div>
	</div>
</Story>

<!-- Weapon - All Stages -->
<Story name="Weapon - All Stages" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">3★ MLB:</span>
			<UncapIndicator type="weapon" uncapLevel={3} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">4★ FLB:</span>
			<UncapIndicator type="weapon" flb uncapLevel={4} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">5★ ULB:</span>
			<UncapIndicator type="weapon" flb ulb uncapLevel={5} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">6★ Transcendence:</span>
			<UncapIndicator type="weapon" flb ulb transcendence uncapLevel={5} transcendenceStage={5} />
		</div>
	</div>
</Story>

<!-- Summon - All Stages -->
<Story name="Summon - All Stages" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">3★ MLB:</span>
			<UncapIndicator type="summon" uncapLevel={3} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">4★ FLB:</span>
			<UncapIndicator type="summon" flb uncapLevel={4} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">5★ ULB:</span>
			<UncapIndicator type="summon" flb ulb uncapLevel={5} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 150px; font-size: 12px;">6★ Transcendence:</span>
			<UncapIndicator type="summon" flb ulb transcendence uncapLevel={5} transcendenceStage={5} />
		</div>
	</div>
</Story>

<!-- Partially Uncapped -->
<Story name="Partially Uncapped" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">0/4:</span>
			<UncapIndicator type="character" uncapLevel={0} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">1/4:</span>
			<UncapIndicator type="character" uncapLevel={1} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">2/4:</span>
			<UncapIndicator type="character" uncapLevel={2} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">3/4:</span>
			<UncapIndicator type="character" uncapLevel={3} />
		</div>
		<div style="display: flex; align-items: center; gap: 8px;">
			<span style="width: 100px; font-size: 12px;">4/4:</span>
			<UncapIndicator type="character" uncapLevel={4} />
		</div>
	</div>
</Story>

<!-- Transcendence Stages -->
<Story name="Transcendence Stages" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		{#each [0, 1, 2, 3, 4, 5] as stage}
			<div style="display: flex; align-items: center; gap: 8px;">
				<span style="width: 100px; font-size: 12px;">Stage {stage}:</span>
				<UncapIndicator type="weapon" flb ulb transcendence uncapLevel={5} transcendenceStage={stage} />
			</div>
		{/each}
	</div>
</Story>

<!-- Editable -->
<Story name="Editable" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<p style="font-size: 12px; color: #666;">Click stars to change uncap level</p>
		<UncapIndicator
			type="weapon"
			flb
			ulb
			transcendence
			uncapLevel={editableUncap}
			transcendenceStage={editableTrans}
			editable
			updateUncap={(level) => (editableUncap = level)}
			updateTranscendence={(stage) => (editableTrans = stage)}
		/>
		<p style="font-size: 12px;">
			Current: {editableUncap}★ / Transcendence: {editableTrans}
		</p>
	</div>
</Story>

