#!/bin/bash

# Uncomment the lines of the commands you wish to run

# Requires package jq to read secrets.json
# Install jq package if not installed
if [ $(dpkg-query -W -f='${Status}' jq 2>/dev/null | grep -c "ok installed") -eq 0 ];
then
	echo "Installing jq..."
	apt-get install -y jq
fi

# Copy necessary files to container
docker cp ./settings/cassandra.yaml cass:/etc/cassandra/
docker cp ./init cass:/

# Restart the docker images
#docker-compose stop cassandra
#docker-compose stop express
#docker-compose up -d

# Look up passwords
ROOT=$(jq -r '.cassRoot' "../express/api/secret.json")
USER=$(jq -r '.cassPass' "../express/api/secret.json")

# Change root cassandra password
#docker exec cass cqlsh -u cassandra -p cassandra -e "ALTER USER cassandra WITH PASSWORD '$ROOT'"

# Initialize tables
docker exec cass cqlsh -u cassandra -p $ROOT -f /init/init.cql

# Initialize Roles
#docker exec cass cqlsh -u cassandra -p $ROOT -e "CREATE ROLE IF NOT EXISTS shelf_user WITH PASSWORD = '$USER' AND LOGIN = true"
#docker exec cass cqlsh -u cassandra -p $ROOT -e "GRANT SELECT ON KEYSPACE shelf TO shelf_user"
#docker exec cass cqlsh -u cassandra -p $ROOT -e "GRANT MODIFY ON KEYSPACE shelf TO shelf_user"