CREATE KEYSPACE IF NOT EXISTS shelf WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 1};

USE shelf;

CREATE TYPE IF NOT EXISTS shelf.descript(
    key text,
    value text
);

CREATE TYPE IF NOT EXISTS shelf.item(
    item_name text,
    item_created timestamp,
    other_props set<frozen<descript>>,
    tags set<text>,
    image_blob blob
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

CREATE TABLE IF NOT EXISTS shelf.users_by_email(
    id uuid,
    username text,
    email text,
    PRIMARY KEY (email)
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
    PRIMARY KEY (username, shelf_id)
);

CREATE TABLE IF NOT EXISTS shelf.shelves_by_username(
   username text,
   shelf_id uuid,
   shelf_created timestamp,
   shelf_type text,
   PRIMARY KEY (username, shelf_type, shelf_id)
);

CREATE TABLE IF NOT EXISTS shelf.shelf_contents_by_shelf(
   username text,
   shelf_id uuid,
   item_name text,
   item_id uuid,
   image_blob blob,
   item_created timestamp,
   tags set<text>,
   PRIMARY KEY ((username, shelf_id), item_name, item_id)
);

CREATE TABLE IF NOT EXISTS shelf.item_props_by_item(
   username text,
   item_id uuid,
   key text,
   value text,
   PRIMARY KEY ((username, item_id), key)
);

COPY shelf.users (id, username, password, email) FROM './init/users.csv' WITH HEADER = TRUE;
COPY shelf.shelves (shelf_id,name,username,date_created,date_modified,type,description,items,comments) FROM './init/shelves.csv' WITH HEADER = TRUE;
COPY shelf.shelf_contents_by_shelf (username, shelf_id, item_name, item_id, image_blob, item_created, tags) FROM './init/shelf_contents_by_shelf.csv' WITH HEADER = TRUE;
COPY shelf.shelves_by_username (username, shelf_type, shelf_id, shelf_created) FROM './init/shelves_by_username.csv' WITH HEADER = TRUE;
COPY shelf.item_props_by_item ( username, item_id, key, value) FROM './init/item_props_by_item.csv' WITH HEADER = TRUE;