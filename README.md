# FARIX · The Digital Universe

A cinematic, interactive portfolio. Two deliberately different front doors to the same universe:

- **Desktop / tablet**: a giant cyan moon, a tiny silhouette, a black car, drifting rocks. The moon is a real-time procedural WebGL sphere (craters, maria, rim light) and its lighting follows your pointer.
- **Mobile**: a violet-to-magenta planet with orbital rings and glossy floating orbs, built for thumbs (tap ripples, swipe carousel, big touch targets, safe-area padding).

No framework, no build step, no dependencies. Plain HTML, CSS and JavaScript.

## Run it

Easiest: double-click `index.html`.

Or serve it locally (recommended, closer to real hosting):

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

(`npx serve .` works too.)

## Put it online (free)

On GitHub: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Your site appears at
`https://<your-username>.github.io/<repo-name>/`. It works as-is because every path is relative.

## Make it yours

All the words live in one file: **`js/content.js`**. Edit, save, refresh.

| What | Where in `js/content.js` |
|---|---|
| Hero title (try `['Beyond the', 'Ordinary.']`) | `title` |
| Hero paragraph | `lede` |
| About text + four "signals" | `about` |
| Projects (title, category, text, tags, link, planet colours) | `projects` |
| Experiments labels | `experiments` |
| Focus areas | `skills` |
| Email / GitHub / LinkedIn | `contact` |

Everything marked **placeholder** is sample content. Leave `link`, `email` or `linkedin` empty (`''`) and the matching button is shown as "not added yet" instead of pointing nowhere.

**Fonts**: Space Grotesk, Orbitron (mobile headline) and JetBrains Mono load from Google Fonts. If they can't load, the site falls back to system fonts and still looks right. To go fully offline, download them and add `@font-face` rules to `css/styles.css`.

**Colours**: the palette is at the top of `css/styles.css` (`--cyan`, `--violet`, `--magenta`…). Desktop uses cyan as its accent, mobile uses violet-magenta.

## Files

```
index.html          page structure + inline SVG art (rocks, figure, car, ground)
css/styles.css      design tokens, responsive art direction, sections
js/content.js       ← your editable content
js/scenes.js        WebGL moon + planet shaders, orbital rings, parallax, pointer light
js/experiments.js   the five Experiment Lab toys
js/ui.js            Explore portal, project cards + detail view, reveals, contact
scripts/bundle.py   optional: packs everything into one standalone HTML file
```

## How the responsive art direction works

| Viewport | Scene |
|---|---|
| ≥ 1024px (and wide landscape) | Full cinematic lunar scene |
| 768–1023px portrait | Smaller moon with a violet tint, ground lifted, minor rocks removed, copy moved below |
| ≤ 767px | Dedicated planet scene; the moon, rocks, car and figure are removed entirely |
| ≤ 767px landscape | Planet on the left, copy on the right |

JS and CSS use the same media queries, so only one scene is ever rendered.

## Performance & accessibility notes

- Only one WebGL scene runs at a time, capped at 30 fps, and it **pauses** when the hero is off-screen or the tab is hidden.
- Render resolution is capped (moon 1280px, planet 900px) so mid-range phones stay smooth.
- Lab experiments start lazily and run only while visible.
- `prefers-reduced-motion`: animations, parallax and shader motion stop; content is never hidden behind an animation.
- If WebGL is unavailable, CSS gradient versions of the moon and planet are shown.
- Keyboard: skip link, visible focus rings, Esc closes the menu and dialogs, focus returns to where you were.
- No information is hover-only. Everything has a tap/keyboard path.

## Standalone single file

```bash
python3 scripts/bundle.py   # writes farix-standalone.html
```

## Notes

- The Hero scene is an original recreation inspired by two reference images; no reference image is used as a background.
- Replace the sample projects before you share the link.
