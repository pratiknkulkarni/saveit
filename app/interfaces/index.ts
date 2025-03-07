import {
    ApplySettingsResponse,
    BookmarkDisplayOption,
    BookmarkLayoutOption,
    SidebarContentType, SidebarType,
    ThemeOption
} from "@/app/types";


export interface Settings {
    theme: ThemeOption;
    bookmarkDisplay: BookmarkDisplayOption[];
    showTags: boolean;
    bookmarkLayout: BookmarkLayoutOption;
    itemsPerPage: number;
}

export interface PendingSettings {
    bookmarkDisplay?: BookmarkDisplayOption[];
    showTags?: boolean;
    bookmarkLayout?: BookmarkLayoutOption;
    itemsPerPage?: number;
}

export interface SettingsContextType {
    settings: Settings;
    updateTheme: (theme: ThemeOption) => void;
    updateBookmarkDisplay: (option: BookmarkDisplayOption[]) => void;
    updateShowTags: (show: boolean) => void;
    updateItemsPerPage: (itemsPerPage: number) => void;
    updateBookmarkLayout: (layout: BookmarkLayoutOption) => void;
    applySettings: () => ApplySettingsResponse;
    cancelPendingChanges: () => void;
}

export interface HeaderProps {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

export interface SidebarContextType {
    selectedContent: SidebarContentType;
    setSelectedContent: (content: SidebarContentType) => void;
}

export interface SidebarProps {
    isCollapsed: boolean;
    contents: SidebarContentType[];
    title: SidebarType;
    isEmpty?: boolean;
    handleClick?: () => void;
}