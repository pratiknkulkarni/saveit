"use client"

import {ChangeEvent, useState, KeyboardEvent} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Tag, X} from "lucide-react"
import ActionButton from "@/app/home/ActionButton";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {authClient} from "@/lib/auth-client";
import {createNewTags} from "@/app/actions/tags";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useToast} from "@/hooks/use-toast"
import {QUERY_KEYS} from "@/lib/queryKeys";

interface CreateTagsResponse {
    success: boolean;
    error?: string;
    data?: number;
    duplicateTags?: string[];
}

const CreateTagDialog = () => {
    const [open, setOpen] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [inputValue, setInputValue] = useState("")
    const {data: session} = authClient.useSession();
    const {toast} = useToast();
    const queryClient = useQueryClient();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const createTagsMutation = useMutation<CreateTagsResponse, Error, void>({
        mutationFn: () => createNewTags({
            tags: tags,
            userId: session?.user?.id
        }),
        onSuccess: (data) => {
            if (data.success) {
                toast({
                    title: "Tag(s) created successfully",
                    description: `${data.data} tags created.`
                });
                setOpen(false);
                setTags([]);
                queryClient.refetchQueries({queryKey: [QUERY_KEYS.useGetUserTagsQueryKey]})
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to create tags",
                    variant: "destructive",
                });
                if (data.duplicateTags) {
                    toast({
                        title: "Duplicate tags",
                        description: `Tags "${data.duplicateTags.join('", "')}" already exist`,
                        variant: "destructive",
                    })
                }
            }
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = () => {
        createTagsMutation.mutate()
    }

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim() !== "") {
            e.preventDefault()
            const newTag = inputValue.trim()
            if (!tags.includes(newTag)) {
                const updatedTags = [...tags, newTag];
                setTags(updatedTags);
                setInputValue(""); // Clear input after "Enter" is pressed. Might change later.
            }
        }
    }

    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter((tag) => tag !== tagToRemove)
        setTags(updatedTags)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <ActionButton icon={Tag} label={"New Tag"}/>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Tag(s)</DialogTitle>
                    <DialogDescription>
                        Enter the tag name(s) here. Press enter and keep adding new ones.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-sm py-1 px-2">
                                {tag}
                                <button onClick={() => removeTag(tag)}
                                        className="ml-1 hover:bg-gray-200 rounded-full p-1">
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <Input
                        type="text"
                        placeholder="Enter tags (press Enter to add)"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        className="mt-2"
                    />
                </div>
                <div className={"flex justify-evenly w-full"}>
                    <Button disabled={tags.length === 0} onClick={handleSubmit}>Submit</Button>
                    <Button onClick={() => {
                        setOpen(false)
                    }} variant={"destructive"}>Cancel</Button>
                </div>
                <DialogFooter className="mt-4">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateTagDialog;
