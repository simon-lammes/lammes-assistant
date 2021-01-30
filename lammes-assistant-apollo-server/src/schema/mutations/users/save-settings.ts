import {arg, mutationField, nonNull} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {getSettingsUrl} from "../../../utils/object-storage-utils";
import {ExerciseCooldownInputType} from "../../types/exercise-cooldown";
import {userObjectType} from "../../types/user";
import {Settings, SettingsInputType} from "../../types/settings";

export const saveSettingsMutation = mutationField('saveSettings', {
  type: userObjectType,
  args: {
    settings: nonNull(arg({type: SettingsInputType})),
  },
  resolve: async (root, {settings}, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You must be authenticated.');
    }
    const settingsUpdatedTimestamp = new Date();
    const upload = context.spacesClient.putObject({
      Bucket: "lammes-assistant-space",
      Key: getSettingsUrl(userId),
      Body: JSON.stringify({
        ...settings,
        settingsUpdatedTimestamp: settingsUpdatedTimestamp.toISOString()
      } as Settings),
      ContentType: "application/json",
      ACL: "private"
    });
    await upload.promise();
    return context.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        settingsUpdatedTimestamp
      }
    });
  }
});
