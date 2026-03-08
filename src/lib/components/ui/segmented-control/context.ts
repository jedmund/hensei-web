import { getContext, setContext } from 'svelte'
import type { SegmentedControlVariant, SegmentedControlSize } from './SegmentedControl.svelte'

export interface SegmentedControlContext {
	variant: SegmentedControlVariant
	size: SegmentedControlSize
	grow: boolean
	element: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | null
}

const SEGMENTED_CONTROL_KEY = Symbol('segmented-control')

export function setSegmentedControlContext(ctx: SegmentedControlContext) {
	setContext(SEGMENTED_CONTROL_KEY, ctx)
}

export function getSegmentedControlContext(): SegmentedControlContext {
	return getContext<SegmentedControlContext>(SEGMENTED_CONTROL_KEY)
}
