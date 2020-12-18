import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {FileUpload} from "graphql-upload";
import {ReadStream} from "fs";
import {Exercise} from "@prisma/client";

export interface CreateExerciseInput {
  title: string;
  assignment: Promise<FileUpload>;
  solution: Promise<FileUpload>;
}

/**
 * An exercise with all the information belonging to it. A regular "Exercise" only contains light metadata and it saved
 * in the relational database while an "Hydrated Exercise" is a storage-intensive object saved in DigitalOcean Spaces.
 */
interface HydratedExercise {

  /**
   * Should be usable to determine whether an exercise changed without looking into the "storage-intensive" parts of the exercise.
   */
  versionTimestamp: string;
  title: string;
  encodedAssignment: string;
  encodedSolution: string;
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
 * Takes a file upload, collects the data of that stream and converts that data to a base64 encoded string.
 */
async function encodeFileUploadToBase64(file: Promise<FileUpload>) {
  const frontUpload = await file;
  const stream = frontUpload.createReadStream();
  return await encodeStreamToBase64(stream);
}

export async function createExercise(context: Context, {
  title,
  assignment,
  solution
}: CreateExerciseInput): Promise<Exercise> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only create exercises when you are authenticated.');
  }
  const exerciseKey = createKeyForExercise(title);
  const [encodedAssignment, encodedSolution] = await Promise.all([
    encodeFileUploadToBase64(assignment),
    encodeFileUploadToBase64(solution)
  ]);
  const versionTimestamp = new Date();
  const hydratedExercise = {
    versionTimestamp: versionTimestamp.toString(),
    title,
    encodedAssignment,
    encodedSolution
  } as HydratedExercise;
  const upload = context.spacesClient.putObject({
    Bucket: "lammes-assistant-space",
    Key: `exercises/${exerciseKey}.json`,
    Body: JSON.stringify(hydratedExercise),
    ContentType: "application/json",
    ACL: "private"
  });
  await upload.promise();
  return context.prisma.exercise.create({
    data: {
      title,
      versionTimestamp,
      creator: {
        connect: {id: userId}
      }
    }
  });
}

export async function fetchMyExercises(context: Context): Promise<Exercise[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch your exercises when you are authenticated.');
  }
  return context.prisma.exercise.findMany({
    where: {
      creatorId: userId
    }
  });
}
