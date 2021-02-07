import {arg, intArg, list, mutationField, nonNull} from "@nexus/schema";
import {groupObjectType} from "../../types/group";
import {validateAuthenticated} from "../../../utils/validators/authorization/validate-authenticated";
import {validateMembersRole} from "../../../utils/validators/group-validation/validate-members-role";
import {UserInputError} from "apollo-server";
import {NewGroupMembership} from "../../types";
import {GroupMemberRole, GroupMemberRoleEnumType} from "../../types/group-member-role";

export const addGroupMemberships = mutationField('addGroupMemberships', {
  type: groupObjectType,
  args: {
    id: nonNull(intArg()),
    addedMemberships: nonNull(list(nonNull(arg({type: NewGroupMembership})))),
    role: nonNull(arg({type: GroupMemberRoleEnumType, description: 'The role that the added members should have'}))
  },
  resolve: async (
    root,
    {id, addedMemberships, role},
    {jwtPayload, prisma}
  ) => {
    if (!addedMemberships || addedMemberships.length === 0) {
      throw new UserInputError('Array length should be larger than 0');
    }
    const userId = validateAuthenticated(jwtPayload);
    // Which role must the user have at least in order for this operation to be allowed?
    const minRole: GroupMemberRole = role === 'owner' ? 'owner' : 'admin';
    await validateMembersRole(prisma, id, userId, minRole);
    return prisma.group.update({
      where: {
        id
      },
      data: {
        groupMemberships: {
          create: addedMemberships.map(membership => {
            return {
              role,
              memberId: membership.memberId
            }
          })
        }
      }
    })
  }
});
