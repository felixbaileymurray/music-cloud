import type { AlbumListen, ParseResult } from "@/lib/types";

/** How many covers the example cloud shows after sampling the pool. */
export const EXAMPLE_CLOUD_SIZE = 35;

/**
 * Preset album pool for the demo path. Names favour well-indexed catalogue
 * titles so Deezer/iTunes previews resolve reliably.
 */
export const EXAMPLE_ALBUM_POOL: AlbumListen[] = [
  { album: "Abbey Road", artist: "The Beatles", listenCount: 140 },
  { album: "Thriller", artist: "Michael Jackson", listenCount: 138 },
  { album: "Rumours", artist: "Fleetwood Mac", listenCount: 132 },
  { album: "The Dark Side of the Moon", artist: "Pink Floyd", listenCount: 130 },
  { album: "Nevermind", artist: "Nirvana", listenCount: 128 },
  { album: "OK Computer", artist: "Radiohead", listenCount: 126 },
  { album: "Blue", artist: "Joni Mitchell", listenCount: 124 },
  { album: "Purple Rain", artist: "Prince", listenCount: 122 },
  { album: "Back in Black", artist: "AC/DC", listenCount: 120 },
  { album: "Lemonade", artist: "Beyoncé", listenCount: 118 },
  { album: "To Pimp a Butterfly", artist: "Kendrick Lamar", listenCount: 116 },
  { album: "Channel Orange", artist: "Frank Ocean", listenCount: 114 },
  { album: "Blond", artist: "Frank Ocean", listenCount: 112 },
  { album: "My Beautiful Dark Twisted Fantasy", artist: "Kanye West", listenCount: 110 },
  { album: "The College Dropout", artist: "Kanye West", listenCount: 108 },
  { album: "good kid, m.A.A.d city", artist: "Kendrick Lamar", listenCount: 106 },
  { album: "Random Access Memories", artist: "Daft Punk", listenCount: 104 },
  { album: "Discovery", artist: "Daft Punk", listenCount: 102 },
  { album: "Currents", artist: "Tame Impala", listenCount: 100 },
  { album: "In Rainbows", artist: "Radiohead", listenCount: 98 },
  { album: "Kid A", artist: "Radiohead", listenCount: 96 },
  { album: "Homogenic", artist: "Björk", listenCount: 94 },
  { album: "Dummy", artist: "Portishead", listenCount: 92 },
  { album: "Mezzanine", artist: "Massive Attack", listenCount: 90 },
  { album: "Kind of Blue", artist: "Miles Davis", listenCount: 88 },
  { album: "A Love Supreme", artist: "John Coltrane", listenCount: 86 },
  { album: "What's Going On", artist: "Marvin Gaye", listenCount: 84 },
  { album: "Songs in the Key of Life", artist: "Stevie Wonder", listenCount: 82 },
  { album: "Off the Wall", artist: "Michael Jackson", listenCount: 80 },
  { album: "Legacy! Legacy!", artist: "Jamila Woods", listenCount: 78 },
  { album: "Ctrl", artist: "SZA", listenCount: 76 },
  { album: "SOS", artist: "SZA", listenCount: 74 },
  { album: "ANTI", artist: "Rihanna", listenCount: 72 },
  { album: "Future Nostalgia", artist: "Dua Lipa", listenCount: 70 },
  { album: "When We All Fall Asleep, Where Do We Go?", artist: "Billie Eilish", listenCount: 68 },
  { album: "Punisher", artist: "Phoebe Bridgers", listenCount: 66 },
  { album: "Melodrama", artist: "Lorde", listenCount: 64 },
  { album: "Pure Heroine", artist: "Lorde", listenCount: 62 },
  { album: "Norman Fucking Rockwell!", artist: "Lana Del Rey", listenCount: 60 },
  { album: "Born to Die", artist: "Lana Del Rey", listenCount: 58 },
  { album: "1989", artist: "Taylor Swift", listenCount: 56 },
  { album: "folklore", artist: "Taylor Swift", listenCount: 54 },
  { album: "After Hours", artist: "The Weeknd", listenCount: 52 },
  { album: "Starboy", artist: "The Weeknd", listenCount: 50 },
  { album: "AM", artist: "Arctic Monkeys", listenCount: 49 },
  { album: "Whatever People Say I Am, That's What I'm Not", artist: "Arctic Monkeys", listenCount: 48 },
  { album: "Is This It", artist: "The Strokes", listenCount: 47 },
  { album: "Turn On the Bright Lights", artist: "Interpol", listenCount: 46 },
  { album: "Funeral", artist: "Arcade Fire", listenCount: 45 },
  { album: "The Suburbs", artist: "Arcade Fire", listenCount: 44 },
  { album: "Yankee Hotel Foxtrot", artist: "Wilco", listenCount: 43 },
  { album: "Illinois", artist: "Sufjan Stevens", listenCount: 42 },
  { album: "Carrie & Lowell", artist: "Sufjan Stevens", listenCount: 41 },
  { album: "For Emma, Forever Ago", artist: "Bon Iver", listenCount: 40 },
  { album: "22, A Million", artist: "Bon Iver", listenCount: 39 },
  { album: "Vespertine", artist: "Björk", listenCount: 38 },
  { album: "Parachutes", artist: "Coldplay", listenCount: 36 },
  { album: "A Rush of Blood to the Head", artist: "Coldplay", listenCount: 35 },
  { album: "Origin of Symmetry", artist: "Muse", listenCount: 34 },
  { album: "Absolution", artist: "Muse", listenCount: 33 },
  { album: "Lateralus", artist: "Tool", listenCount: 32 },
  { album: "Ænima", artist: "Tool", listenCount: 31 },
  { album: "Master of Puppets", artist: "Metallica", listenCount: 30 },
  { album: "Ride the Lightning", artist: "Metallica", listenCount: 29 },
  { album: "The Joshua Tree", artist: "U2", listenCount: 28 },
  { album: "Achtung Baby", artist: "U2", listenCount: 27 },
  { album: "Graceland", artist: "Paul Simon", listenCount: 26 },
  { album: "Bridge Over Troubled Water", artist: "Simon & Garfunkel", listenCount: 25 },
  { album: "Pet Sounds", artist: "The Beach Boys", listenCount: 24 },
  { album: "Revolver", artist: "The Beatles", listenCount: 23 },
  { album: "Sgt. Pepper's Lonely Hearts Club Band", artist: "The Beatles", listenCount: 22 },
  { album: "London Calling", artist: "The Clash", listenCount: 21 },
  { album: "Never Mind the Bollocks, Here's the Sex Pistols", artist: "Sex Pistols", listenCount: 20 },
  { album: "The Rise and Fall of Ziggy Stardust and the Spiders From Mars", artist: "David Bowie", listenCount: 19 },
  { album: "Heroes", artist: "David Bowie", listenCount: 18 },
  { album: "Low", artist: "David Bowie", listenCount: 17 },
  { album: "Hounds of Love", artist: "Kate Bush", listenCount: 16 },
  { album: "The Kick Inside", artist: "Kate Bush", listenCount: 15 },
  { album: "Remain in Light", artist: "Talking Heads", listenCount: 14 },
  { album: "Speaking in Tongues", artist: "Talking Heads", listenCount: 13 },
  { album: "Exile on Main St.", artist: "The Rolling Stones", listenCount: 12 },
  { album: "Sticky Fingers", artist: "The Rolling Stones", listenCount: 11 },
  { album: "Led Zeppelin IV", artist: "Led Zeppelin", listenCount: 10 },
  { album: "Houses of the Holy", artist: "Led Zeppelin", listenCount: 9 },
  { album: "The Blueprint", artist: "Jay-Z", listenCount: 87 },
  { album: "Illmatic", artist: "Nas", listenCount: 85 },
  { album: "Ready to Die", artist: "The Notorious B.I.G.", listenCount: 83 },
  { album: "Enter the Wu-Tang (36 Chambers)", artist: "Wu-Tang Clan", listenCount: 81 },
  { album: "Madvillainy", artist: "Madvillain", listenCount: 79 },
  { album: "Donuts", artist: "J Dilla", listenCount: 77 },
  { album: "Since I Left You", artist: "The Avalanches", listenCount: 75 },
  { album: "Endtroducing.....", artist: "DJ Shadow", listenCount: 73 },
  { album: "Selected Ambient Works 85-92", artist: "Aphex Twin", listenCount: 71 },
  { album: "Untrue", artist: "Burial", listenCount: 69 },
  { album: "LP1", artist: "FKA twigs", listenCount: 67 },
  { album: "MAGDALENE", artist: "FKA twigs", listenCount: 65 },
  { album: "Desire, I Want To Turn Into You", artist: "Caroline Polachek", listenCount: 63 },
  { album: "Fetch the Bolt Cutters", artist: "Fiona Apple", listenCount: 61 },
  { album: "When the Pawn...", artist: "Fiona Apple", listenCount: 59 },
  { album: "Voodoo", artist: "D'Angelo", listenCount: 55 },
];

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

/** Random sample from the preset pool (default 35). */
export function sampleExampleAlbums(
  count = EXAMPLE_CLOUD_SIZE
): AlbumListen[] {
  const size = Math.min(count, EXAMPLE_ALBUM_POOL.length);
  return shuffleInPlace([...EXAMPLE_ALBUM_POOL]).slice(0, size);
}

export function buildExampleAlbumParseResult(): ParseResult {
  return {
    kind: "album",
    listens: sampleExampleAlbums(),
    skippedRows: 0,
    sourceLabel: "example cloud",
    issues: [],
  };
}
