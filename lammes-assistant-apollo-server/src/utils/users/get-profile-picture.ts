import {S3} from "aws-sdk";

export async function getProfilePicture(spacesClient: AWS.S3, userId: number): Promise<S3.Object | undefined> {
  const picturesListResult = await spacesClient.listObjectsV2({
    Bucket: 'lammes-assistant-space',
    Prefix: `users/${userId}/profile-picture`
  }).promise();
  const pictures = picturesListResult.Contents;
  return pictures && pictures.length > 0 ? pictures[0] : undefined;
}
