"use client"

import React from 'react'
import Link from 'next/link'
import {cn} from "@/lib/utils"
import {Folder} from 'lucide-react'
import {useSidebar} from "@/components/ui/sidebar"

const folders = [
    {name: "Work", path: "/folders/work"},
    {name: "Personal", path: "/folders/personal"},
    {name: "Reading List", path: "/folders/reading-list"},
    {name: "Recipes", path: "/folders/recipes"},
]

export function FolderList() {
    const {state} = useSidebar()
    const isCollapsed = state === 'collapsed'

    return (
        <>
            {!isCollapsed && <div className="font-medium mb-2 px-2 text-sm">Folders</div>}
            {folders.map((folder) => (
                <Link
                    key={folder.path}
                    href={folder.path}
                    className={cn(
                        "flex items-center py-2 px-2 rounded-md text-sm hover:bg-accent",
                        isCollapsed && "justify-center"
                    )}
                >
                    <Folder className="h-4 w-4"/>
                    {!isCollapsed && <span className="ml-2">{folder.name}</span>}
                </Link>
            ))}
        </>
    )
}