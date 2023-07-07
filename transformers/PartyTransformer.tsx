import * as Grid from './GridTransformer'
import * as Guidebook from './GuidebookTransformer'
import * as Job from './JobTransformer'
import * as JobAccessory from './JobAccessoryTransformer'
import * as JobSkill from './JobSkillTransformer'
import * as Raid from './RaidTransformer'
import * as User from './UserTransformer'

// Transforms API response to Party object
export function toObject(data: any): Party {
  return {
    id: data.id,
    localId: data.local_id,
    name: data.name,
    description: data.description,
    shortcode: data.shortcode,
    user: User.toObject(data.user),
    editable: data.editable ?? false,
    grid: Grid.toObject({
      characters: data.characters,
      summons: data.summons,
      weapons: data.weapons,
    }),
    details: {
      extra: data.extra,
      fullAuto: data.full_auto,
      autoGuard: data.auto_guard,
      autoSummon: data.auto_summon,
      chargeAttack: data.charge_attack,
      clearTime: data.clear_time,
      buttonCount: data.button_count,
      turnCount: data.turn_count,
      chainCount: data.chain_count,
    },
    protagonist: {
      job: data.job && Job.toObject(data.job),
      skills: {
        0: data.job_skills[0] && JobSkill.toObject(data.job_skills[0]),
        1: data.job_skills[1] && JobSkill.toObject(data.job_skills[1]),
        2: data.job_skills[2] && JobSkill.toObject(data.job_skills[2]),
        3: data.job_skills[3] && JobSkill.toObject(data.job_skills[3]),
      },
      masterLevel: data.master_level,
      ultimateMastery: data.ultimate_mastery,
      accessory: data.accessory && JobAccessory.toObject(data.accessory),
    },
    social: {
      favorited: data.favorited,
      remix: data.remix,
      remixes: data.remixes.map((remix: any) => toObject(remix)),
      sourceParty: data.source_party && toObject(data.source_party),
    },
    timestamps: {
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    raid: data.raid && Raid.toObject(data.raid),
    guidebooks: {
      0: data.guidebooks[1] && Guidebook.toObject(data.guidebooks[1]),
      1: data.guidebooks[2] && Guidebook.toObject(data.guidebooks[2]),
      2: data.guidebooks[3] && Guidebook.toObject(data.guidebooks[3]),
    },
  }
}

// Transforms Party object into API parameters
export function toParams(party: Party): PartyParams {
  return {
    local_id: party.localId,
    name: party.name,
    description: party.description,
    extra: party.details.extra,
    full_auto: party.details.fullAuto,
    auto_guard: party.details.autoGuard,
    auto_summon: party.details.autoSummon,
    charge_attack: party.details.chargeAttack,
    clear_time: party.details.clearTime,
    button_count: party.details.buttonCount,
    turn_count: party.details.turnCount,
    chain_count: party.details.chainCount,
    raid_id: party.raid?.id,
    job_id: party.protagonist.job?.id,
    master_level: party.protagonist.masterLevel,
    ultimate_mastery: party.protagonist.ultimateMastery,
    guidebook1_id: party.guidebooks[0]?.id,
    guidebook2_id: party.guidebooks[1]?.id,
    guidebook3_id: party.guidebooks[2]?.id,
  } as PartyParams
}
