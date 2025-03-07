"use client"

import { Dispatch, FC, SetStateAction, useEffect } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Check, ChevronsUpDown, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookmarkFormData, bookmarkSchema } from "./CreateBookmarkDialog"
import { fetchMetadata } from "@/app/actions/metadatafetcher";
import TagInput from "@/app/home/components/TagInput";
import { useToast } from "@/hooks/use-toast"
import { authClient } from "@/lib/auth-client";
import { createFolders, getUserFolders } from "@/app/actions/folders";
import { getTagsForBookmark } from "@/app/actions/tags";
import { GetTagsForBookmarkResponse, Tag } from "@/app/actions/types";
import { ScrollArea } from "@/components/ui/scroll-area"
import * as React from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EditBookmarkFormData } from "@/app/home/components/EditBookmarkDialog";
import { updateBookmark } from "@/app/actions/bookmark";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { useGetUserTagsQuery } from "@/hooks/use-get-user-tags-query";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useSettings } from "@/app/context/SettingsContext";

interface EditBookmarkFormProps {
  setOpen: Dispatch<SetStateAction<boolean>>
  bookmarkFormData: EditBookmarkFormData,
}

const EditBookmarkForm: FC<EditBookmarkFormProps> = ({ setOpen, bookmarkFormData }) => {
  const queryClient = useQueryClient();
  const form = useForm<BookmarkFormData>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: bookmarkFormData.title,
      url: bookmarkFormData.url,
      description: bookmarkFormData.description,
      folderId: bookmarkFormData.folderId,
      tagsModified: false,
    },
  });

  const { data: session } = authClient.useSession();
  const { url } = form.watch();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [folderInputValue, setFolderInputValue] = useState("");
  const pathName = usePathname();
  const { settings } = useSettings();
  const [previewImageURL, setPreviewImageURL] = useState("");

  // query to fetch/refetch folders
  const { data: folders = [], refetch: refetchFolders, isRefetching: isFoldersRefetching } = useQuery({
    queryKey: [QUERY_KEYS.useGetUserFoldersQueryKey, session?.user?.id],
    queryFn: () => getUserFolders({ userId: session?.user?.id as string }),
    enabled: !!session?.user?.id,
    select: (response) =>
      response.success && response.data
        ? response.data.map((folder: { id: number; name: string }) => ({
          id: folder.id.toString(),
          name: folder.name,
        }))
        : [],
  });

  // query to fetch/refetch tags
  const {
    data: tags = [],
    refetch: refetchTags,
    isRefetching: isTagsRefetching
  } = useGetUserTagsQuery(session?.user?.id);

  // query to fetch the tags which are selected for the bookmark under edit
  const { data: tagsForBookmark } = useQuery<GetTagsForBookmarkResponse>({
    queryKey: ["tagsForBookmark", session?.user?.id],
    queryFn: () => getTagsForBookmark(bookmarkFormData.id),
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (tagsForBookmark && tagsForBookmark?.success) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const tags = tagsForBookmark.data.map(tag => tag.tag);
      setSelectedTags(tags);
    }
  }, [tagsForBookmark]);

  const updateBookmarkMutation = useMutation({
    mutationFn: ({ formData, userId, bookmarkId, tags }: {
      formData: FormData;
      userId: string,
      bookmarkId: number,
      tags: Tag[]
    }) => updateBookmark(formData, bookmarkId, userId, tags),
    onSuccess: async (data) => {
      if (data?.success) {
        setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useBookmarksOnHomePageQueryKey] });
        }, 100)

        toast({
          title: "Bookmark updated",
          description: "Your bookmark has been successfully updated.",
        });

        setOpen(false);
        form.reset(); // reset form
        if (pathName === "/home") {
          router.push("/home");
        }
        if (pathName === "/filters") {
          // setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useFilteredBookmarksQuery] });
          // }, 100)
        }
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was a problem updating your bookmark.",
        variant: "destructive",
      })
    },
  });

  // handle the form submission to create bookmark
  const onSubmit = async (data: BookmarkFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "tags" && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    });

    if (session?.user?.id) {
      updateBookmarkMutation.mutate({
        formData,
        userId: session?.user?.id,
        tags: selectedTags,
        bookmarkId: bookmarkFormData.id,
      });
    }
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
      if (metadata.title === null && metadata.description === null) {
        toast({
          title: "Metadata not found",
          description: "Unable to fetch metadata for the provided URL. Please enter a manual title/description.",
        });
        return;
      }
      form.setValue("title", metadata.title || "");
      form.setValue("description", metadata.description || "");

      if (metadata.preview_image) {
        setPreviewImageURL(metadata.preview_image)
        form.setValue("imageURL", metadata.preview_image)
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
    if (folderInputValue === "") {
      toast({
        title: "Folder name cannot be empty",
        description: "Please enter the folder name",
      });
      return
    }

    await createFolders({ names: [folderInputValue], userId: session?.user?.id });
    await refetchFolders();
    setFolderInputValue("")
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-hidden pb-6">
        {/* URL Field */}
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <div className="flex gap-2 pr-3 overflow-x-clip">
                  <Input className={"overflow-x-clip"} placeholder="https://example.com" {...field}
                    autoFocus={true} />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            fetchAndSetMetadata()
                          }}
                          variant="outline"
                          size="icon"
                          aria-label="Autofill data"
                        >
                          <Wand2 className="h-4 w-4" />
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
              <FormMessage />
            </FormItem>
          )}
        />

        {settings.bookmarkDisplay.includes("Images") && <FormField
          control={form.control}
          name="imageURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preview Image</FormLabel>
              <FormControl>
                {(previewImageURL !== "" || loading) && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <Input className={"hidden"} {...field} value={previewImageURL}
                      onChange={(e) => field.onChange(e.target.value)} />
                    <div className="relative aspect-video w-full">
                      {loading ? (
                        <Skeleton className="absolute inset-0" />
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
              <FormMessage />
            </FormItem>
          )}
        />}

        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="Enter bookmark title" {...field} />
              </FormControl>
              <FormDescription>The title of your bookmark.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea disabled={loading} placeholder="Enter a description" {...field} />
              </FormControl>
              <FormDescription>A brief description of the bookmark.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <input type={"hidden"}{...form.register("tagsModified")} />

        {/* Folder Field */}
        <FormField
          control={form.control}
          name="folderId"
          render={({ field }) => (
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
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <ScrollArea>
                    <Command>
                      <CommandInput placeholder="Search folders..." value={folderInputValue}
                        onValueChange={setFolderInputValue} />
                      <CommandList>
                        <CommandEmpty>
                          <div>
                            No folder found.
                            <br />
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
                              <LoadingSpinner />
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  tags={tags}
                  selectedTags={selectedTags}
                  onChange={(newTags) => {
                    setSelectedTags(newTags)
                    form.setValue("tags", newTags)
                    form.setValue("tagsModified", true)
                  }}
                  refetchTags={refetchTags}
                  isTagsRefetching={isTagsRefetching}
                  userId={session?.user?.id}
                />
              </FormControl>
              <FormDescription>Add tags to categorize your bookmark.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading || updateBookmarkMutation.isPending}>
          Save Bookmark
        </Button>
      </form>
    </Form>
  )
}

export default EditBookmarkForm;
