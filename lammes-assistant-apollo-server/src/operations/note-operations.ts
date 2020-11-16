import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {Note} from "@prisma/client";

export interface CreateNoteInput {
  text: string;
}

export async function createNote(context: Context, {text}: CreateNoteInput): Promise<Note> {
  const username = context.jwtPayload?.username;
  if (!username) {
    throw new AuthenticationError('You can only create notes when you are authenticated.');
  }
  return context.prisma.note.create({
    data: {
      text,
      user: {
        connect: {username}
      }
    }
  });
}