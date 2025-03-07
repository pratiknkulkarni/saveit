"use server"

import {z} from "zod"
import {revalidatePath} from "next/cache"
import {Prisma, PrismaClient} from "@prisma/client"
import {
    CreateBookmarkResponse,
    DeleteBookmarkByUserIdResponse, GetBookmarkByUserIdResponse,
    Tag
} from "@/app/actions/types";

const createBookmark = async (formData: FormData, userId: string): Promise<CreateBookmarkResponse> => {
    const prisma = new PrismaClient();
    try {
        const rawData = {
            title: formData.get("title"),
            url: formData.get("url"),
            description: formData.get("description"),
            folderId: Number(formData.get("folderId")),
            tags: JSON.parse(formData.get("tags") as string || "[]") as Tag[],
            imageURL: formData.get("imageURL"),
        }
        const rawTags: Tag[] = [];

        // only if the tags are present
        if (rawData.tags.length > 0) {
            rawTags.push(...rawData.tags);
        }

        const validatedData = bookmarkSchema.safeParse(rawData);

        if (!validatedData.success) {
            return {
                success: false,
                error: "Invalid bookmark data",
                validationErrors: validatedData.error.flatten().fieldErrors,
            }
        }

        const bookmarks = await prisma.bookmark.create({
            data: {
                title: validatedData.data.title,
                url: validatedData.data.url,
                description: validatedData.data.description,
                folderId: validatedData.data.folderId ? Number(validatedData.data.folderId) : null,
                imageURL: validatedData.data.imageURL,
                userId,
            },
        });

        // only if the tags are present
        if (rawTags.length > 0) {
            await prisma.bookmarkTags.createMany({
                data: rawTags.map((tag) => ({
                    tagId: tag.id,
                    bookmarkId: bookmarks.id,
                })),
            });
        }

        revalidatePath("/home");
        return {success: true, data: bookmarks}
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error"}
        } else {
            return {success: false, error: "Unknown error"}
        }
    } finally {
        await prisma.$disconnect()
    }
}

const getBookmarksByUserId = async (
    userId: string,
    page: number = 1,
    pageSize: number = 10
): Promise<GetBookmarkByUserIdResponse> => {
    const prisma = new PrismaClient();

    try {
        const totalItems = await prisma.bookmark.count({
            where: {userId}
        });

        const bookmarks = await prisma.bookmark.findMany({
            where: {userId},
            orderBy: {createdAt: 'desc'},
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            success: true,
            data: {
                data: bookmarks,
                metadata: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    pageSize
                }
            }
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                success: false,
                error: "Database error"
            }
        }
        if (error instanceof Prisma.PrismaClientValidationError) {
            return {
                success: false,
                error: "Invalid data"
            }
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            success: false,
            error: errorMessage
        }
    } finally {
        await prisma.$disconnect();
    }
}

const deleteBookmarkByUserId = async (userId: string | undefined, bookmarkId: number): Promise<DeleteBookmarkByUserIdResponse> => {
    if (!userId) {
        return {
            error: "User not found",
            success: false,
        }
    }

    const prisma = new PrismaClient();

    try {
        await prisma.bookmarkTags.deleteMany({
            where: {
                bookmarkId,
            },
        });
        await prisma.bookmark.delete({
            where: {
                id: bookmarkId,
                userId,
            },
        });

        return {
            success: true,
        }

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                success: false, error: "Database error"
            }
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
            return {
                success: false, error: "Invalid data"
            }
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            success: false, error: errorMessage
        }
    } finally {
        await prisma.$disconnect();
    }
}

const toggleBookmarkFavorite = async (userId: string | undefined, bookmarkId: number, isFavorite: boolean) => {
    if (!userId) {
        return {
            error: "User not found",
            success: false,
        }
    }

    const prisma = new PrismaClient();

    try {
        await prisma.bookmark.update({
            data: {
                isFavorite
            },
            where: {
                userId,
                id: bookmarkId,
            },
        });
        return {
            success: true
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                success: false, error: "Database error"
            }
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
            return {
                success: false, error: "Invalid data"
            }
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            success: false, error: errorMessage
        }
    } finally {
        await prisma.$disconnect();
    }

}
const bookmarkSchema = z.object({
    title: z.string().max(255, "Title must be 255 characters or less").optional(),
    url: z.string().url("Must be a valid URL"),
    description: z.string().max(500, "Description must be 500 characters or less").optional(),
    folderId: z.number().optional(),
    imageURL: z.string().optional(),
});

const updateBookmark = async (formData: FormData, bookmarkId: number, userId: string, tags: Tag[]) => {
    const prisma = new PrismaClient();
    // TODO: remove this line
    const t = tags;
    t.push(...tags);

    try {
        const rawData = {
            title: formData.get("title")?.toString() || undefined,
            url: formData.get("url")?.toString() || "",
            description: formData.get("description")?.toString() || undefined,
            folderId: formData.get("folderId")
                ? Number(formData.get("folderId"))
                : undefined,
            tags: JSON.parse(formData.get("tags")?.toString() || "[]") as Tag[],
            tagsModified: formData.get("tagsModified") === "true",
        };
        const rawTags: Tag[] = [];

        // only if the tags are present
        if (rawData.tags.length > 0) {
            rawTags.push(...rawData.tags);
        }

        const validatedData = bookmarkSchema.safeParse(rawData);

        if (!validatedData.success) {
            return {
                success: false,
                error: "Invalid bookmark data",
                validationErrors: validatedData.error.flatten().fieldErrors,
            }
        }

        const existingBookmark = await prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId,
            },
        });

        if (!existingBookmark) {
            return {success: false, message: "Bookmark not found."};
        }

        await prisma.bookmark.update({
            where: {id: bookmarkId},
            data: {
                ...(rawData.url && {url: rawData.url}),
                ...(rawData.title !== null && {title: rawData.title}),
                ...(rawData.description !== null && {description: rawData.description}),
                ...(rawData.folderId !== undefined && {folderId: rawData.folderId}),
            },
        });

        if (rawData.tagsModified) {
            await prisma.bookmarkTags.deleteMany({
                where: {bookmarkId}
            });

            if (rawData.tags.length > 0) {
                await prisma.bookmarkTags.createMany({
                    data: rawTags.map(tag => ({
                        bookmarkId,
                        tagId: tag.id,
                    })),
                });
            }
        }

        revalidatePath("/home");
        return {success: true, message: "Bookmark updated successfully."};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                success: false, error: "Database error"
            }
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
            return {
                success: false, error: "Invalid data"
            }
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            success: false, error: errorMessage
        }
    } finally {
        await prisma.$disconnect();
    }
}

export {createBookmark, getBookmarksByUserId, deleteBookmarkByUserId, toggleBookmarkFavorite, updateBookmark};
