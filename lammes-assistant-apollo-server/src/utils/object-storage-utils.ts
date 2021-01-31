import AWS, {S3} from "aws-sdk";

/**
 * Returns path in which the settings should be stored in BLOB storage.
 */
export function getSettingsUrl(userId: number): string {
  return `users/${userId}/settings.json`;
}

export function getProfilePicturePath(userId: number, fileExtension: string) {
  return `users/${userId}/profile-picture.${fileExtension}`;
}

export function getSignedUrlForProfilePicture(spacesClient: AWS.S3, key?: string): string | undefined {
  if (!key) {
    return;
  }
  return spacesClient.getSignedUrl('getObject', {
    Bucket: "lammes-assistant-space",
    Key: key,
    Expires: 60 * 60 * 60 * 24 // one day
  })
}

export function getBufferFromData64Content(base64Content: string) {
  return Buffer.from(base64Content.replace(/^data:image\/\w+;base64,/, ""), 'base64');
}

export async function deleteObject(client: AWS.S3, object: S3.Object | undefined): Promise<any> {
  if (!object || !object.Key) {
    return;
  }
  await client.deleteObject({
    Bucket: 'lammes-assistant-space',
    Key: object.Key
  }).promise();
}
