CREATE KEYSPACE IF NOT EXISTS shelf WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 1};

USE shelf;

CREATE TYPE IF NOT EXISTS shelf.descript(
    title text,
    body text
);

CREATE TYPE IF NOT EXISTS shelf.item(
    title text,
    date_added timestamp,
    description frozen<descript>,
    tags set<text>
);

CREATE TYPE IF NOT EXISTS shelf.comment(
    username text,
    date_added timestamp,
    message text
);

CREATE TABLE IF NOT EXISTS shelf.users(
    id uuid,
    username text,
    password text,
    email text,
    PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS shelf.shelves(
    shelf_id uuid,
    name text,
    username text,
    date_created timestamp,
    date_modified timestamp,
    type text,
    description frozen<descript>,
    items set<frozen<item>>,
    comments set<frozen<comment>>,
    PRIMARY KEY(username, shelf_id)
);

COPY shelf.users (id, username, password, email) FROM './users.csv' WITH HEADER = TRUE;
COPY shelf.shelves (shelf_id,name,username,date_created,date_modified,type,description,items,comments) FROM './shelves.csv' WITH HEADER = TRUE;