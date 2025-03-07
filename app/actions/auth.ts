import {authClient} from "@/lib/auth-client";
import {applyDefaultSettings} from "@/app/actions/settings";
import {LoginInput, RegisterInput} from "./types";


export const registerUser = async ({email, password, name, callbackURL}: RegisterInput) => {
    const {data, error} = await authClient.signUp.email({
        email,
        password,
        name: name ? name : "",
        callbackURL: callbackURL ? callbackURL : "/home",
    });

    if (data && data?.user?.id) {
        await applyDefaultSettings({userId: data.user.id})
    }

    return {data, error}
}


export const loginUser = async ({email, password}: LoginInput) => {
    const {data, error} = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/home"
    });
    return {data, error};
}