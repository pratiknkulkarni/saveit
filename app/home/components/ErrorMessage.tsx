import {AlertCircle} from "lucide-react"

export function ErrorMessage({message}: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"/>
            <h2 className="mt-4 text-xl font-semibold text-accent-foreground">Error</h2>
            <p className="mt-2 text-accent-foreground">{message}</p>
        </div>
    )
}