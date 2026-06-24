# Minki — Flutist Portfolio (Prototype)

An interactive, scroll-driven portfolio built for a boarding-school application.
Pure **HTML / CSS / JavaScript** with **GSAP + ScrollTrigger** (loaded via CDN).

## Run it

From this folder:

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173> in a browser.
(Any static server works — it must be served over `http://`, not opened as a `file://` path, so GSAP loads from the CDN.)

## The screens

The whole piece sits on a fixed **theatrical backdrop**: opened red stage curtains, a valance, and a wooden stage floor.

1. **Screen 1 — Stage** — the girl (formal gown) stands on the left, a floating flute and piccolo sit on the right, and a button reads *"Click on either flute or piccolo."* Scrolling (or clicking the button/flute) triggers a **gradual zoom** as she gets ready to play.
2. **Screen 2 — Ready** — the zoom stops with the **flute on her lips** and the **first key glowing gold**. Scrolling does **not** advance here — you must **click the glowing key**.
3. **Video pop-up** — clicking the key opens the performance video as a **modal** (16:9 frame + play button). Close it to continue.
4. **Screen 3 — Descriptions** — after the video, scrolling down raises a large flute (with the **second key glowing**) above two photos (left) and the written description (right).

## Swapping in real content

Everything visual is a placeholder you can replace:

- **Video:** in `index.html`, replace the `.video-frame` block inside `#videoModal` with a real `<video controls poster="...">` or a YouTube `<iframe>`.
- **Photos (Screen 3):** the two `.photo` blocks use CSS gradients. Replace `<div class="photo-fill ...">` with `<img src="assets/your-photo.jpg" alt="...">`.
- **Girl & instrument art:** the illustrations are inline SVGs inside `#svg-templates` in `index.html`. Replace them with your own SVG/PNG if you have polished artwork.
- **Copy:** all headings and paragraphs live directly in `index.html`.

## File structure

```
minki portfolio/
├── index.html      # markup + inline SVG illustrations
├── css/styles.css  # all styling (shade-themed, professional fonts)
├── js/main.js      # GSAP scene animations + click navigation
└── README.md
```

Fonts: *Cormorant Garamond* (serif headings) and *Jost* (sans body), via Google Fonts.
