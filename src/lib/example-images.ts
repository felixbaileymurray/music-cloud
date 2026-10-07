/**
 * Preset architecture photos for Images → See an example.
 * Files live under `public/examples/architecture/` (Unsplash; see ATTRIBUTION.md).
 */

export const EXAMPLE_IMAGE_DIR = "/examples/architecture";

/** How many photos the example collage shows after sampling the pool. */
export const EXAMPLE_IMAGE_CLOUD_SIZE = 24;

export type ExampleImage = {
  /** Filename under `EXAMPLE_IMAGE_DIR`. */
  file: string;
  /** Tooltip / accessibility label. */
  label: string;
  photographer: string;
  /** Width ÷ height from the shipped JPEG. */
  aspectRatio: number;
};

/**
 * Architecture pool. Labels are short scene names; photographer credit is
 * kept for attribution, not shown on the canvas chip.
 */
export const EXAMPLE_IMAGE_POOL: ExampleImage[] = [
  {
    file: "01-white-modern-facade.jpg",
    label: "White modern facade",
    photographer: "Joel Filipe",
    aspectRatio: 1.5,
  },
  {
    file: "02-glass-tower.jpg",
    label: "Glass tower",
    photographer: "Joel Filipe",
    aspectRatio: 1.5,
  },
  {
    file: "03-brick-row.jpg",
    label: "Brick row",
    photographer: "Ricardo Gomez Angel",
    aspectRatio: 1.495,
  },
  {
    file: "04-office-interior.jpg",
    label: "Office interior",
    photographer: "Nastuh Abootalebi",
    aspectRatio: 1.4975,
  },
  {
    file: "05-open-plan-office.jpg",
    label: "Open-plan office",
    photographer: "Nastuh Abootalebi",
    aspectRatio: 1.4975,
  },
  {
    file: "06-glass-skyscraper.jpg",
    label: "Glass skyscraper",
    photographer: "Sean Pollock",
    aspectRatio: 1.5,
  },
  {
    file: "07-museum-hall.jpg",
    label: "Museum hall",
    photographer: "Cosmic Timetraveler",
    aspectRatio: 1.505,
  },
  {
    file: "08-stair-void.jpg",
    label: "Stair void",
    photographer: "Danist Soh",
    aspectRatio: 1.7787,
  },
  {
    file: "09-apartment-block.jpg",
    label: "Apartment block",
    photographer: "Ralph Ravi Kayden",
    aspectRatio: 0.75,
  },
  {
    file: "10-living-space.jpg",
    label: "Living space",
    photographer: "Sidekix Media",
    aspectRatio: 1.5,
  },
  {
    file: "11-house-facade.jpg",
    label: "House facade",
    photographer: "R Architecture",
    aspectRatio: 1.5075,
  },
  {
    file: "12-modern-home.jpg",
    label: "Modern home",
    photographer: "R Architecture",
    aspectRatio: 1.5,
  },
  {
    file: "13-interior-void.jpg",
    label: "Interior void",
    photographer: "R Architecture",
    aspectRatio: 1.4706,
  },
  {
    file: "14-white-kitchen.jpg",
    label: "White kitchen",
    photographer: "R Architecture",
    aspectRatio: 0.6667,
  },
  {
    file: "15-courtyard.jpg",
    label: "Courtyard",
    photographer: "Spacejoy",
    aspectRatio: 0.6667,
  },
  {
    file: "16-scandinavian-room.jpg",
    label: "Scandinavian room",
    photographer: "Frames For Your Heart",
    aspectRatio: 1.5,
  },
  {
    file: "17-minimal-interior.jpg",
    label: "Minimal interior",
    photographer: "Minh Pham",
    aspectRatio: 1.3333,
  },
  {
    file: "18-bedroom-light.jpg",
    label: "Bedroom light",
    photographer: "R Architecture",
    aspectRatio: 1.5,
  },
  {
    file: "19-desert-villa.jpg",
    label: "Desert villa",
    photographer: "Viral Amrutia",
    aspectRatio: 1.5,
  },
  {
    file: "20-hallway-doors.jpg",
    label: "Hallway doors",
    photographer: "Spacejoy",
    aspectRatio: 1.5,
  },
  {
    file: "21-timber-pavilion.jpg",
    label: "Timber pavilion",
    photographer: "Frames For Your Heart",
    aspectRatio: 1.2081,
  },
  {
    file: "22-bright-loft.jpg",
    label: "Bright loft",
    photographer: "R Architecture",
    aspectRatio: 1.4975,
  },
  {
    file: "23-studio-flat.jpg",
    label: "Studio flat",
    photographer: "Spacejoy",
    aspectRatio: 1.3433,
  },
  {
    file: "24-city-apartment.jpg",
    label: "City apartment",
    photographer: "Naomi Hébert",
    aspectRatio: 1.5,
  },
  {
    file: "25-bridge.jpg",
    label: "Bridge",
    photographer: "Pedro Lastra",
    aspectRatio: 1.6245,
  },
  {
    file: "26-library.jpg",
    label: "Library",
    photographer: "Susan Q Yin",
    aspectRatio: 1.5,
  },
  {
    file: "27-station.jpg",
    label: "Station",
    photographer: "Annie Spratt",
    aspectRatio: 1.5,
  },
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

/** Random sample from the architecture pool (default 24). */
export function sampleExampleImages(
  count = EXAMPLE_IMAGE_CLOUD_SIZE
): ExampleImage[] {
  const size = Math.min(count, EXAMPLE_IMAGE_POOL.length);
  return shuffleInPlace([...EXAMPLE_IMAGE_POOL]).slice(0, size);
}

export type ExampleStoredImage = {
  id: string;
  imageUrl: string;
  label: string;
  aspectRatio: number;
};

/** Build stored-image rows ready for the images collage apply path. */
export function buildExampleImageItems(
  count = EXAMPLE_IMAGE_CLOUD_SIZE
): ExampleStoredImage[] {
  return sampleExampleImages(count).map((image, index) => ({
    id: `example-arch-${image.file}-${index}`,
    imageUrl: `${EXAMPLE_IMAGE_DIR}/${image.file}`,
    label: image.label,
    aspectRatio: image.aspectRatio,
  }));
}
