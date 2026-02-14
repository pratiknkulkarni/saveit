"use server"

import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server";
import {logger} from "@/lib/logger";
import {Filter, MatchMode} from "@/app/actions/search_enum";

type SearchResult = {
    id: number;
    type: string;
    title: string;
    description: string;
    url: string;
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
        let sqlQuery;

        if (matchMode === "exact") {
            // EXACT
            sqlQuery = prisma.$queryRaw<SearchResult[]>`
                SELECT id, 'bookmark' as type, title, description, url, 1 as rank
                FROM "Bookmark"
                WHERE "userId" = ${user.id}
                  AND (
                    (${filter} IN ('all', 'title') AND title ILIKE ${query}) OR
                    (${filter} IN ('all', 'description') AND description ILIKE ${query}) OR
                    (${filter} IN ('all', 'url') AND url ILIKE ${query})
                    )
                LIMIT 50;
            `;
        } else if (matchMode === "startsWith") {
            // STARTS WITH
            sqlQuery = prisma.$queryRaw<SearchResult[]>`
                SELECT id, 'bookmark' as type, title, description, url, 1 as rank
                FROM "Bookmark"
                WHERE "userId" = ${user.id}
                  AND (
                    (${filter} IN ('all', 'title') AND title ILIKE ${query + '%'}) OR
                    (${filter} IN ('all', 'description') AND description ILIKE ${query + '%'}) OR
                    (${filter} IN ('all', 'url') AND url ILIKE ${query + '%'})
                    )
                LIMIT 50;
            `;
        } else {
            // FUZZY / LOOSE
            // FIX: Switched from similarity() to word_similarity(query, column)
            // This finds the best matching *substring* within the text.
            sqlQuery = prisma.$queryRaw<SearchResult[]>`
                SELECT id,
                       'bookmark' as type,
                       title,
                       description,
                       url,
                       -- Rank by the best word match
                       GREATEST(
                               word_similarity(${query}, title),
                               word_similarity(${query}, description),
                               word_similarity(${query}, url)
                       )          as rank
                FROM "Bookmark"
                WHERE "userId" = ${user.id}
                  AND (
                    -- Fuzzy Word Similarity
                    (
                        word_similarity(${query}, title) > 0.2 OR
                        word_similarity(${query}, description) > 0.2 OR
                        word_similarity(${query}, url) > 0.2
                        )
                        OR
                        -- Partial Match Fallback
                    (
                        title ILIKE ${`%${query}%`} OR
                        description ILIKE ${`%${query}%`} OR
                        url ILIKE ${`%${query}%`}
                        )
                    )
                ORDER BY rank DESC
                LIMIT 50;
            `;
        }

        const results = await sqlQuery;

        const formatted = results.map(row => ({
            id: `bookmark-${row.id}`,
            type: "bookmark",
            title: row.title || row.url,
            description: row.description,
            url: row.url,
            match: row.rank
        }));

        logger.info({
            userId: user.id,
            query,
            matchMode,
            count: formatted.length
        }, "Search Performed");

        return formatted;

    } catch (error) {
        logger.error({err: error}, "Search Failed");
        return [];
    }
}
