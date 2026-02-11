"use server"

import {Settings} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth-server"; // Gatekeeper
import {logger} from "@/lib/logger";
import {settingsSchema} from "@/app/actions/schema/settings";
import {ApplyDefaultSettingsInput, ApplySettingsInput} from "@/app/actions/types";

/**
 * Updates the authenticated user's settings.
 * Security: Uses session to identify user. Validates input with Zod.
 */
export async function commitSettings(input: Omit<ApplySettingsInput, "userId">): Promise<{
    success: boolean;
    message: string
}> {
    try {
        const user = await getCurrentUser();

        const validated = settingsSchema.safeParse(input);
        if (!validated.success) {
            logger.warn({userId: user.id, errors: validated.error.flatten()}, "Settings Update: Validation Failed");
            return {success: false, message: "Invalid settings provided."};
        }

        const {theme, bookmarkDisplay, showTags, bookmarkLayout, itemsPerPage} = validated.data;

        const updatedFields = {
            ...(theme && {theme}),
            ...(bookmarkDisplay && {bookmarkDisplay: bookmarkDisplay.join(",")}), // Convert Array -> CSV
            ...(showTags !== undefined && {showTags}),
            ...(bookmarkLayout && {bookmarkLayout}),
            ...(itemsPerPage && {itemsPerPage}),
        };

        await prisma.settings.update({
            where: {userId: user.id},
            data: updatedFields,
        });

        logger.info({userId: user.id, fields: Object.keys(updatedFields)}, "Settings Updated");
        return {success: true, message: "Settings applied successfully."};

    } catch (error) {
        logger.error({err: error}, "Settings Update: Failed");
        return {success: false, message: "Failed to apply settings. Please try again."};
    }
}

/**
 * Retrieves settings for an authenticated user.
 */
export async function getUserSettings(): Promise<Settings | null> {
    try {
        const user = await getCurrentUser();

        const settings = await prisma.settings.findFirst({
            where: {userId: user.id},
        });

        if (!settings) {
            logger.warn({userId: user.id}, "User Settings: Not Found (Using Defaults)");
        }

        return settings;
    } catch (error) {
        logger.error({err: error}, "User Settings: Fetch Failed");
        return null;
    }
}

export async function applyDefaultSettings({userId}: ApplyDefaultSettingsInput): Promise<{
    success: boolean;
    message: string
}> {
    try {
        if (!userId) throw new Error("UserId is required for default settings");

        await prisma.settings.create({
            data: {
                userId,
                theme: "light",
                bookmarkDisplay: "Title,Description,Tags,Actions",
                showTags: true,
                bookmarkLayout: "minimal",
                itemsPerPage: 20,
            },
        });

        logger.info({userId}, "Default Settings: Created");
        return {success: true, message: "Default settings applied successfully."};

    } catch (error) {
        logger.error({err: error, userId}, "Default Settings: Creation Failed");
        return {success: false, message: "Failed to apply default settings."};
    }
}

