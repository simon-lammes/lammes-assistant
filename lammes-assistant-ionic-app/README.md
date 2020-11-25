## Developer Guide

### GraphQL

#### Getting Type Support in your IDE

The server creates a schema.graphql file, describing its own endpoint. As you would expect, this file is put into the servers' directory. For the [GraphQL plugin for Intellij/WebStorm](https://jimkyndemeyer.github.io/js-graphql-intellij-plugin) to be able to use this schema, the schema needs to be placed in this frontends' project folder. Thus, we need a copy. I don't like this, so if you know a way of getting the plugin to work without this copy, please change this workflow. Anyway: In .graphqlconfig, we tell the plugin where to find the schema, so that it can introspect it and create the needed copy. How to do that in your development environment is described [here.](https://jimkyndemeyer.github.io/js-graphql-intellij-plugin/docs/developer-guide) This creates the schema.graphql file in this project file which should be almost 100% identical to the schema.graphql file in the servers' directory. Therefore, we do not check it into source control, one "source of truth" is enough.
