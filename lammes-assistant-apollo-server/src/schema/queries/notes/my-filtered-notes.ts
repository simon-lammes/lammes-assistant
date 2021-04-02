import {arg, nonNull, queryField} from "@nexus/schema";
import {noteObjectType} from "../../types/note";
import {NoteFilterDefinition} from "../../types/note-filter";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";

export const myFilteredNotes = queryField('myFilteredNotes', {
  type: noteObjectType,
  list: true,
  args: {
    filter: nonNull(arg({type: NoteFilterDefinition}))
  },
  resolve: async (root, {filter}, {jwtPayload, prisma}) => {
    const userId = validateAuthenticated(jwtPayload);
    await validateMembersRole(prisma, userId, 'member', filter.groupIds);
    return prisma.note.findMany({
      where: {
        creatorId: userId,
        groupNotes: filter.groupIds && filter.groupIds.length ? {
          some: {
            groupId: {
              in: filter.groupIds
            }
          }
        } : undefined,
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
  return filters;
}
