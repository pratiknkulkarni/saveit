"use client"

import * as React from "react"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {cn} from "@/lib/utils"
import {useForm} from "react-hook-form";
import {registerFormSchema} from "@/app/register/schema/registerFormSchema";
import {registerUser} from "@/app/actions/auth";
import {useToast} from "@/hooks/use-toast";
import {useRouter} from "next/navigation"
// import {useRouter} from "next/navigation";

type RegisterFormValues = z.infer<typeof registerFormSchema>

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>

export function RegisterForm({className, ...props}: UserAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const {toast} = useToast();
    const router = useRouter();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: ""
        }
    })

    async function onSubmit(data: RegisterFormValues) {
        setIsLoading(true);
        try {
            const {data: response, error} = await registerUser({
                name: "",
                email: data.email,
                password: data.password,
                callbackURL: "",
            });
            if (response) {
                toast({
                    title: "Success!",
                    description: "User account created successfully."
                });
                router.push("/login");
            }
            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome</CardTitle>
                    <CardDescription>
                        Please create an account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            {/*            <div className="flex flex-col gap-4">*/}
                            {/*                <Button variant="outline" className="w-full" type="button"*/}
                            {/*                        disabled={isLoading}>*/}
                            {/*                    Continue with GitHub*/}
                            {/*                </Button>*/}
                            {/*                <Button variant="outline" className="w-full" type="button" disabled={isLoading}>*/}
                            {/*                    Continue with Google*/}
                            {/*                </Button>*/}
                            {/*            </div>*/}
                            {/*            <div*/}
                            {/*                className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"*/}
                            {/*            >*/}
                            {/*<span className="relative z-10 bg-background px-2 text-muted-foreground">*/}
                            {/*  Or continue with*/}
                            {/*</span>*/}
                            {/*            </div>*/}
                            <div className=" grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="m@example.com"
                                                    type="email"
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({field}) => (
                                        <FormItem className={"my-0"}>
                                            <FormLabel
                                                className={"my-0 py-0"}>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your password"
                                                    type="password"
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Confirm your password"
                                                    type="password"
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    Register
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                Already have an account?{" "}
                                <a href="/login" className="underline underline-offset-4">
                                    Login
                                </a>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegisterForm