"use server"

import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server";
import {logger} from "@/lib/logger";

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

export const getFilteredBookmarks = async ({folderId, tagIds}: {
    folderId?: number;
    tagIds?: number[]
}): Promise<GetFilteredBookmarksResponse> => {
    try {
        const user = await getCurrentUser();

        if (!folderId && (!tagIds || tagIds.length === 0)) {
            return {success: false, error: "Invalid parameters", data: []};
        }

        const bookmarks = await prisma.bookmark.findMany({
            where: {
                userId: user.id,

                ...(folderId ? {folderId} : {}),
                ...(tagIds && tagIds.length > 0 ? {
                    AND: tagIds.map(tagId => ({
                        BookmarkTags: {
                            some: {tagId}
                        }
                    }))
                } : {})
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
                        tag: {select: {name: true}},
                    },
                },
            },
            orderBy: {createdAt: 'desc'}
        });

        const formatted = bookmarks.map((bookmark) => ({
            ...bookmark,
            tags: bookmark.BookmarkTags.map(({tagId, tag}) => ({
                id: tagId,
                name: tag.name,
            })),
        }));

        logger.info({userId: user.id, count: formatted.length, folderId}, "Filtered Bookmarks Fetched");
        return {success: true, data: formatted};

    } catch (error) {
        logger.error({err: error, userId: "unknown"}, "Get Filtered Bookmarks: Failed");
        return {success: false, error: "Failed to fetch data", data: []};
    }
};