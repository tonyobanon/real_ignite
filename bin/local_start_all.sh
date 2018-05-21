#!/bin/bash

CONTAINER_NAME="real_ignite_app"
IMAGE_NAME="real_ignite_image"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$(dirname "${SCRIPT_DIR}")"

if [[ $(docker inspect --format='{{.RepoTags}}' ${IMAGE_NAME}) == "[${IMAGE_NAME}:latest]" ]]; then
    echo " ----- Web App Image Available for Use. -----"
else
    echo " ----- Web App Image Does Not Exist. Building Now. -----"
    docker build -t ${IMAGE_NAME} ${ROOT}
fi

    docker-compose -p real_ignite_ up -d

    docker run \
        --name ${CONTAINER_NAME}
        -i \
        -t \
        -p 8000:8080 \
        -v ${ROOT}:/src \
        --env-file=${ROOT}/.env \
        --network=real_ignite__main_network \
        ${IMAGE_NAME} \
        sh -c "npm install && bash"
