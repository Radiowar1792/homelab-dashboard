import { createWriteStream, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

// CRC32 table
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function uint32BE(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcInput = Buffer.concat([typeBytes, dataBytes]);
  const crc = crc32(crcInput);
  return Buffer.concat([
    uint32BE(dataBytes.length),
    typeBytes,
    dataBytes,
    uint32BE(crc),
  ]);
}

function generatePNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bitDepth=8, colorType=2 (RGB), compression=0, filter=0, interlace=0
  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type: RGB
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter method
  ihdrData[12] = 0;  // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Build raw scanlines: filter byte 0x00 + RGB per pixel
  const scanline = Buffer.allocUnsafe(1 + width * 3);
  scanline[0] = 0; // filter type: None
  for (let x = 0; x < width; x++) {
    const offset = 1 + x * 3;
    scanline[offset]     = r;
    scanline[offset + 1] = g;
    scanline[offset + 2] = b;
  }

  // All rows are identical, so build the full raw image buffer
  const rawData = Buffer.allocUnsafe(height * scanline.length);
  for (let y = 0; y < height; y++) {
    scanline.copy(rawData, y * scanline.length);
  }

  // Compress with zlib deflate
  const compressed = deflateSync(rawData, { level: 9 });
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Background color: #0f0f17
const BG_R = 0x0f; // 15
const BG_G = 0x0f; // 15
const BG_B = 0x17; // 23

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = '/Users/batiste/Projects/homelab-dashboard/public/icons';

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

for (const size of sizes) {
  const filename = `${outputDir}/icon-${size}x${size}.png`;
  const png = generatePNG(size, size, BG_R, BG_G, BG_B);
  const ws = createWriteStream(filename);
  ws.write(png);
  ws.end();
  console.log(`Generated ${filename} (${png.length} bytes)`);
}

console.log('\nDone! All icons generated.');
