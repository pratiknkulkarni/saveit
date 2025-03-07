import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Save It</h1>
                    <div className="flex items-center space-x-4">
                        <Link href={"/login"}>
                            <Button variant="ghost">Login</Button>
                        </Link>

                        <Link href={"/register"}>
                            <Button>Register</Button>
                        </Link>
                        <ThemeToggle/>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-12">
                <section className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Your Personal Bookmark Manager</h2>
                    <p className="text-xl text-muted-foreground mb-8">
                        Organize, access, and share your bookmarks with ease
                    </p>
                    <Button size="lg">Get Started</Button>
                </section>

                <section className="mb-16">
                    <h3 className="text-2xl font-semibold mb-6 text-center">See It in Action</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <ScreenshotCard
                            src="/placeholder.svg"
                            alt="Dashboard Overview"
                            title="Intuitive Dashboard"
                        />
                        <ScreenshotCard
                            src="/placeholder.svg"
                            alt="Bookmark Organization"
                            title="Easy Organization"
                        />
                    </div>
                </section>

                <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        title="Easy Organization"
                        description="Create folders, add tags, and categorize your bookmarks effortlessly"
                    />
                    <FeatureCard
                        title="Quick Access"
                        description="Find your bookmarks instantly with powerful search and filtering"
                    />
                    <FeatureCard
                        title="Cross-Device Sync"
                        description="Access your bookmarks from any device, always in sync"
                    />
                    <FeatureCard
                        title="Collaboration"
                        description="Share folders with friends or colleagues for easy collaboration"
                    />
                    <FeatureCard
                        title="Read Status"
                        description="Keep track of which bookmarks you've read or still need to check out"
                    />
                    <FeatureCard
                        title="Customization"
                        description="Personalize your bookmark view and organize as you like"
                    />
                </section>
            </main>

            <footer className="border-t">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    © 2023 Save It. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

export default LandingPage;

function FeatureCard({title, description}: { title: string; description: string }) {
    return (
        <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

function ScreenshotCard({src, alt, title}: { src: string; alt: string; title: string }) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <Image src={src} alt={alt} width={800} height={600} className="w-full h-auto"/>
            <div className="p-4">
                <h4 className="text-lg font-semibold">{title}</h4>
            </div>
        </div>
    )
}

