import {Filter, LucideMail, Menu, Moon, Sun} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useIsMobile} from "@/hooks/use-mobile";
import SearchComponent from "@/app/home/components/SearchComponent";
import generateAvatarIcon from "@/lib/generateAvatarIcon";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import {useSettings} from "@/app/context/SettingsContext";
import {useTheme} from "next-themes";
import {HeaderProps} from "@/app/interfaces";

const Header = ({toggleSidebar, isSidebarCollapsed}: HeaderProps) => {
    const isMobile = useIsMobile();
    const router = useRouter();
    const {toast} = useToast();
    const {data: session} = authClient.useSession();
    const {updateTheme} = useSettings();
    const {theme} = useTheme();

    const handleLogout = async () => {
        router.push("/login");
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast({
                        title: "You have been successfully logged out!",
                    });
                },
                onError: (error) => {
                    console.log(error);
                }
            },
        });
    };

    return (
        <header className="flex items-center justify-evenly px-4 py-2 border-b">
            <div className="flex w-fit items-center">
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className={!isSidebarCollapsed ? "" : "ml-2 mr-2"}
                    >
                        <Menu className="h-4 w-4"/>
                    </Button>
                )}
            </div>

            <div
                className={
                    !isSidebarCollapsed && isMobile ? "hidden" : "w-full flex items-center px-2"
                }
            >
                <SearchComponent/>
                {isMobile && <Filter/>}
            </div>

            <div
                className={
                    !isSidebarCollapsed && isMobile
                        ? "hidden"
                        : "flex justify-end gap-4 w-fit"
                }
            >
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Avatar
                            className={"cursor-pointer border-2 border-black border-solid"}
                        >
                            {session?.user?.email !== undefined && (
                                <AvatarImage src={generateAvatarIcon(session?.user?.email)}/>
                            )}
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem className={"flex items-center justify-center"}>
                            <LucideMail/>
                            <span className={"mx-auto"}>{session?.user?.email}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            className="w-full flex space-x-2 items-center cursor-pointer">
                            <Button variant={"ghost"} onClick={(event) => {
                                event.preventDefault();

                                const newTheme = theme === "light" ? "dark" : "light";
                                updateTheme(newTheme);
                            }} className="flex w-full items-center justify-center space-x-2">
                                <span>Switch theme</span>
                                {theme === "light" ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}
                            </Button>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem className={"cursor-pointer"}>
                            <Button
                                className={"w-full h-full"}
                                onClick={() => {
                                    router.push("/settings");
                                }}
                                variant={"ghost"}
                            >
                                Settings
                            </Button>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem>
                            <Button
                                className={"w-full h-full cursor-pointer"}
                                onClick={() => handleLogout()}
                                variant={"ghost"}
                            >
                                Logout
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Header;
