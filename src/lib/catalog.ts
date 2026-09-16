import type { Album, Track } from "@/lib/types";

export const IMPORTED_ALBUM_ID = "imported";

export const albums: Album[] = [
  {
    id: "harbor-lights",
    title: "Harbor Lights",
    artist: "Marina Cole",
    year: 2019,
    genre: "Late-night jazz",
    liner:
      "Recorded after last call on a wet Tuesday in Lisbon. Brushes, upright bass, and a window left open on the estuary.",
    cover: {
      from: "#1b2a4a",
      to: "#c9893a",
      accent: "#f2d39a",
      motif: "rings",
    },
    trackIds: [
      "harbor-1",
      "harbor-2",
      "harbor-3",
      "harbor-4",
      "harbor-5",
    ],
  },
  {
    id: "second-floor-tape",
    title: "Second Floor Tape",
    artist: "Low Voltage",
    year: 2021,
    genre: "Lo-fi",
    liner:
      "A cassette left on a radiator. Soft drums, a detuned Rhodes, and the neighbour’s television bleeding through the wall.",
    cover: {
      from: "#3a2418",
      to: "#d9a15c",
      accent: "#f6e3c4",
      motif: "grid",
    },
    trackIds: ["tape-1", "tape-2", "tape-3", "tape-4"],
  },
  {
    id: "glass-orchard",
    title: "Glass Orchard",
    artist: "Iria Sol",
    year: 2018,
    genre: "Ambient",
    liner:
      "Sustained tones recorded in an empty greenhouse at dusk. No percussion. Plenty of condensation.",
    cover: {
      from: "#14352f",
      to: "#8fbfa8",
      accent: "#e7f4ea",
      motif: "arc",
    },
    trackIds: [
      "glass-1",
      "glass-2",
      "glass-3",
      "glass-4",
      "glass-5",
    ],
  },
  {
    id: "night-bus-east",
    title: "Night Bus East",
    artist: "Kestrel Line",
    year: 2022,
    genre: "Electronic",
    liner:
      "Built from the hum of a 24-hour route. Kick drums land where the bus hits the pothole on Mare Street.",
    cover: {
      from: "#221433",
      to: "#e06b4f",
      accent: "#f6c9a8",
      motif: "bars",
    },
    trackIds: ["bus-1", "bus-2", "bus-3", "bus-4"],
  },
  {
    id: "copper-and-rain",
    title: "Copper & Rain",
    artist: "The Mill Room",
    year: 2016,
    genre: "Folk",
    liner:
      "Two nylon-string guitars, one kitchen table, rain on a corrugated roof. The third voice is the weather.",
    cover: {
      from: "#4a1f14",
      to: "#c46a3a",
      accent: "#f3d7b0",
      motif: "split",
    },
    trackIds: [
      "copper-1",
      "copper-2",
      "copper-3",
      "copper-4",
      "copper-5",
    ],
  },
  {
    id: "atlas-static",
    title: "Atlas Static",
    artist: "Vanta Field",
    year: 2023,
    genre: "Post-rock",
    liner:
      "Long builds, short collapses. Guitar harmonics against a weather-radio sample from a storm that never made landfall.",
    cover: {
      from: "#12151c",
      to: "#6d8aa8",
      accent: "#d7e4f2",
      motif: "orbit",
    },
    trackIds: ["atlas-1", "atlas-2", "atlas-3", "atlas-4"],
  },
];

const seededTracks: Track[] = [
  { id: "harbor-1", albumId: "harbor-lights", title: "Last Sitting", duration: 16, src: "/audio/loop-harbor.mp3" },
  { id: "harbor-2", albumId: "harbor-lights", title: "Blue Lamp", duration: 16, src: "/audio/loop-linen.mp3" },
  { id: "harbor-3", albumId: "harbor-lights", title: "Tide Wall", duration: 16, src: "/audio/loop-drift.mp3" },
  { id: "harbor-4", albumId: "harbor-lights", title: "After the Ferry", duration: 16, src: "/audio/loop-ember.mp3" },
  { id: "harbor-5", albumId: "harbor-lights", title: "Keep the Tab Open", duration: 16, src: "/audio/loop-harbor.mp3" },
  { id: "tape-1", albumId: "second-floor-tape", title: "Side A Hiss", duration: 16, src: "/audio/loop-tape.mp3" },
  { id: "tape-2", albumId: "second-floor-tape", title: "Radiator Waltz", duration: 16, src: "/audio/loop-ember.mp3" },
  { id: "tape-3", albumId: "second-floor-tape", title: "Borrowed Headphones", duration: 16, src: "/audio/loop-linen.mp3" },
  { id: "tape-4", albumId: "second-floor-tape", title: "Rewind From Here", duration: 16, src: "/audio/loop-tape.mp3" },
  { id: "glass-1", albumId: "glass-orchard", title: "Condensation", duration: 16, src: "/audio/loop-glass.mp3" },
  { id: "glass-2", albumId: "glass-orchard", title: "Pear Trees After Dark", duration: 16, src: "/audio/loop-drift.mp3" },
  { id: "glass-3", albumId: "glass-orchard", title: "Frost on the Pane", duration: 16, src: "/audio/loop-linen.mp3" },
  { id: "glass-4", albumId: "glass-orchard", title: "Unwatered", duration: 16, src: "/audio/loop-glass.mp3" },
  { id: "glass-5", albumId: "glass-orchard", title: "Leaving the Door Unlatched", duration: 16, src: "/audio/loop-harbor.mp3" },
  { id: "bus-1", albumId: "night-bus-east", title: "Standee", duration: 16, src: "/audio/loop-bus.mp3" },
  { id: "bus-2", albumId: "night-bus-east", title: "Mare Street", duration: 16, src: "/audio/loop-signal.mp3" },
  { id: "bus-3", albumId: "night-bus-east", title: "Last Stop Request", duration: 16, src: "/audio/loop-atlas.mp3" },
  { id: "bus-4", albumId: "night-bus-east", title: "Doors Open on the Left", duration: 16, src: "/audio/loop-bus.mp3" },
  { id: "copper-1", albumId: "copper-and-rain", title: "Kitchen Table", duration: 16, src: "/audio/loop-copper.mp3" },
  { id: "copper-2", albumId: "copper-and-rain", title: "Corrugated Roof", duration: 16, src: "/audio/loop-ember.mp3" },
  { id: "copper-3", albumId: "copper-and-rain", title: "The Third Voice", duration: 16, src: "/audio/loop-linen.mp3" },
  { id: "copper-4", albumId: "copper-and-rain", title: "Borrowed Capo", duration: 16, src: "/audio/loop-copper.mp3" },
  { id: "copper-5", albumId: "copper-and-rain", title: "Leave the Porch Light", duration: 16, src: "/audio/loop-drift.mp3" },
  { id: "atlas-1", albumId: "atlas-static", title: "Weather Radio", duration: 16, src: "/audio/loop-atlas.mp3" },
  { id: "atlas-2", albumId: "atlas-static", title: "Grid Reference", duration: 16, src: "/audio/loop-signal.mp3" },
  { id: "atlas-3", albumId: "atlas-static", title: "Never Made Landfall", duration: 16, src: "/audio/loop-glass.mp3" },
  { id: "atlas-4", albumId: "atlas-static", title: "Static Map", duration: 16, src: "/audio/loop-atlas.mp3" },
];

export const tracksById: Record<string, Track> = Object.fromEntries(
  seededTracks.map((track) => [track.id, track])
);

export function getAlbum(id: string) {
  return albums.find((album) => album.id === id);
}

export function getAlbumTracks(album: Album) {
  return album.trackIds
    .map((id) => tracksById[id])
    .filter((track): track is Track => Boolean(track));
}

export function searchCatalog(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return albums;
  return albums.filter((album) => {
    const haystack = [
      album.title,
      album.artist,
      album.genre,
      album.year.toString(),
      ...getAlbumTracks(album).map((track) => track.title),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export const importedAlbumShell: Album = {
  id: IMPORTED_ALBUM_ID,
  title: "Imported",
  artist: "Your library",
  year: new Date().getFullYear(),
  genre: "Local files",
  liner:
    "Audio you brought in from this computer. Files stay in the browser — nothing is uploaded.",
  cover: {
    from: "#2a2118",
    to: "#e8c07a",
    accent: "#fff4dc",
    motif: "split",
  },
  trackIds: [],
};
