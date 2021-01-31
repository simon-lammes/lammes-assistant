import {objectType} from "@nexus/schema";
import {validateAuthenticated} from "../../utils/validators/authorization/validate-authenticated";
import {getSignedUrlForProfilePicture} from "../../utils/object-storage-utils";
import {getProfilePicture} from "../../utils/users/get-profile-picture";

export const userObjectType = objectType({
  name: 'User',
  definition(t) {
    t.model.id();
    t.model.firstName();
    t.model.lastName();
    t.model.username();
    t.model.notes();
    t.model.settingsUpdatedTimestamp();
    t.string('profilePictureDownloadLink', {
      resolve: async (root, args, {spacesClient, jwtPayload}) => {
        validateAuthenticated(jwtPayload);
        const picture = await getProfilePicture(spacesClient, root.id);
        return getSignedUrlForProfilePicture(spacesClient, picture?.Key) ?? null;
      },
    });
  },
});
