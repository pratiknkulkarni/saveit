import {beforeEach, describe, expect, it, vi} from "vitest";
import {searchAll} from "../search";
import {prisma} from "@/lib/prisma";

vi.mock("@/lib/auth-server", () => ({
    getCurrentUser: vi.fn().mockResolvedValue({id: "search-user-id", email: "search@test.com"}),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Server Action: Search", () => {

    beforeEach(async () => {
        await prisma.user.createMany({
            data: [
                {
                    id: "search-user-id",
                    name: "Search User",
                    email: "search@test.com",
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: "other-user-id",
                    name: "Other User",
                    email: "other@test.com",
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]
        });
    });

    describe("basic matching", () => {
        it("should find a bookmark by fuzzy title match", async () => {
            await prisma.bookmark.create({
                data: {url: "https://nextjs.org", title: "Next.js Documentation", userId: "search-user-id"}
            });

            const results = await searchAll("Documentation");

            expect(results.some(r => r.title === "Next.js Documentation")).toBe(true);
        });

        it("should find folders and tags alongside bookmarks", async () => {
            await prisma.folder.create({data: {name: "Reading List", userId: "search-user-id"}});
            await prisma.tag.create({data: {name: "Reading", userId: "search-user-id"}});

            const results = await searchAll("Reading");

            expect(results.some(r => r.type === "folder")).toBe(true);
            expect(results.some(r => r.type === "tag")).toBe(true);
        });

        it("should scope results to the current user", async () => {
            await prisma.bookmark.create({
                data: {url: "https://private.example", title: "Secret Bookmark", userId: "other-user-id"}
            });

            const results = await searchAll("Secret");

            expect(results).toEqual([]);
        });

        it("should return an empty array for a blank query", async () => {
            expect(await searchAll("   ")).toEqual([]);
            expect(await searchAll(undefined)).toEqual([]);
        });
    });

    // The query used to be interpolated straight into $queryRawUnsafe. Each case
    // below threw a syntax error that search.ts swallowed into [], which was
    // indistinguishable from "no results" / "pg_trgm missing".
    describe("SQL injection and quoting", () => {
        it("should match titles containing an apostrophe", async () => {
            await prisma.bookmark.create({
                data: {url: "https://example.com/obrien", title: "O'Brien on Databases", userId: "search-user-id"}
            });

            const results = await searchAll("O'Brien");

            expect(results.some(r => r.title === "O'Brien on Databases")).toBe(true);
        });

        it("should treat an injection payload as a literal search term", async () => {
            await prisma.bookmark.create({
                data: {url: "https://example.com", title: "Harmless", userId: "search-user-id"}
            });

            const results = await searchAll(`'; DROP TABLE "Bookmark"; --`);

            expect(results).toEqual([]);
            // the table — and the row — must still be there
            expect(await prisma.bookmark.count()).toBe(1);
        });

        it("should not let a payload escape the user scope", async () => {
            await prisma.bookmark.create({
                data: {url: "https://private.example", title: "Secret Bookmark", userId: "other-user-id"}
            });

            const results = await searchAll(`' OR '1'='1`);

            expect(results).toEqual([]);
        });

        it("should treat LIKE wildcards as literal characters", async () => {
            await prisma.bookmark.create({
                data: {url: "https://example.com/a", title: "100% cotton", userId: "search-user-id"}
            });

            // unescaped, the trailing % would make this an exact match
            expect(await searchAll("100%", "title", "exact")).toEqual([]);

            const results = await searchAll("100% cotton", "title", "exact");
            expect(results.map(r => r.title)).toEqual(["100% cotton"]);
        });
    });

    describe("match modes", () => {
        beforeEach(async () => {
            await prisma.bookmark.create({
                data: {url: "https://typescript.org", title: "TypeScript Handbook", userId: "search-user-id"}
            });
        });

        it("exact should require the whole value to match", async () => {
            expect(await searchAll("TypeScript Handbook", "title", "exact")).toHaveLength(1);
            expect(await searchAll("TypeScript", "title", "exact")).toEqual([]);
        });

        it("startsWith should match on a prefix", async () => {
            expect(await searchAll("TypeScript", "title", "startsWith")).toHaveLength(1);
            expect(await searchAll("Handbook", "title", "startsWith")).toEqual([]);
        });

        it("loose should tolerate a typo that fuzzy rejects", async () => {
            // word_similarity('Typescrpt', 'TypeScript Handbook') is exactly 0.7,
            // so it clears loose's 0.5 threshold but not fuzzy's `> 0.7`.
            expect(await searchAll("Typescrpt", "title", "fuzzy")).toEqual([]);

            const results = await searchAll("Typescrpt", "title", "loose");
            expect(results.some(r => r.title === "TypeScript Handbook")).toBe(true);
        });
    });
});
