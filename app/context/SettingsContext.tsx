"use client"

import {createContext, useCallback, useContext, useEffect, useState} from "react";
import {ApplySettingsResponse, BookmarkDisplayOption, BookmarkLayoutOption, ThemeOption} from "@/app/types";
import {PendingSettings, Settings, SettingsContextType} from "@/app/interfaces";
import {commitSettings, getUserSettings} from "@/app/actions/settings";
import {authClient} from "@/lib/auth-client";
import {useTheme} from "next-themes";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({children}: { children: React.ReactNode }) {
    const {data: session} = authClient.useSession();
    const {setTheme, theme} = useTheme();

    const [currentSettings, setCurrentSettings] = useState<Settings>({
        bookmarkDisplay: [],
        showTags: true,
        bookmarkLayout: "minimal",
        theme: theme as ThemeOption,
        itemsPerPage: 10,
    });
    const [pendingChanges, setPendingChanges] = useState<PendingSettings>({});

    useEffect(() => {
        async function fetchUserSettings() {
            if (!session?.user?.id) return;

            const settings = await getUserSettings();
            if (settings) {
                const formattedSettings: Settings = {
                    bookmarkDisplay: settings.bookmarkDisplay.split(",") as BookmarkDisplayOption[],
                    showTags: settings.showTags,
                    bookmarkLayout: settings.bookmarkLayout as BookmarkLayoutOption,
                    theme: settings.theme as ThemeOption,
                    itemsPerPage: settings.itemsPerPage
                };
                setCurrentSettings(formattedSettings);
                setTheme(formattedSettings.theme as ThemeOption);
            }
        }

        fetchUserSettings();
    }, [session?.user?.id, setTheme]);


    const updateTheme = useCallback((theme: ThemeOption) => {
        setCurrentSettings((prev) => ({...prev, theme}));
        setTheme(theme);

        if (session?.user?.id) {
            commitSettings({theme});
        }
    }, [setTheme, session?.user?.id]);

    const updateItemsPerPage = (itemsPerPage: number) => {
        setCurrentSettings(prev => ({...prev, itemsPerPage}));
        setPendingChanges(prev => ({...prev, itemsPerPage}));
    };

    const updateBookmarkDisplay = (options: BookmarkDisplayOption[]) => {
        setCurrentSettings(prev => ({...prev, bookmarkDisplay: options}));
        setPendingChanges(prev => ({...prev, bookmarkDisplay: options}));
    };

    const updateShowTags = useCallback((show: boolean) => {
        setCurrentSettings(prev => ({...prev, showTags: show}));
        setPendingChanges(prev => ({...prev, showTags: show}));
    }, []);

    const updateBookmarkLayout = useCallback((layout: BookmarkLayoutOption) => {
        setCurrentSettings(prev => ({...prev, bookmarkLayout: layout}));
        setPendingChanges(prev => ({...prev, bookmarkLayout: layout}));
    }, []);

    const applySettings = useCallback(async (): Promise<ApplySettingsResponse> => {
        if (Object.keys(pendingChanges).length === 0) {
            return {success: true, statusCode: 200, message: "No changes to apply"};
        }

        setCurrentSettings(prev => ({...prev, ...pendingChanges}));

        try {
            const result = await commitSettings({...pendingChanges});

            setPendingChanges({});

            if (result.success) {
                return {success: true, statusCode: 200, message: result.message};
            } else {
                return {success: false, statusCode: 500, message: result.message};
            }
        } catch (e) {
            return {success: false, statusCode: 500, message: "Failed to save settings"};
        }
    }, [pendingChanges]);

    const cancelPendingChanges = () => {
        setPendingChanges({});
    };

    return (
        <SettingsContext.Provider
            value={{
                settings: currentSettings,
                updateBookmarkDisplay,
                updateShowTags,
                updateBookmarkLayout,
                updateItemsPerPage,
                applySettings,
                cancelPendingChanges,
                updateTheme,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}