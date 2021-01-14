# Lammes Assistant

Lammes Assistant is an application that helps individuals with organisation and studying. It should replace classical To Do apps and create less cluttered To Do lists with better filtering functionality. Users should be able to **very quickly** create notes to remind themselves of something. This goal is induced by the fact that I often find myself in situations where I just want to remind myself about something but I want to do it as fast as possible so that I can return to the task at hand. An example is that I am in a lecure and the professur gives us a homework assignment. I want to write down the homework assignment quickly so that I can return to focussing on the lecture. In order to reduce the time it takes to take a note, this app does not require the user to provide any additional information like "To which list does this task belong? When is it due? etc.". You just write the reminder text and are "done for now". Later, when you have the necessary time, you can review and refine your reminders. For example, you can add the information of when your homework assignment is due. Refining your notes is the perfect task for when you are commuting or just having spare time. This is the aspect that sets apart **Lammes Assistant** from other To Do apps. Other To Do apps are designed so that you create reminders with all their necessary information in one step. Lammes Assistant is designed to let you quickly take a note and refine it later for when you have enough time to do so.

> But theoretically you could do the same with classical To Do apps: Create a simple note to do and refine it later.

Yes, but classical To Do apps do not remind you to refine your reminder. It might get lost amonst many other reminders. Instead, Lammes Assistant puts those simple, unrefined reminders in a category called *pending*. All notes that require action by you are gathered there. Thus, you have a focused view on exactly those notes that are important to you right now. Let's say you refine a note and provide the information that you cannot start with this task right now but next week. This note will be put into the *deferred* category which gathers all tasks that will matter to you soon but not right now.

> Lammes Assistant offers more functionality than just notes. Why is various functionality integrated into this app instead of splitted across separate apps?

Another important concept of Lammes Assistant is integrating functionality that can nicely be integrated. For example, when I create notes at university, I later want to convert those notes into exercises. When I don't have to switch apps, this process works seemlessly. This is why I am currently developing functionality for creating and doing exercises.

## User guide

This guide is aimed at everyone who just wants to use this app. The simplest way is to just visit this link [link](https://lammes-assistant-5m7y3.ondigitalocean.app/). That link routes you to the application that I am hosting on [DigitalOcean App Plattform](https://www.digitalocean.com/products/app-platform/).

You can deploy the source code on your own infrastructure. This might be useful, when you want to test the app or contribute to this project. To host the application on your own infrasturcture, follow the Developer guide regarding local development.

## Developer Guide

This guide is aimed at everyone who wants to test, develop or contribute to this app.

### Architecture

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) containing all projects that make up Lammes Assistant. Every project is put in its own folder.

The whole application consists of the following projects. The *lammes-assistant-ionic-app* is the user interface. It uses *lammes-assistant-apollo-server* as its backend for CRUD operations. The *lammes-assistant-apollo-server* is stateless and uses a Postgres database for storing structured data and [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/) for unstructured data like binary files.

For the documention of the single projects go into their corresponding folders. The Postgres database does not have any project folder because this would not seem to make sense. Instead the database schema is documented in the [prisma.schema file](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-apollo-server/prisma/schema.prisma). To understand this file, I recommend checking out the corresponding [Prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-schema).

### Local Development

Running the application on your own infrastructure is useful when you want to contribute or test the application. As this application consists of multiple components (e.g. frontend, backend), you can run a selected set of those components locally. For example, if you just want to work on the frontend, you can run the frontend locally but configure it to talk to the remotely hosted backend. If you just want to work on the backend API, you can just run the backend locally. The documentation for running those projects locally can be found in their corresponding folder. For example, if you want to see how to run the frontend locally, go into the folder *lammes-assistant-ionic-app.* There should be a README with the project specific steps explained in the chapter *Developer Guide.*

For a fully fledged development experience, I recommend running the frontend locally **and** letting it communicate with a locally deployed server.
