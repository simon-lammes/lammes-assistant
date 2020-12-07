FROM node:12-alpine AS builder

WORKDIR /src

# Copy package and package-lock first and install dependencies before copying the rest.
# Because these two steps rather at the start of the Dockerfile, they can usually be cached.
COPY package*.json ./

RUN npm ci

# Copy the rest. This step is purposely far at the end because for this step the cache can usually not be used.
# Consequently, all following steps cannot make use of the cache and thus this step should be as far at the end as possible.
COPY . .

RUN npm run build

# Now take the build angular application and copy it to the next stage: An nginx server hosting the generated content.
FROM node:12-alpine

# Copy the build application from stage "builder" into a directory that is hosted by nginx.
COPY --from=builder /src/dist /dist
COPY --from=builder /src/node_modules node_modules

CMD node dist/server
