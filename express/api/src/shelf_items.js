const express = require('express');
const cassClient = require('../services/cassandra-client');
const Uuid = require('cassandra-driver').types.Uuid;
const router = express();

//add item              *
//remove item           *
//edit item             *



router.post('/getItems',getItems);
router.post('/upsertItem',upsertItem);
router.post('/upsertImageBlob',upsertImageBlob);
router.post('/removeItem',removeItem);


module.exports = router;

/**
 * Get all items on the shelf.
 * -name, id, image, date, tags
 * -if shelf is empty will return empty array
 */

function getItems(req,res){
    const keys = Object.keys(req.body);
    if( !keys.includes('shelfID')){
        res.status(400).send({ error: "Missing Parameters" });
    }

    const query =   'SELECT * FROM shelf.shelf_contents_by_shelf '+
                    'WHERE username = ? AND shelf_id = ?;';
    
    const params = [
        req.user,
        req.body.shelfID
    ];
    // const params = [
    //     "tim",
    //     "63914078-a04f-4da3-a765-c999b4d24680"
    // ]

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
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
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error:'Server error'});
    })
}


/**
 * upsert an item
 * -insert will update the values if the primary key matches
 * -must provide all content, otherwise data will be lost.
 */

function upsertItem(req,res){
    const keys = Object.keys(req.body);
    if( !keys.includes('shelfID') || !keys.includes('itemName') || !keys.includes('itemID') || !keys.includes('itemCreated') || !keys.includes('tags')){
        res.status(400).send({ error: "Missing Parameters" });
    }
    const query =   'INSERT INTO shelf.shelf_contents_by_shelf '+
                    '(username, shelf_id, item_name, item_id, item_created, tags)'+
                    ' VALUES (?,?,?,?,?,?);';
    const itemID = req.body.itemID ? req.body.itemID : Uuid.random();
    const params = [
        req.user,
        req.body.shelfID,
        req.body.itemName,
        itemID,
        req.body.itemCreated,
        req.body.tags
    ];
    // const params = [
    //     'tim',
    //     '63914078-a04f-4da3-a765-c999b4d24680',
    //     'test1',
    //     'db02a81d-a844-4f59-95fc-5444a016028e',
    //     null,
    //     Date(),
    //     ['tag1','tag2']
    // ];
    cassClient.execute(query,params,{prepare:true})
    .then(result => {
        res.status(200).send({success:true, itemID});
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error:"Server error"});
    }) 
}

/**
 * upsert an item
 * -insert will update the values if the primary key matches
 * -must provide all content, otherwise data will be lost.
 */

function upsertImageBlob(req,res){
    const keys = Object.keys(req.body);
    if( !keys.includes('shelfID') || !keys.includes('itemID') ||  !keys.includes('imageBlob')){
        res.status(400).send({ error: "Missing Parameters" });
    }
    const query =   'INSERT INTO shelf.shelf_contents_by_shelf '+
                    '(username, shelf_id, item_id, image_blob)'+
                    ' VALUES (?,?,?,?,?,?);';
    const params = [
        req.user,
        req.body.shelfID,
        req.body.itemID,
        req.body.imageBlob
    ];
   
    cassClient.execute(query,params,{prepare:true})
    .then(result => {
        res.status(200).send({success: true});
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error:"Server error"});
    }) 
}


/**
 * Remove and item 
 * based on username, shelfID, itemName, itemID 
 */
function removeItem(req,res){
    const keys = Object.keys(req.body);
    if( !keys.includes('shelfID') || !keys.includes('itemName') || !keys.includes('itemID')){
        res.status(400).send({ error: "Missing Parameters" });
    }
    const query = 'DELETE FROM shelf.shelf_contents_by_shelf WHERE username = ? AND shelf_id = ? AND item_name = ? AND item_id = ?';
    const params = [
        req.user,
        req.body.shelfID,
        req.body.itemName,
        req.body.itemID
    ]
    // const params = [
    //     'tim',
    //     '63914078-a04f-4da3-a765-c999b4d24680',
    //     'test',
    //     '516771cb-82b6-442c-a3a6-6ab1c207a3cc'
    // ]
    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        res.status(200).send({ success: true });
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error: 'Server error'});
    }) 
}



/* 
cassClient.execute(query, params, { prepare: true })
.then(result => {})
.catch (error => {}) 
*/

//insert into shelf_contents_by_shelf (username,shelf_id,item_name,item_id,image_blob,item_created,tags)values ('tim',63914078-a04f-4da3-a765-c999b4d24680,'Wood Spoon',uuid(),null,toUnixTimestamp(now()),{'Caveman','priceless'});