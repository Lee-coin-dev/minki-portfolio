# Into the Deep — Ocean Zones Portfolio Prototype

An interactive, scroll-driven journey that follows a fishing lure as it sinks
through the ocean's five layers of light, built from the brief in
`subpage_mb.md`.

## The experience

1. **Hero (Screen 1)** — A teenage girl in a pink athletic shirt and black
   shorts stands on a fishing vessel under a bright blue sky. **Tap anywhere**
   (or the button) to cast: the rod winds up and whips forward, the fake-fish
   lure arcs into the sky, splashes into the sea, and begins to sink.
2. **Sunlight Zone (0–200 m)** — sea lion and whale shark with description memos.
3. **Twilight Zone (200–1000 m)** — info card on the left (photo + text), with a
   sperm whale and a crab on a stone on the right.
4. **Midnight Zone (1000–4000 m)** — info card on the left, with a colossal squid
   and an anglerfish on the right.
5. **Abyssal Zone (4000–6000 m)** — frilled shark and sea cucumbers above a sea
   floor that reads **"You've Reached the Floor!"**.

A fixed lure on a fishing line follows you down the zones, the water darkens with
each layer, and a depth gauge tracks your descent.

## Tech stack

- HTML / CSS / vanilla JavaScript
- [GSAP](https://gsap.com/) with `ScrollTrigger` and `MotionPathPlugin` (via CDN)

## Run it

No build step. Use any static server so the images and CDN scripts load cleanly:

```bash
cd minki_mb_webpage
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` directly also works.)

## Files

- `index.html` — page structure and inline SVG for the girl, boat, and lure
- `styles.css` — zone gradients, layout, animations, responsive rules
- `script.js` — cast interaction and scroll choreography
- `images/` — creature photos used in each zone

## Notes

This is a prototype. The girl, boat, and lure are hand-drawn SVG/CSS; the
creature photos are the provided rectangular images framed as cards, since they
are not transparent cutouts.
