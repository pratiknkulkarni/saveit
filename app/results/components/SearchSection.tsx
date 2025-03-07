import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge, Folder, Link, Tag} from "lucide-react";
import HighlightText from "@/app/results/components/HighlightText";
import {getMatchedTerms} from "@/lib/getMatchedTerms";
import SearchResultsBookmarkActions from "./SearchResultsBookmarkActions";
import {SearchResult} from "minisearch";
import React, {RefObject} from "react";

type SearchSectionProps = {
    title: string;
    items: SearchResult[];
    type: "tag" | "folder" | "bookmark";
    includeActions?: boolean;
    ref: RefObject<HTMLDivElement | null>;
}

const SearchSection = ({title, items, type, ref}: SearchSectionProps) => (
    <div className="mb-8" ref={ref}>
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">{title}</h2>

        {items.length === 0 ? (
            <p className="text-gray-500 italic">No {title.toLowerCase()} found.</p>
        ) : (
            <div className="grid gap-4">
                {items.map((item) => (
                    <Card key={item.id}>
                        <CardHeader>
                            <CardTitle>{item.title || (type === "tag" ? item.tags : item.folder)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {type === "bookmark" && (
                                <>
                                    {item.description && (
                                        <p className="text-sm text-gray-500">
                                            {HighlightText(item.description, getMatchedTerms(item, "description"))}
                                        </p>
                                    )}

                                    {item.url && (
                                        <a href={item.url}
                                           className="flex items-center text-blue-500 text-sm hover:underline">
                                            <Link className="h-4 w-4 mr-1"/>
                                            {HighlightText(item.url, getMatchedTerms(item, "url"))}
                                        </a>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.folder && (
                                            <Badge className="flex items-center">
                                                <Folder className="h-4 w-4 mr-1"/>
                                                {HighlightText(item.folder, getMatchedTerms(item, "folder"))}
                                            </Badge>
                                        )}

                                        {item.tags &&
                                            item.tags.split(",").map((tag: string) => (
                                                <Badge key={tag} className="flex items-center">
                                                    <Tag className="h-4 w-4 mr-1"/>
                                                    {HighlightText(tag.trim(), getMatchedTerms(item, "tags"))}
                                                </Badge>
                                            ))}
                                    </div>
                                    <SearchResultsBookmarkActions/>
                                </>
                            )}

                            {type === "tag" && item.tags !== undefined && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Tag className="h-4 w-4 mr-2 text-blue-400"/>
                                    {HighlightText(item?.tags, getMatchedTerms(item, "tags"))}
                                </div>
                            )}

                            {type === "folder" && item?.folder && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Folder className="h-4 w-4 mr-2 text-yellow-500"/>
                                    {HighlightText(item?.folder, getMatchedTerms(item, "folder"))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
);

export default SearchSection