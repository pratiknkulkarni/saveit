"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Moon, Sun} from "lucide-react";
import {useSettings} from "@/app/context/SettingsContext";

// NOT USING THIS AT THE MOMENT
const ThemeSettings = () => {
    const {
        updateTheme,
        settings,
    } = useSettings();

    return <Card>
        <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
                Choose between light and dark theme
            </CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup
                // value={settings.theme}
                defaultValue={settings.theme}
                onValueChange={(value) => {
                    updateTheme(value as "light" | "dark");
                }
                }
                className="flex space-x-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light"/>
                    <Label htmlFor="light" className="flex items-center space-x-2">
                        <Sun className="h-4 w-4"/>
                        <span>Light</span>
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark"/>
                    <Label htmlFor="dark" className="flex items-center space-x-2">
                        <Moon className="h-4 w-4"/>
                        <span>Dark</span>
                    </Label>
                </div>
            </RadioGroup>
        </CardContent>
    </Card>
}

export default ThemeSettings