import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import "../envConfig";

const prisma = new PrismaClient();

const trustedURLs = process.env.BETTER_AUTH_TRUSTED_URLS?.split(",") || [];
const secret = process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite"
    }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: trustedURLs,
    secret: secret,
});