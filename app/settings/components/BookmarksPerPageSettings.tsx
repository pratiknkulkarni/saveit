"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {useSettings} from "@/app/context/SettingsContext";
import {SelectItemIndicator} from "@radix-ui/react-select";

const BookmarksPerPageSettings = () => {
    const {settings, updateItemsPerPage} = useSettings();
    const bookmarksPerPageValues = [10, 20, 30, 50, 100];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookmarks Per Page</CardTitle>
                <CardDescription>
                    Select Number Of Bookmarks Per Page
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <Select value={String(settings.itemsPerPage)} onValueChange={(value) => {
                        updateItemsPerPage(Number(value));
                    }}>
                        <SelectTrigger className="w-[90px]">
                            <SelectValue placeholder={String(settings.itemsPerPage)} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {bookmarksPerPageValues.map(bookmarksPerPageValue => {
                                    return <SelectItem key={bookmarksPerPageValue}
                                                       value={String(bookmarksPerPageValue)}>
                                        <SelectItemIndicator/>
                                        {bookmarksPerPageValue}</SelectItem>
                                })}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}

export default BookmarksPerPageSettings;