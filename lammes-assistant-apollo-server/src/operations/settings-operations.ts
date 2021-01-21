import {Context} from "../context";
import {AuthenticationError} from "apollo-server";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  notes?: any;
  settingsUpdatedTimestamp: string
}

export interface ExerciseCooldown {
  days: number;
  hours: number;
  minutes: number;
}

export interface Settings {
  settingsUpdatedTimestamp?: string;
  exerciseCooldown: ExerciseCooldown;
}

export async function saveSettings(context: Context, settings: Settings): Promise<any> {
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

/**
 * Returns the user object that belongs to user making the request.
 */
export function getCurrentUser(context: Context): any {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  return context.prisma.user.findFirst({
    where: {
      id: userId
    }
  });
}

export async function getSettingsDownloadLink(context: Context): Promise<any> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You must be authenticated.');
  }
  const usersSettingsUrl = getSettingsUrl(userId);
  const doUserSettingsExist = await new Promise(resolve => {
    context.spacesClient.headObject({
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
  return context.spacesClient.getSignedUrl('getObject', {
    Bucket: "lammes-assistant-space",
    Key: usersSettingsUrl,
    Expires: 60
  });
}

function getSettingsUrl(userId: number) {
  return `users/${userId}/settings.json`;
}
