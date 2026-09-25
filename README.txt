HSTU RESOURCE CENTRE — SNAKE ROUTING FIX
25 September 2026

Root cause corrected:
The service worker was treating health-snake.html as though it were a navigation
to the main Resource Centre and was returning cached index.html inside the Arcade iframe.
That is why desktop showed the Resource Centre inside the game area.

This build explicitly routes health-snake.html to the actual game document while
preserving the fast cached startup for the main Resource Centre.
A new cache version forces browsers/PWA installs to discard the faulty routing cache.
