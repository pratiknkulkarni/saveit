import type {NextConfig} from "next";


const nextConfig: NextConfig = {
    // Emits .next/standalone with its own server.js — the container runs that,
    // not `next start`. Requires public/ and .next/static to be copied alongside.
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*"
            }
        ]
    },
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*",
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization",
                    },
                    {
                        key: "Access-Control-Allow-Credentials",
                        value: "true"
                    },
                ],
            },
        ]
    }
};

export default nextConfig;
