CREATE KEYSPACE IF NOT EXISTS shelf WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 1};

USE shelf;

CREATE TYPE IF NOT EXISTS item(
    title text,
    date_added timestamp,
    description text,
    tags set<text>
);

CREATE TYPE IF NOT EXISTS comment(
    username text,
    date_added timestamp,
    message text
);

CREATE TABLE IF NOT EXISTS users(
    id uuid,
    username text,
    password text,
    email text,
    PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS shelves(
    shelf_id uuid,
    name text,
    username text,
    date_created timestamp,
    date_modified timestamp,
    type text,
    description text,
    items set<frozen<item>>,
    comments set<frozen<comment>>,
    PRIMARY KEY(username, shelf_id)
);
