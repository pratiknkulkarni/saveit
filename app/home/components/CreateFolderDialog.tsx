"use client"

import {ChangeEvent, useState, KeyboardEvent} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Folder, X} from "lucide-react"
import ActionButton from "@/app/home/ActionButton";
import {useToast} from "@/hooks/use-toast";
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {createFolders} from "@/app/actions/folders";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {QUERY_KEYS} from "@/lib/queryKeys";

type CreateFoldersResponse = {
    success: boolean
    data?: number
    error?: string
    duplicateFolders?: string[]
}

const CreateFolderDialog = () => {
    const [open, setOpen] = useState(false)
    const [folders, setFolders] = useState<string[]>([])
    const [inputValue, setInputValue] = useState("")
    const {toast} = useToast()
    const queryClient = useQueryClient();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const createFoldersMutation = useMutation<CreateFoldersResponse, Error, void>({
        mutationFn: () => createFolders({
            names: folders,
        }),
        onSuccess: async (data) => {
            if (data.success) {
                toast({
                    title: "Folder(s) created successfully",
                    description: `${data.data} folders created.`
                });
                setOpen(false);
                setFolders([]);

                await queryClient.invalidateQueries({queryKey: [QUERY_KEYS.useGetUserFoldersSidebarQuery]});
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to create folders",
                    variant: "destructive",
                })

                if (data.duplicateFolders) {
                    toast({
                        title: "Duplicate folders",
                        description: `Folders "${data.duplicateFolders.join('", "')}" already exist`,
                        variant: "destructive",
                    })
                }
            }
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        },
    })

    const handleSubmit = () => {
        createFoldersMutation.mutate()
    }

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim() !== "") {
            e.preventDefault()
            const newFolder = inputValue.trim()
            if (!folders.includes(newFolder)) {
                const updatedFolders = [...folders, newFolder]
                setFolders(updatedFolders)
                setInputValue("")
            }
        }
    }

    const removeFolder = (folderToRemove: string) => {
        const updatedFolders = folders.filter((folder) => folder !== folderToRemove)
        setFolders(updatedFolders)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <ActionButton icon={Folder} label="New Folder"/>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Folder(s)</DialogTitle>
                    <DialogDescription>
                        Enter the folder name(s) here. Press enter to add each folder.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                        {folders.map((folder) => (
                            <div key={folder} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                                <span>{folder}</span>
                                <button onClick={() => removeFolder(folder)}
                                        className="hover:bg-destructive/20 rounded-full p-1">
                                    <X className="h-4 w-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <Input
                        type="text"
                        placeholder="Enter folder name (press Enter to add)"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        className="mt-2"
                    />
                </div>
                <div className="flex justify-evenly w-full">
                    <Button disabled={folders.length === 0} onClick={handleSubmit}>Submit</Button>
                    <Button onClick={() => {
                        setOpen(false)
                        setFolders([])
                    }} variant="destructive">Cancel</Button>
                </div>
                <DialogFooter className="mt-4">
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateFolderDialog;
