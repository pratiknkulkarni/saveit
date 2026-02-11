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

        revalidatePath("/home");
        return {success: true, data: bookmark}

    } catch (error) {
        console.error("Create Bookmark Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        }
        return {success: false, error: "Failed to create bookmark"}
    }
}

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
        console.error("Get Bookmarks Error:", error);
        return {success: false, error: "Failed to fetch bookmarks"};
    }
}

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
            return {success: false, error: "Bookmark not found or unauthorized"};
        }

        revalidatePath("/home");
        return {success: true}

    } catch (error) {
        console.error("Delete Bookmark Error:", error);
        return {success: false, error: "Failed to delete bookmark"};
    }
}

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
            return {success: false, error: "Bookmark not found"}
        }

        revalidatePath("/home");
        return {success: true}
    } catch (error) {
        console.error("Toggle Favorite Error:", error);
        return {success: false, error: "Failed to update favorite status"}
    }
}

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

        revalidatePath("/home");
        return {success: true, message: "Bookmark updated successfully."};

    } catch (error) {
        console.error("Update Bookmark Error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return {success: false, error: "Unauthorized"};
        }
        return {success: false, error: "Failed to update bookmark"};
    }
}