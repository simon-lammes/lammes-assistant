import {makeSchema} from "@nexus/schema";
import {nexusPrisma} from "nexus-plugin-prisma";
import * as mutations from './mutations';
import * as queries from './queries';
import * as types from './types';

export const schema = makeSchema({
  types: [mutations, queries, types],
  plugins: [nexusPrisma({experimentalCRUD: true})],
  outputs: {
    schema: __dirname + '/../../schema.graphql',
    typegen: __dirname + '/../generated/nexus.ts',
  },
  typegenAutoConfig: {
    contextType: 'Context.Context',
    sources: [
      {
        source: '@prisma/client',
        alias: 'prisma',
      },
      {
        source: require.resolve('../context'),
        alias: 'Context',
      },
    ],
  },
})
