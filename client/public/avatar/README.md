# Rykochet.io — Avatar Sticker Assets

Every sticker is a single SVG file dropped into `stickers/`, then registered in `manifest.json`.

## Sticker rules

- **viewBox** MUST be `"0 0 512 512"` — all stickers share this coordinate system so layers line up automatically.
- The avatar body renders as a circle centered at **(256, 256)** with radius **~180**.
- Visible content should fit within a **360×360** area centered on the canvas — the extra 76 px margin on each side is for oversize hats, horns, particles, etc.
- Use `fill="currentColor"` for shapes that should recolor when the layer's `color` is set.
- Use literal hex fills for parts that must stay a specific color (e.g., a wooden hat brim).
- **NO** `<script>`, external `<image href>`, or external stylesheets — the composer refuses to render them.
- Keep each file under **15 KB**. Run through [SVGO](https://github.com/svg/svgo) before committing.
- Save UTF-8, no BOM, LF line endings.

## Anchor points (approx)

```
Head/top   (256,  90)
Center     (256, 256)
Bottom     (256, 420)
Left ear   (100, 240)
Right ear  (412, 240)
```

## Template

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g>
    <!-- Fixed-color: never tinted -->
    <rect x="176" y="150" width="160" height="20" fill="#8B4513"/>
    <!-- Tintable: uses currentColor / layer.color -->
    <path fill="currentColor" d="M256 100 L280 120 L256 140 Z"/>
  </g>
</svg>
```

## Adding a new sticker

1. Save the file as `stickers/my_sticker.svg`.
2. Register in `manifest.json`:
   ```json
   { "id": "my_sticker", "name": "My Sticker", "file": "my_sticker.svg", "tintable": true }
   ```
3. Rebuild the client (`npm run build`). No server restart needed — assets are served statically.

## Tintable vs fixed

- `"tintable": true` — the layer's `color` property overrides `currentColor` fills.
- `"tintable": false` — the color picker in the property panel is disabled for this layer.
