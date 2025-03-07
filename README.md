## Save It

### A Minimal & Smart Bookmark Manager

**Save It** is a simple yet powerful bookmarking application designed to help users save, organize, and retrieve bookmarks effortlessly. The app automatically fetches metadata for saved links and provides intuitive filtering, searching, and categorization options.

---

## Features

- **Save Bookmarks with Metadata** – Automatically fetches titles, descriptions, and thumbnails for saved links.
- **Organize with Tags & Folders** – Categorize bookmarks easily with custom tags and folders.
- **Powerful Search & Filtering** – Quickly find bookmarks with a built-in search (powered by MiniSearch) and filters.
- **Favorite & Archive Bookmarks** – Mark important bookmarks as favorites or archive them for later.
- **Clean & Minimal UI** – Designed for a distraction-free and efficient bookmarking experience.

---

## Why I Built This

I created **Save It** because I wanted a fast, clutter-free bookmarking tool that automatically organizes saved links. Unlike traditional bookmark managers, this app retrieves metadata instantly and provides an easy-to-use interface for managing bookmarks efficiently.

---

## Tech Stack

- **Frontend**: Next.js 
- **Database**: SQLite with Prisma ORM
- **Search**: MiniSearch (for efficient search functionality)
- **Backend**: API routes in Next.js
- **Containerization**: Docker (optional)

---

## Installation & Setup

Clone the Repository

```sh
git clone https://github.com/praaatik/saveit
cd saveit
```

### Run Locally

1. Install dependencies:
   ```sh
   npm install
   ```  
2. Run the development server:
   ```sh
   npm run dev
   ```  
3. Open `http://localhost:3000` in your browser.

---

### Run with Docker

1. Build the Docker image:
   ```sh
   docker build -t saveit .
   ```  
2. Run the container:
   ```sh
   docker run -p 3000:3000 saveit
   ```  
---

## Usage

- **Add a bookmark**: Paste a link, and metadata is fetched automatically.
- **Search & filter**: Use tags, folders, or keywords to find bookmarks.
- **Manage bookmarks**: Favorite, archive, or delete as needed.
- **Sort by date added** – View bookmarks chronologically.
- **Dark mode** – For better accessibility.

---

## Future Plans

- **Bookmark reminders** – Get notified to revisit saved links.

---

## License

This project is licensed under [MIT License](LICENSE).