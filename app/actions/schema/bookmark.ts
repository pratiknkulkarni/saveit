import z from "zod";

export const bookmarkSchema = z.object({
    title: z.string().max(255, "Title must be 255 characters or less").optional(),
    url: z.string().url("Must be a valid URL"),
    description: z.string().max(500, "Description must be 500 characters or less").optional(),
    folderId: z.number().optional(),
    imageURL: z.string().optional(),
    tags: z.array(z.object({
        id: z.number(),
        name: z.string()
    })).optional(),
    // Set by the edit form only when TagInput actually changes. Without it a
    // title-only edit would send no tags and wipe every tag on the bookmark.
    tagsModified: z.boolean().optional(),
});

export type BookmarkSchemaType = z.infer<typeof bookmarkSchema>;