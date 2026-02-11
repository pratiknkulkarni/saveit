import {describe, it, expect, vi, beforeEach} from "vitest";
import {createFolders, deleteFolder, getUserFolders, updateFolder} from "../folders";
import {prisma} from "@/lib/prisma";

vi.mock("@/lib/auth-server", () => ({
    getCurrentUser: vi.fn().mockResolvedValue({id: "folder-user-id", email: "folder@test.com"}),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Server Action: Folders", () => {
    beforeEach(async () => {
        await prisma.user.create({
            data: {
                id: "folder-user-id",
                name: "Folder User",
                email: "folder@test.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    });

    describe("createFolders", () => {
        it("should create multiple folders successfully", async () => {
            const names = ["Work", "Personal", "Ideas"];
            const response = await createFolders({names});

            expect(response.success).toBe(true);
            if (response.success) {
                expect(response.data).toBe(3);
            }

            const dbFolders = await prisma.folder.findMany({where: {userId: "folder-user-id"}});
            expect(dbFolders).toHaveLength(3);
            expect(dbFolders.map(f => f.name)).toContain("Work");
        });

        it("should prevent duplicate folders", async () => {
            await prisma.folder.create({
                data: {name: "Work", userId: "folder-user-id"}
            });

            const response = await createFolders({names: ["Work", "Travel"]});

            expect(response.success).toBe(false);
            if (!response.success && 'duplicateFolders' in response) {
                expect(response.error).toContain("Folder(s) already exist");
                expect(response.duplicateFolders).toContain("Work");
            }
        });
    });

    describe("getUserFolders", () => {
        it("should fetch only the user's folders", async () => {
            await prisma.folder.create({data: {name: "My Folder", userId: "folder-user-id"}});

            await prisma.user.create({
                data: {
                    id: "other-user",
                    email: "o@o.com",
                    name: "O",
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            await prisma.folder.create({data: {name: "Not Mine", userId: "other-user"}});

            const response = await getUserFolders();

            expect(response.success).toBe(true);
            if (response.success) {
                expect(response.data).toHaveLength(1);
                expect(response.data[0].name).toBe("My Folder");
            }
        });
    });

    describe("updateFolder", () => {
        it("should rename a folder", async () => {
            const folder = await prisma.folder.create({data: {name: "Old Name", userId: "folder-user-id"}});

            const response = await updateFolder({folderId: folder.id, newFolderName: "New Name"});
            expect(response.success).toBe(true);

            const updated = await prisma.folder.findUnique({where: {id: folder.id}});
            expect(updated?.name).toBe("New Name");
        });

        it("should prevent renaming to an existing folder name", async () => {
            await prisma.folder.create({data: {name: "Existing", userId: "folder-user-id"}});
            const folderToRename = await prisma.folder.create({data: {name: "To Rename", userId: "folder-user-id"}});

            const response = await updateFolder({folderId: folderToRename.id, newFolderName: "Existing"});

            expect(response.success).toBe(false);
        });
    });

    describe("deleteFolder", () => {
        it("should delete a folder and unlink bookmarks", async () => {
            const folder = await prisma.folder.create({data: {name: "Delete Me", userId: "folder-user-id"}});

            const bookmark = await prisma.bookmark.create({
                data: {
                    url: "https://test.com",
                    userId: "folder-user-id",
                    folderId: folder.id
                }
            });

            const response = await deleteFolder({folderId: folder.id});
            expect(response.success).toBe(true);

            const dbFolder = await prisma.folder.findUnique({where: {id: folder.id}});
            expect(dbFolder).toBeNull();

            const dbBookmark = await prisma.bookmark.findUnique({where: {id: bookmark.id}});
            expect(dbBookmark?.folderId).toBeNull();
        });

        it("should NOT delete another user's folder", async () => {
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
            const victimFolder = await prisma.folder.create({data: {name: "Secure", userId: "victim"}});

            const response = await deleteFolder({folderId: victimFolder.id});

            expect(response.success).toBe(false);
        });
    });
});