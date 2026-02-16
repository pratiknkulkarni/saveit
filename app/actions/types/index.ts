import {Bookmark, BookmarkTags} from "@prisma/client";

type ApplySettingsInput = {
    userId: string;
    theme?: "light" | "dark";
    bookmarkDisplay?: string[];
    showTags?: boolean;
    bookmarkLayout?: string;
    itemsPerPage?: number;
};

type ApplyDefaultSettingsInput = {
    userId: string;
};

type RegisterInput = {
    email: string;
    password: string;
    name: string;
    image?: string;
    callbackURL: string;
}

type LoginInput = {
    email: string;
    password: string;
}


// interface GetBookmarkByUserIdSuccess {
//     success: true,
//     data: Bookmark[]
// }
//
// interface GetBookmarkByUserIdError {
//     success: false,
//     error: string
// }

// type GetBookmarkByUserIdResponse = GetBookmarkByUserIdSuccess | GetBookmarkByUserIdError;

type CreateBookmarkSuccess = {
    success: true, data: Bookmark
}

type CreateBookmarkValidationError = {
    success: false, error: string, validationErrors: Record<string, string[]>
}

type CreateBookmarkDatabaseError = {
    success: false, error: string
}

type CreateBookmarkError = CreateBookmarkDatabaseError | CreateBookmarkValidationError

type CreateBookmarkResponse = CreateBookmarkSuccess | CreateBookmarkError

type CreateFoldersSuccess = {
    success: true,
    data: number
}

type CreateFoldersError = {
    success: false,
    error: string
}

type DuplicateFoldersError = {
    success: false,
    error: string,
    duplicateFolders: string[]
}

type CreateFoldersResponse = CreateFoldersSuccess | CreateFoldersError | DuplicateFoldersError;

type CreateTagsSuccess = {
    success: true,
    data: number
}

type CreateTagsError = {
    success: false,
    error: string
}

type DuplicateTagsError = {
    success: false,
    error: string,
    duplicateTags: string[]
}

type CreateTagsResponse = CreateTagsSuccess | CreateTagsError | DuplicateTagsError

type Tag = {
    id: number,
    name: string,
}

type GetUserTagsSuccess = {
    success: true,
    data: Tag[]
}

type GetUserTagsError = {
    success: false,
    error: string
}

type GetUserTagsResponse = GetUserTagsSuccess | GetUserTagsError;

type GetUserFoldersSuccess = {
    success: true,
    data: Tag[]
}

type GetUserFoldersError = {
    success: false,
    error: string
}

type GetUserFoldersResponse = GetUserFoldersSuccess | GetUserFoldersError;

interface DeleteBookmarkByUserIdSuccess {
    success: true,
}

interface DeleteBookmarkByUserIdError {
    success: false,
    error: string
}

type DeleteBookmarkByUserIdResponse = DeleteBookmarkByUserIdSuccess | DeleteBookmarkByUserIdError;

export type BookmarkTagsWithTag = BookmarkTags & { tag: Tag };

type GetTagsForBookmarkSuccess = {
    success: true,
    // data: BookmarkTags[]
    data: BookmarkTagsWithTag[]
}
type GetTagsForBookmarkError = {
    success: false,
    error: string
}

type GetTagsForBookmarkResponse = GetTagsForBookmarkSuccess | GetTagsForBookmarkError;


type GetFormattedTagsForBookmarksSuccess = {
    success: true;
    data: { bookmarkId: number; tagNames: string[] }[];
};

type GetFormattedTagsForBookmarksError = {
    success: false;
    error: string;
};

type GetFormattedTagsForBookmarksResponse =
    GetFormattedTagsForBookmarksSuccess
    | GetFormattedTagsForBookmarksError;

type PaginatedResponse<T> = {
    data: T[];
    metadata: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
}

type GetBookmarkByUserIdResponse = {
    success: true;
    data: PaginatedResponse<Bookmark>;
} | {
    success: false;
    error: string;
}


type DeleteTagSuccessResponse = {
    success: true,
}

type DeleteTagErrorResponse = {
    success: false,
    error: string
}

type DeleteTagResponse = DeleteTagSuccessResponse | DeleteTagErrorResponse

type UpdateTagResponseSuccess = {
    success: true
}

type UpdateTagResponseError = {
    success: false,
    error: string
}

type UpdateTagResponse = UpdateTagResponseSuccess | UpdateTagResponseError

type DeleteFolderSuccessResponse = {
    success: true;
};

type DeleteFolderErrorResponse = {
    success: false;
    error: string;
};

type DeleteFolderResponse = DeleteFolderSuccessResponse | DeleteFolderErrorResponse;

type UpdateFolderResponseSuccess = {
    success: true
}

type UpdateFolderResponseError = {
    success: false,
    error: string
}

type UpdateFolderResponse = UpdateFolderResponseSuccess | UpdateFolderResponseError


export type {
    Tag,
    CreateTagsResponse,
    GetUserTagsResponse,
    CreateFoldersResponse,
    CreateBookmarkResponse,
    ApplySettingsInput,
    ApplyDefaultSettingsInput,
    RegisterInput,
    LoginInput,
    GetBookmarkByUserIdResponse,
    GetUserFoldersResponse,
    DeleteBookmarkByUserIdResponse,
    GetTagsForBookmarkResponse,
    GetFormattedTagsForBookmarksResponse,
    DeleteTagResponse,
    UpdateTagResponse,
    DeleteFolderResponse,
    UpdateFolderResponse
}