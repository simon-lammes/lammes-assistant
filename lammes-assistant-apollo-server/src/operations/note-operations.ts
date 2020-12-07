import {Context} from "../context";
import {AuthenticationError} from "apollo-server";
import {Note} from "@prisma/client";
import {generateAuthorizationError} from "../custom-errors/authorization-error";
import {generateNotFoundError} from "../custom-errors/not-found-error";

export interface CreateNoteInput {
  text: string;
  description?: string | null;
}

interface ResolveNoteInput {
  noteId: number;
}

export async function createNote(context: Context, {text, description}: CreateNoteInput): Promise<Note> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only create notes when you are authenticated.');
  }
  return context.prisma.note.create({
    data: {
      text,
      description,
      user: {
        connect: {id: userId}
      }
    }
  });
}

export async function fetchMyDeferredNotes(context: Context): Promise<Note[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only fetch your notes when you are authenticated.');
  }
  return context.prisma.note.findMany({
    where: {
      creatorId: userId,
      resolvedTimestamp: null,
      // Deferred notes are notes whose startTime is in the future.
      startTimestamp: {gt: new Date()}
    },
    orderBy: {
      startTimestamp: 'asc'
    },
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
      resolvedTimestamp: null,
      // We only want those notes whose startTimestamp is in the past. This is a criterion we have set for **pending** notes.
      startTimestamp: {lte: new Date()}
    },
    orderBy: {
      updatedTimestamp: 'desc'
    }
  });
}

export async function fetchMyResolvedNotes(context: Context): Promise<Note[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can fetch your notes when you are authenticated.');
  }
  return context.prisma.note.findMany({
    where: {
      creatorId: userId,
      resolvedTimestamp: {not: null}
    },
    orderBy: {
      resolvedTimestamp: 'desc'
    }
  });
}

export async function resolveNote(context: Context, {noteId}: ResolveNoteInput): Promise<Note> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only resolve notes when you are authenticated.');
  }
  const note = await context.prisma.note.findFirst({
    where: {
      id: noteId
    }
  });
  if (!note) {
    throw generateNotFoundError(`No note with id ${noteId}.`);
  }
  if (note.creatorId !== userId) {
    throw generateAuthorizationError("You cannot resolve notes of other users.");
  }
  return await context.prisma.note.update({
    where: {id: noteId},
    data: {
      resolvedTimestamp: new Date()
    }
  });
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

export async function editNote(context: Context, editedNote: {id: number, text: string, description: string, startTimestamp: string}): Promise<Note> {
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
      text: editedNote.text,
      startTimestamp: editedNote.startTimestamp
    }
  });
}
