/**
 * The aliases gbf.wiki's team templates accept, shared by the TeamSpread
 * export (`wikiExport.ts`) and import (`wikiImport.ts`). Each entry lists
 * every alias the wiki accepts; the first is the one the export writes.
 */

/** TeamSpread parameters that take weapon keys, one set per series. */
export type KeyParam = 'opus' | 'ultima' | 'draconic' | 'destroyer' | 'ccw'

export const KEY_PARAMS: KeyParam[] = ['opus', 'ultima', 'draconic', 'destroyer', 'ccw']

interface KeyAliases {
	granblueId: number
	aliases: string[]
}

/**
 * Weapon keys by TeamSpread parameter and key slot, from Module:WeaponGrid.
 * The module lowercases the value, splits it on commas and reads each skill
 * slot by position, so a key's slot is its position in the list. Destroyer and
 * Class Champion take a single value.
 *
 * Two of the module's Ultima aliases are typos that render nothing on the
 * wiki (`plenum = 'a4,'`, `arcanum = 'ougi'`); they're kept here for what they
 * clearly mean, Plenum and Arcanum.
 */
export const KEY_ALIASES: Record<KeyParam, KeyAliases[][]> = {
	// Dark Opus: Pendulums (skill 2) and Pendulums/Chains (skill 3)
	opus: [
		[
			{ granblueId: 13001, aliases: ['auto', 'alpha'] },
			{ granblueId: 13002, aliases: ['skill', 'beta'] },
			{ granblueId: 13003, aliases: ['ca', 'gamma', 'ougi'] },
			{ granblueId: 13004, aliases: ['cb', 'delta'] }
		],
		[
			{ granblueId: 14001, aliases: ['stamina', 'strength'] },
			{ granblueId: 14002, aliases: ['enmity', 'zeal'] },
			{ granblueId: 14003, aliases: ['trium', 'strife'] },
			{ granblueId: 14004, aliases: ['progression', 'prosperity'] },
			{ granblueId: 14005, aliases: ['extremity', 'ruination'] },
			{ granblueId: 14006, aliases: ['sagacity', 'honing'] },
			{ granblueId: 14007, aliases: ['supremacy', 'fathoms'] },
			{ granblueId: 14011, aliases: ['celere', 'temperament'] },
			{ granblueId: 14012, aliases: ['majesty', 'restoration'] },
			{ granblueId: 14013, aliases: ['glory', 'glorification'] },
			{ granblueId: 14014, aliases: ['temptation', 'freyr'] },
			{ granblueId: 14015, aliases: ['forbiddance', 'fruit', 'apple'] },
			{ granblueId: 14016, aliases: ['depravity', 'conduct'] },
			{ granblueId: 14017, aliases: ['falsehood', 'fallacy', 'echo'] }
		]
	],
	// Ultima: Gauph Keys
	ultima: [
		[
			{ granblueId: 10001, aliases: ['will', 'dominion', 'atk'] },
			{ granblueId: 10002, aliases: ['strife', 'parity', 'ma'] },
			{ granblueId: 10003, aliases: ['vitality', 'utopia', 'hp'] },
			{ granblueId: 10004, aliases: ['strength', 'plenum', 'stamina'] },
			{ granblueId: 10005, aliases: ['zeal', 'ultio', 'enmity'] },
			{ granblueId: 10006, aliases: ['courage', 'ars', 'crit'] }
		],
		[
			{ granblueId: 11001, aliases: ['auto', 'aggressio', 'alpha'] },
			{ granblueId: 11002, aliases: ['skill', 'facultas', 'beta'] },
			{ granblueId: 11003, aliases: ['ca', 'arcanum', 'gamma', 'ougi'] },
			{ granblueId: 11004, aliases: ['cb', 'catena', 'delta'] }
		],
		[
			{ granblueId: 17001, aliases: ['cap', 'fortis', 'ena'] },
			{ granblueId: 17002, aliases: ['healing', 'sanatio', 'dio'] },
			{ granblueId: 17003, aliases: ['seraphic', 'impetus', 'tria'] },
			{ granblueId: 17004, aliases: ['cbgain', 'elatio', 'tessera'] }
		]
	],
	// Draconic and Draconic Provenance: Telumas
	draconic: [
		[
			{ granblueId: 15001, aliases: ['endurance', 'def'] },
			{ granblueId: 15002, aliases: ['inferno', 'vermillion', 'fire'] },
			{ granblueId: 15003, aliases: ['abyss', 'azure', 'water'] },
			{ granblueId: 15004, aliases: ['crag', 'golden', 'earth'] },
			{ granblueId: 15005, aliases: ['tempest', 'emerald', 'wind'] },
			{ granblueId: 15006, aliases: ['aureole', 'white', 'light'] },
			{ granblueId: 15007, aliases: ['malice', 'black', 'dark'] },
			{ granblueId: 15008, aliases: ['salvation', 'fortitude', 'hp'] },
			{ granblueId: 15009, aliases: ['oblivion', 'magnitude', 'amp'] }
		],
		[
			{ granblueId: 16001, aliases: ['optimus', 'primal'] },
			{ granblueId: 16002, aliases: ['omega', 'magna'] }
		]
	],
	// Destroyer: Anklets
	destroyer: [
		[
			{ granblueId: 19001, aliases: ['auto', 'oblivion', 'godstrike'] },
			{ granblueId: 19002, aliases: ['skill', 'ascendance', 'godflair'] },
			{ granblueId: 19003, aliases: ['ca', 'ougi', 'maximality', 'godheart'] }
		]
	],
	// Class Champion: Emblems
	ccw: [
		[
			{ granblueId: 1, aliases: ['humanity'] },
			{ granblueId: 2, aliases: ['divinity'] },
			{ granblueId: 3, aliases: ['devilry'] }
		]
	]
}

/** Weapon key granblue ID → the parameter and the alias the export writes for it. */
export const KEY_EXPORT_VALUES: Record<number, { param: KeyParam; value: string }> =
	Object.fromEntries(
		KEY_PARAMS.flatMap((param) =>
			KEY_ALIASES[param].flatMap((slot) =>
				slot.map(({ granblueId, aliases }) => [granblueId, { param, value: aliases[0]! }])
			)
		)
	)

/** Parameter → slot → alias → weapon key granblue ID, for the import. */
export const KEY_IMPORT_IDS: Record<KeyParam, Map<string, number>[]> = Object.fromEntries(
	KEY_PARAMS.map((param) => [
		param,
		KEY_ALIASES[param].map(
			(slot) =>
				new Map(slot.flatMap(({ granblueId, aliases }) => aliases.map((a) => [a, granblueId])))
		)
	])
) as Record<KeyParam, Map<string, number>[]>

/**
 * Bullet slug → the aliases Template:Team/Bullets accepts. The template only
 * knows these bullets, each at one tier. Its `primal` alias stands for every
 * Point IV bullet at once, so it maps to none of them.
 */
export const BULLET_ALIASES: Record<string, string[]> = {
	'iron-bullet-v': ['iron'],
	'full-metal-jacket-v': ['fmj'],
	'expert-model-paradise-lost': ['faa', 'paradise lost', 'pl'],
	'expert-model-chaos-legion': ['chaos legion', 'chaos', 'bubs', 'bubz'],
	'expert-model-anagenesis': ['anagenesis', 'apple', 'belial'],
	'expert-model-genesis-nova': ['genesis nova', 'subhl', 'baha'],
	'expert-model-rationale-exitium': ['rationale exitium', 'hexa', 'hexarifle'],
	'expert-model-anti-vasileia': ['anti vasileia', 'faa0', 'faa0rifle', 'faazero'],
	'expert-model-apocalypse': ['apocalypse', 'faa0cartridge'],
	'expert-model-hexachromatic': ['hexachromatic', 'hexaaether'],
	'slug-shot-ii': ['slug'],
	'chaser-shell': ['chaser', 'echo'],
	'enhancing-shell': ['enhancing', 'supp'],
	'agni-point-iv': ['agni'],
	'neptune-point-iv': ['neptune'],
	'titan-point-iv': ['titan'],
	'zephyrus-point-iv': ['zephyrus', 'zeph'],
	'zeus-point-iv': ['zeus'],
	'hades-point-iv': ['hades']
}

/** Alias → bullet slug, for the import. */
export const BULLET_SLUGS: Map<string, string> = new Map(
	Object.entries(BULLET_ALIASES).flatMap(([slug, aliases]) => aliases.map((a) => [a, slug]))
)

/** Character awakening slug → the value the export writes. */
export const CHARACTER_AWAKENINGS: Record<string, string> = {
	'character-atk': 'attack',
	'character-def': 'defense',
	'character-multi': 'multiattack'
}

/** Weapon awakening slug → the value the export writes. */
export const WEAPON_AWAKENINGS: Record<string, string> = {
	'weapon-atk': 'attack',
	'weapon-def': 'defense',
	'weapon-special': 'special',
	'weapon-ca': 'ca',
	'weapon-skill': 'skill',
	'weapon-heal': 'heal',
	'weapon-multi': 'multiattack'
}

/**
 * Character awakening aliases (Template:Team/Richtall) → the export's value.
 * Keys are lowercased with everything but letters and digits removed.
 */
export const CHARACTER_AWAKENING_ALIASES: Record<string, string> = {
	atk: 'attack',
	attack: 'attack',
	def: 'defense',
	defense: 'defense',
	ma: 'multiattack',
	multi: 'multiattack',
	multiattack: 'multiattack'
}

/**
 * Weapon awakening aliases (Template:Richitm, read through Template:Icon's
 * `awakening …` names) → the export's value. Keys are normalized like
 * CHARACTER_AWAKENING_ALIASES, so `C.A.` reads as `ca`.
 */
export const WEAPON_AWAKENING_ALIASES: Record<string, string> = {
	...CHARACTER_AWAKENING_ALIASES,
	spec: 'special',
	special: 'special',
	ca: 'ca',
	skill: 'skill',
	skilldmg: 'skill',
	heal: 'heal',
	healing: 'heal'
}

/** Manatura aliases, from Template:Team/Minos (matched lowercased). */
export const MINO_ALIASES: Record<string, string> = aliasTable([
	[['levi', 'leviathan'], 'Leviathan Mino'],
	[['yggy', 'yggdrasil', 'ygg'], 'Yggdrasil Mino'],
	[['baha', 'bahamut'], 'Bahamut Mino'],
	[['luwoh', 'lu woh'], 'Lu Woh Mino'],
	[['mimic'], 'Mini Mimic'],
	[['schalk'], 'Schalk'],
	[['burlona'], 'Burlona'],
	[['cag', 'ouro', 'ouroboros'], 'Ouroboros Mino'],
	[['europa'], 'Europa Mino'],
	[['wilnas'], 'Wilnas Mino'],
	[['agastia'], 'Agastia Simulacrum'],
	[['faa', 'dark rapture'], 'Dark Rapture Simulacrum'],
	[['chachazero', 'evangeline'], 'Chachazero'],
	[['ccw', 'emt', 'perfida'], 'Perfida'],
	[['qilin'], 'Qilin Simulacrum'],
	[['coco and mimi', 'cocomimi'], 'Coco and Mimi'],
	[['hexa', 'hexachromatic'], 'Hexachromatic Simulacrum'],
	[['octavia', 'green knight', 'gk'], 'Clockwork Octavia No. 3.5']
])

/** Shield aliases, from Template:Team/Shields (matched lowercased). */
export const SHIELD_ALIASES: Record<string, string> = aliasTable([
	[['round shield', 'round', 'hp1'], 'Round Shield'],
	[['buckler', 'dodge'], 'Buckler'],
	[['knight shield', 'knight', 'def1'], 'Knight Shield'],
	[['scutum', 'def2'], 'Scutum'],
	[['mythril shield', 'mythril', 'hp2'], 'Mythril Shield'],
	[['holy shield', 'holy', 'darkres'], 'Holy Shield'],
	[['tiamat shield', 'tiamat', 'windatk'], 'Tiamat Shield'],
	[['rose crystal shield', 'rose', 'superiorelementres'], 'Rose Crystal Shield'],
	[['spartan shield', 'spartan', 'default', 'def3'], 'Spartan Shield'],
	[['malice adarga', 'malice', 'atk'], 'Malice Adarga'],
	[["archangel's shield", 'angel', 'hp3'], "Archangel's Shield"],
	[['colossus wall', 'colossus', 'fireatk'], 'Colossus Wall'],
	[['bahamut shield', 'bahamut', 'baha', 'cadmg'], 'Bahamut Shield'],
	[['soul of oneness', 'twinelements', 'firewaterdef'], 'Soul of Oneness'],
	[['eutr nogadr ldeysh', 'lindwurm', 'debuffres'], 'Eutr Nogadr Ldeysh'],
	[["hero's shield", 'hero', 'gilgamesh', 'gilg', 'def'], "Hero's Shield"],
	[['shield of lamentation', 'grandorder', 'go', 'nadmg'], 'Shield of Lamentation'],
	[['huanglong shield', 'huanglong', 'lightatk'], 'Huanglong Shield'],
	[['qilin shield', 'qilin', 'darkatk'], 'Qilin Shield'],
	[['nibelung mauer', 'alex', 'alexiel', 'waterres'], 'Nibelung Mauer'],
	[['obelisk', 'ennead', 'cb'], 'Obelisk'],
	[['shield of the enthroned', 'enthroned', 'atum'], 'Shield of the Enthroned'],
	[['horus', 'lustrous wall'], 'Lustrous Wall'],
	[['galleon', 'eth ldog ldeysh'], 'Eth Ldog Ldeysh'],
	[['fediel', 'eth ckalb ldeysh'], 'Eth Ckalb Ldeysh'],
	[['dias', 'diaspora', 'moonhill'], 'Moonhill'],
	[['subhl', 'subbie', 'tenets', 'shield of tenets'], 'Shield of Tenets'],
	[['new world shield', 'world'], 'New World Shield'],
	[['anima animus shield', 'aniani'], 'Anima Animus Shield'],
	[['eva', 'esv shield (man-portable)', 'esv'], 'ESV Shield (Man-Portable)']
])

function aliasTable(entries: [string[], string][]): Record<string, string> {
	return Object.fromEntries(entries.flatMap(([aliases, name]) => aliases.map((a) => [a, name])))
}
