import random
from datetime import datetime, timedelta
import string


def random_string(length):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def random_date(start_date, end_date):
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    return start_date + timedelta(days=random_number_of_days)


# Constants
USER_ID = 'EVJOPadhqV83IxzIirrRomOuRLlvlgdC'
NUM_FOLDERS = 10
NUM_TAGS = 20
NUM_BOOKMARKS = 1000
START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2024, 12, 31)

# Generate folder insert statements
folder_inserts = []
folder_ids = []
for i in range(NUM_FOLDERS):
    folder_id = i + 1000
    folder_ids.append(folder_id)
    created_at = random_date(START_DATE, END_DATE)
    updated_at = random_date(created_at, END_DATE)
    folder_inserts.append(
        f"INSERT INTO Folder (id, name, createdAt, updatedAt, userId) "
        f"VALUES ({folder_id}, 'Folder {i + 1}', datetime('now'), datetime('now'), '{USER_ID}');"
    )

# Generate tag insert statements
tag_inserts = []
tag_ids = []
for i in range(NUM_TAGS):
    tag_id = i + 1000
    tag_ids.append(tag_id)
    created_at = random_date(START_DATE, END_DATE)
    updated_at = random_date(created_at, END_DATE)
    tag_inserts.append(
        f"INSERT INTO Tag (id, name, createdAt, updatedAt, userId) "
        f"VALUES ({tag_id}, 'Tag {i + 1}', datetime('now'), datetime('now'), '{USER_ID}');"
    )

# Generate bookmark insert statements
bookmark_inserts = []
bookmark_tag_inserts = []
for i in range(NUM_BOOKMARKS):
    bookmark_id = i + 1000
    created_at = random_date(START_DATE, END_DATE)
    updated_at = random_date(created_at, END_DATE)
    is_favorite = random.choice(['true', 'false'])
    is_archived = random.choice(['true', 'false'])
    folder_id = random.choice([None] + folder_ids)
    folder_part = f"{folder_id}" if folder_id else "NULL"

    bookmark_inserts.append(
        f"INSERT INTO Bookmark (id, url, title, description, isFavorite, isArchived, createdAt, updatedAt, folderId, userId) "
        f"VALUES ({bookmark_id}, 'https://{random_string(10)}.com/{random_string(8)}', "
        f"'Bookmark {i + 1}', 'Description for bookmark {i + 1}', {is_favorite}, {is_archived}, "
        f"datetime('now'), datetime('now'), {folder_part}, '{USER_ID}');"
    )

    # Generate 1-3 random tags for each bookmark
    num_tags = random.randint(1, 3)
    selected_tags = random.sample(tag_ids, num_tags)
    for tag_id in selected_tags:
        bookmark_tag_inserts.append(
            f"INSERT INTO BookmarkTags (bookmarkId, tagId) VALUES ({bookmark_id}, {tag_id});"
        )

# Print all insert statements
print("-- Folder inserts")
print("\n".join(folder_inserts))
print("\n-- Tag inserts")
print("\n".join(tag_inserts))
print("\n-- Bookmark inserts")
print("\n".join(bookmark_inserts))
print("\n-- BookmarkTags inserts")
print("\n".join(bookmark_tag_inserts))
