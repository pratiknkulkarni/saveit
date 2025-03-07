"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // no system default theme, only light and dark themes
  return <NextThemesProvider enableSystem={false} themes={["light", "dark"]} {...props}>{children}</NextThemesProvider>
}
