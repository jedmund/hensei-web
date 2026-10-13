/**
 * Evoking Solomonis guidebook fixtures, copied from the lane board's
 * contract fixtures (guide-effects.json: all 101 known effects; party-run.json:
 * a run's `solomonis` object). API shape (snake_case), as the API emits it.
 */

import { snakeToCamel } from '$lib/api/schemas/transforms'
import type { GuideEffect, SolomonisExpedition } from '$lib/types/api/solomonis'

export const API = {
	guideEffects: {
		guide_effects: [
			{
				id: '920c5765-7cf4-574b-9e98-b0c1177d39c0',
				granblue_id: 1,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'ATK +20%',
					ja: null
				},
				icon_category: 1,
				icon_type: 1,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'affaf15f-00f8-595c-90a5-31aa50956594',
				granblue_id: 2,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Multiattack rate +20%',
					ja: null
				},
				icon_category: 1,
				icon_type: 2,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'c818063b-bd13-5df7-b495-72eccaba084c',
				granblue_id: 3,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Skill DMG +20% / Skill DMG cap +10%',
					ja: null
				},
				icon_category: 1,
				icon_type: 303,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '731d52f8-4f99-5835-8184-763a749439e6',
				granblue_id: 4,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'C.A. DMG +20% / C.A. DMG cap +10%',
					ja: null
				},
				icon_category: 1,
				icon_type: 305,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'dcfcaff7-2adc-5a9f-bf36-a34c785e258c',
				granblue_id: 5,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Chain burst DMG +50% / Chain burst DMG cap +30%',
					ja: null
				},
				icon_category: 1,
				icon_type: 307,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'e352fba6-aa70-5e4b-ac1d-e8f1093eb804',
				granblue_id: 6,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Special C.A. DMG cap +10%',
					ja: null
				},
				icon_category: 1,
				icon_type: 305,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '1ad72dfe-2fe5-52dc-8a11-60ac1d16e87c',
				granblue_id: 7,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'DMG cap +10%',
					ja: null
				},
				icon_category: 1,
				icon_type: 308,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '6a88286a-de40-5287-bad8-2f4d33f4228f',
				granblue_id: 8,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Elemental ATK +20%',
					ja: null
				},
				icon_category: 1,
				icon_type: 1,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '8564e154-5450-5271-aa8f-95d7b1f79443',
				granblue_id: 9,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Stamina',
					ja: null
				},
				icon_category: 1,
				icon_type: 3,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '9d7ce28d-3066-5573-a427-2d3acc64d514',
				granblue_id: 10,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Enmity',
					ja: null
				},
				icon_category: 1,
				icon_type: 4,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '4db0a1a3-f816-5fe2-8ef3-cc043b89c7bb',
				granblue_id: 11,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Critical hit rate +30%',
					ja: null
				},
				icon_category: 1,
				icon_type: 5,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '6005d5ad-0cb4-5c8b-8255-d2a59b74595a',
				granblue_id: 13,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Max HP +30%',
					ja: null
				},
				icon_category: 2,
				icon_type: 201,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '7abf267b-9ce2-5c85-8087-86f5b25aa04a',
				granblue_id: 14,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'DEF +30%',
					ja: null
				},
				icon_category: 2,
				icon_type: 101,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'c22aaf58-a728-595b-8750-dacf608bea91',
				granblue_id: 15,
				rarity: 'normal',
				stackable: true,
				name: {
					en: 'Healing specs +20%',
					ja: null
				},
				icon_category: 2,
				icon_type: 202,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'c75a1f76-676f-5908-8038-13d873e9a293',
				granblue_id: 17,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Bonus Elemental DMG effect (20%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 6,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'de8887ec-b45e-549b-a8ff-aceb8e181db2',
				granblue_id: 18,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Bonus Elemental C.A. DMG effect (20%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 7,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '9810f509-a5b6-5792-b7d6-644114fe15f2',
				granblue_id: 19,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Elemental Rigor effect (20%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 8,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'a4f64773-5361-5c02-aaa5-05a057785233',
				granblue_id: 20,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Amplify normal attack DMG +30%',
					ja: null
				},
				icon_category: 1,
				icon_type: 311,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '3e65b474-31a7-5948-bdfe-41484b8424e1',
				granblue_id: 21,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Amplify skill DMG +30%',
					ja: null
				},
				icon_category: 1,
				icon_type: 312,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '9b394d94-ece6-5016-9642-3e387c8f6ee6',
				granblue_id: 22,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Amplify C.A. DMG +30%',
					ja: null
				},
				icon_category: 1,
				icon_type: 313,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '63ade889-f40f-534d-a403-1889e9a8715d',
				granblue_id: 23,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Amplify chain DMG +100%',
					ja: null
				},
				icon_category: 1,
				icon_type: 314,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'c2e6f713-cc54-5d8d-abc5-75aed915e7ea',
				granblue_id: 24,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Elemental skill enhancement +60%',
					ja: null
				},
				icon_category: 3,
				icon_type: 9,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'a5f4fd27-3d18-5658-9b00-fca5397b0712',
				granblue_id: 25,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Mitigate DMG taken (500)',
					ja: null
				},
				icon_category: 2,
				icon_type: 101,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '4d455a33-b652-5653-a699-0e66c7db37d8',
				granblue_id: 27,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Regeneration (1000 HP)',
					ja: null
				},
				icon_category: 2,
				icon_type: 203,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'e1573495-dc28-53d6-869c-5b1365eeb49c',
				granblue_id: 28,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Charge bar gain +20%',
					ja: null
				},
				icon_category: 3,
				icon_type: 315,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '614e95ee-d1f6-58ce-b1fc-397d7e491aff',
				granblue_id: 29,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Uplift (10%)',
					ja: null
				},
				icon_category: 3,
				icon_type: 315,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '9fdfdeb9-bd7a-5ce6-84e9-a96d0c4691db',
				granblue_id: 30,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Number of summon calls per turn +1',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'ee1d0201-641a-5bc2-832d-cf1c31facf30',
				granblue_id: 31,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "Elemental DMG dealt will be treated as superior to the target's element (Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '72b9bc6d-5a0d-56f4-919a-797475d122c1',
				granblue_id: 32,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "Allies' attacks won't miss regardless of accuracy, foe dodge rates, Mirror Image effects, or similar (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '3c0a30d0-c3a0-53c8-8f6c-c45501133dff',
				granblue_id: 33,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Normal attack hit count +1',
					ja: null
				},
				icon_category: 1,
				icon_type: 10,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '2df5bb7f-4e84-57be-be28-99920253fe9b',
				granblue_id: 34,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "Amplify Human and Geonoid allies' DMG +30%",
					ja: null
				},
				icon_category: 1,
				icon_type: 310,
				target_type: 'race',
				target_values: [1, 7],
				character_id: null
			},
			{
				id: 'eddbb301-de62-53d3-884d-d4dc4bb66060',
				granblue_id: 35,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Normal attack hit count for Erune and Levleath allies +1',
					ja: null
				},
				icon_category: 1,
				icon_type: 10,
				target_type: 'race',
				target_values: [2, 8],
				character_id: null
			},
			{
				id: 'aad9f1e8-49b2-57e6-bf65-d8e9fa0dc79b',
				granblue_id: 36,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Bonus Elemental C.A. DMG effect to Draph and Grokkle allies (30%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 7,
				target_type: 'race',
				target_values: [3, 9],
				character_id: null
			},
			{
				id: '4716501c-91d8-5e1d-ab7b-68a4d75f6263',
				granblue_id: 37,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Bonus Elemental DMG effect to Harvin and Wolvir allies (30%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 6,
				target_type: 'race',
				target_values: [4, 10],
				character_id: null
			},
			{
				id: 'bac07c7d-d232-5bfc-b821-404a307bb07f',
				granblue_id: 38,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "Primal and Other allies' DMG cap +50%",
					ja: null
				},
				icon_category: 1,
				icon_type: 308,
				target_type: 'race',
				target_values: [5, 6],
				character_id: null
			},
			{
				id: '78be4185-ae40-54f1-b00b-393982499365',
				granblue_id: 39,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At battle start: Dodge/Tank-and-Counter effect to all allies (3 hits) (Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'fab3d844-0ab2-56e1-bfaa-7ceeeab3d677',
				granblue_id: 40,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "At battle start: 40% boost to all allies' charge bars",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '58b1cf01-e3ce-5428-b6c8-e8a1b91189f2',
				granblue_id: 41,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At battle start: 5 Crests to all allies (Type of Crest depends on their element) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '7dc2b20a-fd17-58f6-ac1d-2f9666c11204',
				granblue_id: 42,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At battle start: Undying effect to all allies (1 time) (Can't be stacked)",
					ja: null
				},
				icon_category: 2,
				icon_type: 102,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'd98cbde3-443e-58cd-96d4-196acfc598db',
				granblue_id: 43,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At battle start: C.A. Reactivation effect to all allies (1 time) (Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 304,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'd519b045-93be-5ecf-a753-6878197f4643',
				granblue_id: 44,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At battle start: Dispel Cancel effect (1 time) / Debuff immunity (1 time) (Can't be stacked)",
					ja: null
				},
				icon_category: 2,
				icon_type: 103,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '9f285f96-152e-5da6-8186-38b455267721',
				granblue_id: 45,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "Increase all allies' normal attack hit count based on number of cursed guidebooks held ({value} / Max: +10)",
					ja: null
				},
				icon_category: 1,
				icon_type: 10,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '3d79496f-cfb2-5f7b-8019-57756589c2c8',
				granblue_id: 46,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At end of turn: Chance to end cooldown for a random skill on each ally that didn't use a skill that turn (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'd55616e2-ded9-561d-9d41-edbb364ecea6',
				granblue_id: 47,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "When an ally uses a skill: Amplify caster's DMG based on the skill's cooldown (Max: 50% / Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '2832b907-569d-5bb7-8b39-557cd8e6d345',
				granblue_id: 48,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "At end of turn: Elemental DMG to a foe for each ally that didn't take DMG that turn (Hit number increases based on number of consecutive turns DMG wasn't taken [Max: 5])",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '6256e85e-bc6f-5a24-8689-ab8503a073d8',
				granblue_id: 49,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "Amplify MC's and SSR allies' DMG +10% / Amplify SR allies' DMG +100% / Amplify R allies' DMG +200%",
					ja: null
				},
				icon_category: 1,
				icon_type: 310,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '353cdfef-4e25-5070-b05b-cce8ac097711',
				granblue_id: 50,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'When an ally uses a damage skill: Plain DMG to a foe based on its current HP',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '638299e8-b6af-587c-ac36-e9e391a19cba',
				granblue_id: 51,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Sephira coin drop amount upon clearing battles +30%',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'c739b3e3-82f0-5e98-8509-7bbf6fb12c8d',
				granblue_id: 52,
				rarity: 'rare',
				stackable: true,
				name: {
					en: '20% miasma DMG reduction',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '2342551f-dae0-5e06-a102-cc0616a391f9',
				granblue_id: 53,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "1-turn cut to all allies' skill cooldowns after every 5 spaces moved ({value}/5 spaces)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'e12ebe6a-3125-56b6-8133-97686535e1b5',
				granblue_id: 54,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "When not entering battle for 3 spaces or more: Amplify all allies' DMG at start of next battle +50% / DMG Mitigation effect (2000) ({value}/3 spaces) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '94e48760-a751-570b-bac4-16ee9da1da13',
				granblue_id: 55,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Next obtained cursed guidebook effect is counteracted (Remaining uses: {value}/1)',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '89b20c0d-adc5-5a67-8696-615066540d9b',
				granblue_id: 56,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Gain a random guidebook effect when resting at a healing space',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '72e1c7fa-8d6d-55b8-b91c-ce2bb929969f',
				granblue_id: 57,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Upon obtaining a guidebook effect from a treasure chest space: Gain 1 additional guidebook effect (Remaining uses: {value}/2)',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '77e4f374-c7b5-5dcd-ab24-84e54e70b2bc',
				granblue_id: 58,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Upon reaching an event space: Obtain a random amount of Sephira coins',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '86bef29c-6db9-59b7-b5ad-fa98299e5a82',
				granblue_id: 59,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "Party members gain all weapons types as specialty weapons (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'd1f6a666-0407-52b6-8819-029c1a9e385a',
				granblue_id: 60,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "Party members gain all character types (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'ce7b2dc6-a421-5abf-9396-7775972462db',
				granblue_id: 61,
				rarity: 'rare',
				stackable: true,
				name: {
					en: 'Upon an ally using a debuff skill: 2 random debuffs to a foe',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '404cbcb4-6cc1-52e9-8ab4-6295ed00f8b5',
				granblue_id: 62,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "Chance for all allies' normal attacks, skill DMG, and charge attacks to miss / 100% boost to ATK / 50% boost to DMG cap",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '310db136-d82c-5ee6-bd2b-ab55421a0c22',
				granblue_id: 64,
				rarity: 'rare',
				stackable: true,
				name: {
					en: "C.A. Sealed effect to allies upon using their C.A. / Amplify N.A. DMG and skill DMG +20% / Skills and charge attacks won't consume charge bar (Excludes skills with 0 cooldown)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '5c8bc28b-d857-550c-beeb-3517de8336c3',
				granblue_id: 65,
				rarity: 'rare',
				stackable: true,
				name: {
					en: '50% hit to DMG dealt against foes appearing on battle spaces / Amplify DMG against foes appearing on strong foe, terrifying foe, ruler, and boss spaces +50%',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '4f71e053-6335-5ea3-9aa3-f9f369a532f5',
				granblue_id: 66,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "Boost to chance of obtaining rare guidebook effects upon clearing a battle (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'e3190e95-7132-5ee8-b4a4-af47449e7f79',
				granblue_id: 67,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "For every 3 skill uses by allies: First-position ally deals 3-hit elemental DMG to all foes / Hit to ATK and DEF (Stackable) / Amplify DMG taken (6 hits) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'b8fe43ee-8c8a-5f15-ad19-724f1b9f4e8a',
				granblue_id: 68,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "At end of turn: First-position ally deals elemental DMG to all foes / Blind effect / Supplement DMG taken / Remove 1 buff (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '664ef1b6-6049-5f38-9b1f-5c3227b05b20',
				granblue_id: 70,
				rarity: 'rare',
				stackable: false,
				name: {
					en: "Upon an ally attacking: Random debuff to a foe (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '7e21d279-80cf-5fdf-90ca-c6a56a4ba1c3',
				granblue_id: 73,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "20% DMG reduction (Can't be stacked)",
					ja: null
				},
				icon_category: 2,
				icon_type: 101,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'cf974def-1cef-58e7-b5b7-87789707ec7d',
				granblue_id: 74,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "2-turn reduction to skill cooldowns (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '9f12495b-9345-509d-92a3-1ccfbbed0fc7',
				granblue_id: 75,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "Upon an ally using a charge attack: 2-turn cut their skill cooldowns (Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'fca9d79e-34d0-5876-9775-42acdf8e486f',
				granblue_id: 76,
				rarity: 'unique',
				stackable: true,
				name: {
					en: '100% boost to special C.A. DMG cap',
					ja: null
				},
				icon_category: 1,
				icon_type: 305,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '2da20ea4-7d5c-591c-9f73-04a006ba2f99',
				granblue_id: 77,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "All allies have a maximum charge bar limit of 200% (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 315,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'e1f4f4f6-3d2b-5e75-b882-01fa658d3ae4',
				granblue_id: 79,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'Elemental skill enhancement +180%',
					ja: null
				},
				icon_category: 3,
				icon_type: 9,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '574b6ddf-f71e-58c4-a418-2936001de044',
				granblue_id: 80,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "Allies' DMG taken is converted to the element they have superiority against (Can't be stacked)",
					ja: null
				},
				icon_category: 2,
				icon_type: 104,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'ad029188-d63f-5da0-a29b-4dde1c2f05f5',
				granblue_id: 81,
				rarity: 'unique',
				stackable: false,
				name: {
					en: '"Can\'t recast" skills and "Can\'t resummon" summon calls become reusable again at the start of each battle (Can\'t be stacked)',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '695a739f-1a66-5822-ac73-1e503b6f8344',
				granblue_id: 83,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "Summon cooldowns become 1 turn (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '487e435f-4f7f-5ecd-84de-5bb1a9c087f3',
				granblue_id: 84,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "Chain bursts of over 4 chains change to Ultimate Nova (Ultimate Nova: Destruction DMG / Remove all buffs from foes / Counts as all elemental chain bursts) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'a5a8b730-d334-5d1d-a5ba-4d593c16ffa9',
				granblue_id: 85,
				rarity: 'unique',
				stackable: true,
				name: {
					en: "Amplify all allies' DMG based on total HP lost after this guidebook effect was obtained ({value} / Max: 100%)",
					ja: null
				},
				icon_category: 1,
				icon_type: 310,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '1f8de175-d4a4-5db6-b14b-5be047041a26',
				granblue_id: 86,
				rarity: 'unique',
				stackable: true,
				name: {
					en: "Amplify all allies' DMG based on number of times an event space was reached after this guidebook effect was obtained ({value} / Max: 100%)",
					ja: null
				},
				icon_category: 1,
				icon_type: 310,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'ee617525-1194-5d47-b1de-0347047dd7fd',
				granblue_id: 87,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'Obtain a random number of Sephira coins and 1 random guidebook effect upon clearing a battle',
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'b33d0683-e719-5ce5-9a4d-ce4f4aec1800',
				granblue_id: 88,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'Bonus Elemental DMG effect to sabre-, dagger-, spear-, axe-, or staff-specialty allies (50%) / Bonus Superior Elemental DMG effect (50%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: 'proficiency',
				target_values: [1, 2, 4, 3, 6],
				character_id: null
			},
			{
				id: 'be2be202-e25e-5a5c-b202-56c5bbac5d76',
				granblue_id: 89,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'Bonus Elemental C.A. DMG effect to gun-, melee-, bow-, harp-, or katana-specialty allies (50%) / Bonus Superior Elemental C.A. DMG effect (50%)',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: 'proficiency',
				target_values: [9, 7, 5, 8, 10],
				character_id: null
			},
			{
				id: '39ad0ca4-1410-538c-a1ef-15b73046e800',
				granblue_id: 90,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'Amplify DMG for allies with max HP above 24,999 +30% (Above 49,999: Bonus Elemental DMG effect [30%] / Above 99,999: Boost specs for the Bonus DMG and DMG amplify)',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '7db02bf7-3945-57a6-a60a-10c92aba7be3',
				granblue_id: 91,
				rarity: 'unique',
				stackable: true,
				name: {
					en: "From an ally's 2nd or higher attack each turn: Sharp boost to ATK / From the 3rd or higher attack: Bonus Superior Elemental DMG effect (100%)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'f823b0b2-86b7-5682-b25e-e3ca8b80a0a0',
				granblue_id: 92,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At the end of each turn allies dealt 100 hits of DMG: 2-turn cut to all allies' skill cooldowns (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '7ea685b6-8860-57e2-a97e-69d2adb46cdf',
				granblue_id: 93,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At end of turn when all allies' charge bars are at least 100%: Consume 100% of all allies' charge bars / First-position ally deals 10-hit elemental DMG to all foes (1000% total) (Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '87eccca6-2a51-5d15-99a7-4de44b40680c',
				granblue_id: 95,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'Upon attacking when all allies are almost knocked out: Increase number of times all allies do an attack +1',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '02c8ea97-0488-57c6-b747-33bfe6e33602',
				granblue_id: 96,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "Sharp hit to DEF / Autorevive (Keeps buffs / Once per battle) / Amplify DMG for each time an ally was knocked out after obtaining this effect ({value} / Max: 100%) (Can't be stacked)",
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'c608059f-27ad-594d-841b-b2a7db7cc036',
				granblue_id: 97,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At battle start: All allies' HP is reduced to 1 / Shield effect to each ally worth 500% of the HP they consumed (Can't be stacked)",
					ja: null
				},
				icon_category: 2,
				icon_type: 105,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '4476aa29-a72d-57be-b678-7b2d3c6e5f5d',
				granblue_id: 99,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'On Lake Area ruler spaces: Amplify DMG +30% / Bonus Earth DMG effect [20%] / Bonus Earth C.A. DMG effect [20%] / Lower requirements to cancel foe Omens',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '83e7c8c5-a73f-5d51-a24d-34b1697e8c77',
				granblue_id: 100,
				rarity: 'unique',
				stackable: true,
				name: {
					en: 'On Forest Area ruler spaces: Amplify DMG +30% / Bonus Wind DMG effect [20%] / Bonus Wind C.A. DMG effect [20%] / Lower requirements to cancel foe Omens',
					ja: null
				},
				icon_category: 1,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'aaccc206-2eb1-558e-a56f-06cdb3134687',
				granblue_id: 101,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "MC harbors the power of the Omnipotent (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'b83ff359-015b-518b-9929-31b0544a0137',
				granblue_id: 102,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At battle start (1st ally): Earth/wind DMG to foes / Hit to ATK, DEF, and M.A. rate / Bonus Earth DMG to allies / End of turn: Restore HP / 10% boost to charge bars (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '373d6e60-cc11-5d2e-afc0-400f930869f8',
				granblue_id: 104,
				rarity: 'unique',
				stackable: true,
				name: {
					en: "1-turn reduction to all allies' skill cooldowns / Heal all allies by 10% of max HP at battle start",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '810f8af1-048b-5889-98c2-bf2f76f68789',
				granblue_id: 105,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "To all allies for 2 turns after battle start: DMG immunity, debuff immunity, and buffs can't be removed (Can't be stacked)",
					ja: null
				},
				icon_category: 2,
				icon_type: 401,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '0aef7ae0-2ebb-5af4-9c53-c43d7dc5f593',
				granblue_id: 107,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At battle start: Fraux activates Strength Upright / End skill cooldowns / End cooldown for a damage skill after it is cast for 8 casts (Only if Fraux is a main ally) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: 'character',
				target_values: [3100],
				character_id: '128fb62e-dcb6-50fc-a541-bc1ee5188b9e'
			},
			{
				id: '150ee301-facc-5277-83e6-59712cf9553e',
				granblue_id: 108,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At battle start: Maria Theresa activates The Empress Upright / If all allies' HP is full before attacking: Sharp boost to all allies' ATK (1 time) (Only if Maria Theresa is a main ally) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: 'character',
				target_values: [3099],
				character_id: '40fc6669-e44e-5827-ba3f-2ac368e9048d'
			},
			{
				id: '159b22cb-2e00-5a6c-8def-3c85bbcc40f4',
				granblue_id: 115,
				rarity: 'unique',
				stackable: false,
				name: {
					en: "At battle start: Nier activates The Lovers Upright / Eternal Vow becomes useable again / When Nier and MC are main allies before attacking: Double Strike effect to both (Only if Nier is a main ally) (Can't be stacked)",
					ja: null
				},
				icon_category: 3,
				icon_type: 401,
				target_type: 'character',
				target_values: [3108],
				character_id: 'c816c582-b04a-5173-982b-fa833919f4e6'
			},
			{
				id: '07dff4da-4dff-583e-8309-b7561fe2b677',
				granblue_id: 116,
				rarity: 'cursed',
				stackable: true,
				name: {
					en: 'At end of turn: Random debuffs to each ally',
					ja: null
				},
				icon_category: 4,
				icon_type: 501,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '6a8ec4a1-93cd-5afe-a634-df469c8a57f6',
				granblue_id: 120,
				rarity: 'cursed',
				stackable: true,
				name: {
					en: 'Chance of 1-turn extension to skill cooldowns for all allies at end of turn',
					ja: null
				},
				icon_category: 4,
				icon_type: 501,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '83884f28-3bdd-5889-81ce-635ee244725d',
				granblue_id: 122,
				rarity: 'cursed',
				stackable: false,
				name: {
					en: "At battle start: DMG immunity to foe (30 hits) (Can't be stacked)",
					ja: null
				},
				icon_category: 4,
				icon_type: 501,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: 'cf8db31b-3d97-52bd-8dcb-290021b8c4b8',
				granblue_id: 123,
				rarity: 'cursed',
				stackable: false,
				name: {
					en: "Foes' attacks and debuffs can't miss (Can't be stacked)",
					ja: null
				},
				icon_category: 4,
				icon_type: 501,
				target_type: null,
				target_values: [],
				character_id: null
			},
			{
				id: '0d058a11-58f6-50f4-89e9-25c0b310cd10',
				granblue_id: 124,
				rarity: 'cursed',
				stackable: false,
				name: {
					en: "Become weak to all elements (Can't be stacked)",
					ja: null
				},
				icon_category: 4,
				icon_type: 501,
				target_type: null,
				target_values: [],
				character_id: null
			}
		]
	},
	runSolomonis: {
		route_evoker: {
			id: 'c816c582-b04a-5173-982b-fa833919f4e6',
			granblue_id: '3040169000',
			name: {
				en: 'Nier',
				ja: 'ニーア'
			},
			element: 5
		},
		zone: {
			id: 'bf7cd555-ac37-569c-91f4-f9836d04f695',
			slug: 'allotropic-microcosm',
			name: {
				en: 'Allotropic Microcosm',
				ja: null
			}
		},
		pledge_level: 0,
		outcome: 'cleared',
		game_report_id: 381099,
		ended_at: '2026-10-11T16:38:00+09:00',
		stats: {
			battle: 14,
			strong: 0,
			terrifying: 0,
			ruler: 0,
			boss: 2,
			event: 20,
			healing: 6,
			chest: 5,
			teleporter: 0,
			special: 1,
			shop_purchases: 18,
			points_earned: 2924
		},
		blessing_cost_limit: 100,
		blessing_cost_total: 50,
		blessings: [
			{
				blessing: {
					id: '43e4bc59-4585-512a-b9eb-ae83eb6109b8',
					slug: 'justice',
					arcana_number: 11,
					name: {
						en: 'Justice',
						ja: null
					}
				},
				level_id: '4bffc53c-442a-5299-b049-2988981e8ff3',
				level: 3,
				cost: 50
			}
		],
		guidebook: [
			{
				effect: {
					id: 'cf974def-1cef-58e7-b5b7-87789707ec7d',
					granblue_id: 74,
					rarity: 'unique',
					stackable: false,
					name: {
						en: "2-turn reduction to skill cooldowns (Can't be stacked)",
						ja: null
					},
					icon_category: 3,
					icon_type: 401,
					target_type: null,
					target_values: [],
					character_id: null
				},
				count: 1,
				display_value: null,
				acquired_order: null,
				inherited: false,
				note: null
			},
			{
				effect: {
					id: 'a5a8b730-d334-5d1d-a5ba-4d593c16ffa9',
					granblue_id: 85,
					rarity: 'unique',
					stackable: true,
					name: {
						en: "Amplify all allies' DMG based on total HP lost after this guidebook effect was obtained ({value} / Max: 100%)",
						ja: null
					},
					icon_category: 1,
					icon_type: 310,
					target_type: null,
					target_values: [],
					character_id: null
				},
				count: 1,
				display_value: '100%',
				acquired_order: null,
				inherited: false,
				note: null
			},
			{
				effect: {
					id: 'b33d0683-e719-5ce5-9a4d-ce4f4aec1800',
					granblue_id: 88,
					rarity: 'unique',
					stackable: true,
					name: {
						en: 'Bonus Elemental DMG effect to sabre-, dagger-, spear-, axe-, or staff-specialty allies (50%) / Bonus Superior Elemental DMG effect (50%)',
						ja: null
					},
					icon_category: 1,
					icon_type: 401,
					target_type: 'proficiency',
					target_values: [1, 2, 4, 3, 6],
					character_id: null
				},
				count: 1,
				display_value: null,
				acquired_order: null,
				inherited: false,
				note: null
			},
			{
				effect: {
					id: '4716501c-91d8-5e1d-ab7b-68a4d75f6263',
					granblue_id: 37,
					rarity: 'rare',
					stackable: true,
					name: {
						en: 'Bonus Elemental DMG effect to Harvin and Wolvir allies (30%)',
						ja: null
					},
					icon_category: 1,
					icon_type: 6,
					target_type: 'race',
					target_values: [4, 10],
					character_id: null
				},
				count: 2,
				display_value: null,
				acquired_order: null,
				inherited: false,
				note: null
			},
			{
				effect: {
					id: '72e1c7fa-8d6d-55b8-b91c-ce2bb929969f',
					granblue_id: 57,
					rarity: 'rare',
					stackable: true,
					name: {
						en: 'Upon obtaining a guidebook effect from a treasure chest space: Gain 1 additional guidebook effect (Remaining uses: {value}/2)',
						ja: null
					},
					icon_category: 3,
					icon_type: 401,
					target_type: null,
					target_values: [],
					character_id: null
				},
				count: 1,
				display_value: '0',
				acquired_order: null,
				inherited: false,
				note: null
			},
			{
				effect: {
					id: '1ad72dfe-2fe5-52dc-8a11-60ac1d16e87c',
					granblue_id: 7,
					rarity: 'normal',
					stackable: true,
					name: {
						en: 'DMG cap +10%',
						ja: null
					},
					icon_category: 1,
					icon_type: 308,
					target_type: null,
					target_values: [],
					character_id: null
				},
				count: 6,
				display_value: null,
				acquired_order: null,
				inherited: false,
				note: null
			},
			{
				effect: {
					id: '731d52f8-4f99-5835-8184-763a749439e6',
					granblue_id: 4,
					rarity: 'normal',
					stackable: true,
					name: {
						en: 'C.A. DMG +20% / C.A. DMG cap +10%',
						ja: null
					},
					icon_category: 1,
					icon_type: 305,
					target_type: null,
					target_values: [],
					character_id: null
				},
				count: 5,
				display_value: null,
				acquired_order: null,
				inherited: false,
				note: null
			}
		]
	}
}

/** The fixtures as the app sees them, after the adapter's camelCase transform. */
export const EXPECTED = {
	guideEffects: snakeToCamel(API.guideEffects.guide_effects) as unknown as GuideEffect[],
	runSolomonis: snakeToCamel(API.runSolomonis) as unknown as SolomonisExpedition
}
