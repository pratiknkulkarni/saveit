"use client"

import {createContext, useCallback, useContext, useEffect, useState} from "react";
import {ApplySettingsResponse, BookmarkDisplayOption, BookmarkLayoutOption, ThemeOption} from "@/app/types";
import {PendingSettings, Settings, SettingsContextType} from "@/app/interfaces";
import {commitSettings, getUserSettings} from "@/app/actions/settings";
import {authClient} from "@/lib/auth-client";
import {useTheme} from "next-themes";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

//TODO: Update the location for SettingsProvider in layout, currently in root
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

    // called only when the user clicks on the header to update the theme
    const updateTheme = useCallback((theme: ThemeOption) => {
        setCurrentSettings((prev) => ({...prev, theme}));
        setTheme(theme);

        if (session?.user?.id) {
            commitSettings({
                userId: session?.user?.id, theme: theme,
            });
        }
    }, [setTheme, session?.user?.id])

    // runs only on the first load or when user id changes, loads the existing settings in the memory
    useEffect(() => {
        async function fetchUserSettings() {
            const settings = await getUserSettings(session?.user?.id as string);
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

        fetchUserSettings().then();
    }, [session?.user?.id, setTheme]);

    const updateItemsPerPage = (itemsPerPage: number) => {
        setCurrentSettings(prev => ({
            ...prev,
            itemsPerPage,
        }));

        // use this to commit to DB
        setPendingChanges(prev => ({
            ...prev,
            itemsPerPage,
        }));
    };

    const updateBookmarkDisplay = (options: BookmarkDisplayOption[]) => {
        setCurrentSettings(prev => ({
            ...prev,
            bookmarkDisplay: options,
        }));

        // use this to commit to DB
        setPendingChanges(prev => ({
            ...prev,
            bookmarkDisplay: options,
        }));
    };

    const updateShowTags = useCallback((show: boolean) => {
        setCurrentSettings(prev => ({...prev, showTags: show}));

        // Also used to commit to db
        setPendingChanges(prev => ({...prev, showTags: show}));
    }, []);

    const updateBookmarkLayout = useCallback((layout: BookmarkLayoutOption) => {
        setCurrentSettings(prev => ({...prev, bookmarkLayout: layout}));

        // use to commit to db
        setPendingChanges(prev => ({...prev, bookmarkLayout: layout}));
    }, []);

    function applySettings(): ApplySettingsResponse {
        if (Object.keys(pendingChanges).length === 0) {
            return {
                success: true,
                statusCode: 200,
                message: "No changes to apply"
            }
        }

        setCurrentSettings(prev => ({
            ...prev,
            ...pendingChanges
        }));

        // "commit" the final changes
        // TODO: save these changes in the database or local storage
        commitSettings({
            userId: session?.user?.id as string,
            ...currentSettings
        }).then(() => {
            //TODO:
        });

        // and "reset" the pending changes
        setPendingChanges({});

        return {
            success: true,
            statusCode: 200,
            message: "Changes applied successfully."
        }
    }

    const cancelPendingChanges = () => {
        setPendingChanges({});
    }

    return (
        <SettingsContext.Provider
            value={{
                settings: currentSettings,
                updateBookmarkDisplay,
                updateShowTags,
                updateBookmarkLayout,
                updateItemsPerPage,
                applySettings: applySettings,
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