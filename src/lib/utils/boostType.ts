/**
 * Human-readable labels for weapon-skill `boost_type` keys.
 *
 * The raw keys are internal, underscore-delimited abbreviations (e.g. `ca_dmg_cap`,
 * `elem_amplify`, `na_supp_sp`). Rather than hand-maintain a full name for every
 * combination — which flattens distinctions the data intentionally keeps (e.g. the
 * `_sp` "separate multiplier" variants) — we humanize by token:
 *   - standard GBF acronyms are uppercased (CA, NA, DMG, ATK, …)
 *   - known words are expanded (amp → Amplify, supp → Supplemental, …)
 *   - anything unrecognized is title-cased, so new keys still render cleanly.
 *
 * `BOOST_TYPE_OVERRIDES` covers the handful where a fully spelled-out name reads
 * clearly better than token expansion.
 */

const BOOST_TYPE_OVERRIDES: Record<string, string> = {
	da: 'Double Attack',
	ta: 'Triple Attack',
	critical: 'Critical Rate',
	crit_amp: 'Critical Amplify',
	enmity: 'Enmity',
	stamina: 'Stamina',
	shield: 'Shield',
	rigor: 'Rigor',
	charge_gain: 'Charge Bar Gain',
	def_ignore: 'DEF Ignore',
	hp_cut: 'HP Cut',
	hp_fixed: 'Fixed HP',
	debuff_res: 'Debuff Resistance',
	turn_dmg: 'Damage per Turn',
	omega_exalto: 'Omega Exalto',
	optimus_exalto: 'Optimus Exalto',
	elem_amplify: 'Elemental Amplify',
	elem_reduc: 'Elemental Reduction',
	e_atk: 'Elemental ATK',
	e_atk_prog: 'Elemental ATK (Progression)',
	dmg_cap_arc: 'Damage Cap (Arcarum)',
	dmg_amp_non_elem: 'Non-Elemental Damage Amplify'
}

// Per-token expansion. Acronyms map to uppercase; words map to their expanded form.
const TOKEN_LABELS: Record<string, string> = {
	ca: 'CA',
	na: 'NA',
	cb: 'Chain Burst',
	fc: 'Full Chain',
	od: 'Overdrive',
	hp: 'HP',
	atk: 'ATK',
	def: 'DEF',
	ex: 'EX',
	da: 'DA',
	ta: 'TA',
	sp: 'Sp.',
	dmg: 'DMG',
	amp: 'Amplify',
	amplify: 'Amplify',
	supp: 'Supplemental',
	cap: 'Cap',
	elem: 'Elemental',
	reduc: 'Reduction',
	res: 'Resistance',
	prog: 'Progression',
	arc: 'Arcarum',
	des: 'Destruction',
	single: '(Single)',
	bonus: 'Bonus',
	heal: 'Heal',
	skill: 'Skill',
	counter: 'Counter',
	crit: 'Crit',
	turn: 'Turn'
}

/** Convert a raw boost_type key to a human-readable label. */
export function getBoostTypeLabel(key: string): string {
	if (BOOST_TYPE_OVERRIDES[key]) return BOOST_TYPE_OVERRIDES[key]
	return key
		.split(/[_\s]+/)
		.map((token) => TOKEN_LABELS[token] ?? token.charAt(0).toUpperCase() + token.slice(1))
		.join(' ')
}
