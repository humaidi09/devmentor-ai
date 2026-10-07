import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this app so Next ignores unrelated lockfiles
  // elsewhere on the machine (silences the "multiple lockfiles" warning).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
