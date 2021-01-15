## Developer Guide

### Local Development

- Make sure you have a Postgres database instance running. It should have a schema that fits to the [prisma.schema file](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-apollo-server/prisma/schema.prisma). To understand this file, I recommend checking out the corresponding [Prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-schema).
- Make sure you have an S3 compatible object storage running. To start one, you can use the provided [docker-compose configuration](https://github.com/simon-lammes/lammes-assistant/blob/master/docker-compose.yaml). When you use the minio container configured in docker-compose, you just need to add a *lammes-assistant-spaces* bucket via the [web interface](http://localhost:9000/minio) and are ready to go.
- `npm install`
- This project is configured with a .env file that is **not** checked into version control for security reasons. Therefore, when you as a developer check out this project, you need to add a `.env` file inside the folder `lammes-assistant-apollo-server` and configure some variables. You can find a list of all required variables in the `Environment` interface [here](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-apollo-server/src/environment.ts).

- `npx prisma introspect` followed by `npx prisma generate` so that Prisma generates a database client for communicating with Postgres
- `npm run dev`

### Updating the database schema

We work with an SQL database that is accessed via the Prisma ORM. When you want to change the database schema you start by changing the database schema in the SQL database. Then you let Prisma introspect your changes by running:
```
npx prisma introspect
```
This should update the file `schema.prisma`. There you should make final adjustment such as mapping column names (e.g. first_name) to proper JavaScript property names (e.g. firstName). After that, you can let the Prisma CLI generate an updated Prisma client that will be used in our source code. 
```
npx prisma generate
```
