# Ashen Hollow – look spec (from Persona 3/4/5 key art references)
Translate the *language*, not the artwork: no characters, logos or compositions are copied.

## Signature details
1. Two-tone world: near-black shadow masses + one saturated accent per scene/character (P5 red/black, P3 cyan/navy, P4 yellow/black).
2. Hard cel shading: 3 tones per material, hard terminator, no dithering/gradients on characters.
3. Coloured line art: outlines are a dark shade of the fill hue, never pure black (already in S.outline).
4. Characters read by silhouette + one accent (scarf, ribbon, glove, collar).
5. Big readable heads/hands, simplified torso (chibi proportion for in-world sprites).
6. Sparkle/shard motifs for magic (diamond glints, angular shards).

## Palette (sampled)
| role | hex |
|---|---|
| shadow | #000009 / #14191d / #1e1a18 |
| accent red | #94272b |
| accent cyan | #0eb1f4 |
| accent yellow | #fef227 |
| deep navy | #001050 / #323452 |
| skin light | #ebdcc7 |

## Proportions (game, 480x270, 16px tiles)
- Figure 18x30 px; head ~10x13 (was 8x9), torso shortened 2 rows; stature unchanged.
- Hands/boots visible; eyes spaced wider (column doubling at head centre).

## Status
Done: chibi head pass (art.js `chibi()`, opt-out `noChibi`). Next: 2x hi-res buffer (src/core/hires.js drafted), native-2x characters, accent-colour pass on UI/world.
