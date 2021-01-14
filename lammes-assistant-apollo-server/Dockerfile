# Build the the application in a node.js environment
FROM node:12 AS builder

WORKDIR /src

# Copy package and package-lock first and install dependencies before copying the rest.
# Because these two steps rather at the start of the Dockerfile, they can usually be cached.
COPY package*.json ./

RUN npm ci

# Copy the rest. This step is purposely far at the end because for this step the cache can usually not be used.
# Consequently, all following steps cannot make use of the cache and thus this step should be as far at the end as possible.
COPY . .

RUN npm run build

# Now take the built application and run it inside the node.js runtime.
FROM node:12

COPY --from=builder /src/dist /dist
COPY --from=builder /src/node_modules node_modules

CMD node dist/server
