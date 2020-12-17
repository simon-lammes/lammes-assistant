import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {FileUpload} from "graphql-upload";
import {ReadStream} from "fs";

export interface CreateExerciseInput {
  title: string;
  front: Promise<FileUpload>;
  back: Promise<FileUpload>;
}

/**
 * Documented on the GraphQL schema level.
 */
interface HydratedExercise {
  title: string;
  front: string;
  back: string;
}

/**
 * Using the exercise title, this method creates an identifying key for the exercise following a standardized procedure.
 * This key can be used to create a folder that contains all of the exercises files.
 */
function createKeyForExercise(exerciseTitle: string) {
  // Prefix 'c_' stands for custom because the exercise is tied to one user.
  return 'c_' + exerciseTitle.toLowerCase().replace(' ', '_');
}

/**
 * Takes a stream and converts it to a base64 encoded string
 */
function encodeStreamToBase64(stream: ReadStream): Promise<string> {
  return new Promise(resolve => {
    const chunks: Uint8Array[] = [];
    stream.on('data', function (chunk) {
      chunks.push(chunk);
    });
    stream.on('end', function () {
      const result = Buffer.concat(chunks);
      resolve(result.toString('base64'));
    });
  });
}

/**
 * Uploads a file to DigitalOcean Spaces and returns a base64 representation of that file.
 * @param context
 * @param exerciseKey A unique string for the exercise that is used for creating an exercise folder.
 * @param file A file that is part of the exercise.
 */
async function uploadExerciseFile(context: Context, exerciseKey: string, file: Promise<FileUpload>) {
  const frontUpload = await file;
  const stream = frontUpload.createReadStream();
  const encodedString = await encodeStreamToBase64(stream);
  const upload = context.spacesClient.putObject({
    Bucket: "lammes-assistant-space",
    Key: `exercises/${exerciseKey}/${frontUpload.filename}`,
    // A bit bad that we have encoded the file to base64 and now we decode it again.
    // Feel free to find a better way in the future.
    Body: Buffer.from(encodedString, 'base64'),
  });
  await upload.promise();
  return encodedString;
}

export async function createExercise(context: Context, {
  title,
  front,
  back
}: CreateExerciseInput): Promise<HydratedExercise> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only create exercises when you are authenticated.');
  }
  const exerciseKey = createKeyForExercise(title);
  const [encodedFront, encodedBack] = await Promise.all([
    uploadExerciseFile(context, exerciseKey, front),
    uploadExerciseFile(context, exerciseKey, back)
  ]);
  return {
    title,
    front: encodedFront,
    back: encodedBack,
  };
}
