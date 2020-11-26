## Developer Guide

### Deploy to Android

Because we need the android emulator to the server running on our PC, we need a different configuration. Currently, we use the environment.prod.ts for this purpose. Therefore, we need to build with the prod flag. Run:

```
ionic cap copy --prod
```

In case you changed something in the source code of the native portion (in the android directory), run:

```
ionic cap sync
```

Now you can start the app via Android Studio in your Emulator!

### GraphQL

#### Getting Type Support in your IDE

The server creates a schema.graphql file, describing its own endpoint. As you would expect, this file is put into the servers' directory. For the [GraphQL plugin for Intellij/WebStorm](https://jimkyndemeyer.github.io/js-graphql-intellij-plugin) to be able to use this schema, the schema needs to be placed in this frontends' project folder. Thus, we need a copy. I don't like this, so if you know a way of getting the plugin to work without this copy, please change this workflow. Anyway: In .graphqlconfig, we tell the plugin where to find the schema, so that it can introspect it and create the needed copy. How to do that in your development environment is described [here.](https://jimkyndemeyer.github.io/js-graphql-intellij-plugin/docs/developer-guide) This creates the schema.graphql file in this project file which should be almost 100% identical to the schema.graphql file in the servers' directory. Therefore, we do not check it into source control, one "source of truth" is enough.

### Reminder To Dos for the future

This chapter is about to dos in this source code that cannot be done right now but should definitely get done in the future.

#### Forbid cleartext / unsecured http communication

Currently, the android app allows unsecured http communication because the local server does not offer encrypted communication.
Once the communication is encrypted, remove android:usesCleartextTraffic="true".
