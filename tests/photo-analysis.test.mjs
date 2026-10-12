// Regression tests for src/lib/photo-analysis.ts, imported directly (Node
// strips the types). Run: node --test tests/photo-analysis.test.mjs
//
// Images are synthesised with sharp (installed with Next). The thresholds were
// calibrated separately against 125 real files: 18 listing photos plus
// WhatsApp-compressed, softened, dim/noisy, mildly/heavily/motion-blurred
// copies of each, and 14 real phone and desktop screenshots, direct and
// forwarded. Results: no acceptable photo rejected, no screenshot accepted,
// one mildly blurred photo accepted.
import test from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import sharp from "sharp";

import * as A from "../src/lib/photo-analysis.ts";

const SIZE = A.ANALYSIS_LONG_SIDE;

/** A textured, photo-like image: noise over broad gradients and shapes. */
async function photo(width = 2400, height = 1600, seed = 1) {
  const shapes = Array.from({ length: 14 }, (_, i) => {
    const x = (seed * 97 + i * 173) % width;
    const y = (seed * 59 + i * 131) % height;
    const hue = (seed * 40 + i * 37) % 360;
    return `<rect x="${x}" y="${y}" width="${200 + ((i * 71) % 500)}" height="${150 + ((i * 53) % 400)}" fill="hsl(${hue},45%,${35 + (i % 4) * 12}%)" transform="rotate(${(i * 17) % 40} ${x} ${y})"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#6a8caf"/><stop offset="1" stop-color="#c9b48a"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>${shapes}</svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const noise = await sharp({ create: { width, height, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 22 } } }).png().toBuffer();
  return sharp(base).composite([{ input: noise, blend: "overlay" }]).jpeg({ quality: 88 }).toBuffer();
}

async function analyse(buffer, fileName = "photo.jpg") {
  const meta = await sharp(buffer).metadata();
  const { data, info } = await sharp(buffer)
    .resize({ width: SIZE, height: SIZE, fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return A.analysePhoto({
    fileName,
    bytes: new Uint8Array(buffer),
    width: meta.width,
    height: meta.height,
    pixels: { width: info.width, height: info.height, data },
  });
}

const codes = (result) => result.issues.map((i) => i.code);

/** Insert a PNG tEXt chunk after IHDR, as Stable Diffusion front-ends do. */
function withPngText(png, keyword, text) {
  const body = Buffer.concat([Buffer.from(keyword, "latin1"), Buffer.from([0]), Buffer.from(text, "latin1")]);
  const type = Buffer.from("tEXt", "latin1");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([type, body])));
  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  return Buffer.concat([png.subarray(0, ihdrEnd), length, type, body, crc, png.subarray(ihdrEnd)]);
}

const xmp = (inner) =>
  `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:exif="http://ns.adobe.com/exif/1.0/">${inner}</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;

test("a sharp photo passes every check", async () => {
  const result = await analyse(await photo());
  assert.deepEqual(codes(result), []);
  assert.ok(result.metrics.sharpness > A.BLUR_THRESHOLD * 1.5, `sharpness ${result.metrics.sharpness}`);
  assert.ok(result.metrics.screenshotScore < A.SCREENSHOT_THRESHOLD);
});

test("an out-of-focus photo is rejected as blurry", async () => {
  const blurred = await sharp(await photo()).blur(6).jpeg().toBuffer();
  assert.deepEqual(codes(await analyse(blurred)), ["blurry"]);
});

test("camera shake (one-directional blur) is rejected as blurry", async () => {
  const k = 31;
  const kernel = [...Array(k).fill(0), ...Array(k).fill(1 / k), ...Array(k).fill(0)];
  const shaken = await sharp(await photo()).convolve({ width: k, height: 3, kernel }).jpeg().toBuffer();
  assert.ok(codes(await analyse(shaken)).includes("blurry"));
});

test("a small image is rejected for resolution", async () => {
  const small = await sharp(await photo()).resize(900).jpeg().toBuffer();
  assert.ok(codes(await analyse(small)).includes("low_resolution"));
});

test("a phone app screenshot is rejected, and so is a forwarded copy of it", async () => {
  // Flat app chrome with a photo card in it, at iPhone resolution.
  const card = await sharp(await photo(1050, 700)).png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532"><rect width="100%" height="100%" fill="#eef2f1"/>
    <rect y="0" width="1170" height="140" fill="#ffffff"/><rect x="60" y="1700" width="1050" height="200" rx="40" fill="#d8e6e2"/>
    <rect x="60" y="1960" width="700" height="60" rx="30" fill="#0f5c55"/><rect y="2330" width="1170" height="202" fill="#ffffff"/></svg>`;
  const shot = await sharp(Buffer.from(svg)).composite([{ input: card, left: 60, top: 300 }]).png().toBuffer();
  const direct = await analyse(shot, "IMG_4412.PNG");
  assert.ok(codes(direct).includes("screenshot"), direct.metrics.screenshotSignals.join("; "));

  const forwarded = await sharp(shot).resize({ height: 1600 }).jpeg({ quality: 70 }).toBuffer();
  const viaWhatsApp = await analyse(forwarded, "IMG-20260928-WA0003.jpg");
  assert.ok(codes(viaWhatsApp).includes("screenshot"), viaWhatsApp.metrics.screenshotSignals.join("; "));
});

test("an iPhone screenshot tag alone is enough", async () => {
  const tagged = await sharp(await photo()).withXmp(xmp("<exif:UserComment>Screenshot</exif:UserComment>")).jpeg().toBuffer();
  assert.ok(codes(await analyse(tagged)).includes("screenshot"));
});

test("a 16:9 web export of a real photo is not a screenshot", async () => {
  const exported = await sharp(await photo(3840, 2160)).resize(1920, 1080).jpeg({ quality: 82 }).toBuffer();
  assert.ok(!codes(await analyse(exported)).includes("screenshot"));
});

test("Stable Diffusion PNG parameters are detected as AI-generated", async () => {
  const png = await sharp(await photo()).png().toBuffer();
  const tagged = withPngText(png, "parameters", "modern villa, pool, golden hour\nNegative prompt: blurry\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1234");
  assert.ok(codes(await analyse(tagged, "villa.png")).includes("ai_generated"));
});

test("IPTC trainedAlgorithmicMedia (C2PA / XMP) is detected as AI-generated", async () => {
  const tagged = await sharp(await photo())
    .withXmp(xmp("<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>"))
    .jpeg()
    .toBuffer();
  const result = await analyse(tagged);
  assert.ok(codes(result).includes("ai_generated"));
  assert.ok(!codes(result).includes("ai_edited"));
});

test("generative fill (compositeWithTrainedAlgorithmicMedia) is flagged as AI-edited, not generated", async () => {
  const tagged = await sharp(await photo())
    .withXmp(xmp("<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>"))
    .jpeg()
    .toBuffer();
  const result = await analyse(tagged);
  assert.ok(codes(result).includes("ai_edited"));
  assert.ok(!codes(result).includes("ai_generated"));
});

test("non-AI source types and ordinary camera EXIF are not flagged", async () => {
  const camera = await sharp(await photo())
    .withExif({ IFD0: { Make: "Apple", Model: "iPhone 15 Pro", Software: "17.5.1" } })
    .withXmp(xmp("<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture</Iptc4xmpExt:DigitalSourceType>"))
    .jpeg()
    .toBuffer();
  const result = await analyse(camera);
  assert.deepEqual(codes(result), []);
  assert.equal(result.metrics.cameraMake, "Apple");
  assert.equal(result.metrics.cameraModel, "iPhone 15 Pro");
});

test("a resized, re-compressed copy hashes as the same photo; a different photo does not", async () => {
  const original = await photo(2400, 1600, 1);
  const copy = await sharp(original).resize(1600).modulate({ brightness: 1.1 }).jpeg({ quality: 65 }).toBuffer();
  const other = await photo(2400, 1600, 7);
  const [a, b, c] = await Promise.all([analyse(original), analyse(copy), analyse(other)]);
  assert.ok(A.hammingDistance(a.hash, b.hash) <= A.DUPLICATE_MAX_DISTANCE);
  assert.ok(A.hammingDistance(a.hash, c.hash) > A.DUPLICATE_MAX_DISTANCE * 2);
  assert.ok(A.hashBands(a.hash).some((band) => A.hashBands(b.hash).includes(band)));
});

test("hash bands: any two hashes within 3 bits share a band", () => {
  const base = "f0e1d2c3b4a59687";
  const flip = (hex, bit) => {
    const n = BigInt(`0x${hex}`) ^ (1n << BigInt(bit));
    return n.toString(16).padStart(16, "0");
  };
  const near = flip(flip(flip(base, 3), 20), 50);
  assert.equal(A.hammingDistance(base, near), 3);
  assert.ok(A.hashBands(base).some((band) => A.hashBands(near).includes(band)));
});

test("format sniffing recognises HEIC, which browsers other than Safari cannot open", () => {
  const heic = new Uint8Array([0, 0, 0, 0x18, ...Buffer.from("ftypheic"), 0, 0, 0, 0]);
  assert.equal(A.sniffFormat(heic), "heic");
  assert.equal(A.sniffFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
});
