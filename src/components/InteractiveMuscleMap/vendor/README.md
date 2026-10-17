# Open-Muscle-Map vendored web assets

Source: https://github.com/perspicaciousguy/Open-Muscle-Map
Pinned commit: `32ffea69539a66e2de1c6282ab16dd4db5844c6c`
Release: v1.1.0 artwork; latest main includes the subsequent CDN documentation fix.
License: MIT; see `LICENSE` alongside these files.

`muscle-map.js`, `male-muscle-map.svg`, `female-muscle-map.svg`, and
`muscles.json` are byte-for-byte copies of `muscle-map/` in that commit.
Keep them unmodified. Host styling and group mapping live one directory above.

The controller exposes `window.MuscleMap`; it does not have an ES-module default
export. The host imports it for its side effect. SVGs are Vite raw-text imports.
No runtime CDN, fetch, package installation, or SVG parsing is required.

This update includes transparent artwork backgrounds and the upstream
`setColors`/`clearColors`/`heatColor` API. The host retains its existing
group-status CSS; it does not currently call the new heatmap API.
