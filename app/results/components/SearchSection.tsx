import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge, Folder, Link, Tag} from "lucide-react";
import HighlightText from "@/app/results/components/HighlightText";
import {getMatchedTerms} from "@/lib/search-highlight";
import {getSmartSnippet} from "@/lib/smart-snippet";
import SearchResultsBookmarkActions from "./SearchResultsBookmarkActions";
import React, {RefObject} from "react";
import {MatchMode} from "@/app/actions/search_enum";

type SearchResultItem = {
    id: string;
    type: string;
    title: string;
    description: string;
    url: string;
    match: number;
    tags?: string;
    folder?: string;
};

type SearchSectionProps = {
    title: string;
    items: SearchResultItem[];
    type: "tag" | "folder" | "bookmark";
    includeActions?: boolean;
    ref: RefObject<HTMLDivElement | null>;
    searchTerm: string;
    matchMode: MatchMode;
}

const SearchSection = ({title, items, type, ref, searchTerm, matchMode}: SearchSectionProps) => (
    <div className="mb-8" ref={ref}>
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">{title}</h2>

        {items.length === 0 ? (
            <p className="text-gray-500 italic">No {title.toLowerCase()} found.</p>
        ) : (
            <div className="grid gap-4">
                {items.map((item) => (
                    <Card key={item.id}>
                        <CardHeader>
                            <CardTitle>
                                {item.title
                                    ? HighlightText(item.title, getMatchedTerms(item.title, searchTerm, matchMode))
                                    : (type === "tag" ? item.tags : item.folder)
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {type === "bookmark" && (
                                <>
                                    {item.description && (
                                        <p className="text-sm text-gray-500">
                                            {HighlightText(
                                                getSmartSnippet(item.description, searchTerm, matchMode),
                                                getMatchedTerms(item.description, searchTerm, matchMode)
                                            )}
                                        </p>
                                    )}

                                    {item.url && (
                                        <a href={item.url}
                                           className="flex items-center text-blue-500 text-sm hover:underline">
                                            <Link className="h-4 w-4 mr-1"/>
                                            {HighlightText(
                                                item.url,
                                                getMatchedTerms(item.url, searchTerm, matchMode)
                                            )}
                                        </a>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.folder && (
                                            <Badge className="flex items-center">
                                                <Folder className="h-4 w-4 mr-1"/>
                                                {HighlightText(
                                                    item.folder,
                                                    getMatchedTerms(item.folder, searchTerm, matchMode)
                                                )}
                                            </Badge>
                                        )}
                                        {item.tags && item.tags.split(",").map((tag: string) => (
                                            <Badge key={tag} className="flex items-center">
                                                <Tag className="h-4 w-4 mr-1"/>
                                                {HighlightText(tag.trim(), getMatchedTerms(tag, searchTerm, matchMode))}
                                            </Badge>
                                        ))}
                                    </div>
                                    <SearchResultsBookmarkActions/>
                                </>
                            )}

                            {/* ... Folder/Tag specific card views ... */}
                            {/*TODO: DEBUG - REMOVE AFTER TESTING */}
                            {/*                    {process.env.NODE_ENV === "development" && (*/}
                            {/*                        <div*/}
                            {/*                            className="text-[10px] bg-gray-100 p-2 mb-2 rounded border border-dashed border-gray-300">*/}
                            {/*                            <span className="font-bold text-gray-600">DEBUG: </span>*/}
                            {/*                            <span className="mr-2">ID: {item.id}</span>*/}
                            {/*                            <span className="mr-2">DB Rank: {item.match.toFixed(3)}</span>*/}
                            {/*                            <span>*/}
                            {/*    Matches Found: {getMatchedTerms(item.title + " " + item.description + " " + item.url, searchTerm, matchMode).join(", ") || "NONE"}*/}
                            {/*</span>*/}
                            {/*                        </div>*/}
                            {/*                    )}*/}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
);

export default SearchSection;