"use client"

import {Badge} from "@/components/ui/badge"
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import * as React from "react";
import {X} from "lucide-react";

type Tag = {
    id: number, name: string
}

type TagGroup = {
    letter: string;
    tags: Tag[];
}

const generateFilterURL = (folderId: string, tagIds: string[], newTagId: string): string => {
    const url = "/filters";
    const params: string[] = [];

    if (folderId) {
        params.push(`folderId=${folderId}`);
    }

    // Toggle the newTagId: remove if it exists, add if it doesn't
    const updatedTags = tagIds.includes(newTagId)
        ? tagIds.filter(tagId => tagId !== newTagId) // Remove if exists
        : [...tagIds, newTagId]; // Add if not exists

    // if only tags were selected and no folders, redirect to home since all filters were removed
    if (updatedTags.length === 0 && folderId === "") {
        return "/home";
    }

    updatedTags.forEach(tagId => {
        params.push(`tagId=${tagId}`);
    });


    return params.length > 0 ? `${url}?${params.join("&")}` : url;
};


const groupTagsAlphabetically = (tags: Tag[]): TagGroup[] => {
    const grouped = tags.reduce((acc, tag) => {
        const letter = tag.name[0].toUpperCase();
        if (!acc[letter]) {
            acc[letter] = [];
        }
        acc[letter].push(tag);
        return acc;
    }, {} as Record<string, Tag[]>);

    return Object.entries(grouped)
        .map(([letter, tags]) => ({
            letter,
            tags: tags.sort((a, b) => a.name.localeCompare(b.name))
        }))
        .sort((a, b) => a.letter.localeCompare(b.letter));
};

const FilteredTagList = ({tags}: { tags: Tag[] }) => {
    const [groupedTags, setGroupedTags] = useState<TagGroup[]>([]);
    const router = useRouter();

    const searchParams = useSearchParams();
    const tagIds = searchParams.getAll("tagId") || "";
    const setTagIds = new Set(searchParams.getAll("tagId"));
    const folderId = searchParams.get("folderId") || "";

    useEffect(() => {
        if (tags.length > 0) {
            setGroupedTags(groupTagsAlphabetically(tags.map(tag => ({id: tag.id, name: tag.name}))));
        }
    }, [tags]);


    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Tags</h2>
            {groupedTags.map((group) => (
                <div key={group.letter}>
                    <h3 className="text-sm font-bold mb-2">{group.letter}</h3>
                    <div className="flex text-xs flex-wrap gap-2">
                        {group.tags.map((tag) => {
                            const isSelected = setTagIds.has(String(tag.id));

                            return <Badge key={tag.id}
                                          className={`cursor-pointer ${isSelected ? "bg-primary-foreground text-secondary-foreground" : "bg-accent-200"}`}
                                          variant={isSelected ? "default" : "secondary"}
                                          onClick={() => {
                                              const url = generateFilterURL(folderId, [...tagIds], String(tag.id));
                                              router.push(url);
                                          }}>
                                {tag.name} {isSelected && <X className="ml-1 h-3 w-3"/>}
                            </Badge>
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default FilteredTagList;
