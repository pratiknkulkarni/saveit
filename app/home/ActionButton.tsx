"use client"

import {Button} from "@/components/ui/button"
import {cn} from "@/lib/utils"
import type {LucideIcon} from "lucide-react"
import {ButtonHTMLAttributes} from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon
    label: string
}

const ActionButton = ({icon: Icon, label, ...props}: ActionButtonProps) => {
    return (
        <Button
            size="lg"
            variant="ghost"
            className={cn(
                "w-full flex items-center justify-start px-4 py-6",
                "transition-colors",
            )}
            {...props}
        >
            <Icon className="h-5 w-5 mr-3 flex-shrink-0"/>
            <span className="flex-grow text-left">{label}</span>
        </Button>
    )
}

export default ActionButton
