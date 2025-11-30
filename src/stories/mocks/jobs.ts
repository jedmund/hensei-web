import type { Job } from '$lib/types/api/job';

/** Mock job data for Storybook stories */
export const mockJob: Job = {
	id: 'job-1',
	granblueId: '180001',
	name: { en: 'Lumberjack', ja: 'ランバージャック' },
	proficiency: [3], // Axe
	row: 5,
	ultimateMastery: true
};

export const mockJobNoUM: Job = {
	id: 'job-2',
	granblueId: '100001',
	name: { en: 'Dark Fencer', ja: 'ダークフェンサー' },
	proficiency: [1, 2], // Sword, Dagger
	row: 3,
	ultimateMastery: false
};

export const mockJobMultiProf: Job = {
	id: 'job-3',
	granblueId: '180101',
	name: { en: 'Kengo', ja: 'ケンゴウ' },
	proficiency: [1, 2], // Sword, Katana
	row: 5,
	ultimateMastery: true
};

/** Jobs organized by row/tier */
export const mockJobsByRow = {
	row1: { ...mockJob, id: 'job-row1', granblueId: '100001', row: 1, ultimateMastery: false },
	row2: { ...mockJob, id: 'job-row2', granblueId: '110001', row: 2, ultimateMastery: false },
	row3: { ...mockJob, id: 'job-row3', granblueId: '120001', row: 3, ultimateMastery: false },
	row4: { ...mockJob, id: 'job-row4', granblueId: '130001', row: 4, ultimateMastery: true },
	row5: { ...mockJob, id: 'job-row5', granblueId: '180001', row: 5, ultimateMastery: true }
};
