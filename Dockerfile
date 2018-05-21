# Use the predefined node base image for this module.
FROM node:9.11.1

# Creating base "src" directory where the source repo will reside in our container.
# Code is copied from the host machine to this "src" folder in the container as a last step.
RUN mkdir /src
WORKDIR /src

# Copy from cache unless the package.json file has changed
COPY ./package.json /src

# Install node dependencies
RUN npm install

# Copy entire file to docker
COPY . /src

VOLUME ["/src"]

# Expose server port
EXPOSE 8080

CMD ["node", "server"]