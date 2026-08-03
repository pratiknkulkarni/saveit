"use client";

import { useSidebarContext } from "@/app/context/SidebarContext";
import AppearanceSettings from "@/app/settings/components/AppearanceSettings";
import AccountSettings from "@/app/settings/components/AccountSettings";

const Settings = () => {
  const { selectedContent } = useSidebarContext();
  return (
    <div>
      {selectedContent.name === "Appearance" && <AppearanceSettings />}
      {selectedContent.name === "Account" && <AccountSettings />}
    </div>
  )
};

export default Settings;