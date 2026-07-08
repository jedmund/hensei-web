# HP-sweep captures (#73 / #76 raw data)

In-game "Weapon Skill Boosts" readings across the Calculator Conditions HP slider,
captured 2026-07-07. These drive the stamina/enmity/garrison/HP-scaled-skill curve
calibration and carry Estimated DMG targets for #76.

## QJ9736 — Dark Optimus (Fighter Origin; enh 400/30/0)

Fallen Sword x4 (Might II/III + Hatred's Stamina), Eternal Signature x2 (Convergence,
Majesty), Excalibur MH (Garrison + Rightway Pathfinder + Stamina), Daodao Fu, Herb
Basket, Third Stripe of the Streak (Persistence supp).

| HP% | Stamina  | DEF | C.A. DMG     | DMG Supp. | Estimated / to Light / Max HP |
| --- | -------- | --- | ------------ | --------- | ----------------------------- |
| 100 | 243      | 50  | 120 (capped) | 30000     | 914073 / 961989 / 140118      |
| 75  | 135      | 116 | 90           | 25000     | 747466 / 931346               |
| 50  | 78.13    | 176 | 60           | 20000     | 595017 / 769505               |
| 25  | (absent) | 252 | 0            | 15000\*   | 346169 / 459981               |

(\*25% row supp read +10200 at the 1% capture; 15000 at 25%.)
Constant: Might 620, EX Might 80, E.ATK (Prog.) 8, DA 40, TA 20, HP 390,
Heal Cap 100 (capped), Debuff Res. 20, DMG Cap (Sp.) 14, C.A. DMG Cap 30,
Skill DMG Supp. +100000, C.A. Supp. +1000000 (capped).

Confirmed: normal stamina formula exact at 75/50 (135.56→"135" via the >=100
display floor; 78.13 exact); stamina line ABSENT at 25 — "no boost below 25%"
(wiki) and the panel drops it; Persistence supp = value x (1 + 2\*hp/100) / 3
(30000->10200 exact at all five points); Rightway Pathfinder C.A. = 120 x hp/100
with the same sub-25 cutoff (120/90/60/30/0). Garrison rises FASTER than the
enmity curve we borrow (deltas +66/+126/+202 at 75/50/25 — needs its own curve).

## OlFQ2a — Dark Omega (Fighter Origin; enh 60/460/0)

Celeste Claw Omega x3 (AX: atk2.5+skill_cap1 / ca6+ele_atk2 / —), Celeste Grace
Ater x3 (rebirth stamina), Fediel's Spine x2 (AX hp6+stam2 / hp3+stam3; ancestral
stamina), Katana of Renunciation (opus), Excalibur MH.

| HP% | Stamina | Ω Enmity | DEF      | C.A. DMG     | AX Stamina | Estimated / to Light |
| --- | ------- | -------- | -------- | ------------ | ---------- | -------------------- |
| 100 | 61.64   | (absent) | (absent) | 120 (capped) | 9          | 386294 / 550219      |
| 75  | 31.04   | 47.25    | (absent) | 90           | 9          | 455325 / 651010      |
| 50  | 14.81   | 126      | 21.26    | 60           | 8          | 596663 / 828224      |
| 25  | 8.53    | 236      | 40.5     | 30           | 6          | 786521 / 1030010     |
| 1   | 4       | 377      | 64.8     | 0            | 4          | 938159 / 1042108     |

Max HP 57861. Constant: Ω Might 694, EX Might 42, Dark Omega 60, HP 123,
DMG Cap 20 (capped), Ω DMG Amp. 9.8, Skill DMG Cap 50, C.A. DMG Cap 30,
C.A. Supp. +1000000 (capped), Charge Gain -100; AX: ATK 2.5, Ele. ATK 2,
HP 9, Skill DMG Cap 1, C.A. DMG 6.

AX stamina validates the wiki level tables exactly (lv3+lv2 = 9/9/8/6/4).
OPEN: the gold Stamina line's sub-25 values (8.53@25, 4@1) don't decompose
with the >=25-only formula — the mixed normal(Excalibur)/rebirth(Grace)/
ancestral(Fediel) sum needs a solver pass; Ω Enmity appears only below 100
(47.25/126/236/377) and DEF (garrison) only from 50 down — curve fits pending.
