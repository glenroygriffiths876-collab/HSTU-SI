HSTU RESOURCE CENTRE — INSTANT START BUILD
25 September 2026

Performance changes only:
1. HSTU Health Snake is now a separate health-snake.html file.
2. The game is NOT loaded or running while the Resource Centre opens.
3. It loads only when Play HSTU Health Snake is tapped.
4. It is unloaded when Back is tapped, stopping its animation/game loop.
5. The PWA app shell is cached for immediate repeat launches.
6. Navigation serves the cached Resource Centre immediately, then refreshes it quietly in the background.
7. A new cache version clears the previous service-worker cache.

No Resource Centre sections were intentionally redesigned or removed.
