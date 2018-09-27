# To build and start the services in background mode

        docker-compose up -d

# You can run cqlsh directly within the container.

        docker exec -it cass cqlsh

# All ports are exposed to host machine for both services.
# In the future we should only connect with express.

# For API development edit files within the api directory.
# Express container must be restarted for every api update.

######## Useful commands ########### 
# [optional]

# look at out put from containers
        docker logs exp|cass            (exp or cass)
        
# Starting Stoping rebuilding

        docker-compose start [exp|cass]
        docker-compose stop  [exp|cass]
        docker-compose build 
        docker-compose up -d    #can also be used to refresh both services
