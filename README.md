# Ashen Hollow (working title)

A dark-fantasy 2D action RPG: ancient magic, witchcraft, forgotten gods, European folklore.
Custom Canvas 2D engine, no dependencies, no build step, no server needed.

## Run
Open `index.html` in a modern browser (Chrome/Edge/Firefox). Click once so audio can start.
Add `?debug` to the URL for debug output.

## Controls
WASD/arrows move, J/Z/left-click attack (3-hit combo), Space dodge (i-frames; dodge a telegraphed blow at the last moment for a perfect dodge), L/C/right-click cast, E interact, Q/R or 1-4 spell slots, I/B/T/M/N inventory/spellbook/skills/map/codex, Esc pause. Gamepad mapping exists but is untested.

## Layout
- `src/core` engine: util, font, input, audio (synthesised), sprites, particles, lighting, weather
- `src/game` art, tiles, props, world, player, combat, magic, enemy, boss, objects, life (NPCs/ecology/events), state (save/load)
- `src/data` items, spells, skills, lore, enemies, maps, dialogue
- `src/ui` skin, hud, screens
- `tools` art and prop test sheets
