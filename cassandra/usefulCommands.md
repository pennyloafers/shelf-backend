# Initialize Cassandra

docker cp init.cql cass:/inti.cql
docker cp users.csv cass:/users.csv
docker cp shelves.csv cass:/shelves.csv
docker exec -it cqlsh -f ./init.cql


# Useful commands

 - #this will copy the config file to the host.
	docker cp cass:/etc/cassandra/cassandra.yaml ./cassandra/settings

	