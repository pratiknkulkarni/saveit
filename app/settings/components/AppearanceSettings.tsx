"use client";

import {Button} from "@/components/ui/button";
import AppearanceSettingsContainer from "@/app/settings/components/AppearanceSettingsContainer";
import {useSettings} from "@/app/context/SettingsContext";
import {useToast} from "@/hooks/use-toast";

const AppearanceSettings = () => {
    const {applySettings} = useSettings();
    const {toast} = useToast();

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6 text-center">Appearance Settings</h1>
            <AppearanceSettingsContainer/>
            <div className="flex justify-center gap-6 w-full py-3">
                <Button onClick={async () => {
                    const {statusCode} = await applySettings();
                    if (statusCode === 200) {
                        toast({
                            title: "Settings saved!"
                        })
                    } else {
                        toast({
                            title: "Something went wrong!"
                        })
                    }
                }} variant={"default"} className={""}>Save</Button>
                <Button variant={"destructive"} className={""}>Cancel</Button>
            </div>
        </div>
    );
};

export default AppearanceSettings;
