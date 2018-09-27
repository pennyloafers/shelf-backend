# Starting
To build and start the services in background mode

```bash
$ docker-compose up -d
```
For local express development

```bash
$ docker-compose start cassandra
```

You can run cqlsh or bash directly within the container.
```bash
$ docker exec -it cass cqlsh
$ docker exec -it cass bash
```
# Notes
- All ports are exposed to host machine for both services. In the future this should change.
- For API development edit files within the api directory.
- Express container must be restarted for every api update.
- Alternativly you could run the cassandra container only and connect a locally hosted express server by running node on your machine.

# Useful commands 
`[optional]`

## Look at output from containers
```bash
$ docker logs exp|cass            (exp or cass)
```      
## Starting Stoping rebuilding
```bash
$ docker-compose start [express|cassandra]
$ docker-compose stop  [express|cassandra]
$ docker-compose build 
$ docker-compose up -d    #can also be used to refresh both services
```