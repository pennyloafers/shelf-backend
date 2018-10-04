# Initialize Cassandra

```bash
	docker cp /init cass:/init
	docker exec cqlsh -f /init/init.cql
```

# Useful commands

 - #this will copy the config file to the host.
	docker cp cass:/etc/cassandra/cassandra.yaml ./cassandra/settings

	
