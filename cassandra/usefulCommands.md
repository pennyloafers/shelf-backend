# Initialize Cassandra

docker cp init.cql cass:/inti.cql
docker exec -it cqlsh -f ./init.cql


# Useful commands

 - #this will copy the config file to the host.
	docker cp cass:/etc/cassandra/cassandra.yaml ./cassandra/settings

	