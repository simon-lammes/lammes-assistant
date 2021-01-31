import {arg, mutationField, nonNull} from "@nexus/schema";
import {PictureInputType} from "../../types/picture";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {
  deleteObject,
  getBufferFromData64Content,
  getProfilePicturePath,
  getSignedUrlForProfilePicture
} from "../../../utils/object-storage-utils";
import {ApolloError} from "apollo-server";
import mime from "mime";
import {getProfilePicture} from "../../../utils/users/get-profile-picture";

export const setProfilePictureMutation = mutationField("setProfilePicture", {
  type: "String",
  description: 'Set the user\'s profile picture and return a signed download link for it.',
  nullable: true,
  args: {
    picture: nonNull(arg({type: PictureInputType}))
  },
  resolve: async (
    _,
    {
      picture
    },
    {
      prisma,
      jwtPayload,
      spacesClient
    },
  ) => {
    const userId = validateAuthenticated(jwtPayload);
    const existingImage = await getProfilePicture(spacesClient, userId);
    const existingImageDeletion = deleteObject(spacesClient, existingImage);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore The TS types for mime seem to be wrong.
    const fileExtension = mime.extension(picture.type);
    if (typeof fileExtension !== 'string') {
      throw new ApolloError('Server could not determine file extension');
    }
    const pictureKey = getProfilePicturePath(userId, fileExtension);
    const upload = spacesClient.putObject({
      Bucket: "lammes-assistant-space",
      Key: getProfilePicturePath(userId, fileExtension),
      Body: getBufferFromData64Content(picture.content),
      ContentEncoding: 'base64',
      ContentType: picture.type,
      ACL: "private"
    });
    await Promise.all([
      upload.promise(),
      existingImageDeletion
    ]);
    return getSignedUrlForProfilePicture(spacesClient, pictureKey) ?? null;
  }
});
