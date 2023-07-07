import * as Character from './CharacterTransformer'

// Transforms API response to GridCharacter object
export function toObject(data: any): GridCharacter {
  return {
    id: data.id,
    object: Character.toObject(data.object),
    position: data.position,
    uncapLevel: data.uncap_level,
    transcendenceStep: data.transcendence_step,
    mastery: {
      overMastery: data.over_mastery,
      aetherialMastery: data.aetherial_mastery,
      awakening: {
        type: Awakening.toObject(data.awakening.type),
        level: data.awakening.awakening_level,
      },
      perpetuity: data.perpetuity,
    },
  }
}

// Transforms User object into API parameters
export function toParams(data: GridCharacter): GridCharacterParams {
  return {
    character_id: data.id,
    position: data.position,
    uncap_level: data.uncapLevel,
    transcendence_step: data.transcendenceStep,
    ring1: data.mastery.overMastery[1],
    ring2: data.mastery.overMastery[2],
    ring3: data.mastery.overMastery[3],
    ring4: data.mastery.overMastery[4],
    earring: data.mastery.aetherialMastery,
    awakening_id: data.mastery.awakening.type.id,
    awakening_level: data.mastery.awakening.level,
    perpetuity: data.mastery.perpetuity,
  }
}
