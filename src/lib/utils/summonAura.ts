import { m } from '$lib/paraglide/messages'
import type { SummonAura } from '$lib/types/api/entities'

/** The tier an aura row belongs to: "Base", "MLB", "FLB", "ULB" or "T{n}" for a transcendence stage. */
export function summonAuraTierLabel(aura: SummonAura): string {
	if (aura.transcendenceStage > 0) {
		return m.weapon_skills_tier_transcendence({ n: aura.transcendenceStage })
	}
	switch (aura.uncapLevel) {
		case 0:
			return m.weapon_skills_tier_base()
		case 3:
			return m.aura_tier_mlb()
		case 4:
			return m.weapon_skills_tier_flb()
		case 5:
			return m.weapon_skills_tier_ulb()
		default:
			return `${aura.uncapLevel}★`
	}
}
