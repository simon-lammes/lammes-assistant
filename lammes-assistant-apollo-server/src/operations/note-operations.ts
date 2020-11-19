import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {Note} from "@prisma/client";

export interface CreateNoteInput {
  text: string;
}

export async function createNote(context: Context, {text}: CreateNoteInput): Promise<Note> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only create notes when you are authenticated.');
  }
  return context.prisma.note.create({
    data: {
      text,
      user: {
        connect: {id: userId}
      }
    }
  });
}

export async function fetchMyNotes(context: Context): Promise<Note[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can fetch your notes when you are authenticated.');
  }
  return context.prisma.note.findMany({
    where: {
      creatorId: userId
    }
  });
}
