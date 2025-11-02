"use server"

import { PrismaClient, Settings } from "@prisma/client";
import { ApplyDefaultSettingsInput, ApplySettingsInput } from "@/app/actions/types";


export async function commitSettings({
    userId,
    theme,
    bookmarkDisplay,
    showTags,
    bookmarkLayout,
    itemsPerPage,
}: ApplySettingsInput): Promise<{ success: boolean; message: string }> {

    const prisma = new PrismaClient();
    try {
        await prisma.settings.update({
            where: { userId },
            data: {
                ...(theme && { theme }),
                ...(bookmarkDisplay && { bookmarkDisplay: bookmarkDisplay.join(",") }),
                ...(showTags !== undefined && { showTags }),
                ...(bookmarkLayout && { bookmarkLayout }),
                ...(itemsPerPage && { itemsPerPage }),
            },
        });

        return { success: true, message: "Settings applied successfully." };
    } catch (error) {
        console.error("Error applying settings:", error);
        return { success: false, message: "Failed to apply settings. Please try again." };
    }
}


export async function applyDefaultSettings({
    userId,
}: ApplyDefaultSettingsInput): Promise<{
    success: boolean;
    message: string
}> {
    const prisma = new PrismaClient();

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
        return { success: true, message: "Default settings applied successfully." };
    } catch (error) {
        console.error("Error applying default settings:", error);
        return { success: false, message: "Failed to apply default settings." };
    }
}

export async function getUserSettings(userId: string): Promise<Settings | null> {
    const prisma = new PrismaClient();

    try {
        const settings = await prisma.settings.findFirst({
            where: { userId },
        });

        return settings;
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return null;
    }
}
