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
import {Bookmark} from "lucide-react"
import {z} from "zod"
import ActionButton from "@/app/home/ActionButton";
import CreateBookmarkForm from "./CreateBookmarkForm"

export const bookmarkSchema = z.object({
    title: z.string().optional(),
    url: z.string().url("Must be a valid URL"),
    description: z.string().max(500, "Description must be 500 characters or less").optional(),
    folderId: z.string().optional(),
    imageURL: z.string().optional(),
    //TODO: updating this to any() array for now, need to change to use Tag[]
    tags: z.array(z.any()).optional(),
    tagsModified: z.boolean().optional(),
});

export type BookmarkFormData = z.infer<typeof bookmarkSchema>

const CreateBookmarkDialog = () => {
    const [open, setOpen] = useState(false);

    return (
        // UPDATE - set modal to false to allow for scrolling in the Tags and Folders Commands
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger asChild>
                <ActionButton icon={Bookmark} label={"New Bookmark"}/>
            </DialogTrigger>
            <DialogContent forceMount={true}
                           className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Bookmark</DialogTitle>
                    <DialogDescription>
                        Enter the details of your new bookmark here. Click save when you are done.
                    </DialogDescription>
                </DialogHeader>
                <CreateBookmarkForm setOpen={setOpen}/>
                <DialogFooter className="mt-4">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateBookmarkDialog;
