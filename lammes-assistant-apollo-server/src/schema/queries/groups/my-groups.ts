import {queryField} from "@nexus/schema";
import {noteObjectType} from "../../types/note";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {groupObjectType} from "../../types/group";

export const myGroups = queryField('myGroups', {
  type: groupObjectType,
  list: true,
  resolve: (root, args, {jwtPayload, prisma}) => {
    const userId = validateAuthenticated(jwtPayload);
    return prisma.group.findMany({
      where: {
        groupMemberships: {
          some: {
            memberId: userId
          }
        }
      },
    });
  }
});
