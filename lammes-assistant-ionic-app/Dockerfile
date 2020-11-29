# Build the application in one stage. We use multistage-builds as describe here: https://docs.docker.com/develop/develop-images/multistage-build/
FROM node:alpine AS builder
RUN apk update && apk add --no-cache make git
RUN npm install -g @ionic/cli

WORKDIR /src

# Copy package and package-lock first and install dependencies before copying the rest.
# Because these two steps rather at the start of the Dockerfile, they can usually be cached.
COPY package*.json ./

# CI installs the *exact* dependencies. This makes sure that images built from the same code base
# use the exact same dependencies. This reduces the risk of newly created images having bugs due to
# the release of newer dependencies.
RUN npm ci

# Copy the everything. This step is purposely far at the end because for this step the cache can usually not be used.
# Consequently, all following steps cannot make use of the cache and thus this step should be as far at the end as possible.
COPY . .

RUN ionic build --prod

# Now take the build angular application and copy it to the next stage: A simple alpine image used by digitaloceans web plattform for hosting.
FROM alpine

# Copy the build application from stage "builder" into a directory that is hosted by digitalocean.
COPY --from=builder src/www/ /app/
WORKDIR /app
