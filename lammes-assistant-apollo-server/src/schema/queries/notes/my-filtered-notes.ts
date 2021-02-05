import {arg, nonNull, queryField} from "@nexus/schema";
import {noteObjectType} from "../../types/note";
import {AuthenticationError} from "apollo-server";
import {NoteFilterDefinition} from "../../types/note-filter";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";

export const myFilteredNotes = queryField('myFilteredNotes', {
  type: noteObjectType,
  list: true,
  args: {
    filter: nonNull(arg({type: NoteFilterDefinition}))
  },
  resolve: (root, {filter}, {jwtPayload, prisma}) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.note.findMany({
      where:  {
        creatorId: userId,
        noteLabels: filter.labels && filter.labels.length > 0 ? {
          some: {
            label: {
              title: {in: filter.labels}
            }
          }
        } : undefined,
        OR: getNoteStatusFilters(filter)
      }
    });
  }
});

function getNoteStatusFilters(filter: {noteStatus?: string[] | null}): any[] | undefined {
  const status = filter.noteStatus;
  if (!status || status.length === 0) {
    return undefined;
  }
  const now = new Date();
  const filters = [];
  if (status.includes('deferred')) {
    filters.push({
      startTimestamp: {
        gt: now
      },
      resolvedTimestamp: null
    });
  }
  if (status.includes('pending')) {
    filters.push({
      startTimestamp: {
        lte: now
      },
      resolvedTimestamp: null
    });
  }
  if (status.includes('resolved')) {
    filters.push({
      resolvedTimestamp: {not: null}
    });
  }
  console.log(filters);
  return filters;
}
