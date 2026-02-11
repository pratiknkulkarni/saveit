import {z} from "zod";

export const createFoldersSchema = z.object({
    names: z.array(
        z.string()
            .trim()
            .min(1, "Folder name cannot be empty")
            .max(50, "Folder name too long")
    ).min(1, "At least one folder name is required"),
});

export const updateFolderSchema = z.object({
    folderId: z.number(),
    newFolderName: z.string().trim().min(1, "Folder name cannot be empty").max(50, "Folder name too long"),
});

export const deleteFolderSchema = z.object({
    folderId: z.number(),
});
