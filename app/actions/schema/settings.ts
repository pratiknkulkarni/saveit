import {z} from "zod";

export const settingsSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    bookmarkDisplay: z.array(z.string()).optional(),
    showTags: z.boolean().optional(),
    bookmarkLayout: z.enum(["minimal", "list", "grid", "card"]).optional(),
    itemsPerPage: z.number().min(5).max(100).optional(),
});