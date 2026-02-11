"use server"

import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server";
import {logger} from "@/lib/logger";
import {Prisma} from "@prisma/client";
import {
    createTagsSchema,
    deleteTagSchema,
    updateTagSchema
} from "@/app/actions/schema/tag";
import {
    CreateTagsResponse,
    DeleteTagResponse,
    GetFormattedTagsForBookmarksResponse,
    GetTagsForBookmarkResponse,
    GetUserTagsResponse,
    UpdateTagResponse,
} from "@/app/actions/types";

/**
 * Retrieves tags for a specific bookmark.
 * Security: Ensures the bookmark belongs to the current user.
 */
export const getTagsForBookmark = async (bookmarkId: number): Promise<GetTagsForBookmarkResponse> => {
    try {
        const user = await getCurrentUser();

        const bookmark = await prisma.bookmark.findFirst({
            where: {id: bookmarkId, userId: user.id},
            include: {
                BookmarkTags: {
                    include: {tag: true},
                    orderBy: {tag: {name: 'asc'}}
                }
            }
        });

        if (!bookmark) {
            return {success: false, error: "Bookmark not found or unauthorized"};
        }

        return {success: true, data: bookmark.BookmarkTags};

    } catch (error) {
        logger.error({err: error, bookmarkId}, "Get Tags For Bookmark: Failed");
        return {success: false, error: "Failed to fetch tags"};
    }
}

/**
 * Retrieves formatted tags for a list of bookmarks.
 * Used primarily for the list view to show pills on bookmark cards.
 * Security: Filters by userId to prevent data leakage.
 */
export const getFormattedTagsForBookmarks = async (bookmarkIds: number[]): Promise<GetFormattedTagsForBookmarksResponse> => {
    if (!bookmarkIds.length) {
        return {success: true, data: []};
    }

    try {
        const user = await getCurrentUser();

        const tags = await prisma.bookmarkTags.findMany({
            where: {
                bookmarkId: {in: bookmarkIds},
                bookmark: {userId: user.id} // Security Check
            },
            include: {
                tag: true,
            },
            orderBy: {
                tag: {name: 'asc'}
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
        logger.error({err: error, count: bookmarkIds.length}, "Get Formatted Tags: Failed");
        return {success: false, error: "Failed to fetch tags"};
    }
}

/**
 * Retrieves all tags created by the authenticated user.
 */
export const getUserTags = async (): Promise<GetUserTagsResponse> => {
    try {
        const user = await getCurrentUser();

        const tags = await prisma.tag.findMany({
            where: {userId: user.id},
            select: {id: true, name: true},
            orderBy: {name: 'asc'}
        });

        return {success: true, data: tags};

    } catch (error) {
        logger.error({err: error}, "Get User Tags: Failed");
        return {success: false, error: "Failed to fetch tags"};
    }
}

/**
 * Creates new tags. Checks for duplicates first.
 */
export const createNewTags = async ({tags}: { tags: string[] }): Promise<CreateTagsResponse> => {
    try {
        const user = await getCurrentUser();

        const validated = createTagsSchema.safeParse({tags});
        if (!validated.success) return {success: false, error: "Invalid tag names"};

        const tagNames = validated.data.tags;

        const existingTags = await prisma.tag.findMany({
            where: {
                userId: user.id,
                name: {in: tagNames},
            },
            select: {name: true}
        });

        if (existingTags.length > 0) {
            const duplicateTags = existingTags.map(tag => tag.name);
            logger.warn({userId: user.id, duplicateTags}, "Create Tags: Duplicates found");
            return {
                success: false,
                error: `Tag(s) already exist`,
                duplicateTags,
            }
        }

        const count = await prisma.tag.createMany({
            data: tagNames.map((name) => ({
                name,
                userId: user.id,
            })),
        });

        logger.info({userId: user.id, count: count.count}, "Tags Created");
        revalidatePath("/home");
        return {success: true, data: count.count};

    } catch (error) {
        logger.error({err: error}, "Create Tags: Failed");
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return {success: false, error: "Tag(s) already present"}
        }
        return {success: false, error: "Failed to create tags"}
    }
}

/**
 * Deletes a tag and removes it from all associated bookmarks.
 */
export const deleteTag = async ({tagId}: { tagId: number }): Promise<DeleteTagResponse> => {
    try {
        const user = await getCurrentUser();

        const validated = deleteTagSchema.safeParse({tagId});
        if (!validated.success) return {success: false, error: "Invalid tag ID"};

        await prisma.$transaction(async (tx) => {
            const tag = await tx.tag.findFirst({
                where: {id: tagId, userId: user.id}
            });

            if (!tag) throw new Error("Unauthorized");

            await tx.bookmarkTags.deleteMany({
                where: {tagId}
            });

            await tx.tag.delete({
                where: {id: tagId}
            });
        });

        logger.info({userId: user.id, tagId}, "Tag Deleted");
        revalidatePath("/home");
        return {success: true};

    } catch (error) {
        logger.error({err: error, tagId}, "Delete Tag: Failed");
        if (error instanceof Error && error.message === "Unauthorized") {
            return {success: false, error: "Tag not found or unauthorized"};
        }
        return {success: false, error: "Failed to delete tag"}
    }
}

/**
 * Updates a tag's name.
 */
export const updateTag = async ({
                                    tagId,
                                    newTagName,
                                }: {
    tagId: number,
    newTagName: string,
}): Promise<UpdateTagResponse> => {
    try {
        const user = await getCurrentUser();

        const validated = updateTagSchema.safeParse({tagId, newTagName});
        if (!validated.success) return {success: false, error: "Invalid input"};

        const result = await prisma.tag.updateMany({
            where: {
                id: tagId,
                userId: user.id,
            },
            data: {
                name: validated.data.newTagName,
            }
        });

        if (result.count === 0) {
            return {success: false, error: "Tag not found or unauthorized"};
        }

        logger.info({userId: user.id, tagId}, "Tag Updated");
        revalidatePath("/home");
        return {success: true};

    } catch (error) {
        logger.error({err: error, tagId}, "Update Tag: Failed");
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return {success: false, error: "Tag with this name already exists."}
        }
        return {success: false, error: "Failed to update tag"}
    }
}
