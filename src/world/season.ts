/**
 * The wood keeps the seasons of Brevard, North Carolina. The date there
 * decides what colour the leaves are and how much has fallen to the ground.
 */
export interface Season {
  name: string;
  /** Colours most trees take. */
  leaves: number[];
  /** Colours a few trees take, for contrast. */
  accents: number[];
  /** Share of trees that take an accent colour. */
  accentShare: number;
  /** How full the crowns are: 1 in summer, thin in winter. */
  fullness: number;
  /** Colour and amount (0..1) of fallen leaves on the ground. */
  litter: number;
  litterAmount: number;
  /** Ground colours: mossy shade and open grass. */
  ground: [number, number];
  /** Tints laid over the painted grass. */
  grass: number[];
  /** What is in flower: the colour of the small sprays and of the tall spikes. */
  sprayBloom: number;
  spikeBloom: number;
  /** How much is in flower compared with high summer. */
  bloomShare: number;
}

const SEASONS: Record<string, Season> = {
  winter: {
    name: 'winter',
    leaves: [0x6e5a48, 0x7d6650, 0x5c4c40, 0x8a7458],
    accents: [0x1f5d4a, 0x2a6a50], // the few evergreens
    accentShare: 0.2,
    fullness: 0.35,
    litter: 0x8a7458,
    litterAmount: 0.9,
    ground: [0x5c7146, 0x8d985a],
    grass: [0xa9b08c, 0xb8b894, 0x98a583, 0xc2bd96],
    sprayBloom: 0xf4f4ee, // snowdrops and hellebores
    spikeBloom: 0xe0527a, // camellias
    bloomShare: 0.3,
  },
  spring: {
    name: 'spring',
    leaves: [0x6fb85c, 0x8fcf6a, 0xa9d870, 0x57a653],
    accents: [0xf2b8cf, 0xffe3ec, 0xe9d36a], // blossom
    accentShare: 0.16,
    fullness: 0.85,
    litter: 0xa9984f,
    litterAmount: 0.3,
    ground: [0x4f9048, 0x90c060],
    grass: [0xb4dca0, 0xd0ecb0, 0xa6d296, 0xe0f0b8],
    sprayBloom: 0xf7b6d6, // phlox and spring beauty
    spikeBloom: 0xff5a4a, // fire pink
    bloomShare: 1,
  },
  summer: {
    name: 'summer',
    leaves: [0x1f6b52, 0x2f8552, 0x4fa457, 0x7fb95c, 0xa9c85e],
    accents: [0xe0a43c, 0xd07f62, 0xe9c75a],
    accentShare: 0.05,
    fullness: 1,
    litter: 0xa9984f,
    litterAmount: 0.45,
    ground: [0x4a8748, 0x86b257],
    grass: [0xa9c79a, 0xc4d8a6, 0x9dbf95, 0xd8e2b0],
    sprayBloom: 0xe9a6c8,
    spikeBloom: 0xe03a2e, // cardinal flower
    bloomShare: 1,
  },
  earlyFall: {
    name: 'early fall',
    leaves: [0x4fa457, 0x8fae4c, 0xd9b23c, 0xe08a2e, 0xc9582e],
    accents: [0x1f6b52, 0xa83224],
    accentShare: 0.2,
    fullness: 1,
    litter: 0xc98a2b,
    litterAmount: 0.7,
    ground: [0x548244, 0x94ae54],
    grass: [0xb4c890, 0xcfd69a, 0xa6bc88, 0xdcd89c],
    sprayBloom: 0xf2c230, // goldenrod
    spikeBloom: 0x7d4fc9, // ironweed
    bloomShare: 0.9,
  },
  lateFall: {
    name: 'late fall',
    leaves: [0x7a1c1a, 0x8f2a1e, 0x6a1620, 0x9c3320, 0x5e1418],
    accents: [0xb5651d, 0xc98a2b, 0x1f5d4a], // russet, amber, and the odd evergreen
    accentShare: 0.14,
    fullness: 0.9,
    litter: 0x8f3a22,
    litterAmount: 1,
    ground: [0x587a42, 0x93a352],
    grass: [0xb9c08a, 0xc9c78c, 0xa8b47e, 0xd6c98a],
    sprayBloom: 0x8a6fd6, // the last asters
    spikeBloom: 0xf2d23c, // witch hazel, in flower from October to December
    bloomShare: 0.6,
  },
};

function pick(): Season {
  // For trying out other seasons: add ?season=spring (or winter, summer, earlyFall, lateFall) to the address.
  const forced = new URLSearchParams(window.location.search).get('season');
  if (forced && SEASONS[forced]) return SEASONS[forced];

  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date());
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? 7);
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? 1);
  const date = month * 100 + day;
  if (date >= 1205 || date < 320) return SEASONS.winter;
  if (date < 601) return SEASONS.spring;
  if (date < 920) return SEASONS.summer;
  if (date < 1022) return SEASONS.earlyFall;
  return SEASONS.lateFall;
}

export const season: Season = pick();
