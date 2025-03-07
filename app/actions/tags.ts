"use server"

import {Prisma, PrismaClient} from "@prisma/client";
import {
    CreateTagsResponse, DeleteTagResponse,
    GetFormattedTagsForBookmarksResponse,
    GetTagsForBookmarkResponse,
    GetUserTagsResponse, UpdateTagResponse,
} from "@/app/actions/types";
import {revalidatePath} from "next/cache";


const getTagsForBookmark = async (bookmarkId: number): Promise<GetTagsForBookmarkResponse> => {
    const prisma = new PrismaClient();

    try {
        const tags = await prisma.bookmarkTags.findMany({
            where: {
                bookmarkId
            },
            include: {
                tag: true,
            },
            orderBy: {
                bookmarkId: "asc",
            },
        });
        return {success: true, data: tags};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"};
        }
        return {success: false, error: "Unknown error"};
    } finally {
        await prisma.$disconnect();
    }
}

const getFormattedTagsForBookmarks = async (bookmarkIds: number[]): Promise<GetFormattedTagsForBookmarksResponse> => {
    const prisma = new PrismaClient();

    if (!bookmarkIds.length) {
        return {success: true, data: []};
    }

    try {
        const tags = await prisma.bookmarkTags.findMany({
            where: {
                bookmarkId: {in: bookmarkIds},
            },
            include: {
                tag: true,
            },
            orderBy: {
                bookmarkId: "asc",
            },
        });

        const groupedTags = bookmarkIds.map((id) => ({
            bookmarkId: id,
            tagNames: tags
                .filter((bt) => bt.bookmarkId === id)
                .map((bt) => bt.tag.name),
        }));

        return {success: true, data: groupedTags};
    } catch (error) {
        console.log(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"};
        }
        return {success: false, error: "Unknown error"};
    } finally {
        await prisma.$disconnect();
    }
}

const getUserTags = async ({userId}: { userId: string | undefined }): Promise<GetUserTagsResponse> => {
    const prisma = new PrismaClient();

    try {
        if (!userId) {
            return {success: false, error: "User not found"}
        }
        const tags = await prisma.tag.findMany({
            where: {
                userId,
            }, select: {
                id: true,
                name: true,
            }
        });

        if (tags.length === 0) {
            return {success: true, data: []}
        }

        return {success: true, data: tags};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        }
        return {success: false, error: "Unknown error"}
    } finally {
        await prisma.$disconnect()
    }
}

const createNewTags = async ({tags, userId}: {
    tags: string[],
    userId: string | undefined
}): Promise<CreateTagsResponse> => {
    const prisma = new PrismaClient();
    try {
        if (!userId) {
            return {
                success: false,
                error: "User not found"
            }
        }

        const existingTags = await prisma.tag.findMany({
            where: {
                userId,
                name: {
                    in: tags,
                }
            }, select: {
                name: true,
            }
        });

        if (existingTags.length > 0) {
            const duplicateTags = existingTags.map(tag => tag.name);
            return {
                success: false,
                error: `Tag${duplicateTags.length > 1 ? 's' : ''} "${duplicateTags.join('", "')}" already exist`,
                duplicateTags,
            }
        }

        const tagsData = tags.map((tagName) => ({
            name: tagName,
            userId,
        }));

        try {
            const response = await prisma.tag.createMany({
                data: tagsData,
            });

            revalidatePath("/home");
            return {success: true, data: response.count};
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return {success: false, error: "Tag(s) already present"}
                }
                return {success: false, error: error.message}
            }
            return {success: false, error: "Error creating tags"}
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        }
        return {success: false, error: "Unknown error"}
    } finally {
        await prisma.$disconnect()
    }
}


const deleteTag = async ({tagId, userId}: {
    tagId: number,
    userId: string | undefined
}): Promise<DeleteTagResponse> => {
    const prisma = new PrismaClient();

    try {
        if (!userId) {
            return {success: false, error: "User not found"}
        }

        await prisma.bookmarkTags.deleteMany({
            where: {
                tagId,
            }
        });

        await prisma.tag.delete({
            where: {
                id: tagId,
            },
            select: {
                id: true
            }
        });

        return {success: true};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        }
        return {success: false, error: "Unknown error"}
    } finally {
        await prisma.$disconnect()
    }
}


const updateTag = async ({
                             tagId,
                             newTagName,
                             userId
                         }: {
    tagId: number,
    newTagName: string,
    userId: string | undefined
}): Promise<UpdateTagResponse> => {
    const prisma = new PrismaClient();

    try {
        if (!userId) {
            return {success: false, error: "User not found"}
        }

        await prisma.tag.update({
            where: {
                id: tagId,
                userId: userId,
            },
            data: {
                name: newTagName,
            }
        });

        return {success: true};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {success: false, error: "Tag with this name already exists."}
            }
            return {success: false, error: "Database error"}
        }

        return {success: false, error: "Unknown error"}
    } finally {
        await prisma.$disconnect()
    }
}

export {createNewTags, getUserTags, getFormattedTagsForBookmarks, getTagsForBookmark, deleteTag, updateTag}