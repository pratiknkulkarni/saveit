import {headers} from "next/headers";
import {auth} from "./auth";

export async function getCurrentUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return session.user;
}