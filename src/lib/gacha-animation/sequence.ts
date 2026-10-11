/**
 * The animation's phases in order: the opening crystal, the stones, one
 * reveal per item, then done. Each phase moves on after its duration; a tap
 * moves on early. Durations follow the game's timings (30 fps frames
 * measured in the animation harness), rounded.
 */

export type Phase =
	{ kind: 'opening' } | { kind: 'stones' } | { kind: 'reveal'; index: number } | { kind: 'done' }

/** Milliseconds each phase holds before moving on by itself */
export const DURATION = {
	/** Clouds to the crystal's tap prompt is 63 frames in the game */
	opening: 2100,
	/** The stones play for 66 frames */
	stones: 2200,
	/** The game waits for a tap per item; here each one holds for a beat */
	reveal: 1500
} as const

export const FIRST_PHASE: Phase = { kind: 'opening' }

export function nextPhase(phase: Phase, itemCount: number): Phase {
	switch (phase.kind) {
		case 'opening':
			return { kind: 'stones' }
		case 'stones':
			return itemCount > 0 ? { kind: 'reveal', index: 0 } : { kind: 'done' }
		case 'reveal':
			return phase.index + 1 < itemCount
				? { kind: 'reveal', index: phase.index + 1 }
				: { kind: 'done' }
		case 'done':
			return phase
	}
}

export function phaseDuration(phase: Phase): number | null {
	return phase.kind === 'done' ? null : DURATION[phase.kind]
}
