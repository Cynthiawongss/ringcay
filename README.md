# little atoll

A ring that grows into a place. Design a ring together, watch it turn into a tiny 3D island, and tuck a photo and a story into each thing on it.

一枚戒指，长成一座岛。一起设计一枚戒指，看它长成一座 3D 小岛，再把照片和故事放进岛上的每样东西里。

This is a working prototype, not a launched product.

## Run it

You need Python 3 and a current browser. Nothing to install.

```bash
python3 serve.py
```

Then open http://localhost:4173. The page loads Three.js and its fonts from public CDNs, so it needs an internet connection.

## What works

- **Ring**: 5 bands, 3 metals, 3 finishes, 6 stones, engraved words and a symbol.
- **Island**: the ring lies flat and grows an island. The engraved symbol becomes a landmark, the words become a signpost, the stone tints the lagoon.
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
| `app/css/app.css` | All styling |
| `app/js/main.js` | Pages, panels and actions |
| `app/js/world.js` | The 3D stage: ring, island, camera, dragging |
| `app/js/props.js` | The island pieces, built from simple shapes in code |
| `app/js/catalog.js` | Everything a person can pick, with prices |
| `app/js/store.js` | Saving, photos and the public snapshot |
| `app/js/i18n.js`, `app/js/zh.js` | Language switch and the Chinese copy |
| `app/js/samples.js` | The sample islands |
| `serve.py` | Local preview server |
