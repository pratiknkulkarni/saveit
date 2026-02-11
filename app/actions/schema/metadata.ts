import {z} from "zod";

export const metadataSchema = z.object({
    url: z.string().url("Invalid URL").refine((val) => {
        try {
            const url = new URL(val);
            return ['http:', 'https:'].includes(url.protocol);
        } catch {
            return false;
        }
    }, "Only HTTP and HTTPS protocols are allowed"),
});