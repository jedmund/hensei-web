import * as Summon from './SummonTransformer'

// Transforms API response to GridSummon object
export function toObject(data: any): GridSummon {
  return {
    id: data.id,
    object: Summon.toObject(data.object),
    position: data.position,
    main: data.main,
    friend: data.friend,
    uncapLevel: data.uncap_level,
    transcendenceStep: data.transcendence_step ? data.transcendence_step : null,
    quickSummon: data.quick_summon,
  }
}

// Transforms User object into API parameters
export function toParams(data: GridSummon): GridSummonParams {
  return {
    summon_id: data.id,
    position: data.position,
    uncapLevel: data.uncapLevel,
    transcendence_step: data.transcendenceStep,
    quick_summon: data.quickSummon,
  }
}
