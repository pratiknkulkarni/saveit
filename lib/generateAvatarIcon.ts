import {createAvatar} from "@dicebear/core";
import {loreleiNeutral} from "@dicebear/collection"

const generateAvatarIcon = (email: string) => {
    return createAvatar(loreleiNeutral, {
        size: 128,
        seed: email,
    }).toDataUri();
}

export default generateAvatarIcon;