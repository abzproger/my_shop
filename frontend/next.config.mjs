const apiUrl = process.env.NEXT_PUBLIC_API_URL;
let apiPattern = null;

if (apiUrl) {
  try {
    const parsed = new URL(apiUrl);
    apiPattern = {
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {})
    };
  } catch {
    // Ignore invalid NEXT_PUBLIC_API_URL and keep fallback patterns.
  }
}

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "8000"
  }
];

if (apiPattern) {
  const alreadyAdded = remotePatterns.some(
    (pattern) =>
      pattern.protocol === apiPattern.protocol &&
      pattern.hostname === apiPattern.hostname &&
      (pattern.port ?? "") === (apiPattern.port ?? "")
  );
  if (!alreadyAdded) {
    remotePatterns.push(apiPattern);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns
  }
};

export default nextConfig;
