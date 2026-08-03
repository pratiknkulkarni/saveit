import {z} from "zod";

export const changePasswordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
});

export const deleteAccountFormSchema = z.object({
    password: z.string().min(1, "Password is required"),
});
