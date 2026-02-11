import {describe, it, expect, vi, beforeEach} from "vitest";
import {getFilteredBookmarks} from "../filters";
import {prisma} from "@/lib/prisma";

vi.mock("@/lib/auth-server", () => ({
    getCurrentUser: vi.fn().mockResolvedValue({id: "filter-user", email: "filter@test.com"}),
}));

describe("Server Action: Filters", () => {
    beforeEach(async () => {
        await prisma.user.create({
            data: {
                id: "filter-user",
                name: "Filter User",
                email: "filter@test.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    });

    it("should filter by folderId", async () => {
        const folder1 = await prisma.folder.create({data: {name: "Work", userId: "filter-user"}});
        const folder2 = await prisma.folder.create({data: {name: "Personal", userId: "filter-user"}});

        await prisma.bookmark.create({
            data: {
                title: "Work Link",
                url: "work.com",
                userId: "filter-user",
                folderId: folder1.id
            }
        });
        await prisma.bookmark.create({
            data: {
                title: "Personal Link",
                url: "home.com",
                userId: "filter-user",
                folderId: folder2.id
            }
        });

        const response = await getFilteredBookmarks({folderId: folder1.id});

        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].title).toBe("Work Link");
    });

    it("should BLOCK access to other users' folders (IDOR Check)", async () => {
        await prisma.user.create({
            data: {
                id: "victim",
                email: "v@v.com",
                name: "V",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        const victimFolder = await prisma.folder.create({data: {name: "Secret", userId: "victim"}});
        await prisma.bookmark.create({
            data: {
                title: "Secret Link",
                url: "secret.com",
                userId: "victim",
                folderId: victimFolder.id
            }
        });

        const response = await getFilteredBookmarks({folderId: victimFolder.id});

        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(0);
    });

    it("should filter by Tags (AND logic)", async () => {
        const tag1 = await prisma.tag.create({data: {name: "React", userId: "filter-user"}});
        const tag2 = await prisma.tag.create({data: {name: "NextJS", userId: "filter-user"}});

        const b1 = await prisma.bookmark.create({data: {title: "Full Stack", url: "a.com", userId: "filter-user"}});
        await prisma.bookmarkTags.create({data: {bookmarkId: b1.id, tagId: tag1.id}});
        await prisma.bookmarkTags.create({data: {bookmarkId: b1.id, tagId: tag2.id}});

        const b2 = await prisma.bookmark.create({data: {title: "Frontend", url: "b.com", userId: "filter-user"}});
        await prisma.bookmarkTags.create({data: {bookmarkId: b2.id, tagId: tag1.id}});

        const response = await getFilteredBookmarks({tagIds: [tag1.id, tag2.id]});

        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].title).toBe("Full Stack");
    });
});