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

/**
 * `%` and `_` are LIKE wildcards, so a user searching for "100%" would otherwise
 * match anything starting with "100". Backslash is Postgres' default LIKE escape
 * character, which is why it has to be escaped first.
 */
const escapeLikeWildcards = (value: string) =>
    value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * Collects bind values for one `$queryRawUnsafe` call. `bind(value)` appends the
 * value and returns the `$n` placeholder that refers to it, so the SQL below can
 * never contain user input — only placeholders. Each of the three queries is a
 * separate call and therefore needs its own binder, since `$n` numbering restarts.
 */
const createBinder = () => {
    const values: unknown[] = [];
    return {
        values,
        bind: (value: unknown) => `$${values.push(value)}`,
    };
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

        const escapedQuery = escapeLikeWildcards(query);

        // `threshold` stays interpolated deliberately: it is a numeric literal
        // chosen by the ternary above and never carries user input. Binding it
        // would force a cast, since word_similarity() returns `real`.
        const textMatch = (bind: (value: unknown) => string, col: string) => {
            if (isExact) return `${col} ILIKE ${bind(escapedQuery)}`;
            if (isStart) return `${col} ILIKE ${bind(`${escapedQuery}%`)}`;
            return `(word_similarity(${bind(query)}, ${col}) > ${threshold} OR ${col} ILIKE ${bind(`%${escapedQuery}%`)})`;
        };

        const rankCalc = (bind: (value: unknown) => string, col: string) => {
            if (!isFuzzy) return "1";
            return `word_similarity(${bind(query)}, ${col})`;
        };

        const promises = [];

        // =========================================================
        // QUERY 1: BOOKMARKS
        // =========================================================
        if (shouldQueryBookmarks) {
            const {values, bind} = createBinder();
            const bookmarkSQL = `
                WITH MatchingIds AS (SELECT b.id,
                                            GREATEST(
                                                    ${rankCalc(bind, 'b.title')},
                                                    ${rankCalc(bind, 'b.description')},
                                                    ${rankCalc(bind, 'b.url')}
                                            ) as rank
                                     FROM "Bookmark" b
                                              LEFT JOIN "Folder" f ON b."folderId" = f.id
                                              LEFT JOIN "BookmarkTags" bt ON b.id = bt."bookmarkId"
                                              LEFT JOIN "Tag" t ON bt."tagId" = t.id
                                     WHERE b."userId" = ${bind(user.id)}
                                       AND (
                                         (${searchTitle} AND ${textMatch(bind, 'b.title')}) OR
                                         (${searchDesc} AND ${textMatch(bind, 'b.description')}) OR
                                         (${searchUrl} AND ${textMatch(bind, 'b.url')}) OR
                                         (${searchFolderMeta} AND f.name IS NOT NULL AND ${textMatch(bind, 'f.name')}) OR
                                         (${searchTagMeta} AND t.name IS NOT NULL AND ${textMatch(bind, 't.name')})
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
            promises.push(prisma.$queryRawUnsafe<RawSearchResult[]>(bookmarkSQL, ...values));
        }

        // =========================================================
        // QUERY 2: FOLDERS
        // =========================================================
        if (shouldQueryFolders) {
            const {values, bind} = createBinder();
            const folderSQL = `
                SELECT id,
                       'folder'                  as type,
                       name                      as title,
                       ''                        as description,
                       ''                        as url,
                       ''                        as folder,
                       ''                        as tags,
                       ${rankCalc(bind, 'name')} as rank
                FROM "Folder"
                WHERE "userId" = ${bind(user.id)}
                  AND ${textMatch(bind, 'name')}
                LIMIT 20
            `;
            promises.push(prisma.$queryRawUnsafe<RawSearchResult[]>(folderSQL, ...values));
        }

        // =========================================================
        // QUERY 3: TAGS
        // =========================================================
        if (shouldQueryTags) {
            const {values, bind} = createBinder();
            const tagSQL = `
                SELECT id,
                       'tag'                     as type,
                       name                      as title,
                       ''                        as description,
                       ''                        as url,
                       ''                        as folder,
                       ''                        as tags,
                       ${rankCalc(bind, 'name')} as rank
                FROM "Tag"
                WHERE "userId" = ${bind(user.id)}
                  AND ${textMatch(bind, 'name')}
                LIMIT 20
            `;
            promises.push(prisma.$queryRawUnsafe<RawSearchResult[]>(tagSQL, ...values));
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