// THIS FILE HAS BEEN GENERATED USING GEMINI 3

import {PrismaClient} from "@prisma/client";
import {faker} from "@faker-js/faker";

const prisma = new PrismaClient();

const TOTAL_BOOKMARKS = 100_000;
const BATCH_SIZE = 2000; // Increased batch size for speed
const TARGET_USER_ID = "i6HWQ8tYGpNpo2pu7TvoGJKDzWBWo4JM";

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomItems = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

async function main() {
    console.log(`Starting Stress Seed for User: ${TARGET_USER_ID}`);
    console.time("Total Duration");

    // 1. CLEANUP
    console.log("Cleaning old data...");
    await prisma.bookmarkTags.deleteMany({where: {bookmark: {userId: TARGET_USER_ID}}});
    await prisma.bookmark.deleteMany({where: {userId: TARGET_USER_ID}});
    await prisma.folder.deleteMany({where: {userId: TARGET_USER_ID}});
    await prisma.tag.deleteMany({where: {userId: TARGET_USER_ID}});

    // 2. CREATE METADATA
    console.log("Creating Folders & Tags...");

    // Create 50 Folders and 100 Tags
    const folderData = Array.from({length: 50}).map(() => ({
        name: faker.commerce.department() + " " + faker.string.alpha(3),
        userId: TARGET_USER_ID,
        // icon: "folder",
    }));
    await prisma.folder.createMany({data: folderData});
    const folders = await prisma.folder.findMany({where: {userId: TARGET_USER_ID}, select: {id: true}});
    const folderIds = folders.map(f => f.id);

    const tagData = Array.from({length: 100}).map(() => ({
        name: faker.hacker.noun() + "-" + faker.string.alpha(3),
        userId: TARGET_USER_ID,
    }));
    await prisma.tag.createMany({data: tagData});
    const tags = await prisma.tag.findMany({where: {userId: TARGET_USER_ID}, select: {id: true}});
    const tagIds = tags.map(t => t.id);

    // 3. BULK INSERT BOOKMARKS
    console.log(`Inserting ${TOTAL_BOOKMARKS} bookmarks...`);

    for (let i = 0; i < TOTAL_BOOKMARKS; i += BATCH_SIZE) {
        const batch = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            // 70% chance to have a folder, 30% chance to be in "Unsorted"
            const folderId = Math.random() > 0.3 ? getRandomItem(folderIds) : null;

            batch.push({
                userId: TARGET_USER_ID,
                folderId: folderId,
                title: faker.company.catchPhrase(),
                url: faker.internet.url(),
                description: faker.lorem.paragraph(),
                isFavorite: Math.random() > 0.9,
                isArchived: Math.random() > 0.9,
                createdAt: faker.date.past(),
            });
        }

        await prisma.bookmark.createMany({data: batch});

        const progress = Math.min(i + BATCH_SIZE, TOTAL_BOOKMARKS);
        process.stdout.write(`\r   Bookmarks: ${progress} / ${TOTAL_BOOKMARKS}`);
    }
    console.log("\n");

    // 4. LINK TAGS (The tricky part)
    // createMany doesn't return IDs, so we fetch them all now to link tags
    console.log("Linking Tags to Bookmarks...");
    const allBookmarks = await prisma.bookmark.findMany({
        where: {userId: TARGET_USER_ID},
        select: {id: true}
    });

    const tagLinks = [];
    const LINK_BATCH_SIZE = 5000;

    for (const bookmark of allBookmarks) {
        // 50% chance a bookmark has tags
        if (Math.random() > 0.5) {
            const selectedTags = getRandomItems(tagIds, Math.floor(Math.random() * 3) + 1); // 1-3 tags
            for (const tagId of selectedTags) {
                tagLinks.push({
                    bookmarkId: bookmark.id,
                    tagId: tagId
                });
            }
        }

        // Flush batch if full
        if (tagLinks.length >= LINK_BATCH_SIZE) {
            await prisma.bookmarkTags.createMany({data: tagLinks});
            tagLinks.length = 0; // Clear array
            process.stdout.write(`\r   Tag Links Created: ${tagLinks.length} (flushing...)`);
        }
    }
    // Flush remaining
    if (tagLinks.length > 0) {
        await prisma.bookmarkTags.createMany({data: tagLinks});
    }
    console.log("\n");


    // 5. INSERT THE NEEDLE (The Golden Bananna)
    console.log("Inserting the 'Needle'...");

    // Create specific Folder/Tags for the needle so we can test filtering
    const secretFolder = await prisma.folder.create({
        data: {name: "Top Secret 51", userId: TARGET_USER_ID}
    });

    const secretTag = await prisma.tag.create({
        data: {name: "classified-fruit", userId: TARGET_USER_ID}
    });

    await prisma.bookmark.create({
        data: {
            userId: TARGET_USER_ID,
            title: "The Golden Bananna of the Cloud",
            url: "https://bananna-cloud.com",
            description: "A secret bookmark hidden amongst the millions. Find me if you can.",
            folderId: secretFolder.id,
            // Connect Tags using relation syntax
            BookmarkTags: {
                create: [
                    {tagId: secretTag.id}
                ]
            }
        }
    });

    console.log("Done!");
    console.timeEnd("Total Duration");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });