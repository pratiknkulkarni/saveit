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
import {z} from "zod"
import {Button} from "@/components/ui/button";
import EditBookmarkForm from "@/app/home/components/EditBookmarkForm";

export const editBookmarkSchema = z.object({
    id: z.number(),
    title: z.string().optional(),
    url: z.string().url("Must be a valid URL"),
    description: z.string().max(500, "Description must be 500 characters or less").optional(),
    folderId: z.string().optional(),
});

export type EditBookmarkFormData = z.infer<typeof editBookmarkSchema>;

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

                <EditBookmarkForm bookmarkFormData={bookmarkFormData} setOpen={setOpen}/>

                {/*<CreateBookmarkForm setOpen={setOpen}/>*/}
                <DialogFooter className="mt-4">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EditBookmarkDialog;
