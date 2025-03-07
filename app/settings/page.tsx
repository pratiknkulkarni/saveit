"use client";

import { useSidebarContext } from "@/app/context/SidebarContext";
import AppearanceSettings from "@/app/settings/components/AppearanceSettings";

const Settings = () => {
  const { selectedContent } = useSidebarContext();
  return (
    <div>
      {selectedContent.name === "Appearance" && <AppearanceSettings />}
    </div>
  )
};

export default Settings;