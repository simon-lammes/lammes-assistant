import {intArg, nonNull, queryField} from "@nexus/schema";
import {AuthenticationError} from "apollo-server";
import {getHydratedExercisePath} from "../../../utils/object-storage-utils";

export const getExerciseDownloadLink = queryField('getExerciseDownloadLink', {
  type: "String",
  args: {
    exerciseId: nonNull(intArg())
  },
  resolve: (root, {exerciseId}, context) => {
    const userId = context.jwtPayload?.userId;
    if (!userId) {
      throw new AuthenticationError('You must be authenticated.');
    }
    return context.spacesClient.getSignedUrl('getObject', {
      Bucket: "lammes-assistant-space",
      Key: getHydratedExercisePath({id: exerciseId}),
      Expires: 60
    });
  }
});
