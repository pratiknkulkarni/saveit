import {describe, it, expect, vi, beforeEach} from "vitest";
import {createNewTags, deleteTag, getFormattedTagsForBookmarks} from "../tags";
import {prisma} from "@/lib/prisma";

vi.mock("@/lib/auth-server", () => ({
    getCurrentUser: vi.fn().mockResolvedValue({id: "tag-user-id", email: "tags@test.com"}),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Server Action: Tags", () => {

    beforeEach(async () => {
        await prisma.user.create({
            data: {
                id: "tag-user-id",
                name: "Tag User",
                email: "tags@test.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    });

    describe("createNewTags", () => {
        it("should create new tags", async () => {
            const response = await createNewTags({tags: ["React", "NextJS"]});
            expect(response.success).toBe(true);
            // expect(response.data).toBe(2);

            const dbTags = await prisma.tag.findMany({where: {userId: "tag-user-id"}});
            expect(dbTags.map(t => t.name).sort()).toEqual(["NextJS", "React"]);
        });

        it("should reject duplicates", async () => {
            await prisma.tag.create({data: {name: "Duplicate", userId: "tag-user-id"}});

            const response = await createNewTags({tags: ["Duplicate", "Unique"]});
            expect(response.success).toBe(false);
            if (!response.success && 'duplicateTags' in response) {
                expect(response.duplicateTags).toContain("Duplicate");
            }
        });
    });

    describe("getFormattedTagsForBookmarks", () => {
        it("should retrieve tags mapped to bookmark IDs", async () => {
            const tag = await prisma.tag.create({data: {name: "Test Tag", userId: "tag-user-id"}});
            const bookmark = await prisma.bookmark.create({data: {url: "test.com", userId: "tag-user-id"}});

            await prisma.bookmarkTags.create({data: {bookmarkId: bookmark.id, tagId: tag.id}});

            const response = await getFormattedTagsForBookmarks([bookmark.id]);

            expect(response.success).toBe(true);
            if (response.success) {
                expect(response.data[0].bookmarkId).toBe(bookmark.id);
                expect(response.data[0].tagNames).toContain("Test Tag");
            }
        });

        it("should NOT return tags for other users' bookmarks", async () => {
            await prisma.user.create({
                data: {
                    id: "other",
                    email: "o@o.com",
                    name: "O",
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            const otherTag = await prisma.tag.create({data: {name: "Secret", userId: "other"}});
            const otherBookmark = await prisma.bookmark.create({data: {url: "secret.com", userId: "other"}});
            await prisma.bookmarkTags.create({data: {bookmarkId: otherBookmark.id, tagId: otherTag.id}});

            const response = await getFormattedTagsForBookmarks([otherBookmark.id]);

            expect(response.success).toBe(true);
            if (response.success) {
                expect(response.data[0].tagNames).toHaveLength(0);
            }
        });
    });

    describe("deleteTag", () => {
        it("should delete tag and unlink from bookmarks", async () => {
            const tag = await prisma.tag.create({data: {name: "Delete Me", userId: "tag-user-id"}});
            const bookmark = await prisma.bookmark.create({data: {url: "test.com", userId: "tag-user-id"}});
            await prisma.bookmarkTags.create({data: {bookmarkId: bookmark.id, tagId: tag.id}});

            const response = await deleteTag({tagId: tag.id});
            expect(response.success).toBe(true);

            const dbTag = await prisma.tag.findUnique({where: {id: tag.id}});
            expect(dbTag).toBeNull();

            const link = await prisma.bookmarkTags.findFirst({where: {tagId: tag.id}});
            expect(link).toBeNull();
        });
    });
});