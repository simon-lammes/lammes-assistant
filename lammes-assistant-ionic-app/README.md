## Developer Guide

### Local Development

Run `npm install` and then `npm run start:remote`. As default configuration, we use [`environment.ts`](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-ionic-app/src/environments/environment.ts). By default, the app is configured to communicate with the remotely hosted server instance that should always be running.

If you do have a local server instance running and want to test how your locally developed app works together with your locally developed server, run `npm run start:local` instead. It will configure the app to communicate with the locally deployed server. This is the more powerful development configuration that you will need for developing features that require changes in both frontend and backend. The default configuration, however, can be convenient when you are just making changes to the frontend and don't want to start a local instance of the server.

### Deploy to Android

Build the project with production settings by running:

```
ionic cap copy --prod
```

This will use the configuration that is specified in [`environment.prod.ts`](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-ionic-app/src/environments/environment.prod.ts).

In case you changed something in the source code of the native portion (in the android directory), run:

```
ionic cap sync
```

Now you can start the app via Android Studio in your Emulator!

### GraphQL

#### Getting Type Support in your IDE

In this context, GraphQL Type Support means that your IDE will support you when writing GraphQL queries in a way that is perfectly tailored to your GraphQL API. This chapter shows how to get this IDE support working in [WebStorm](https://www.jetbrains.com/webstorm/).

The server creates a schema.graphql file, describing its own endpoint. As you would expect, this file is put into the servers' directory. For the [GraphQL plugin for Intellij/WebStorm](https://jimkyndemeyer.github.io/js-graphql-intellij-plugin) to be able to use this schema, the schema needs to be placed in this frontends' project folder. Thus, we need a copy. I don't like this, so if you know a way of getting the plugin to work without this copy, please change this workflow. Anyway: In .graphqlconfig, we tell the plugin where to find the schema, so that it can introspect it and create the needed copy. When you start IntelliJ/WebStorm you will be asked whether you want to start introspection, please start it ([more information]((https://jimkyndemeyer.github.io/js-graphql-intellij-plugin/docs/developer-guide))).  This creates the schema.graphql file in this project file which should be almost 100% identical to the schema.graphql file in the servers' directory. Therefore, we do not check it into source control, one "source of truth" is enough.

### Reminder To Dos for the future

This chapter is about to dos in this source code that cannot be done right now but should definitely get done in the future.

#### Forbid cleartext / unsecured http communication

Currently, the android app allows unsecured http communication because the local server does not offer encrypted communication.
Once the communication is encrypted, remove android:usesCleartextTraffic="true".
