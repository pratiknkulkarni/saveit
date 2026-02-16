"use client"

import {Dispatch, FC, SetStateAction, useEffect} from "react"
import {useState} from "react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useQueryClient} from "@tanstack/react-query"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage} from "@/components/ui/form"
import {Popover, PopoverTrigger, PopoverContent} from "@/components/ui/popover"
import {Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem} from "@/components/ui/command"
import {TooltipProvider, Tooltip, TooltipTrigger, TooltipContent} from "@/components/ui/tooltip"
import {Check, ChevronsUpDown, Wand2} from "lucide-react"
import {cn} from "@/lib/utils"
import {BookmarkFormData, bookmarkSchema} from "./CreateBookmarkDialog"
import {fetchMetadata} from "@/app/actions/metadatafetcher";
import TagInput from "@/app/home/components/TagInput";
import {useToast} from "@/hooks/use-toast"
import {authClient} from "@/lib/auth-client";
import {createFolders} from "@/app/actions/folders";
import {Tag} from "@/app/actions/types";
import {ScrollArea} from "@/components/ui/scroll-area"
import * as React from "react";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useCreateBookmarkMutation} from "@/hooks/use-create-bookmark-mutation";
import {useGetUserTagsQuery} from "@/hooks/use-get-user-tags-query";
import {useGetUserFoldersQuery} from "@/hooks/use-get-user-folders-query";
import {QUERY_KEYS} from "@/lib/queryKeys";
import Image from "next/image";
import {Skeleton} from "@/components/ui/skeleton";
import {useSettings} from "@/app/context/SettingsContext";

interface CreateBookmarkFormProps {
    setOpen: Dispatch<SetStateAction<boolean>>
}

const BookmarkForm: FC<CreateBookmarkFormProps> = ({setOpen}) => {
    const queryClient = useQueryClient();
    const {settings} = useSettings();
    const form = useForm<BookmarkFormData>({
        resolver: zodResolver(bookmarkSchema),
        defaultValues: {
            title: "",
            url: "",
            description: "",
            folderId: undefined,
            tags: [],
            imageURL: "",
        },
    });

    const {data: session} = authClient.useSession();
    const {url} = form.watch();
    const {toast} = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const [selectedTags, setSelectedTags] = useState<Tag[]>(form.getValues("tags") || []);
    const [folderInputValue, setFolderInputValue] = useState("");
    const [previewImageURL, setPreviewImageURL] = useState("");

    const createBookmarkMutation = useCreateBookmarkMutation();
    const {
        data: tags = [],
        refetch: refetchTags,
        isRefetching: isTagsRefetching
    } = useGetUserTagsQuery(session?.user?.id)

    const {
        data: folders = [],
        refetch: refetchFolders,
        isRefetching: isFoldersRefetching
    } = useGetUserFoldersQuery(session?.user?.id);

    // useEffect(() => {
    //     if (createBookmarkMutation.status === "success") {
    //         setTimeout(() => {
    //             void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]});
    //         }, 100)
    //
    //         setTimeout(() => {
    //             void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useTagsForBookmarksQueryKey]});
    //         }, 200)
    //
    //         setTimeout(() => {
    //             void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery]});
    //         }, 300)
    //
    //         toast({
    //             title: "Bookmark created",
    //             description: "Your bookmark has been successfully added.",
    //         });
    //
    //         setOpen(false);
    //         form.reset(); // reset form
    //         router.push("/home");
    //     }
    //
    //     if (createBookmarkMutation.status === "error") {
    //         toast({
    //             title: "Error",
    //             description: "There was a problem creating your bookmark.",
    //             variant: "destructive",
    //         })
    //     }
    // }, [createBookmarkMutation.status]);
    //

    // handle the form submission to create bookmark
    // const onSubmit = async (data: BookmarkFormData) => {
    //     const formData = new FormData();
    //     Object.entries(data).forEach(([key, value]) => {
    //         if (key === "tags" && Array.isArray(value)) {
    //             formData.append(key, JSON.stringify(value));
    //         } else if (value !== undefined && value !== null) {
    //             formData.append(key, value.toString())
    //         }
    //     })
    //
    //     if (session?.user?.id) {
    //         createBookmarkMutation.mutate({formData, userId: session.user.id})
    //     }
    // };

    const onSubmit = async (data: BookmarkFormData) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === "tags" && Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (value !== undefined && value !== null) {
                formData.append(key, value.toString())
            }
        });

        // No need to pass userId, the server action handles it via session
        createBookmarkMutation.mutate(formData, {
            onSuccess: () => {
                // Invalidate queries strictly
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey]});
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useTagsForBookmarksQueryKey]});
                queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery]});

                toast({
                    title: "Bookmark created",
                    description: "Your bookmark has been successfully added.",
                });

                setOpen(false);
                form.reset();
                router.push("/home");
            },
            onError: (error) => {
                toast({
                    title: "Error",
                    description: error.message || "There was a problem creating your bookmark.",
                    variant: "destructive",
                });
            }
        });
    };

    // fetch metadata for the provided URL
    const fetchAndSetMetadata = async () => {
        if (!url) {
            toast({
                title: "Error",
                description: "Please enter a valid URL.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            const metadata = await fetchMetadata(url)

            console.log(metadata);

            if (metadata && metadata.title === null && metadata.description === null) {
                toast({
                    title: "Metadata not found",
                    description: "Unable to fetch metadata for the provided URL. Please enter a manual title/description.",
                });
                return;
            }
            if (metadata) {
                form.setValue("title", metadata.title || "");
                form.setValue("description", metadata.description || "");
                if (metadata.preview_image) {
                    setPreviewImageURL(metadata.preview_image)
                    form.setValue("imageURL", metadata.preview_image)
                }
            }

            toast({
                title: "Metadata Fetched",
                description: "Metadata has been successfully loaded.",
            });
        } catch {
            toast({
                title: "Error",
                description: "Unable to fetch metadata for the provided URL.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // handle folder creation
    const handleCreateFolder = async () => {
        // await createFolders({names: [folderInputValue], userId: session?.user?.id});
        await createFolders({names: [folderInputValue]});
        await refetchFolders();
        setFolderInputValue("")
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6 overflow-y-hidden">
                {/* URL Field */}
                <FormField
                    control={form.control}
                    name="url"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                                <div className="flex gap-2 pr-3">
                                    <Input placeholder="https://example.com" {...field} autoFocus={true}/>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        void fetchAndSetMetadata()
                                                    }}
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Autofill data"
                                                >
                                                    <Wand2 className="h-4 w-4"/>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Autofill data</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </FormControl>
                            <FormDescription>The URL of the webpage you want to bookmark.</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                {settings.bookmarkDisplay.includes("Images") && <FormField
                    control={form.control}
                    name="imageURL"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Preview Image</FormLabel>
                            <FormControl>
                                {(previewImageURL !== "" || loading) && (
                                    <div className="rounded-lg overflow-hidden border border-border">
                                        <Input className={"hidden"} {...field} value={previewImageURL}
                                               onChange={(e) => field.onChange(e.target.value)}/>
                                        <div className="relative aspect-video w-full">
                                            {loading ? (
                                                <Skeleton className="absolute inset-0"/>
                                            ) : (
                                                <Image
                                                    src={previewImageURL}
                                                    alt="URL preview"
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 600px"
                                                />
                                            )}
                                        </div>
                                        <div className="p-2 bg-muted/30 text-xs text-muted-foreground">
                                            Preview image from {url}
                                        </div>
                                    </div>
                                )}
                            </FormControl>
                            <FormDescription>Preview image of the URL</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />}

                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Title (Optional)</FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Enter bookmark title" {...field} />
                            </FormControl>
                            <FormDescription>The title of your bookmark.</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                {/* Description Field */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea disabled={loading} placeholder="Enter a description" {...field} />
                            </FormControl>
                            <FormDescription>A brief description of the bookmark.</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                {/* Folder Field */}
                <FormField
                    control={form.control}
                    name="folderId"
                    render={({field}) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Folder (Optional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                        >
                                            {field.value ? folders.find((folder) => folder.id === field.value)?.name : "Select folder"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <ScrollArea>
                                        <Command>
                                            <CommandInput placeholder="Search folders..." value={folderInputValue}
                                                          onValueChange={setFolderInputValue}/>
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div>
                                                        No folder found.
                                                        <br/>
                                                        <Button variant="outline" size="sm" className="mt-2"
                                                                onClick={handleCreateFolder}>
                                                            Create <div
                                                            className={"opacity-65"}>{folderInputValue}</div>
                                                        </Button>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {isFoldersRefetching &&
                                                        <div
                                                            className={"h-full w-full flex justify-center items-center"}>
                                                            <LoadingSpinner/>
                                                        </div>}
                                                    {folders.map((folder) => (
                                                        <CommandItem
                                                            value={folder.name}
                                                            key={folder.id}
                                                            onSelect={() => {
                                                                form.setValue("folderId", folder.id)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn("mr-2 h-4 w-4", folder.id === field.value ? "opacity-100" : "opacity-0")}
                                                            />
                                                            {folder.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <FormDescription>Choose a folder for your bookmark (optional).</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                {/*Tag Field */}
                <FormField
                    control={form.control}
                    name="tags"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Tags (Optional)</FormLabel>
                            <FormControl>
                                {field.value && (
                                    <TagInput
                                        tags={tags}
                                        selectedTags={selectedTags}
                                        onChange={(newTags) => {
                                            setSelectedTags(newTags)
                                            form.setValue("tags", newTags)
                                        }}
                                        refetchTags={refetchTags}
                                        isTagsRefetching={isTagsRefetching}
                                        userId={session?.user?.id}
                                    />
                                )}
                            </FormControl>
                            <FormDescription>Add tags to categorize your bookmark.</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading || createBookmarkMutation.isPending}>
                    Save Bookmark
                </Button>
            </form>
        </Form>
    )
}

export default BookmarkForm
