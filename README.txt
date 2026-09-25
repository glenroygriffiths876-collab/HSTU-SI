HSTU RESOURCE CENTRE — DESKTOP PLAY FIX
25 September 2026

The screenshot identified the remaining issue:
the original mobile Snake game intentionally showed “Please rotate to portrait mode to play!”
for any landscape viewport. A laptop is naturally landscape, so the game was being blocked.

This build:
- allows desktop/laptop browsers (fine pointer + hover, >=900px) to play in landscape;
- keeps the portrait-orientation safeguard for phones/tablets;
- preserves Arrow/WASD desktop controls;
- preserves mobile swipe and D-pad controls;
- preserves the dedicated health-snake.html service-worker route;
- uses a new cache version so the old blocked game is replaced.
