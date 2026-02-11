"use server"

import {revalidatePath} from "next/cache"
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server";
import {bookmarkSchema} from "@/app/actions/schema/bookmark";
import {
    CreateBookmarkResponse,
    DeleteBookmarkByUserIdResponse,
    GetBookmarkByUserIdResponse,
    Tag
} from "@/app/actions/types";
import {Prisma} from "@prisma/client";
import {logger} from "@/lib/logger";

/**
 * Creates a new bookmark for the authenticated user.
 *
 * This function performs an atomic transaction to ensuring that both the bookmark
 * and its associated tags are created successfully.
 * If either fails, the entire operation rolls back to prevent "zombie" data.
 *
 * @param formData - The raw FormData from the client. Expected fields: 'url', 'title' (optional), 'tags' (JSON array).
 * @returns {Promise<CreateBookmarkResponse>} - On success, returns the created bookmark. On failure, returns a specific error message.
 */
export const createBookmark = async (formData: FormData): Promise<CreateBookmarkResponse> => {
    try {
        const user = await getCurrentUser();

        const rawData = {
            title: formData.get("title")?.toString(),
            url: formData.get("url")?.toString(),
            description: formData.get("description")?.toString(),
            folderId: formData.get("folderId") ? Number(formData.get("folderId")) : undefined,
            tags: JSON.parse(formData.get("tags")?.toString() || "[]"),
            imageURL: formData.get("imageURL")?.toString(),
        }

        const validatedData = bookmarkSchema.safeParse(rawData);

        if (!validatedData.success) {
            logger.warn({userId: user.id, errors: validatedData.error.flatten()}, "Create Bookmark: Validation Failed");
            return {
                success: false,
                error: "Invalid input",
                validationErrors: validatedData.error.flatten().fieldErrors as Record<string, string[]>,
            }
        }

        const {tags, ...bookmarkData} = validatedData.data;

        const bookmark = await prisma.bookmark.create({
            data: {
                ...bookmarkData,
                url: bookmarkData.url!,
                userId: user.id,
                BookmarkTags: tags && tags.length > 0 ? {
                    create: tags.map(tag => ({
                        tag: {
                            connect: {id: tag.id}
                        }
                    }))
                } : undefined
            },
        });

        logger.info({bookmarkId: bookmark.id, userId: user.id}, "Bookmark Created Successfully");
        revalidatePath("/home");
        return {success: true, data: bookmark}

    } catch (error) {
        logger.error({err: error}, "Create Bookmark: Server Error");
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        }
        return {success: false, error: "Failed to create bookmark"}
    }
}

/**
 * Retrieves a paginated list of bookmarks for an authenticated user.
 *
 * @param page - The page number (1-based index). Defaults to 1.
 * @param pageSize - The number of items per page. Defaults to 10.
 * @returns {Promise<GetBookmarkByUserIdResponse>} - A paginated response object containing the bookmarks and metadata.
 */
export const getBookmarksByUserId = async (
    page: number = 1,
    pageSize: number = 10
): Promise<GetBookmarkByUserIdResponse> => {
    try {
        const user = await getCurrentUser();

        const totalItems = await prisma.bookmark.count({
            where: {userId: user.id}
        });

        const bookmarks = await prisma.bookmark.findMany({
            where: {userId: user.id},
            orderBy: {createdAt: 'desc'},
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                BookmarkTags: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        return {
            success: true,
            data: {
                data: bookmarks,
                metadata: {
                    totalItems,
                    totalPages: Math.ceil(totalItems / pageSize),
                    currentPage: page,
                    pageSize
                }
            }
        };
    } catch (error) {
        logger.error({err: error, userId: "unknown"}, "Get Bookmarks: Failed");
        return {success: false, error: "Failed to fetch bookmarks"};
    }
}

/**
 * Deletes a bookmark by ID.
 *
 * Securely ensures that the bookmark belongs to the authenticated user before deletion.
 * Uses `deleteMany` pattern to handle the "check ownership + delete" in a single query.
 *
 * @param bookmarkId - The ID of the bookmark to delete.
 */
export const deleteBookmarkByUserId = async (bookmarkId: number): Promise<DeleteBookmarkByUserIdResponse> => {
    try {
        const user = await getCurrentUser();

        const result = await prisma.bookmark.deleteMany({
            where: {
                id: bookmarkId,
                userId: user.id
            }
        });

        if (result.count === 0) {
            logger.warn({bookmarkId, userId: user.id}, "Delete Bookmark: Not Found or Unauthorized");
            return {success: false, error: "Bookmark not found or unauthorized"};
        }

        logger.info({bookmarkId, userId: user.id}, "Bookmark Deleted");
        revalidatePath("/home");
        return {success: true}

    } catch (error) {
        logger.error({err: error, bookmarkId}, "Delete Bookmark: Server Error");
        return {success: false, error: "Failed to delete bookmark"};
    }
}

/**
 * Toggles the 'isFavorite' status of a bookmark.
 *
 * @param bookmarkId - The ID of the bookmark to update.
 * @param isFavorite - The new boolean state.
 */
export const toggleBookmarkFavorite = async (bookmarkId: number, isFavorite: boolean) => {
    try {
        const user = await getCurrentUser();

        const result = await prisma.bookmark.updateMany({
            where: {
                id: bookmarkId,
                userId: user.id,
            },
            data: {
                isFavorite
            },
        });

        if (result.count === 0) {
            logger.warn({bookmarkId, userId: user.id}, "Toggle Favorite: Not Found or Unauthorized");
            return {success: false, error: "Bookmark not found"}
        }

        revalidatePath("/home");
        return {success: true}
    } catch (error) {
        logger.error({err: error, bookmarkId}, "Toggle Favorite: Failed");
        return {success: false, error: "Failed to update favorite status"}
    }
}

/**
 * Updates an existing bookmark.
 *
 * Handles concurrent updates to scalar fields (title, url) and relational fields (tags).
 * Uses a Prisma transaction to ensure atomicity: if the tag update fails, the title update is reverted.
 *
 * @param formData - The raw FormData containing updated fields.
 * @param bookmarkId - The ID of the bookmark to update.
 */
export const updateBookmark = async (formData: FormData, bookmarkId: number) => {
    try {
        const user = await getCurrentUser();

        const rawData = {
            title: formData.get("title")?.toString(),
            url: formData.get("url")?.toString(),
            description: formData.get("description")?.toString(),
            folderId: formData.get("folderId") ? Number(formData.get("folderId")) : undefined,
            tags: JSON.parse(formData.get("tags")?.toString() || "[]"),
        };

        const validatedData = bookmarkSchema.safeParse(rawData);

        if (!validatedData.success) {
            return {
                success: false,
                error: "Invalid input",
                validationErrors: validatedData.error.flatten().fieldErrors
            };
        }

        const {tags, ...dataToUpdate} = validatedData.data;

        await prisma.$transaction(async (tx) => {
            const existing = await tx.bookmark.findFirst({
                where: {id: bookmarkId, userId: user.id}
            });

            if (!existing) throw new Error("Unauthorized");

            await tx.bookmark.update({
                where: {id: bookmarkId},
                data: {
                    ...dataToUpdate,
                    url: dataToUpdate.url!
                }
            });

            if (tags) {
                await tx.bookmarkTags.deleteMany({where: {bookmarkId}});
                if (tags.length > 0) {
                    await tx.bookmarkTags.createMany({
                        data: tags.map(tag => ({
                            bookmarkId,
                            tagId: tag.id
                        }))
                    });
                }
            }
        });

        logger.info({bookmarkId, userId: user.id}, "Bookmark Updated");
        revalidatePath("/home");
        return {success: true, message: "Bookmark updated successfully."};

    } catch (error) {
        logger.error({err: error, bookmarkId}, "Update Bookmark: Failed");
        if (error instanceof Error && error.message === "Unauthorized") {
            return {success: false, error: "Unauthorized"};
        }
        return {success: false, error: "Failed to update bookmark"};
    }
}