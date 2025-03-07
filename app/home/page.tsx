"use client"

import BookmarkList from "./components/BookmarkList";
import TagList from "@/app/home/components/TagList";
import {useIsMobile} from "@/hooks/use-mobile";
import {useSettings} from "@/app/context/SettingsContext";
import {authClient} from "@/lib/auth-client";

const Home = () => {
    const isMobile = useIsMobile();
    const {settings} = useSettings();
    const {data: session} = authClient.useSession();

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow text-sm">
                    <BookmarkList userId={session?.user?.id as string}/>
                </div>
                {settings.showTags && !isMobile && <div className={"px-2 w-1/5"}>
                    <TagList/>
                </div>}
            </div>
        </div>
    );
};

export default Home;