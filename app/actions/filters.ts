"use server"

import {Prisma, PrismaClient} from "@prisma/client";
import {prisma} from "@/lib/prisma";

// TODO: extract this out
export type FilteredBookmark = {
    id: number;
    url: string;
    title?: string | null;
    description?: string | null;
    folderId?: number | null;
    isFavorite: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId?: string | null;
    tags: { id: number, name: string }[];
}

export type GetFilteredBookmarksResponse = {
    success: boolean;
    data: FilteredBookmark[];
    error?: string;
};

const getFilteredBookmarks = async ({folderId, tagIds}: {
    folderId?: number;
    tagIds?: number[]
}): Promise<GetFilteredBookmarksResponse> => {
    try {
        if (!folderId && (!tagIds || tagIds.length === 0)) {
            return {success: false, error: "Invalid parameters", data: []};
        }

        const bookmarks = await prisma.bookmark.findMany({
            where: {
                folderId: folderId || undefined,
            },
            select: {
                id: true,
                url: true,
                title: true,
                description: true,
                folderId: true,
                isFavorite: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                BookmarkTags: {
                    select: {
                        tagId: true,
                        tag: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // only run if the tags are selected, but if folders are selected, skip
        if (tagIds) {
            const filteredBookmarks = bookmarks.filter(
                (bookmark) =>
                    tagIds &&
                    tagIds.every((tagId) =>
                        bookmark.BookmarkTags.some((bt) => bt.tagId === tagId)
                    )
            );
            return {
                success: true,
                data: filteredBookmarks.map((bookmark) => ({
                    ...bookmark,
                    tags: bookmark.BookmarkTags.map(({tagId, tag}) => ({
                        id: tagId,
                        name: tag.name,
                    })),
                })),
            };
        }

        return {
            success: true,
            data: bookmarks.map((bookmark) => ({
                ...bookmark,
                tags: bookmark.BookmarkTags.map(({tagId, tag}) => ({
                    id: tagId,
                    name: tag.name,
                })),
            })),
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {success: false, error: "Database error", data: []};
        }
        return {success: false, error: "Unknown error", data: []};
    } finally {
        await prisma.$disconnect();
    }
};

export {getFilteredBookmarks}