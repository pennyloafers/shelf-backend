# Starting
To build and start the services in background mode use the `docker-compose.yml` in root directory.

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
- should ONLY use the `docker-compose.yml` file in root directory.
- All ports are exposed to host machine for both services. In the future this should change.
- For API development edit files within the api directory.
- Express container must be restarted for every api update.
- Alternativly you could run the cassandra container only and connect a locally hosted express server by running node on your machine.
- Both containers can be address as exp|cass for most docker commands. Otherwise as express|cassandra.

### Express
- Express container shares a directory with the host at the `/api` folder.
- The service connects to Cassandra service in the Docker at `172.20.0.3:9042`, or from the `localhost:9042`.
- Exposes port `8888`.
### Cassandra
- Cassandra container exposes several ports (`7000`,`7001`,`7199`,`9042`,`9160`) on `172.20.0.3` internally, and locally.   
- Currently shares a volume managed by Docker for persistant state. This could be changed to edit data and config files stored on container directly.

# Useful commands 
### Look at output from containers
```bash
$ docker logs exp|cass            (exp or cass)
```      
### Starting Stoping rebuilding
`[optional]`
```bash
$ docker-compose start [express|cassandra]
$ docker-compose stop  [express|cassandra]
$ docker-compose build 
$ docker-compose up -d    #can also be used to refresh both services
```
