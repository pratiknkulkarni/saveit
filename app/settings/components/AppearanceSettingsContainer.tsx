import BookmarkDisplaySettings from "@/app/settings/components/BookmarkDisplaySettings";
import BookmarkTagsSettings from "@/app/settings/components/BookmarkTagsSettings";
import BookmarkLayoutSettings from "@/app/settings/components/BookmarkLayoutSettings";
import BookmarksPerPageSettings from "@/app/settings/components/BookmarksPerPageSettings";

const AppearanceSettingsContainer = () => {
    return (
        <div className="space-y-6">
            <BookmarkDisplaySettings/>
            <BookmarkTagsSettings/>
            <BookmarksPerPageSettings/>
            <BookmarkLayoutSettings/>
        </div>
    )
}

export default AppearanceSettingsContainer;