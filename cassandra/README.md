# Initialize Cassandra
- must be in local directory
```bash
	
	docker cp init cass:./
	docker exec cass cqlsh -f /init/init.cql
```

# Useful commands

 - this will copy the config file to the host.
 - not currently utilizing this file. 10/10/18
```bash
	docker cp cass:/etc/cassandra/cassandra.yaml ./cassandra/settings
```
	
