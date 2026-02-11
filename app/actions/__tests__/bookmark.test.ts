import {describe, it, expect, vi, beforeEach} from "vitest";
import {createBookmark, deleteBookmarkByUserId, updateBookmark} from "../bookmark";
import {prisma} from "@/lib/prisma";

vi.mock("@/lib/auth-server", () => ({
    getCurrentUser: vi.fn().mockResolvedValue({id: "test-user-id", email: "test@example.com"}),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Server Action: createBookmark", () => {
    beforeEach(async () => {
        await prisma.user.create({
            data: {
                id: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    });

    it("should create a bookmark successfully", async () => {
        const formData = new FormData();
        formData.append("url", "https://google.com");
        formData.append("title", "Google");
        formData.append("tags", JSON.stringify([]));

        const response = await createBookmark(formData);

        if (!response.success) {
            console.error("Test Failure Error:", response.error);
        }

        expect(response.success).toBe(true);
        if (response.success) {
            expect(response.data.url).toBe("https://google.com");
            expect(response.data.userId).toBe("test-user-id");
        }

        const dbBookmark = await prisma.bookmark.findFirst({
            where: {url: "https://google.com"}
        });
        expect(dbBookmark).toBeDefined();
    });

    it("should fail with invalid URL", async () => {
        const formData = new FormData();
        formData.append("url", "not-a-url");

        const response = await createBookmark(formData);

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toBe("Invalid input");
        }
    });

    it("should delete own bookmark successfully", async () => {
        const bookmark = await prisma.bookmark.create({
            data: {
                url: "https://delete-me.com",
                userId: "test-user-id"
            }
        });

        const response = await deleteBookmarkByUserId(bookmark.id);

        expect(response.success).toBe(true);
        const deleted = await prisma.bookmark.findFirst({where: {id: bookmark.id}});
        expect(deleted).toBeNull();
    });

    it("should NOT delete someone else's bookmark", async () => {
        await prisma.user.create({
            data: {
                id: "victim-id",
                name: "Victim",
                email: "victim@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        const victimBookmark = await prisma.bookmark.create({
            data: {
                url: "https://victim-data.com",
                userId: "victim-id"
            }
        });

        const response = await deleteBookmarkByUserId(victimBookmark.id);

        expect(response.success).toBe(false);

        const stillExists = await prisma.bookmark.findFirst({where: {id: victimBookmark.id}});
        expect(stillExists).toBeDefined();
    });

    it("should create a bookmark WITH tags", async () => {
        // 1. Create a Tag in the DB first (since we connect to existing tags)
        const tag = await prisma.tag.create({
            data: {name: "Tech", userId: "test-user-id"}
        });

        // 2. Create Bookmark with the Tag
        const formData = new FormData();
        formData.append("url", "https://tagged-url.com");
        formData.append("title", "Tagged Bookmark");
        // Pass the tag ID we just created
        formData.append("tags", JSON.stringify([{id: tag.id, name: "Tech"}]));

        const response = await createBookmark(formData);

        expect(response.success).toBe(true);

        if (response.success) {
            const bookmarkWithTags = await prisma.bookmark.findFirst({
                where: {id: response.data.id},
                include: {BookmarkTags: true}
            });

            expect(bookmarkWithTags?.BookmarkTags).toHaveLength(1);
            expect(bookmarkWithTags?.BookmarkTags[0].tagId).toBe(tag.id);
        }
    });

    it("should UPDATE a bookmark and swap tags successfully", async () => {
        // 1. Setup: Create 2 tags
        const tagOld = await prisma.tag.create({data: {name: "Old Tag", userId: "test-user-id"}});
        const tagNew = await prisma.tag.create({data: {name: "New Tag", userId: "test-user-id"}});

        // 2. Setup: Create a bookmark with the OLD tag
        const bookmark = await prisma.bookmark.create({
            data: {
                title: "Original Title",
                url: "https://update-me.com",
                userId: "test-user-id",
                BookmarkTags: {
                    create: [{tag: {connect: {id: tagOld.id}}}]
                }
            }
        });

        // 3. Prepare Update Data (New Title, New Tag)
        const formData = new FormData();
        formData.append("title", "Updated Title");
        formData.append("url", "https://update-me.com"); // URL required by schema
        // We are replacing tagOld with tagNew
        formData.append("tags", JSON.stringify([{id: tagNew.id, name: "New Tag"}]));

        // 4. Call the Action
        const response = await updateBookmark(formData, bookmark.id);

        // 5. Verify Success
        expect(response.success).toBe(true);

        // 6. Verify DB State
        const updatedBookmark = await prisma.bookmark.findFirst({
            where: {id: bookmark.id},
            include: {BookmarkTags: true}
        });

        expect(updatedBookmark?.title).toBe("Updated Title");
        expect(updatedBookmark?.BookmarkTags).toHaveLength(1);
        expect(updatedBookmark?.BookmarkTags[0].tagId).toBe(tagNew.id); // Should be the NEW tag
        expect(updatedBookmark?.BookmarkTags[0].tagId).not.toBe(tagOld.id); // Should NOT be the OLD tag
    });

    it("should BLOCK updating someone else's bookmark", async () => {
        // 1. Create victim data
        const victim = await prisma.user.create({
            data: {
                id: "victim-2",
                name: "V",
                email: "v@v.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        const victimBookmark = await prisma.bookmark.create({
            data: {
                title: "Don't Touch This",
                url: "https://secure.com",
                userId: "victim-2"
            }
        });

        // 2. Try to update it as "test-user-id"
        const formData = new FormData();
        formData.append("title", "Hacked Title");
        formData.append("url", "https://secure.com");

        const response = await updateBookmark(formData, victimBookmark.id);

        // 3. Verify Failure
        expect(response.success).toBe(false);
        expect(response.error).toBe("Unauthorized"); // Our "Failed to update bookmark" catch might hide the specific error, let's see.
        // Actually, looking at my code, I logged the specific error but returned a generic one?
        // Wait, I threw "Unauthorized" inside the transaction.
        // My error handler wraps it. It will likely return "Failed to update bookmark" unless I exposed the error message.
    });
});