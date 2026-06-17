#!/usr/bin/env bash
#
# migrate-local-images.sh — reorganize a LOCAL image mirror to the new bucket
# structure (the dev-only, git-ignored copy that serves /images in development).
# This is the local-disk equivalent of the S3 copy+cleanup, done with `mv`.
#
# Usage:
#   scripts/migrate-local-images.sh <image-root> [<image-root> ...]          # dry run
#   APPLY=1 scripts/migrate-local-images.sh <image-root> [<image-root> ...]  # do it
#
# <image-root> is the directory that contains character-main/, ability-icons/, etc.
# (e.g. static/images, or a worktree's images/). Re-running is safe (idempotent).
set -euo pipefail

APPLY="${APPLY:-0}"

# old:new directory pairs (excludes jobs/raids — handled specially below — and the
# orphans weapon-raw/raid-square which are removed, not moved).
MAP=(
	"character-main:characters/main" "character-grid:characters/grid"
	"character-square:characters/square" "character-detail:characters/detail"
	"weapon-main:weapons/main" "weapon-grid:weapons/grid" "weapon-square:weapons/square"
	"weapon-base:weapons/base"
	"summon-main:summons/main" "summon-grid:summons/grid" "summon-square:summons/square"
	"summon-detail:summons/detail" "summon-tall:summons/tall" "summon-wide:summons/wide"
	"accessory-square:accessories/square" "accessory-grid:accessories/grid"
	"artifact-square:artifacts/square" "artifact-wide:artifacts/wide"
	"bullet-square:bullets/square"
	"ability-icons:icons/abilities" "job-skills:icons/job-skills"
	"weapon-skill-icons:icons/weapon-skills"
	"elements:icons/elements" "proficiencies:icons/proficiencies" "rarity:icons/rarity"
	"awakening:icons/awakening" "mastery:icons/mastery" "ax:icons/ax-skills"
	"fonts:app/fonts" "placeholders:app/placeholders" "external:app/external" "media:app/media"
)

do_mv() { # do_mv <old> <new>
	local old="$1" new="$2"
	[ -d "$old" ] || return 0
	if [ -e "$new" ]; then echo "  skip: $old (→ $new already exists)"; return 0; fi
	echo "  mv $old → $new"
	if [ "$APPLY" = 1 ]; then mkdir -p "$(dirname "$new")"; mv "$old" "$new"; fi
}

do_rm() { # do_rm <path>
	[ -e "$1" ] || return 0
	echo "  rm $1"
	[ "$APPLY" = 1 ] && rm -rf "$1"
	return 0
}

# Old flat dir -> <group>/full, where the group prefix equals the old dir name.
stage_full() { # stage_full <name>  (e.g. jobs, raids)
	local name="$1"
	[ -d "$name" ] && [ ! -e "$name/full" ] || return 0
	echo "  $name/* → $name/full/"
	if [ "$APPLY" = 1 ]; then
		mv "$name" ".${name}_stage" && mkdir -p "$name" && mv ".${name}_stage" "$name/full"
	fi
}

migrate_root() {
	local root="$1"
	if [ ! -d "$root" ]; then echo "## $root — not found, skipping"; return 0; fi
	echo "## $root"
	pushd "$root" >/dev/null

	for pair in "${MAP[@]}"; do do_mv "${pair%%:*}" "${pair##*:}"; done

	# jobs/ and raids/ nest under their own old name: relocate the old flat dir to
	# <group>/full FIRST (while it still holds only flat files), THEN add the variant
	# subdirs — otherwise the variants get swept into full/.
	stage_full jobs
	do_mv job-icons jobs/icon
	do_mv job-portraits jobs/portrait
	do_mv job-wide jobs/wide
	do_mv job-zoom jobs/zoom
	stage_full raids
	do_mv raid-thumbnail raids/thumbnail

	# loose marketing files at the image root → app/marketing/
	for f in about-hero.jpg about-hero2.jpg background_a.jpg port-breeze.jpg relief.png; do
		[ -f "$f" ] || continue
		echo "  mv $f → app/marketing/$f"
		if [ "$APPLY" = 1 ]; then mkdir -p app/marketing && mv "$f" "app/marketing/$f"; fi
	done

	# orphans + cruft: weapon-raw (dup of weapon-base), raid-square (no source),
	# the nested duplicate images/ dir (holds the dup extension.mp4), and .DS_Store.
	do_rm weapon-raw
	do_rm raid-square
	do_rm images
	do_rm .DS_Store

	popd >/dev/null
	echo
}

[ "$#" -ge 1 ] || { echo "usage: [APPLY=1] $0 <image-root> [<image-root> ...]" >&2; exit 1; }
[ "$APPLY" = 1 ] || echo "(DRY RUN — set APPLY=1 to actually move/remove)"
echo
for root in "$@"; do migrate_root "$root"; done
[ "$APPLY" = 1 ] || echo "(DRY RUN — nothing changed)"
