## Developer Guide

### Local Development

- `npm install`
- Make sure you have a running (Postgres) database instance running. It should have a schema that fits to the [prisma.schema file](https://github.com/simon-lammes/lammes-assistant/blob/master/lammes-assistant-apollo-server/prisma/schema.prisma). To understand this file, I recommend checking out the corresponding [Prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-schema). If you have access to it (with credentials), you can use the production database hosted on DigitalOcean.
- Add a `.env` file to the project with the following lines. Replace the placeholders identified by '<>' characters. For more information on the `DATABASE_URL` environment variable visit [this link](https://www.prisma.io/docs/concepts/components/prisma-schema).

```
DATABASE_URL=postgresql://<username>:<password>@<url>:<port>/<database_name>?schema=public
SECRET=<any_secret_string_doesnt_really_matter_for_local_deployment>
```

- `npx prisma introspect` followed by `npx prisma generate` so that Prisma generates a database client for communicating with Postgres
- `npm run dev`

### Updating the database schema

We work with an SQL database that is accessed via the Prisma ORM. When you want to change the database schema you start by changing the database schema in the SQL database. Then you let Prisma introspect your changes by running:
```
npx prisma introspect
```
This should update the file `schema.prisma`. There you should make final adjustment such as mapping column names (e.g first_name) to proper JavaScript property names (e.g. firstName). After that you can let the Prisma CLI generate an updated Prisma client that will be used in our source code. 
```
npx prisma generate
```
