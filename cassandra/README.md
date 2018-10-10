# Initialize Cassandra

```bash
	docker cp init cass:./
	docker exec cass cqlsh -f /init/init.cql
```

# Useful commands

 - #this will copy the config file to the host.
```bash
	docker cp cass:/etc/cassandra/cassandra.yaml ./cassandra/settings
```
	
