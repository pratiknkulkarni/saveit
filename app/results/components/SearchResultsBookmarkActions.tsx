"use client"

import {Button} from "@/components/ui/button";
import {Trash2} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const SearchResultsBookmarkActions = () => {

    return (
        <div className="flex space-x-2 mt-2">
            {/*<Button*/}
            {/*    variant="ghost"*/}
            {/*    size="icon"*/}
            {/*>*/}
            {/*    <Star*/}
            {/*        className={cn("h-4 w-4", true ? "fill-yellow-400 text-yellow-400" : "text-gray-400")}/>*/}
            {/*</Button>*/}

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bookmark Confirmation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this bookmark? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                        }}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SearchResultsBookmarkActions;