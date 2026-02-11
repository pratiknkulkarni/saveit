import {z} from "zod";

export const createTagsSchema = z.object({
    tags: z.array(
        z.string()
            .trim()
            .min(1, "Tag name cannot be empty")
            .max(50, "Tag name too long")
    ).min(1, "At least one tag is required"),
});

export const updateTagSchema = z.object({
    tagId: z.number(),
    newTagName: z.string().trim().min(1, "Tag name cannot be empty").max(50, "Tag name too long"),
});

export const deleteTagSchema = z.object({
    tagId: z.number(),
});