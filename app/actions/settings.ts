"use server"

import {Settings} from "@prisma/client";
import {ApplyDefaultSettingsInput, ApplySettingsInput} from "@/app/actions/types";
import {logger} from "@/lib/logger";
import {prisma} from "@/lib/prisma";


export async function commitSettings({
                                         userId,
                                         theme,
                                         bookmarkDisplay,
                                         showTags,
                                         bookmarkLayout,
                                         itemsPerPage,
                                     }: ApplySettingsInput): Promise<{ success: boolean; message: string }> {

    try {
        const updatedFields = {
            ...(theme && {theme}),
            ...(bookmarkDisplay && {bookmarkDisplay: bookmarkDisplay.join(",")}),
            ...(showTags !== undefined && {showTags}),
            ...(bookmarkLayout && {bookmarkLayout}),
            ...(itemsPerPage && {itemsPerPage}),
        }

        await prisma.settings.update({
            where: {userId},
            data: updatedFields,
        });

        logger.info(
            {
                userId,
                fieldsUpdated: Object.keys(updatedFields),
                theme,
                bookmarkLayout,
                itemsPerPage
            },
            "User Settings: Updated"
        );

        return {success: true, message: "Settings applied successfully."};
    } catch (error) {
        logger.error(
            {
                err: error,
                userId,
                attemptedFields: {theme, bookmarkDisplay, showTags, bookmarkLayout, itemsPerPage}
            },
            "User Settings: Update Failed"
        );
        return {success: false, message: "Failed to apply settings. Please try again."};
    }
}


export async function applyDefaultSettings({
                                               userId,
                                           }: ApplyDefaultSettingsInput): Promise<{
    success: boolean;
    message: string
}> {
    try {
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

        logger.info(
            {userId},
            "Default Settings: Created"
        );

        return {success: true, message: "Default settings applied successfully."};
    } catch (error) {
        logger.error(
            {err: error, userId},
            "Default Settings: Creation Failed"
        );
        return {success: false, message: "Failed to apply default settings."};
    }
}

export async function getUserSettings(userId: string): Promise<Settings | null> {
    try {
        const settings = await prisma.settings.findFirst({
            where: {userId},
        });

        if (!settings) {
            logger.warn(
                {userId},
                "User Settings: Not Found"
            );
        }

        return settings;
    } catch (error) {
        logger.error(
            {err: error, userId},
            "User Settings: Fetch Failed"
        );
        return null;
    }
}
