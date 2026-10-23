/**
 * Whether the seal overlays (veil, lock and priority badge) are drawn on a
 * Solomonis grid. Viewers hide them to see the items plainly; shared by the
 * weapon and summon grids so both follow the same toggle.
 */
export const sealOverlays = $state({ hidden: false })
