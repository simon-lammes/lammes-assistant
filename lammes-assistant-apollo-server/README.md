## Developer Guide

### Updating the database schema

We work with an SQL database that is accessed via the Prisma ORM. When you want to change the database schema you start by changing the database schema in the SQL database. Then you let Prisma introspect your changes by running:
```
npx prisma introspect
```
This should update the file `schema.prisma`. There you should make final adjustment such as mapping column names (e.g first_name) to proper JavaScript property names (e.g. firstName). After that you can let the Prisma CLI generate an updated Prisma client that will be used in our source code. 
```
npx prisma generate
```
