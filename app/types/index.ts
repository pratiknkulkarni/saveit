export type BookmarkDisplayOption = "Actions" | "Title" | "Description" | "Tags" | "Images";
export type ThemeOption = "light" | "dark";
export type BookmarkLayoutOption = "minimal" | "cards";

export type ApplySettingsResponse = {
    statusCode: number,
    success: boolean,
    message?: string,
}

export type SidebarType = "Folders" | "Settings" | "Search Results";

export type SidebarContentType = {
    id: number;
    name: string;
    isCurrent: boolean;
};