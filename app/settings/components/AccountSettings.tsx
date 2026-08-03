"use client"

import * as React from "react"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {useRouter} from "next/navigation"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {authClient} from "@/lib/auth-client"
import {useToast} from "@/hooks/use-toast"
import {changePasswordFormSchema, deleteAccountFormSchema} from "@/app/settings/schema/accountFormSchema"

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>
type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>

const ChangePasswordSettings = () => {
    const [isLoading, setIsLoading] = React.useState(false)
    const {toast} = useToast()

    const form = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        }
    })

    async function onSubmit(data: ChangePasswordFormValues) {
        setIsLoading(true)
        try {
            await authClient.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                revokeOtherSessions: true,
            }, {
                onSuccess: () => {
                    toast({title: "Password updated successfully."})
                    form.reset()
                },
                onError: (ctx) => {
                    toast({
                        title: "Error",
                        description: ctx.error.message,
                        variant: "destructive",
                    })
                },
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    Update your password. You will stay signed in on this device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 max-w-sm">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" disabled={isLoading} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" disabled={isLoading} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmNewPassword"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" disabled={isLoading} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-fit">
                            Update Password
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

const DeleteAccountSettings = () => {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const {toast} = useToast()
    const router = useRouter()

    const form = useForm<DeleteAccountFormValues>({
        resolver: zodResolver(deleteAccountFormSchema),
        defaultValues: {
            password: "",
        }
    })

    async function onConfirmDelete() {
        const valid = await form.trigger()
        if (!valid) return

        setIsLoading(true)
        try {
            await authClient.deleteUser({
                password: form.getValues("password"),
            }, {
                onSuccess: () => {
                    toast({title: "Your account has been deleted."})
                    router.push("/login")
                },
                onError: (ctx) => {
                    setIsDialogOpen(false)
                    toast({
                        title: "Error",
                        description: ctx.error.message,
                        variant: "destructive",
                    })
                },
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Delete Account</CardTitle>
                <CardDescription>
                    Permanently delete your account and all of your bookmarks, folders and
                    tags. This action cannot be undone.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="grid gap-4 max-w-sm"
                    >
                        <FormField
                            control={form.control}
                            name="password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" disabled={isLoading} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isLoading}
                            className="w-fit"
                            onClick={async () => {
                                const valid = await form.trigger()
                                if (valid) setIsDialogOpen(true)
                            }}
                        >
                            Delete Account
                        </Button>
                        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Account Confirmation?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you certain you want to delete your account? All of your
                                        bookmarks, folders and tags will be permanently removed. This
                                        cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        disabled={isLoading}
                                        onClick={onConfirmDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

const AccountSettings = () => {
    return (
        <div className="space-y-6">
            <ChangePasswordSettings/>
            <DeleteAccountSettings/>
        </div>
    )
}

export default AccountSettings
