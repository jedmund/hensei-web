import * as Awakening from './AwakeningTransformer'
import * as Character from './CharacterTransformer'

// Transforms API response to GridCharacter object
export function toObject(data: any): GridCharacter {
  return {
    id: data.id,
    object: Character.toObject(data.object),
    position: data.position,
    uncapLevel: data.uncap_level,
    transcendenceStep: data.transcendence_step ? data.transcendence_step : null,
    mastery: {
      overMastery: data.over_mastery
        ? data.over_mastery
        : [
            {
              modifier: 1,
              strength: 0,
            },
            {
              modifier: 2,
              strength: 0,
            },
            null,
            null,
          ],
      aetherialMastery: data.aetherial_mastery ? data.aetherial_mastery : null,
      awakening: {
        type: Awakening.toObject(data.awakening.type),
        level: data.awakening.level,
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
    uncapLevel: data.uncapLevel,
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
