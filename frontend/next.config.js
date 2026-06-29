import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Pin Turbopack to the frontend app (avoids parent CRM lockfile as workspace root).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
