import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const DefaultPage = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session) {
        redirect("/home");
    }
    redirect("/welcome");
}

export default DefaultPage
