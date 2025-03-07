"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {Tag} from "lucide-react";
import {useSettings} from "@/app/context/SettingsContext";

const BookmarkTagsSettings = () => {
    const {settings, updateShowTags} = useSettings();

    const handleTagVisibilityChange = (show: boolean) => {
        updateShowTags(show);
    };

    return <Card>
        <CardHeader>
            <CardTitle>Tag Visibility</CardTitle>
            <CardDescription>
                Toggle tag display on the main screen
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-2">
                <Switch
                    id="show-tags"
                    checked={settings.showTags}
                    onCheckedChange={handleTagVisibilityChange}
                />
                <Label
                    htmlFor="show-tags"
                    className="flex items-center space-x-2"
                >
                    <Tag className="h-4 w-4"/>
                    <span>Show Tags</span>
                </Label>
            </div>
        </CardContent>
    </Card>
}


export default BookmarkTagsSettings;