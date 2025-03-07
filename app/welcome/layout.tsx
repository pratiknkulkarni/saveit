import "./globals.css"
import {ThemeProvider} from '@/components/ui/theme-provider'
import {Toaster} from '@/components/ui/toaster'

export const metadata = {
    title: "Save It - Your Personal Bookmark Manager",
    description: "Organize, access, and share your bookmarks with ease",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Toaster/>
            {children}
        </ThemeProvider>
    )
}
