"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Layout} from "lucide-react";
import {useSettings} from "@/app/context/SettingsContext";

const BookmarkLayoutSettings = () => {
    const {settings} = useSettings();

    // const handleBookmarkLayoutChange = (layout: "minimal" | "cards") => {
    // }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookmark Layout</CardTitle>
                <CardDescription>
                    Choose how bookmarks are displayed
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    defaultValue={settings.bookmarkLayout}
                    onValueChange={() => {
                    }}
                    className="flex space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimal" id="minimal"/>
                        <Label
                            htmlFor="minimal"
                            className="flex items-center space-x-2"
                        >
                            <Layout className="h-4 w-4"/>
                            <span>Minimal</span>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cards" id="cards"/>
                        <Label htmlFor="cards" className="flex items-center space-x-2">
                            <Layout className="h-4 w-4"/>
                            <span>Cards</span>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    )
}

export default BookmarkLayoutSettings;