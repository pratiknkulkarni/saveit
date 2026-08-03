import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import "../envConfig";

const trustedURLs = process.env.BETTER_AUTH_TRUSTED_URLS?.split(",") || [];
const secret = process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        // Was "sqlite" over a postgresql datasource. better-auth branches on this
        // to decide whether to apply Prisma's `mode: "insensitive"`, so fixing it
        // also makes email lookups case-insensitive.
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        // No email delivery is configured in this app, so per the better-auth docs,
        // omitting sendDeleteAccountVerification makes deletion immediate once the
        // current password is verified, rather than a token-based email flow.
        deleteUser: {
            enabled: true,
        },
    },
    trustedOrigins: trustedURLs,
    secret: secret,
});