const DEFAULT_FULL_AUTO = -1
const DEFAULT_AUTO_GUARD = -1
const DEFAULT_CHARGE_ATTACK = -1
const DEFAULT_MIN_CHARACTERS = 2
const DEFAULT_MIN_WEAPONS = 5
const DEFAULT_MIN_SUMMONS = 2
const DEFAULT_NAME_QUALITY = true
const DEFAULT_USER_QUALITY = true
const DEFAULT_ORIGINAL_ONLY = false

export const defaultFilterset: FilterSet = {
  full_auto: DEFAULT_FULL_AUTO,
  auto_guard: DEFAULT_AUTO_GUARD,
  charge_attack: DEFAULT_CHARGE_ATTACK,
  characters_count: DEFAULT_MIN_CHARACTERS,
  weapons_count: DEFAULT_MIN_WEAPONS,
  summons_count: DEFAULT_MIN_SUMMONS,
  name_quality: DEFAULT_NAME_QUALITY,
  user_quality: DEFAULT_USER_QUALITY,
  original: DEFAULT_ORIGINAL_ONLY,
}

export const permissiveFilterset: FilterSet = {
  full_auto: -1,
  auto_guard: -1,
  charge_attack: -1,
  characters_count: 0,
  weapons_count: 0,
  summons_count: 0,
  name_quality: false,
  user_quality: false,
  original: false,
}
