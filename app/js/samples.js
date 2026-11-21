// Sample islands for Explore. These are made up by us so the page is not empty before a real community exists.
// They use the same snapshot shape a real shared island uses.
const H = Math.PI / 2;
const it = (id, type, a, r, memory, label) => ({ id, type, a, r, rot: 0, ...(memory ? { memory: { ...memory, public: true }, label: label || '' } : {}) });

export const SAMPLES = [
  {
    id: 'maya-june', ratio: '4 / 5', title: 'the lake house year', people: 'maya + june', sample: true,
    ring: { style: 'classic', metal: 'gold', finish: 'polished', stone: 'none', motif: 'heart', text: 'since 06.14' },
    scene: 'day',
    items: [
      it('a', 'cottage', H + 0.72, 2.55, { title: 'the first place that was ours', date: '2023-06-14', story: 'Third floor, no elevator, one window that stuck. We ate on the floor for a month and it was the best month.' }, 'apartment 3B'),
      it('b', 'signpost', H - 0.42, 2.95),
      it('c', 'dock', H + 2.5, 1.62, { title: 'the week at the lake', date: '2024-08-02', story: 'You swam out to the float and I pretended I was not timing how long you were gone.' }),
      it('d', 'oak', H + 1.6, 2.5), it('e', 'pine', -0.85, 2.9), it('f', 'flowers', H - 1.3, 2.3), it('g', 'bench', H - 2.1, 2.7), it('h', 'mailbox', H + 0.1, 3.0),
    ],
  },
  {
    id: 'room-214', ratio: '2 / 3', title: 'room 214, forever', people: 'the four of us', sample: true,
    ring: { style: 'flat', metal: 'silver', finish: 'brushed', stone: 'sapphire', motif: 'star', text: 'room 214' },
    scene: 'night',
    items: [
      it('a', 'observatory', H + 0.8, 2.55, { title: 'the roof we were not allowed on', date: '2022-10-09', story: 'Four blankets, one thermos, and a meteor shower nobody else on the floor stayed up for.' }),
      it('b', 'campfire', H - 0.7, 2.5, { title: 'graduation night', date: '2025-05-17', story: 'We said we would do this every year. So far: two for two.' }),
      it('c', 'tent', H - 1.7, 2.6), it('d', 'pine', H + 2.0, 2.8), it('e', 'pine', H + 2.5, 2.35), it('f', 'pine', -1.2, 2.9), it('g', 'signpost', H - 0.1, 3.0), it('h', 'sailboat', 1.0, 0.5),
    ],
  },
  {
    id: 'nora-sam', ratio: '1 / 1', title: 'eleven springs', people: 'nora + sam', sample: true,
    ring: { style: 'scallop', metal: 'rose', finish: 'polished', stone: 'rose', motif: 'leaf', text: 'again, please' },
    scene: 'golden',
    items: [
      it('a', 'blossom', H + 0.6, 2.5, { title: 'the tree outside the clinic', date: '2019-04-21', story: 'It was blooming the day we got the good news. We go back every April and stand under it like idiots.' }),
      it('b', 'picnic', H - 0.5, 2.5), it('c', 'balloon', H + 2.4, 2.6), it('d', 'blossom', H - 1.8, 2.8), it('e', 'flowers', H + 1.5, 2.3), it('f', 'cat', H - 1.1, 2.9), it('g', 'swing', -1.3, 2.5),
    ],
  },
  {
    id: 'grandpa', ratio: '4 / 5', title: "grandpa's light", people: 'ellis family', sample: true,
    ring: { style: 'classic', metal: 'gold', finish: 'hammered', stone: 'citrine', motif: 'sun', text: 'keep the light on' },
    scene: 'golden',
    items: [
      it('a', 'lighthouse', H + 0.75, 2.6, { title: 'keep the light on', date: '1998-07-04', story: 'He said it every time anyone left the house. It is on his ring. Now it is on ours.' }),
      it('b', 'dock', H - 1.2, 1.62), it('c', 'sailboat', 0.4, 0.55), it('d', 'cottage', H - 0.6, 2.55), it('e', 'oak', H + 2.2, 2.5), it('f', 'bench', H + 1.5, 2.9), it('g', 'signpost', H - 0.05, 3.02),
    ],
  },
  {
    id: 'winter', ratio: '3 / 4', title: 'the cabin weekend', people: 'dev + priya', sample: true,
    ring: { style: 'slim', metal: 'silver', finish: 'polished', stone: 'diamond', motif: 'moon', text: 'snowed in' },
    scene: 'snow',
    items: [
      it('a', 'campfire', H + 0.7, 2.5, { title: 'the power went out', date: '2025-01-18', story: 'So we cooked on the fire, lost at cards, and I decided.' }),
      it('b', 'cottage', H - 0.7, 2.55), it('c', 'pine', H + 1.6, 2.8), it('d', 'pine', H + 2.1, 2.4), it('e', 'pine', H - 1.7, 2.85), it('f', 'pine', -1.4, 2.4), it('g', 'mailbox', H - 0.05, 3.0),
    ],
  },
  {
    id: 'plant-mom', ratio: '2 / 3', title: 'things we kept alive', people: 'ro + tess', sample: true,
    ring: { style: 'twist', metal: 'gold', finish: 'polished', stone: 'emerald', motif: 'leaf', text: 'still growing' },
    scene: 'day',
    items: [
      it('a', 'oak', H + 0.72, 2.55, { title: 'the fig that should have died', date: '2021-03-02', story: 'Bought on a whim, moved across three apartments, dropped once. It has outlived two couches.' }),
      it('b', 'greenhouse', H - 0.6, 2.55), it('c', 'flowers', H + 1.6, 2.4), it('d', 'flowers', H - 1.5, 2.9), it('e', 'cat', H + 0.05, 2.95), it('f', 'bench', H + 2.4, 2.7), it('g', 'oak', -1.2, 2.6),
    ],
  },
];

// Short prompts that sit between islands in Explore, like idea pins.
export const IDEAS = [
  { tone: 'butter', hand: 'engrave the date you met.', small: 'it turns into a signpost at the edge of the island.' },
  { tone: 'blue', hand: 'pick a stone.', small: 'it tints the lagoon. sapphire runs deep blue, rose quartz goes pink.' },
  { tone: 'jade', hand: 'one piece, one memory.', small: 'a bench can be a three-hour phone call. you decide what it means.' },
];
