"use client"

import {useState} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Edit} from "lucide-react"
import {Button} from "@/components/ui/button";
import BookmarkForm from "./BookmarkForm"

// converting this from the zod schema since there is no reason for a validation as the data is getting pre-populated.
export type EditBookmarkFormData = {
    id: number;
    title?: string;
    url: string;
    description?: string;
    folderId?: number;
}

const EditBookmarkDialog = ({bookmarkFormData}: { bookmarkFormData: EditBookmarkFormData }) => {
    const [open, setOpen] = useState(false);

    return (
        // UPDATE - set modal to false to allow for scrolling in the Tags and Folders Commands
        <Dialog open={open} onOpenChange={setOpen} modal={true}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => console.log("Edit bookmark")}>
                    <Edit className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent forceMount={true}
                           className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Bookmark</DialogTitle>
                    <DialogDescription>
                        Click save when you are done.
                    </DialogDescription>
                </DialogHeader>

                <BookmarkForm setOpen={setOpen} initialData={bookmarkFormData}/>
                <DialogFooter className="mt-4">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EditBookmarkDialog;
