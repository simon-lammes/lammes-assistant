import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {Note} from "@prisma/client";
import {generateAuthorizationError} from "../custom-errors/authorization-error";

export interface CreateNoteInput {
  text: string;
}

interface ResolveNotesInput {
  noteIds: number[];
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

export async function fetchMyPendingNotes(context: Context): Promise<Note[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can fetch your notes when you are authenticated.');
  }
  return context.prisma.note.findMany({
    where: {
      creatorId: userId,
      resolvedTimestamp: null
    }
  });
}

export async function resolveNotes(context: Context, {noteIds}: ResolveNotesInput): Promise<Date> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only resolve notes when you are authenticated.');
  }
  const now = new Date();
  const notesToResolveThatDoNotBelongToUser = await context.prisma.note.findMany({
    where: {
      id: {
        in: noteIds
      },
      creatorId: {
        not: userId
      }
    }
  });
  if (notesToResolveThatDoNotBelongToUser.length > 0) {
    throw generateAuthorizationError("You cannot resolve notes of other users.", {"wrongNoteIds": notesToResolveThatDoNotBelongToUser.map(note => note.id)});
  }
  await context.prisma.note.updateMany({
    where: {
      id: {
        in: noteIds
      }
    },
    data: {
      resolvedTimestamp: now
    }
  });
  return now;
}
