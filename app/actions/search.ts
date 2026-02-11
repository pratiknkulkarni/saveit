"use server"

import {Bookmark, Folder, PrismaClient, Tag} from "@prisma/client";
import MiniSearch, {SearchResult} from "minisearch";
import {Filter, MatchMode} from "@/app/actions/search_enum";

const searchBookmarks = async (searchTerm: string, userId: string | undefined) => {
    const searchFields = ["title", "url", "description", "tags"];
    if (!userId) {
        return []
    }

    const prisma = new PrismaClient();

    if (!searchTerm) {
        return []
    }

    const bookmarks = await prisma.bookmark.findMany({
        where: {
            userId,
        }
    });

    const miniSearch = new MiniSearch({
        fields: searchFields,
        storeFields: ['id', 'title', 'url', 'tags', 'description'],
        searchOptions: {
            prefix: true,
            fuzzy: 0.2,
        },
    });

    miniSearch.addAll(bookmarks);

    const results = miniSearch.search(searchTerm);
    console.log(results);

    return results;
}

// this HAS TO crash if number of bookmark are huge
// TODO: I need to ensure it doesn't.
const searchAll = async (
    searchTerm: string | undefined,
    userId: string | undefined,
    filter?: Filter,
    matchMode?: MatchMode
): Promise<SearchResult[]> => {
    if (!userId || !searchTerm) return [];

    const prisma = new PrismaClient();

    let folders: Folder[] = [];
    let tags: Tag[] = [];
    let bookmarks: Bookmark[] = [];

    // bookmark
    if (filter === "title" || filter === "all" || filter === "description" || filter === "url") {
        bookmarks = await prisma.bookmark.findMany({
            where: {
                userId
            }
        })
    }

    // folder
    if (filter === "folder" || filter === "all") {
        folders = await prisma.folder.findMany({where: {userId}});
    }

    // tag
    if (filter === "tag" || filter === "all") {
        tags = await prisma.tag.findMany({where: {userId}});
    }

    // combining the data to put it all in the minisearch
    const documents = [
        ...bookmarks.map((b) => ({
            id: `bookmark-${b.id}`,
            type: "bookmark",
            title: b.title || "",
            url: b.url,
            description: b.description || "",
            folder: "",
            tags: "",
        })),
        ...folders.map((f) => ({
            id: `folder-${f.id}`,
            type: "folder",
            title: "Folders",
            url: "",
            description: "",
            folder: f.name,
            tags: "",
        })),
        ...tags.map((t) => ({
            id: `tag-${t.id}`,
            type: "tag",
            title: "Tags",
            url: "",
            description: "",
            folder: "",
            tags: t.name,
        })),
    ];

    let searchFields = ["title", "url", "description", "folder", "tags"];

    if (filter) {
        switch (filter) {
            case "title":
                searchFields = ["title"];
                break;
            case "description":
                searchFields = ["description"];
                break;
            case "url":
                searchFields = ["url"];
                break;
            case "tag":
                searchFields = ["tags"];
                break;
            case "folder":
                searchFields = ["folder"];
                break;
            default:
                break;
        }
    }

    let searchOptions = {};

    switch (matchMode) {
        case "exact":
            searchOptions = {fuzzy: false};
            break;
        case "fuzzy":
            searchOptions = {fuzzy: 0.2, prefix: false};
            break;
        case "loose":
            searchOptions = {fuzzy: 0.4, prefix: false};
            break;
        case "startsWith":
            searchOptions = {prefix: true, fuzzy: false};
            break;
        // case "contains":
        //     searchOptions = {fuzzy: 0.3, prefix: true};
        //     break;
        default:
            searchOptions = {fuzzy: 0.2};
    }

    const miniSearch = new MiniSearch({
        fields: searchFields,
        storeFields: ["id", "type", "title", "url", "description", "folder", "tags"],
        searchOptions,
    });

    miniSearch.addAll(documents);

    const entityMatch = searchTerm.match(/^(bookmark|folder|tag):\s*(.*)/i);

    let results;

    if (entityMatch) {
        const [, entityType, term] = entityMatch;
        results = miniSearch.search(term, {
            filter: (doc) => doc.type === entityType.toLowerCase(),
        });
    } else {
        results = miniSearch.search(searchTerm);
    }
    console.log(results);

    const enrichedResults = results.map((res) => ({
        ...res,
        match: res.match,
    }));

    return enrichedResults;
};

export {searchBookmarks, searchAll}
