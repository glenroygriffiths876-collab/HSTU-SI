HSTU RESOURCE CENTRE — DESKTOP RUNNING FIX
25 September 2026

Root cause from the latest desktop screenshot:
The previous patch hid the portrait warning and showed the canvas, but the ORIGINAL
Snake animation loop still contained:

    if (isLandscape()) { draw(); return; }

So on a laptop the board appeared, but the game loop deliberately returned before
advancing the snake.

This build fixes isLandscape() at the source:
- desktop/laptop browsers are not treated as mobile landscape;
- the Snake update loop now advances normally on desktop;
- mobile landscape protection remains;
- Arrow/WASD and mobile controls remain;
- service-worker Snake routing remains;
- fast Resource Centre startup remains;
- new cache version forces the corrected game onto browsers/PWA.
