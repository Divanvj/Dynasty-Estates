/**
 * Photo quality analysis for listing uploads.
 *
 * Everything here is a pure function over raw RGBA pixels or file bytes, with
 * no browser or Firebase imports, so the upload flow and `node --test` run the
 * same code (Node strips the types natively). Keep it import-free.
 *
 * The checks never touch the demo catalogue: they run only on files a seller or
 * agent uploads, so the Unsplash fixtures in property-data.ts are unaffected.
 */

export type Pixels = {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
};

export type PhotoIssueCode =
  | "unsupported_type"
  | "photo_limit"
  | "too_large"
  | "unreadable"
  | "low_resolution"
  | "blurry"
  | "screenshot"
  | "ai_generated"
  | "ai_edited"
  | "duplicate_in_batch"
  | "duplicate_existing";

export type PhotoIssue = {
  code: PhotoIssueCode;
  /** Short heading shown on the rejection card. */
  title: string;
  /** What we found, in plain language. */
  detail: string;
  /** What the uploader should do instead. */
  fix: string;
};

/** Measurements kept with the photo so a moderator can see why it passed. */
export type PhotoMetrics = {
  width: number;
  height: number;
  format: ImageFormat;
  sharpness: number;
  screenshotScore: number;
  screenshotSignals: string[];
  aiMarkers: string[];
  cameraMake?: string;
  cameraModel?: string;
};

export type ImageFormat = "jpeg" | "png" | "webp" | "heic" | "gif" | "unknown";

// ---------------------------------------------------------------------------
// Thresholds. Calibrated against real listing photos and real screenshots in
// tests/photo-analysis.test.mjs; change them there first.
// ---------------------------------------------------------------------------

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MIN_LONG_SIDE = 1024;
export const MIN_SHORT_SIDE = 640;
/** Long side the browser downscales to before measuring. */
export const ANALYSIS_LONG_SIDE = 640;
/**
 * Below this, the sharpest part of the frame is still soft. Calibration: heavy
 * and motion blur scored under 56, mild blur (σ2.5 at 1600px) a median of 44,
 * while acceptable soft phone photos (σ1.0) scored 151 and up.
 */
export const BLUR_THRESHOLD = 100;
export const SCREENSHOT_THRESHOLD = 0.6;
/** dHash bits that may differ for two files to count as the same photo. */
export const DUPLICATE_MAX_DISTANCE = 6;

// ---------------------------------------------------------------------------
// File sniffing and metadata
// ---------------------------------------------------------------------------

export function sniffFormat(bytes: Uint8Array): ImageFormat {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  const tag = latin1(bytes, 0, 12);
  if (tag.startsWith("RIFF") && tag.slice(8, 12) === "WEBP") return "webp";
  if (/^....ftyp(heic|heix|hevc|mif1|msf1|avif)/.test(tag)) return "heic";
  return "unknown";
}

function latin1(bytes: Uint8Array, start: number, end: number): string {
  let out = "";
  const stop = Math.min(end, bytes.length);
  // Chunked so a multi-megabyte slice does not overflow the argument limit.
  for (let i = Math.max(0, start); i < stop; i += 8192) {
    out += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + 8192, stop))));
  }
  return out;
}

/**
 * The parts of a file where metadata lives. JPEG and PNG put it before the
 * image data, but some writers append chunks, so the tail is read too.
 */
function metadataText(bytes: Uint8Array): string {
  const HEAD = 768 * 1024;
  const TAIL = 256 * 1024;
  if (bytes.length <= HEAD + TAIL) return latin1(bytes, 0, bytes.length);
  return latin1(bytes, 0, HEAD) + latin1(bytes, bytes.length - TAIL, bytes.length);
}

type Marker = { pattern: RegExp; label: string; kind: "generated" | "edited" };

/**
 * Tags that generators and editors write into the files they produce. Order
 * matters: the composite (edited) source type must be tested before the bare
 * one, because the bare string is a substring of it.
 */
const AI_MARKERS: Marker[] = [
  { pattern: /compositeWithTrainedAlgorithmicMedia/, label: "Content Credentials: edited with generative AI", kind: "edited" },
  { pattern: /(?<!compositeWith)trainedAlgorithmicMedia/, label: "Content Credentials: created by generative AI", kind: "generated" },
  { pattern: /Steps: \d+, Sampler: /, label: "Stable Diffusion generation parameters", kind: "generated" },
  { pattern: /"class_type"\s*:\s*"(KSampler|CheckpointLoader)/, label: "ComfyUI workflow", kind: "generated" },
  { pattern: /invokeai_metadata|sd-metadata/, label: "InvokeAI metadata", kind: "generated" },
  { pattern: /Midjourney/i, label: "Midjourney", kind: "generated" },
  { pattern: /DALL(-|Â·|·| )E/, label: "DALL·E", kind: "generated" },
  { pattern: /Adobe Firefly/i, label: "Adobe Firefly", kind: "generated" },
  { pattern: /Stable Diffusion/i, label: "Stable Diffusion", kind: "generated" },
  { pattern: /NovelAI/, label: "NovelAI", kind: "generated" },
  { pattern: /Ideogram/i, label: "Ideogram", kind: "generated" },
  { pattern: /Leonardo\.Ai/i, label: "Leonardo.Ai", kind: "generated" },
  { pattern: /Bing Image Creator|Microsoft Designer/, label: "Microsoft Designer / Bing Image Creator", kind: "generated" },
  { pattern: /Google Imagen|Made with Google AI|Edited with Google AI/, label: "Google AI", kind: "edited" },
];

export type AiMarkerResult = { generated: string[]; edited: string[] };

export function findAiMarkers(bytes: Uint8Array): AiMarkerResult {
  const text = metadataText(bytes);
  const generated: string[] = [];
  const edited: string[] = [];
  for (const marker of AI_MARKERS) {
    if (marker.pattern.test(text)) {
      (marker.kind === "generated" ? generated : edited).push(marker.label);
    }
  }
  return { generated, edited };
}

export type CameraExif = { make?: string; model?: string; software?: string };

/**
 * Reads Make / Model / Software from a JPEG's EXIF block. A camera or phone
 * always writes Make; screenshots and exported graphics do not. Messaging apps
 * strip EXIF from real photos too, so absence is only a weak signal.
 */
export function readCameraExif(bytes: Uint8Array): CameraExif {
  if (sniffFormat(bytes) !== "jpeg") return {};
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return {};
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xda) return {}; // start of scan: no more metadata
    if (marker === 0xe1 && latin1(bytes, offset + 4, offset + 10) === "Exif\0\0") {
      return parseTiff(bytes, offset + 10, offset + 2 + length);
    }
    offset += 2 + length;
  }
  return {};
}

function parseTiff(bytes: Uint8Array, start: number, end: number): CameraExif {
  const little = bytes[start] === 0x49;
  const u16 = (at: number) =>
    little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1];
  const u32 = (at: number) =>
    little
      ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0
      : ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;

  const ifd = start + u32(start + 4);
  if (ifd + 2 > end) return {};
  const count = u16(ifd);
  const result: CameraExif = {};
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) break;
    const tag = u16(entry);
    const type = u16(entry + 2);
    const length = u32(entry + 4);
    if (type !== 2 || (tag !== 0x010f && tag !== 0x0110 && tag !== 0x0131)) continue;
    const valueAt = length <= 4 ? entry + 8 : start + u32(entry + 8);
    if (valueAt + length > end) continue;
    const value = latin1(bytes, valueAt, valueAt + length).replace(/\0+$/, "").trim();
    if (!value) continue;
    if (tag === 0x010f) result.make = value;
    else if (tag === 0x0110) result.model = value;
    else result.software = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Pixel measurements
// ---------------------------------------------------------------------------

function toGray({ width, height, data }: Pixels): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < gray.length; i += 1, p += 4) {
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return gray;
}

/**
 * Sharpness of the sharpest part of the frame, measured along its weakest
 * axis. Per 32px tile, take the variance of the horizontal and the vertical
 * second derivative and keep the smaller one, then report the 90th percentile
 * tile.
 *
 * - Per tile, because a crisp photo of a plain white wall has little detail
 *   overall; a genuinely blurry photo has no crisp tile anywhere.
 * - Weakest axis, because camera shake smears one direction and leaves the
 *   other crisp, which a plain Laplacian averages back up to "sharp".
 *
 * Measure at ANALYSIS_LONG_SIDE so scores are comparable between files.
 */
export function measureSharpness(pixels: Pixels): number {
  const { width: w, height: h } = pixels;
  const gray = toGray(pixels);
  const TILE = 32;
  const scores: number[] = [];
  for (let ty = 1; ty + TILE <= h - 1; ty += TILE) {
    for (let tx = 1; tx + TILE <= w - 1; tx += TILE) {
      let sx = 0, sxx = 0, sy = 0, syy = 0;
      for (let y = ty; y < ty + TILE; y += 1) {
        for (let x = tx; x < tx + TILE; x += 1) {
          const i = y * w + x;
          const dxx = 2 * gray[i] - gray[i - 1] - gray[i + 1];
          const dyy = 2 * gray[i] - gray[i - w] - gray[i + w];
          sx += dxx;
          sxx += dxx * dxx;
          sy += dyy;
          syy += dyy * dyy;
        }
      }
      const n = TILE * TILE;
      const varX = sxx / n - (sx / n) ** 2;
      const varY = syy / n - (sy / n) ** 2;
      scores.push(Math.min(varX, varY));
    }
  }
  if (scores.length === 0) return 0;
  scores.sort((a, b) => a - b);
  // Derivatives scale with contrast, so a dim room shot on a phone would read
  // as blurry. Normalise to a 200-level tonal range (1st to 99th percentile).
  const range = Math.max(40, tonalRange(gray));
  const normalised = scores[Math.floor(scores.length * 0.9)] * (200 / range) ** 2;
  return Math.round(normalised * 10) / 10;
}

function tonalRange(gray: Float32Array): number {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < gray.length; i += 1) histogram[Math.min(255, Math.round(gray[i]))] += 1;
  const cut = gray.length * 0.01;
  let low = 0;
  let high = 255;
  for (let seen = 0; low < 255 && (seen += histogram[low]) < cut; low += 1);
  for (let seen = 0; high > 0 && (seen += histogram[high]) < cut; high -= 1);
  return high - low;
}

/** Portrait sizes phones capture their own screen at. No camera shoots these. */
const PHONE_SCREENS = [
  "720x1520", "720x1560", "720x1600", "750x1334", "828x1792", "1080x2160", "1080x2280", "1080x2340", "1080x2400", "1080x2408", "1080x2412",
  "1080x2460", "1125x2436", "1170x2532", "1179x2556", "1206x2622", "1242x2208",
  "1242x2688", "1284x2778", "1290x2796", "1320x2868", "1440x2560", "1440x2960",
  "1440x3040", "1440x3088", "1440x3120", "1440x3200",
];

/**
 * Tablet and desktop screens. Weaker evidence: photographers also export for
 * the web at 1920x1080 and 2560x1440.
 */
const OTHER_SCREENS = [
  "1280x720", "1280x800", "1280x1024", "1366x768", "1440x900", "1536x864",
  "1600x900", "1680x1050", "1920x1080", "1920x1200", "2256x1504", "2560x1440",
  "2560x1600", "2736x1824", "2880x1800", "2880x1920", "3024x1964", "3456x2234",
  "3840x2160", "1536x2048", "1620x2160", "1640x2360", "1668x2224", "1668x2388",
  "2048x2732", "1200x1920", "1600x2560", "800x1280",
];

function matchesScreen(list: string[], width: number, height: number): boolean {
  return list.includes(`${width}x${height}`) || list.includes(`${height}x${width}`);
}

/**
 * Share of 8x8 blocks that are one exact colour and not blown-out white or
 * crushed black. Interface backgrounds are perfectly flat; even a plain wall
 * in a photo carries sensor noise and gradients.
 */
export function measureFlatBlocks({ width, height, data }: Pixels): number {
  const B = 8;
  let flat = 0;
  let total = 0;
  for (let by = 0; by + B <= height; by += B) {
    for (let bx = 0; bx + B <= width; bx += B) {
      total += 1;
      const first = (by * width + bx) * 4;
      const r = data[first];
      const g = data[first + 1];
      const b = data[first + 2];
      const lum = (r + g + b) / 3;
      if (lum > 247 || lum < 8) continue;
      let same = true;
      for (let y = by; y < by + B && same; y += 1) {
        for (let x = bx; x < bx + B; x += 1) {
          const p = (y * width + x) * 4;
          if (Math.abs(data[p] - r) > 1 || Math.abs(data[p + 1] - g) > 1 || Math.abs(data[p + 2] - b) > 1) {
            same = false;
            break;
          }
        }
      }
      if (same) flat += 1;
    }
  }
  return total === 0 ? 0 : Math.round((flat / total) * 1000) / 1000;
}

/**
 * Share of rows in the top and bottom quarter that are one colour edge to
 * edge: letterbox bars around a photo in a gallery app, or the empty bands of
 * an app screen. Black counts here, unlike measureFlatBlocks, because a
 * letterbox is black. A photo can have a blown-out sky at the top, but not a
 * flat band at the top and the bottom.
 */
export function measureFlatRows({ width, height, data }: Pixels): { top: number; bottom: number } {
  const band = Math.floor(height / 4);
  const isFlat = (y: number) => {
    const first = y * width * 4;
    let off = 0;
    for (let x = 1; x < width; x += 1) {
      const p = first + x * 4;
      if (Math.abs(data[p] - data[first]) > 4 || Math.abs(data[p + 1] - data[first + 1]) > 4 || Math.abs(data[p + 2] - data[first + 2]) > 4) {
        off += 1;
        if (off > width * 0.01) return false;
      }
    }
    return true;
  };
  let top = 0;
  let bottom = 0;
  for (let y = 0; y < band; y += 1) {
    if (isFlat(y)) top += 1;
    if (isFlat(height - 1 - y)) bottom += 1;
  }
  return band === 0
    ? { top: 0, bottom: 0 }
    : { top: Math.round((top / band) * 1000) / 1000, bottom: Math.round((bottom / band) * 1000) / 1000 };
}

export type ScreenshotInput = {
  /** Original file dimensions, before any downscale. */
  width: number;
  height: number;
  format: ImageFormat;
  fileName: string;
  exif: CameraExif;
  metadata: string;
  /** Downscaled pixels, as used for the other measurements. */
  pixels: Pixels;
};

export function scoreScreenshot(input: ScreenshotInput): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;
  const add = (weight: number, signal: string) => {
    score += weight;
    signals.push(signal);
  };

  // iOS writes this into every screenshot's XMP.
  if (/UserComment[^<]*>\s*Screenshot\s*</.test(input.metadata) || /<rdf:li[^>]*>Screenshot<\/rdf:li>/.test(input.metadata)) {
    add(0.7, "iPhone screenshot tag");
  }
  if (/screen ?shot|screen[_-]?capture|scrnli|snip/i.test(input.fileName)) {
    add(0.35, "file named as a screenshot");
  }
  const aspect = Math.max(input.width, input.height) / Math.min(input.width, input.height);
  if (matchesScreen(PHONE_SCREENS, input.width, input.height)) {
    add(0.45, `exact phone screen size (${input.width}×${input.height})`);
  } else if (matchesScreen(OTHER_SCREENS, input.width, input.height)) {
    add(0.2, `exact screen size (${input.width}×${input.height})`);
  } else if (aspect >= 1.95 && aspect <= 2.4) {
    // Phone cameras shoot 4:3 or 16:9 (1.78). Taller than 1.95 is the shape of
    // a phone screen, which survives the resize a forwarded screenshot gets.
    add(input.height > input.width ? 0.3 : 0.2, "the shape of a phone screen");
  }

  const flat = measureFlatBlocks(input.pixels);
  // Real listing photos measured at most 8% here.
  if (flat >= 0.4) add(0.55, `${Math.round(flat * 100)}% flat interface colour`);
  else if (flat >= 0.2) add(0.45,`${Math.round(flat * 100)}% flat interface colour`);
  else if (flat >= 0.12) add(0.25, `${Math.round(flat * 100)}% flat interface colour`);

  const rows = measureFlatRows(input.pixels);
  if (rows.top >= 0.15 && rows.bottom >= 0.15) add(0.35, "solid bars above and below the picture");

  if (input.format === "png") add(0.15, "PNG, the format screenshots save as");
  if (!input.exif.make) add(0.1, "no camera information");

  return { score: Math.round(Math.min(score, 1) * 100) / 100, signals };
}

// ---------------------------------------------------------------------------
// Duplicate fingerprints
// ---------------------------------------------------------------------------

/**
 * 64-bit difference hash as 16 hex characters. Survives resizing, JPEG
 * re-compression and small colour edits, which is how a copied listing photo
 * usually arrives.
 */
export function differenceHash(pixels: Pixels): string {
  const gray = toGray(pixels);
  const cols = 9;
  const rows = 8;
  const cells = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy += 1) {
    const y0 = Math.floor((cy * pixels.height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * pixels.height) / rows));
    for (let cx = 0; cx < cols; cx += 1) {
      const x0 = Math.floor((cx * pixels.width) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * pixels.width) / cols));
      let sum = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) sum += gray[y * pixels.width + x];
      }
      cells[cy * cols + cx] = sum / ((y1 - y0) * (x1 - x0));
    }
  }
  let hex = "";
  for (let cy = 0; cy < rows; cy += 1) {
    let byte = 0;
    for (let cx = 0; cx < 8; cx += 1) {
      byte = (byte << 1) | (cells[cy * cols + cx] > cells[cy * cols + cx + 1] ? 1 : 0);
    }
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export function hammingDistance(a: string, b: string): number {
  let distance = 0;
  for (let i = 0; i < 16; i += 4) {
    let x = parseInt(a.slice(i, i + 4), 16) ^ parseInt(b.slice(i, i + 4), 16);
    while (x) {
      distance += x & 1;
      x >>>= 1;
    }
  }
  return distance;
}

/**
 * Four 16-bit bands for an indexed lookup. Two hashes within 3 bits of each
 * other must share a band (pigeonhole), so a Firestore `array-contains-any`
 * over these finds every re-save of a photo without scanning the collection.
 */
export function hashBands(hash: string): string[] {
  return [0, 1, 2, 3].map((i) => `${i}:${hash.slice(i * 4, i * 4 + 4)}`);
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

export type AnalysisInput = {
  fileName: string;
  bytes: Uint8Array;
  /** Original dimensions. */
  width: number;
  height: number;
  /** Downscaled to ANALYSIS_LONG_SIDE. */
  pixels: Pixels;
};

export type AnalysisResult = {
  issues: PhotoIssue[];
  metrics: PhotoMetrics;
  hash: string;
};

/**
 * Pluggable hook for a model-based AI-image detector. None is configured: the
 * only AI check today is the metadata one above. A provider (Sightengine,
 * Hive, a vision model behind an API route) implements this and is added to
 * `aiDetectors` in photo-intake.ts; the UI needs no change.
 */
export type AiImageDetector = {
  name: string;
  /** Resolves to a reason string when the image is judged AI-generated. */
  detect: (file: Blob) => Promise<string | null>;
};

export function analysePhoto(input: AnalysisInput): AnalysisResult {
  const issues: PhotoIssue[] = [];
  const format = sniffFormat(input.bytes);
  const exif = readCameraExif(input.bytes);
  const metadata = metadataText(input.bytes);

  const longSide = Math.max(input.width, input.height);
  const shortSide = Math.min(input.width, input.height);
  if (longSide < MIN_LONG_SIDE || shortSide < MIN_SHORT_SIDE) {
    issues.push({
      code: "low_resolution",
      title: "Resolution too low",
      detail: `This photo is ${input.width}×${input.height} pixels. Listings need at least ${MIN_LONG_SIDE}×${MIN_SHORT_SIDE} to look sharp on a buyer's screen.`,
      fix: "Upload the original from your camera or phone. Photos saved from WhatsApp or social media are shrunk.",
    });
  }

  const sharpness = measureSharpness(input.pixels);
  if (sharpness < BLUR_THRESHOLD) {
    issues.push({
      code: "blurry",
      title: "Photo is blurry",
      detail: "Even the sharpest part of this photo is out of focus, or the camera moved while it was taken.",
      fix: "Retake it with the phone held steady, tap the screen to focus, and make sure the lens is clean.",
    });
  }

  const screenshot = scoreScreenshot({
    width: input.width,
    height: input.height,
    format,
    fileName: input.fileName,
    exif,
    metadata,
    pixels: input.pixels,
  });
  if (screenshot.score >= SCREENSHOT_THRESHOLD) {
    issues.push({
      code: "screenshot",
      title: "This is a screenshot",
      detail: "Screenshots carry the look of another app or website and lose most of the photo's quality.",
      fix: "Upload the original photo file instead of a screenshot of it.",
    });
  }

  const ai = findAiMarkers(input.bytes);
  if (ai.generated.length > 0) {
    issues.push({
      code: "ai_generated",
      title: "AI-generated image",
      detail: `This file is tagged as made by an image generator (${ai.generated.join(", ")}). Buyers must see the real property.`,
      fix: "Upload a real photograph of the property.",
    });
  } else if (ai.edited.length > 0) {
    issues.push({
      code: "ai_edited",
      title: "Edited with generative AI",
      detail: `This photo is tagged as altered by a generative AI tool (${ai.edited.join(", ")}). Added or removed objects misrepresent the property.`,
      fix: "Upload the unedited photo. Brightness and colour corrections are fine; generated content is not.",
    });
  }

  return {
    issues,
    hash: differenceHash(input.pixels),
    metrics: {
      width: input.width,
      height: input.height,
      format,
      sharpness,
      screenshotScore: screenshot.score,
      screenshotSignals: screenshot.signals,
      aiMarkers: [...ai.generated, ...ai.edited],
      cameraMake: exif.make,
      cameraModel: exif.model,
    },
  };
}

export function duplicateIssue(where: "batch" | "existing"): PhotoIssue {
  return where === "batch"
    ? {
        code: "duplicate_in_batch",
        title: "Duplicate photo",
        detail: "You've already added this photo to this listing, possibly resized or re-saved.",
        fix: "Remove the copy, or replace it with a different angle or room.",
      }
    : {
        code: "duplicate_existing",
        title: "Photo already used on Dynasty Estates",
        detail: "This photo already appears on another listing on Dynasty Estates.",
        fix: "Upload your own photos of this property. If the other listing is yours, contact support to transfer it.",
      };
}
