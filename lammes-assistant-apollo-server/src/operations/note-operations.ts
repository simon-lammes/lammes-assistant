import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {Note} from "@prisma/client";
import {generateAuthorizationError} from "../custom-errors/authorization-error";
import {generateNotFoundError} from "../custom-errors/not-found-error";

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

export async function fetchNote(context: Context, noteId: number): Promise<Note> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch notes when you are authenticated.');
  }
  const note = await context.prisma.note.findFirst({where: {id: noteId}});
  if (!note) {
    throw generateNotFoundError(`There is no note with the id ${noteId}.`);
  }
  if (userId !== note.creatorId) {
    throw generateAuthorizationError(`The note with the id of ${noteId} does not belong to you.`);
  }
  return note;
}

export async function editNote(context: Context, editedNote: {id: number, text: string, description: string}): Promise<Note> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only edit notes when you are authenticated.');
  }
  const note = await context.prisma.note.findFirst({where: {id: editedNote.id}});
  if (!note) {
    throw generateNotFoundError(`There is no note with the id ${editedNote.id}.`);
  }
  if (userId !== note.creatorId) {
    throw generateAuthorizationError(`The note with the id of ${editedNote.id} does not belong to you.`);
  }
  return context.prisma.note.update({
    where: {id: editedNote.id},
    data: {
      updatedTimestamp: new Date(),
      description: editedNote.description?.length > 0 ? editedNote.description : null,
      text: editedNote.text
    }
  });
}
