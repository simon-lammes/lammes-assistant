import {queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {getSettingsUrl} from "../../../utils/object-storage-utils";

export const getSettingsDownloadLink = queryField('getSettingsDownloadLink', {
  type: "String",
  description: "Will be null if the user has no settings yet.",
  nullable: true,
  resolve: async (root, args, {jwtPayload, spacesClient}) => {
    const userId = jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You must be authenticated.');
    }
    const usersSettingsUrl = getSettingsUrl(userId);
    const doUserSettingsExist = await new Promise(resolve => {
      spacesClient.headObject({
        Bucket: "lammes-assistant-space",
        Key: usersSettingsUrl,
      }, (err) => {
        // When the error is undefined, we were able to find the users settings.
        resolve(!err);
      });
    });
    if (!doUserSettingsExist) {
      return null;
    }
    return spacesClient.getSignedUrl('getObject', {
      Bucket: "lammes-assistant-space",
      Key: usersSettingsUrl,
      Expires: 60
    });
  }
});
