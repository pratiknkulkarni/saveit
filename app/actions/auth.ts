import {authClient} from "@/lib/auth-client";
import {applyDefaultSettings} from "@/app/actions/settings";
import {LoginInput, RegisterInput} from "./types";
import {logger} from "@/lib/logger";


export const registerUser = async ({email, password, name, callbackURL}: RegisterInput) => {
    try {
        const {data, error} = await authClient.signUp.email({
            email,
            password,
            name: name ? name : "",
            callbackURL: callbackURL ? callbackURL : "/home",
        });

        if (error) {
            logger.warn(
                {
                    email: email.split('@')[1],
                    errorType: error.code || 'unknown'
                },
                "User Registration: Failed"
            );
            return {data, error}
        }

        if (data && data?.user?.id) {
            logger.info(
                {
                    userId: data.user.id,
                    hasName: !!name
                },
                "User Registration: Success"
            );
            await applyDefaultSettings({userId: data.user.id})
            logger.info(
                {userId: data.user.id},
                "Default Settings: Applied"
            );
        }

        return {data, error}
    } catch (error) {
        logger.error(
            {
                err: error,
                email: email.split('@')[1]
            },
            "User Registration: Exception"
        );
        throw error;
    }
}


export const loginUser = async ({email, password}: LoginInput) => {
    try {
        const {data, error} = await authClient.signIn.email({
            email,
            password,
            callbackURL: "/home"
        });
        if (error) {
            logger.warn(
                {
                    email: email.split('@')[1],
                    errorType: error.code || 'unknown'
                },
                "User Login: Failed"
            );
            return {data, error};
        }

        if (data?.user?.id) {
            logger.info(
                {userId: data.user.id},
                "User Login: Success"
            );
        }

        return {data, error};
    } catch (error) {
        logger.error(
            {
                err: error,
                email: email.split('@')[1]
            },
            "User Login: Exception"
        );
        throw error;
    }
}