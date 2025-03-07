"use server"

import {Prisma, PrismaClient} from "@prisma/client";
import {
    CreateFoldersResponse,
    DeleteFolderResponse,
    GetUserFoldersResponse, UpdateFolderResponse,
    UpdateTagResponse
} from "@/app/actions/types";

const getUserFolders = async ({userId}: { userId: string | undefined }): Promise<GetUserFoldersResponse> => {
    if (!userId) {
        return {success: false, error: "User not found!"}
    }

    const prisma = new PrismaClient();

    try {
        const folders = await prisma.folder.findMany({
            select: {
                id: true,
                name: true,
            }, where: {
                userId,
            }
        });

        return {success: true, data: folders};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        }
        return {success: false, error: "Failed to fetch folders. Please try again."};
    }
}

const createFolders = async ({userId, names}: {
    names: string[],
    userId: string | undefined
}): Promise<CreateFoldersResponse> => {
    const prisma = new PrismaClient();

    const existingFolders = await prisma.folder.findMany({
        where: {
            userId,
            name: {
                in: names
            },
        }, select: {
            name: true
        }
    });

    if (existingFolders.length > 0) {
        const existingFolderNames = existingFolders.map(folder => folder.name);
        return {
            success: false,
            error: `Folder${existingFolderNames.length > 1 ? 's' : ''} ${existingFolderNames.join(", ")} already exist.`
        }
    }

    try {
        if (!userId) {
            return {success: false, error: "User not found."}

        }
        const foldersData = names.map((name) => ({
            name,
            userId
        }));

        const response = await prisma.folder.createMany({
            data: foldersData,
        });

        return {
            success: true, data: response.count
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {success: false, error: "Folder name already exists."};
            }
            return {success: false, error: error.message}
        }
        return {success: false, error: "Error creating folders, please try again."}
    } finally {
        await prisma.$disconnect();
    }
}


const deleteFolder = async ({folderId, userId}: {
    folderId: number;
    userId: string | undefined;
}): Promise<DeleteFolderResponse> => {
    const prisma = new PrismaClient();

    try {
        if (!userId) {
            return {success: false, error: "User not found"};
        }

        await prisma.bookmark.updateMany({
            where: {
                folderId,
            },
            data: {
                folderId: null,
            },
        });

        await prisma.folder.delete({
            where: {
                id: folderId,
            },
            select: {
                id: true,
            },
        });

        return {success: true};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"};
        }
        return {success: false, error: "Unknown error"};
    } finally {
        await prisma.$disconnect();
    }
};

const updateFolder = async ({
                                folderId,
                                newFolderName,
                                userId
                            }: {
    folderId: number,
    newFolderName: string,
    userId: string | undefined
}): Promise<UpdateFolderResponse> => {
    const prisma = new PrismaClient();

    try {
        if (!userId) {
            return {success: false, error: "User not found"}
        }

        await prisma.folder.update({
            where: {
                id: folderId,
                userId: userId,
            },
            data: {
                name: newFolderName,
            }
        });

        return {success: true};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {success: false, error: "Folder with this name already exists."}
            }
            return {success: false, error: "Database error"}
        }

        return {success: false, error: "Unknown error"}
    } finally {
        await prisma.$disconnect()
    }
}


export {createFolders, getUserFolders, deleteFolder, updateFolder}
