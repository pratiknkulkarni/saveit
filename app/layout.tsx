import "./globals.css"
import {ThemeProvider} from '@/components/ui/theme-provider'
import {Toaster} from '@/components/ui/toaster'
import {SettingsProvider} from "@/app/context/SettingsContext";
import {ScrollProvider} from "@/app/context/RefContext";
import {Suspense} from "react";
import {PublicEnvScript} from "next-runtime-env";

export const metadata = {
    title: "Save It - Your Personal Bookmark Manager",
    description: "Organize, access, and save your bookmarks with ease",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <PublicEnvScript/>
        </head>
        <body>
        <Suspense fallback={<div>Loading...</div>}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <SettingsProvider>
                    <ScrollProvider>
                        <Toaster/>
                        {children}
                    </ScrollProvider>
                </SettingsProvider>
            </ThemeProvider>
        </Suspense>
        </body>
        </html>
    )
}
