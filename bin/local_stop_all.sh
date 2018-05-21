#!/bin/bash
CONTAINER_NAME="real_ignite_app"

# Stop and remove infrastructure containers
docker-compose stop

# Stop and remove web app container
docker ps | awk '{ print $1,$2 }' | grep ${CONTAINER_NAME} | awk '{print $1 }' | xargs -I {} docker stop {}
docker ps -a | awk '{ print $1,$2 }' | grep ${CONTAINER_NAME} | awk '{print $1 }' | xargs -I {} docker rm {}
