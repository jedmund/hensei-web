#!/usr/bin/env python3
"""Download the in-game weapon-skill label badges used by SkillLabel.svelte.

The game serves each label texture in English and Japanese from its CDN:

    https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/ui/icon/weapon_skill_label/<file>.png  (en)
    https://prd-game-a-granbluefantasy.akamaized.net/assets/img/sp/ui/icon/weapon_skill_label/<file>.png     (ja)

gbf.wiki's label gadget (MediaWiki:Gadget-common-label-images.css) maps display
labels to wiki-hosted copies of those textures, and the wiki preserves the game
filenames — so the CSS gives us slug -> game filename, and the CDN gives us both
languages.

Usage:
    python3 scripts/download-skill-labels.py --lang ja               # missing ja badges for slugs in en/
    python3 scripts/download-skill-labels.py --lang en ja --force    # re-download everything
    python3 scripts/download-skill-labels.py --all-labels            # every label the wiki knows

The wiki asks for a descriptive User-Agent; pass one with --user-agent when
fetching the CSS (or point --css at a saved copy).
"""

import argparse
import pathlib
import re
import sys
import time
import urllib.request

WIKI_CSS_URL = "https://gbf.wiki/MediaWiki:Gadget-common-label-images.css?action=raw"
CDN = "https://prd-game-a-granbluefantasy.akamaized.net/{assets}/img/sp/ui/icon/weapon_skill_label/{filename}"
ASSETS = {"en": "assets_en", "ja": "assets"}
OUT_ROOT = pathlib.Path(__file__).resolve().parent.parent / "src/assets/skill-labels"
THROTTLE_SECONDS = 0.4

# The wiki hosts some labels under renamed files (Book_bonus_label_l_N.png / Bonus_N.png),
# which hides the game filename. These were recovered by probing the game CDN directly.
MANUAL_FILENAMES = {
    "hp": "03_icon_hp.png",
    "da-rate": "01_icon_da_rate.png",
    "ta-rate": "01_icon_ta_rate.png",
    "ca-dmg": "04_icon_ca_dmg.png",
    "skill-dmg": "04_icon_skill_dmg.png",
    "stamina": "01_icon_stamina_01.png",
    "enmity": "01_icon_enmity_01.png",
    "plain-amp": "04_icon_plain_amplify.png",  # not in the wiki gadget at all
    "sp-ca-cap": "04_icon_ca_dmg_cap_ded.png",
    "na-supp": "04_icon_normal_dmg_supp.png",
    # World ("genesis") destruction bonus damage — also absent from the gadget
    "bonus-des-dmg": "01_icon_genesis_concurrent_attack.png",
    "bonus-des-dmg-ca": "01_icon_genesis_special_skill_concurrent_attack.png",
    # Exalto: element and frame concatenate without a separator
    **{f"{el}-{frame}": f"01_icon_{el}{frame}.png"
       for el in ("fire", "water", "earth", "wind", "light", "dark")
       for frame in ("optimus", "omega")},
}


def slugify(label: str) -> str:
    s = re.sub(r"[().']", "", label.lower())
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def parse_css(css: str) -> dict[str, str]:
    """slug -> game filename. A rule block may carry several data-label aliases."""
    mapping: dict[str, str] = {}
    for block in css.split("}"):
        url = re.search(r"url\('https://gbf\.wiki/images/[0-9a-f]/[0-9a-f]{2}/([^']+)'\)", block)
        if not url:
            continue
        for label in re.findall(r"data-label='([^']+)'", block):
            mapping.setdefault(slugify(label), url.group(1))
    return mapping


def fetch(url: str, user_agent: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", nargs="+", choices=list(ASSETS), default=["ja"])
    ap.add_argument("--css", type=pathlib.Path, help="local copy of the gadget CSS (skips the wiki fetch)")
    ap.add_argument("--user-agent", default="hensei-skill-label-downloader (github.com/jedmund/hensei-api)")
    ap.add_argument("--all-labels", action="store_true",
                    help="download every label in the CSS, not just the slugs present in en/")
    ap.add_argument("--force", action="store_true", help="re-download files that already exist")
    args = ap.parse_args()

    css = args.css.read_text() if args.css else fetch(WIKI_CSS_URL, args.user_agent).decode()
    mapping = parse_css(css)
    # Drop wiki-renamed files (not real game filenames) in favor of the probed map.
    mapping = {s: f for s, f in mapping.items()
               if not re.match(r"(Book_bonus_label|Bonus_)", f)} | MANUAL_FILENAMES
    print(f"{len(mapping)} labels in the gadget CSS")

    if args.all_labels:
        slugs = sorted(mapping)
    else:
        slugs = sorted(p.stem for p in (OUT_ROOT / "en").glob("*.png"))
        unmatched = [s for s in slugs if s not in mapping]
        if unmatched:
            print(f"WARNING: no CSS entry for: {', '.join(unmatched)}", file=sys.stderr)
        slugs = [s for s in slugs if s in mapping]

    failures = []
    for lang in args.lang:
        out_dir = OUT_ROOT / lang
        out_dir.mkdir(parents=True, exist_ok=True)
        todo = [s for s in slugs if args.force or not (out_dir / f"{s}.png").exists()]
        print(f"[{lang}] {len(todo)} to download ({len(slugs) - len(todo)} already present)")
        for slug in todo:
            url = CDN.format(assets=ASSETS[lang], filename=mapping[slug])
            try:
                data = fetch(url, args.user_agent)
                (out_dir / f"{slug}.png").write_bytes(data)
                print(f"  {slug} <- {mapping[slug]} ({len(data)} bytes)")
            except Exception as e:  # noqa: BLE001 — report and continue
                failures.append((lang, slug, str(e)))
                print(f"  FAILED {slug}: {e}", file=sys.stderr)
            time.sleep(THROTTLE_SECONDS)

    if failures:
        print(f"{len(failures)} failure(s)", file=sys.stderr)
        return 1
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
