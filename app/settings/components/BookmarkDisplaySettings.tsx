"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {useSettings} from "@/app/context/SettingsContext";
import {BookmarkDisplayOption} from "@/app/types";

const BookmarkDisplaySettings = () => {
    const {settings, updateBookmarkDisplay} = useSettings();
    const bookmarkDisplayOptions: BookmarkDisplayOption[] = [
        "Description",
        "Tags",
        "Title",
        "Actions",
        "Images"
    ];

    const handleBookmarkDisplayChange = (option: BookmarkDisplayOption) => {
        const currentDisplay = settings.bookmarkDisplay;
        let newDisplay: BookmarkDisplayOption[];

        if (currentDisplay.includes(option)) {
            newDisplay = currentDisplay.filter(item => item !== option);
        } else {
            newDisplay = [...currentDisplay, option];
        }
        updateBookmarkDisplay(newDisplay);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookmark Display</CardTitle>
                <CardDescription>
                    Select which elements to display for bookmarks
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {bookmarkDisplayOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                            <Switch
                                id={option}
                                checked={settings.bookmarkDisplay.includes(option)}
                                onCheckedChange={() => handleBookmarkDisplayChange(option)}
                            />
                            <Label htmlFor={option}>{option}</Label>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default BookmarkDisplaySettings;
