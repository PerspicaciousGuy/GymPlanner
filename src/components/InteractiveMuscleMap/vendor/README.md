# Open-Muscle-Map vendored web assets

Source: https://github.com/perspicaciousguy/Open-Muscle-Map
Pinned commit: `502d0bea9938a63c37d4976480ee2eaca769f8ba`
License: MIT; see `LICENSE` alongside these files.

`muscle-map.js`, `male-muscle-map.svg`, `female-muscle-map.svg`, and
`muscles.json` are byte-for-byte copies of `muscle-map/` in that commit.
Keep them unmodified. Host styling and group mapping live one directory above.

The controller exposes `window.MuscleMap`; it does not have an ES-module default
export. The host imports it for its side effect. SVGs are Vite raw-text imports.
No runtime CDN, fetch, package installation, or SVG parsing is required.
