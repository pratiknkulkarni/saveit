"use server"

import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server";
import {logger} from "@/lib/logger";
import {
    createFoldersSchema,
    updateFolderSchema,
    deleteFolderSchema
} from "@/app/actions/schema/folder";
import {Prisma} from "@prisma/client";
import {
    CreateFoldersResponse,
    DeleteFolderResponse,
    GetUserFoldersResponse,
    UpdateFolderResponse,
} from "@/app/actions/types";

/**
 * Retrieves all folders for an authenticated user.
 * * @returns {Promise<GetUserFoldersResponse>}
 */
export const getUserFolders = async (): Promise<GetUserFoldersResponse> => {
    try {
        const user = await getCurrentUser();

        const folders = await prisma.folder.findMany({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {success: true, data: folders};

    } catch (error) {
        logger.error({err: error}, "Get User Folders: Failed");
        return {success: false, error: "Failed to fetch folders."};
    }
}

/**
 * Creates one or more folders for the authenticated user.
 * Checks for duplicates before creation.
 * * @param names - Array of folder names to create.
 */
export const createFolders = async ({names}: { names: string[] }): Promise<CreateFoldersResponse> => {
    try {
        const user = await getCurrentUser();

        const validated = createFoldersSchema.safeParse({names});
        if (!validated.success) {
            return {success: false, error: "Invalid folder names"};
        }

        const folderNames = validated.data.names;

        const existingFolders = await prisma.folder.findMany({
            where: {
                userId: user.id,
                name: {in: folderNames},
            },
            select: {name: true}
        });

        if (existingFolders.length > 0) {
            const duplicates = existingFolders.map(f => f.name);
            logger.warn({userId: user.id, duplicates}, "Create Folders: Duplicates found");

            return {
                success: false,
                error: `Folder(s) already exist.`,
                duplicateFolders: duplicates
            }
        }

        const count = await prisma.folder.createMany({
            data: folderNames.map(name => ({
                name,
                userId: user.id
            }))
        });

        logger.info({userId: user.id, count: count.count}, "Folders Created");
        revalidatePath("/home");

        return {success: true, data: count.count};

    } catch (error) {
        logger.error({err: error}, "Create Folders: Failed");
        return {success: false, error: "Failed to create folders."};
    }
}

/**
 * Deletes a folder and unlinks any associated bookmarks.
 * Uses a transaction to ensure bookmarks are not left pointing to a non-existent folder ID
 * if the deletion fails (though Prisma relations usually restrict this, unlinking is safer UX).
 * * @param folderId - ID of the folder to delete.
 */
export const deleteFolder = async ({folderId}: { folderId: number }): Promise<DeleteFolderResponse> => {
    try {
        const user = await getCurrentUser();

        const validated = deleteFolderSchema.safeParse({folderId});
        if (!validated.success) return {success: false, error: "Invalid folder ID"};

        await prisma.$transaction(async (tx) => {
            const folder = await tx.folder.findFirst({
                where: {id: folderId, userId: user.id}
            });

            if (!folder) {
                throw new Error("Unauthorized");
            }

            // this one unlinks the bookmark from the user
            await tx.bookmark.updateMany({
                where: {folderId: folderId, userId: user.id},
                data: {folderId: null}
            });

            await tx.folder.delete({
                where: {id: folderId}
            });
        });

        logger.info({userId: user.id, folderId}, "Folder Deleted");
        revalidatePath("/home");
        return {success: true};

    } catch (error) {
        logger.error({err: error, folderId}, "Delete Folder: Failed");
        if (error instanceof Error && error.message === "Unauthorized") {
            return {success: false, error: "Folder not found or unauthorized"};
        }
        return {success: false, error: "Failed to delete folder."};
    }
};

/**
 * Updates a folder's name.
 * * @param folderId - ID of the folder to update.
 * @param newFolderName - New name for the folder.
 */
export const updateFolder = async ({
                                       folderId,
                                       newFolderName
                                   }: {
    folderId: number,
    newFolderName: string
}): Promise<UpdateFolderResponse> => {
    try {
        const user = await getCurrentUser();

        const validated = updateFolderSchema.safeParse({folderId, newFolderName});
        if (!validated.success) {
            return {success: false, error: "Invalid input"};
        }

        const result = await prisma.folder.updateMany({
            where: {
                id: folderId,
                userId: user.id,
            },
            data: {
                name: validated.data.newFolderName,
            }
        });

        if (result.count === 0) {
            return {success: false, error: "Folder not found or unauthorized"};
        }

        logger.info({userId: user.id, folderId}, "Folder Updated");
        revalidatePath("/home");
        return {success: true};

    } catch (error) {
        logger.error({err: error, folderId}, "Update Folder: Failed");

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return {success: false, error: "Folder with this name already exists."}
        }

        return {success: false, error: "Failed to update folder."}
    }
}

