/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship raw .ts/.js sources — Next transpiles them.
  transpilePackages: [
    '@judge/engine',
    '@judge/catalog',
    '@judge/problems',
    '@judge/problem-schema',
    '@judge/trace',
    '@judge/queue',
    '@judge/llm',
  ],
  // pg-boss (used by API routes via @judge/queue) is a Node-only dependency.
  serverExternalPackages: ['pg-boss'],
};

export default nextConfig;
