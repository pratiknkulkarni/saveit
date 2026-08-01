"use client"

import * as React from "react"
import {Check, ChevronsUpDown, X} from "lucide-react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Tag} from "@/app/actions/types";
import {ScrollArea} from "@/components/ui/scroll-area";
import {createNewTags} from "@/app/actions/tags";
import {RefetchOptions} from "@tanstack/react-query"
import {QueryObserverResult} from "@tanstack/query-core";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useState} from "react";
import {useToast} from "@/hooks/use-toast";

interface TagInputProps {
    tags: Tag[],
    selectedTags: Tag[],
    onChange: (tags: Tag[]) => void,
    userId: string | undefined,
    isTagsRefetching: boolean,
    refetchTags: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<{
        id: number;
        name: string;
    }[], Error>>
}

// userId stays on TagInputProps so the existing call sites keep compiling, but it
// is no longer destructured — createNewTags derives the user from the session.
const TagInput = ({tags, selectedTags, onChange, refetchTags, isTagsRefetching}: TagInputProps) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const selectedTagIds = selectedTags.map((tag) => tag.id);
    const {toast} = useToast();

    const handleSelect = (tagId: number) => {
        if (selectedTagIds.includes(tagId)) {
            onChange(selectedTags.filter((tag) => tag.id !== tagId))
        } else {
            onChange([...selectedTags, tags.find((tag) => tag.id === tagId)!])
        }
    }

    const handleCreateTag = async () => {
        if (inputValue === "") {
            toast({
                title: "Tag name cannot be empty",
                description: "Please enter a tag name",
            })
            return;
        }
        await createNewTags({tags: [inputValue]});
        await refetchTags();
        setInputValue("")
    };

    const removeTag = (tag: string) => {
        onChange(selectedTags.filter((t) => t.name !== tag))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {selectedTags.length > 0
                        ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                        : "Select tags..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <ScrollArea>
                    <Command>
                        <CommandInput placeholder="Search tags..." value={inputValue} onValueChange={setInputValue}/>
                        <CommandList>
                            {/*show no tags are present only if the tag refetching is not happening*/}
                            {!isTagsRefetching && <CommandEmpty>
                                No tag found.
                                <br/>
                                <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateTag}>
                                    Create <div className={"opacity-65"}>{inputValue}</div>
                                </Button>
                            </CommandEmpty>}
                            <CommandGroup>
                                {isTagsRefetching &&
                                    <div className={"h-full w-full flex justify-center items-center"}><LoadingSpinner/>
                                    </div>}
                                {tags.map((tag) => (
                                    <CommandItem key={tag.id} onSelect={() => handleSelect(tag.id)}>
                                        <Check
                                            className={cn("mr-2 h-4 w-4", selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0")}/>
                                        {tag.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </ScrollArea>
            </PopoverContent>

            <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tag) => (
                    <Button key={tag.id} variant="secondary" size="sm" className="h-7 text-xs"
                            onClick={() => removeTag(tag.name)}>
                        {tag.name}
                        <X className="ml-1 h-3 w-3"/>
                    </Button>
                ))}
            </div>
        </Popover>
    )
}

export default TagInput
