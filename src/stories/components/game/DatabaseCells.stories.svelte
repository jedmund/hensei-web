<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CharacterImageCell from '$lib/components/database/cells/CharacterImageCell.svelte';
	import WeaponImageCell from '$lib/components/database/cells/WeaponImageCell.svelte';
	import SummonImageCell from '$lib/components/database/cells/SummonImageCell.svelte';
	import ElementCell from '$lib/components/database/cells/ElementCell.svelte';
	import ProficiencyCell from '$lib/components/database/cells/ProficiencyCell.svelte';
	import CharacterUncapCell from '$lib/components/database/cells/CharacterUncapCell.svelte';
	import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte';
	import SummonUncapCell from '$lib/components/database/cells/SummonUncapCell.svelte';

	const { Story } = defineMeta({
		title: 'Components/Game/Database Cells',
		tags: ['autodocs']
	});

	// Mock row data for cells
	const mockCharacterRow = {
		granblueId: '3040000000',
		name: { en: 'Narmaya', ja: 'ナルメア' },
		element: 5, // Dark
		proficiency: [1, 2], // Sabre, Dagger
		special: false,
		uncap: { flb: true, ulb: true, transcendence: true }
	};

	const mockSpecialCharacterRow = {
		granblueId: '3040100000',
		name: { en: 'Cagliostro', ja: 'カリオストロ' },
		element: 4, // Earth
		proficiency: [5], // Staff
		special: true,
		uncap: { flb: true, ulb: true }
	};

	const mockWeaponRow = {
		granblueId: '1040000000',
		name: { en: 'Sword of Bahamut', ja: 'バハムートソード' },
		element: 5, // Dark
		proficiency: 1, // Sabre
		rarity: 3,
		uncap: { flb: true, ulb: true, transcendence: true }
	};

	const mockSummonRow = {
		granblueId: '2040001000',
		name: { en: 'Bahamut', ja: 'バハムート' },
		element: 5, // Dark
		rarity: 3,
		uncap: { flb: true, ulb: true, transcendence: true }
	};

	// All elements for comparison
	const elements = [
		{ id: 1, name: 'Wind' },
		{ id: 2, name: 'Fire' },
		{ id: 3, name: 'Water' },
		{ id: 4, name: 'Earth' },
		{ id: 5, name: 'Dark' },
		{ id: 6, name: 'Light' }
	];

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
	];
</script>

<!-- Character Image Cell -->
<Story name="Character Image Cell">
	<div
		style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; height: 80px;"
	>
		<CharacterImageCell row={mockCharacterRow} />
	</div>
</Story>

<!-- Weapon Image Cell -->
<Story name="Weapon Image Cell">
	<div
		style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; height: 80px;"
	>
		<WeaponImageCell row={mockWeaponRow} />
	</div>
</Story>

<!-- Summon Image Cell -->
<Story name="Summon Image Cell">
	<div
		style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; height: 80px;"
	>
		<SummonImageCell row={mockSummonRow} />
	</div>
</Story>

<!-- Element Cells -->
<Story name="Element Cell - All Elements">
	<div
		style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; height: 60px; align-items: center;"
	>
		{#each elements as el}
			<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
				<ElementCell row={{ element: el.id }} />
				<span style="font-size: 10px; color: #666;">{el.name}</span>
			</div>
		{/each}
	</div>
</Story>

<!-- Proficiency Cell -->
<Story name="Proficiency Cell - All Types">
	<div
		style="display: flex; flex-wrap: wrap; gap: 12px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
	>
		{#each proficiencies as prof}
			<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
				<ProficiencyCell row={{ proficiency: [prof.id] }} />
				<span style="font-size: 10px; color: #666;">{prof.name}</span>
			</div>
		{/each}
	</div>
</Story>

<!-- Character Uncap Cell -->
<Story name="Character Uncap Cell">
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">Regular FLB:</span>
			<CharacterUncapCell row={{ uncap: { flb: true }, special: false }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">Regular ULB:</span>
			<CharacterUncapCell row={{ uncap: { flb: true, ulb: true }, special: false }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">Transcendence:</span>
			<CharacterUncapCell
				row={{ uncap: { flb: true, ulb: true, transcendence: true }, special: false }}
			/>
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">Special ULB:</span>
			<CharacterUncapCell row={{ uncap: { flb: true, ulb: true }, special: true }} />
		</div>
	</div>
</Story>

<!-- Weapon Uncap Cell -->
<Story name="Weapon Uncap Cell">
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">MLB (3★):</span>
			<WeaponUncapCell row={{ uncap: {}, rarity: 3 }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">FLB (4★):</span>
			<WeaponUncapCell row={{ uncap: { flb: true }, rarity: 3 }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">ULB (5★):</span>
			<WeaponUncapCell row={{ uncap: { flb: true, ulb: true }, rarity: 3 }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">Transcendence:</span>
			<WeaponUncapCell row={{ uncap: { flb: true, ulb: true, transcendence: true }, rarity: 3 }} />
		</div>
	</div>
</Story>

<!-- Summon Uncap Cell -->
<Story name="Summon Uncap Cell">
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">MLB (3★):</span>
			<SummonUncapCell row={{ uncap: {}, rarity: 3 }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">FLB (4★):</span>
			<SummonUncapCell row={{ uncap: { flb: true }, rarity: 3 }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">ULB (5★):</span>
			<SummonUncapCell row={{ uncap: { flb: true, ulb: true }, rarity: 3 }} />
		</div>
		<div
			style="display: flex; gap: 16px; background: #f5f5f5; padding: 16px; border-radius: 8px; align-items: center;"
		>
			<span style="width: 100px; font-size: 12px; color: #666;">Transcendence:</span>
			<SummonUncapCell row={{ uncap: { flb: true, ulb: true, transcendence: true }, rarity: 3 }} />
		</div>
	</div>
</Story>

