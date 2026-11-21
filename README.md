# ringcay

A ring that grows into a place. Pick a ring, watch it grow a tiny 3D island, and tuck a photo and a story into each thing on it.

一枚戒指，长成一座岛。选一枚戒指，看它长出一座 3D 小岛，再把照片和故事放进岛上的每样东西里。

This is a working prototype, not a launched product.

## Run it

You need Python 3 and a current browser. Nothing to install.

```bash
python3 serve.py
```

Then open http://localhost:4173. The page loads Three.js and its fonts from public CDNs, so it needs an internet connection.

Day or night follows your clock (night is 18:30 to 06:30). To look at either one, add `?theme=day` or `?theme=night` to the address.

## What works

- **Rings**: 24 shapes in six families (classic, clay & wobble, rainbow stones, chunky, signets, candy). Change the metal and the stone colour, and engrave a few words inside the band.
- **Islands that follow the ring**: a band gets an island floating in its hole, so the engraving inside stays readable. A flat-topped signet uses its top as the ground. A ring with a top gets an island hovering where a stone would sit. An open ring gets one islet on each end and a bridge.
- **Memories**: 19 pieces to place and drag. Each can hold a photo, a title, a date and a story.
- **Sharing**: each memory is private until opened. A share link carries only the public parts.
- **Languages**: English and Simplified Chinese, switched from the top right.

## What is not real yet

- Everything is saved in the browser (localStorage and IndexedDB). There are no accounts and no server.
- Checkout is a demo. Nothing is charged.
- The six islands on the home page are samples.
- A share link holds the public snapshot inside the link itself, because there is nowhere to store it yet.

## Where things are

| Path | What it is |
|---|---|
| `app/index.html` | The page shell |
| `app/css/app.css` | All styling, with the day and night palettes |
| `app/js/main.js` | Pages, panels and actions |
| `app/js/world.js` | The 3D stage: ring, island forms, camera, dragging |
| `app/js/rings.js` | The 24 rings |
| `app/js/kit.js` | Building blocks: bands, stones, engraving, island pieces |
| `app/js/catalog.js` | Everything a person can pick, with prices |
| `app/js/store.js` | Saving, photos and the public snapshot |
| `app/js/i18n.js`, `app/js/zh.js` | Language switch and the Chinese copy |
| `app/js/samples.js` | The sample islands |
| `serve.py` | Local preview server |
| `style-options/` | The style boards made while choosing the look. Not part of the app. |
