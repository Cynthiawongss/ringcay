// Sample islands for Explore. These are made up by us so the page is not empty before a real community exists.
// They use the same snapshot shape a real shared island uses (see store.snapshot).
const it = (id, type, s, x, z, rot = 0, memory = null, label = '') => ({ id, type, s, x, z, rot, ...(memory ? { memory: { ...memory, public: true }, label } : {}) });

export const SAMPLES = [
  {
    id: 'maya-june', ratio: '4 / 5', title: 'the lake house year', people: 'maya + june', sample: true,
    ring: { id: 'charm', metal: null, accent: '#FF4FA3', text: 'you + me · 06.14' },
    items: [
      it('a', 'house', 0, -0.3, -0.45, 0.5, { title: 'the first place that was ours', date: '2023-06-14', story: 'Third floor, no elevator, one window that stuck. We ate on the floor for a month and it was the best month.' }, 'apartment 3B'),
      it('b', 'pond', 0, 0.45, 0.4, 0, { title: 'the week at the lake', date: '2024-08-02', story: 'You swam out to the float and I pretended I was not timing how long you were gone.' }),
      it('c', 'tree', 0, 0.7, -0.4), it('d', 'cypress', 0, -0.9, -0.05), it('e', 'cypress', 0, -0.7, -0.6), it('f', 'bush', 0, -0.2, 0.75), it('g', 'bench', 0, 0.05, 0.3, 0.4), it('h', 'lamp', 0, -0.55, 0.45), it('i', 'mailbox', 0, 0.15, -0.9),
    ],
  },
  {
    id: 'room-214', ratio: '2 / 3', title: 'room 214, forever', people: 'the four of us', sample: true,
    ring: { id: 'boxy', metal: null, accent: null, text: 'room 214' },
    items: [
      it('a', 'cabin', 0, -0.55, -0.12, 0.25, { title: 'the roof we were not allowed on', date: '2022-10-09', story: 'Four blankets, one thermos, and a meteor shower nobody else on the floor stayed up for.' }),
      it('b', 'lamp', 0, 0.1, 0.3, 0, { title: 'graduation night', date: '2025-05-17', story: 'We said we would do this every year. So far: two for two.' }),
      it('c', 'cypress', 0, -0.92, 0.2), it('d', 'cypress', 0, 0.9, -0.3), it('e', 'tree', 0, 0.45, -0.15), it('f', 'bench', 0, 0.7, 0.3, -0.5), it('g', 'sunbush', 0, -0.25, 0.32), it('h', 'flag', 0, -0.15, -0.35),
    ],
  },
  {
    id: 'nora-sam', ratio: '1 / 1', title: 'eleven springs', people: 'nora + sam', sample: true,
    ring: { id: 'confetti', metal: null, accent: '#E8438C', text: 'again, please' },
    items: [
      it('a', 'blossom', 0, -0.2, -0.3, 0, { title: 'the tree outside the clinic', date: '2019-04-21', story: 'It was blooming the day we got the good news. We go back every April and stand under it like idiots.' }),
      it('b', 'picnic', 0, 0.35, 0.45, 0.3), it('c', 'umbrella', 0, 0.7, 0.05), it('d', 'blossom', 0, -0.8, 0.25), it('e', 'bush', 0, 0.2, -0.8), it('f', 'sunbush', 0, -0.4, 0.7), it('g', 'house', 0, 0.55, -0.55, -0.6),
    ],
  },
  {
    id: 'grandpa', ratio: '4 / 5', title: "grandpa's light", people: 'ellis family', sample: true,
    ring: { id: 'bombe', metal: null, accent: '#F6D54A', text: 'keep the light on' },
    items: [
      it('a', 'lighthouse', 0, -0.35, -0.35, 0, { title: 'keep the light on', date: '1998-07-04', story: 'He said it every time anyone left the house. It is on his ring. Now it is on ours.' }),
      it('b', 'house', 0, 0.45, -0.3, -0.5), it('c', 'tree', 0, -0.75, 0.25), it('d', 'bench', 0, 0.1, 0.45, 0.2), it('e', 'pond', 0, 0.6, 0.4), it('f', 'cypress', 0, 0.05, -0.85), it('g', 'lamp', 0, -0.3, 0.6),
    ],
  },
  {
    id: 'winter', ratio: '3 / 4', title: 'the cabin weekend', people: 'dev + priya', sample: true,
    ring: { id: 'toimoi', metal: 'silver', accent: '#8FD3E8', text: 'snowed in' },
    items: [
      it('a', 'cabin', 0, -0.1, -0.2, 0.6, { title: 'the power went out', date: '2025-01-18', story: 'So we cooked on the fire, lost at cards, and I decided.' }),
      it('b', 'cypress', 0, 0.42, 0.2), it('c', 'lamp', 0, -0.4, 0.35), it('d', 'house', 1, 0.1, -0.2, -0.6), it('e', 'cypress', 1, -0.42, 0.2), it('f', 'cypress', 1, 0.45, 0.25), it('g', 'mailbox', 1, 0.0, 0.5),
    ],
  },
  {
    id: 'plant-mom', ratio: '2 / 3', title: 'things we kept alive', people: 'ro + tess', sample: true,
    ring: { id: 'vine', metal: null, accent: '#3DBE8B', text: '' },
    items: [
      it('a', 'tree', 0, -0.25, -0.3, 0, { title: 'the fig that should have died', date: '2021-03-02', story: 'Bought on a whim, moved across three apartments, dropped once. It has outlived two couches.' }),
      it('b', 'domehouse', 0, 0.5, -0.45, -0.5), it('c', 'bush', 0, 0.75, 0.2), it('d', 'sunbush', 0, -0.75, 0.3), it('e', 'fountain', 0, 0.15, 0.5), it('f', 'tree', 0, -0.8, -0.35), it('g', 'bench', 0, -0.3, 0.75, 0.3),
    ],
  },
];

// Short prompts that sit between islands in Explore, like idea pins.
export const IDEAS = [
  { tone: 'lemon', hand: 'engrave it on the inside.', small: 'the island floats in the middle, so the words stay readable.' },
  { tone: 'sky', hand: 'pick a stone.', small: 'its colour becomes the crystal under your island.' },
  { tone: 'pink', hand: 'one piece, one memory.', small: 'a bench can be a three-hour phone call. you decide what it means.' },
];
