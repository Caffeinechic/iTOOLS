import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "../public/iTOOLS.svg");
const outPath = path.join(__dirname, "../public/brand-logo.png");

const svg = fs.readFileSync(svgPath, "utf8");
const match = svg.match(/xlink:href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);
if (!match) {
  console.error("PNG not found in SVG");
  process.exit(1);
}

const buf = Buffer.from(match[1], "base64");
fs.writeFileSync(outPath, buf);
console.log("Wrote", outPath, buf.length, "bytes");
console.log("Dimensions:", buf.readUInt32BE(16), "x", buf.readUInt32BE(20));
