const express = require('express');
const cassClient = require('../services/cassandra-client');
const router = express();

//add item              *
//remove item           *
//edit item             *



router.post('/getItems',getItems);

module.exports = router;

/**
 * Get all items on the shelf.
 * -name, id, image, date, tags
 */

function getItems(req,res){
    const query =   'SELECT * FROM shelf.shelf_contents_by_shelf '+
                    'WHERE username = ? AND shelf_id = ?;';
    const params = [
        req.User,
        req.body.shelfID
    ];

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //check if success
        if(true){
            let shelfContents = [];
            let temp = {};
            
            for(let i = 0; i < result.rowLength; i++ ){
                //must convert names to app specifaction
                temp = { 
                    itemName: result.rows[i].item_name,
                    itemID: result.rows[i].item_id,
                    imageBlob: result.rows[i].image_blob,
                    itemCreated: result.rows[i].item_created,
                    tags: result.rows[i].tags
                };
                shelfContents.push(temp);
            }

            res.status(200).send({shelfContents});
        } else {
            res.status(400).send({success: false});
        }
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error:'Server error'});
    })
}


/**
 * add and item
 */

function addItem(req,res){
    const query =   'INSERT INTO shelf.shelf_contents_by_shelf '+
                    '(username, shelf_id, item_name, item_id, image_blob, item_created, tags)'+
                    ' VALUES (?,?,?,?,?,?,?);';
}

/* 
cassClient.execute(query, params, { prepare: true })
.then(result => {})
.catch (error => {}) 
*/

//insert into shelf_contents_by_shelf (username,shelf_id,item_name,item_id,image_blob,item_created,tags)values ('tim',63914078-a04f-4da3-a765-c999b4d24680,'Wood Spoon',uuid(),null,toUnixTimestamp(now()),{'Caveman','priceless'});