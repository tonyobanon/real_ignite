
-------     Overview    -----------

This folder contains scripts that are intended to be simplify the process of starting the application
locally. It contains the following scripts:


1. local_start_all.sh: 

This script is typically run on the developer's local machine. First, it builds the image (if necessary),
then starts the infrastructure containers as outlined in docker-compose.yml. Finally it runs the app's docker 
container. Also we use the .env file in the root directory, so developers should update this file with
their relevant API keys before running the script.


2. local_stop_all.sh: 

This script is typically run on the developer's local machine. It stops the infrastructure containers
as outlined in docker-compose.yml. Then it stops the app's docker container. The images are not deleted
and maintained for future use.
