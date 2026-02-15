"use server"

import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server";
import {logger} from "@/lib/logger";
import {Filter, MatchMode} from "@/app/actions/search_enum";

type RawSearchResult = {
    id: number;
    type: 'bookmark' | 'folder' | 'tag';
    title: string;
    description: string;
    url: string;
    folder: string | null;
    tags: string | null;
    rank: number;
};

export const searchAll = async (
    searchTerm: string | undefined,
    filter: Filter = "all",
    matchMode: MatchMode = "fuzzy"
) => {
    try {
        const user = await getCurrentUser();
        if (!searchTerm || searchTerm.trim().length === 0) return [];
        const query = searchTerm.trim();

        const threshold = matchMode === "loose" ? 0.5 : 0.7;
        const isFuzzy = matchMode === "fuzzy" || matchMode === "loose";
        const isExact = matchMode === "exact";
        const isStart = matchMode === "startsWith";

        const shouldQueryBookmarks = ['all', 'title', 'description', 'url'].includes(filter);
        const shouldQueryFolders = ['all', 'folder'].includes(filter);
        const shouldQueryTags = ['all', 'tag'].includes(filter);

        const searchTitle = ['all', 'title'].includes(filter);
        const searchDesc = ['all', 'description'].includes(filter);
        const searchUrl = ['all', 'url'].includes(filter);
        const searchFolderMeta = filter === 'all';
        const searchTagMeta = filter === 'all';

        const textMatch = (col: string) => {
            if (isExact) return `${col} ILIKE '${query}'`;
            if (isStart) return `${col} ILIKE '${query}%'`;
            return `(word_similarity('${query}', ${col}) > ${threshold} OR ${col} ILIKE '%${query}%')`;
        };

        const rankCalc = (col: string) => {
            if (!isFuzzy) return "1";
            return `word_similarity('${query}', ${col})`;
        };

        const promises = [];

        // =========================================================
        // QUERY 1: BOOKMARKS
        // =========================================================
        if (shouldQueryBookmarks) {
            const bookmarkSQL = `
                WITH MatchingIds AS (SELECT b.id,
                                            GREATEST(
                                                    ${rankCalc('b.title')},
                                                    ${rankCalc('b.description')},
                                                    ${rankCalc('b.url')}
                                            ) as rank
                                     FROM "Bookmark" b
                                              LEFT JOIN "Folder" f ON b."folderId" = f.id
                                              LEFT JOIN "BookmarkTags" bt ON b.id = bt."bookmarkId"
                                              LEFT JOIN "Tag" t ON bt."tagId" = t.id
                                     WHERE b."userId" = '${user.id}'
                                       AND (
                                         (${searchTitle} AND ${textMatch('b.title')}) OR
                                         (${searchDesc} AND ${textMatch('b.description')}) OR
                                         (${searchUrl} AND ${textMatch('b.url')}) OR
                                         (${searchFolderMeta} AND f.name IS NOT NULL AND ${textMatch('f.name')}) OR
                                         (${searchTagMeta} AND t.name IS NOT NULL AND ${textMatch('t.name')})
                                         )
                                     GROUP BY b.id
                                     ORDER BY rank DESC
                                     LIMIT 50)
                SELECT b.id,
                       'bookmark'              as type,
                       b.title,
                       b.description,
                       b.url,
                       f.name                  as folder,
                       STRING_AGG(t.name, ',') as tags,
                       m.rank
                FROM MatchingIds m
                         JOIN "Bookmark" b ON m.id = b.id
                         LEFT JOIN "Folder" f ON b."folderId" = f.id
                         LEFT JOIN "BookmarkTags" bt ON b.id = bt."bookmarkId"
                         LEFT JOIN "Tag" t ON bt."tagId" = t.id
                GROUP BY b.id, f.name, m.rank
                ORDER BY m.rank DESC
            `;
            promises.push(prisma.$queryRawUnsafe<RawSearchResult[]>(bookmarkSQL));
        }

        // =========================================================
        // QUERY 2: FOLDERS
        // =========================================================
        if (shouldQueryFolders) {
            const folderSQL = `
                SELECT id,
                       'folder'            as type,
                       name                as title,
                       ''                  as description,
                       ''                  as url,
                       ''                  as folder,
                       ''                  as tags,
                       ${rankCalc('name')} as rank
                FROM "Folder"
                WHERE "userId" = '${user.id}'
                  AND ${textMatch('name')}
                LIMIT 20
            `;
            promises.push(prisma.$queryRawUnsafe<RawSearchResult[]>(folderSQL));
        }

        // =========================================================
        // QUERY 3: TAGS
        // =========================================================
        if (shouldQueryTags) {
            const tagSQL = `
                SELECT id,
                       'tag'               as type,
                       name                as title,
                       ''                  as description,
                       ''                  as url,
                       ''                  as folder,
                       ''                  as tags,
                       ${rankCalc('name')} as rank
                FROM "Tag"
                WHERE "userId" = '${user.id}'
                  AND ${textMatch('name')}
                LIMIT 20
            `;
            promises.push(prisma.$queryRawUnsafe<RawSearchResult[]>(tagSQL));
        }

        const results = await Promise.all(promises);
        const flatResults = results.flat();

        const formatted = flatResults
            .sort((a, b) => b.rank - a.rank)
            .map(row => ({
                id: `${row.type}-${row.id}`,
                type: row.type,
                title: row.title,
                description: row.description,
                url: row.url,
                match: row.rank,
                folder: row.folder || undefined,
                tags: row.tags || undefined
            }));

        logger.info({
            userId: user.id,
            query,
            filter,
            count: formatted.length
        }, "Search Performed");

        return formatted;

    } catch (error) {
        logger.error({err: error}, "Search Failed");
        return [];
    }
}