import {enumType} from "@nexus/schema";

export const ProtectionLevelEnumType = enumType({
  name: 'ProtectionLevelInput',
  members: ['essential', 'informative', 'delicate']
});
