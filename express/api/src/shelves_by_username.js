const express = require('express');
const cassClient = require('../services/cassandra-client');

const router = express();

router.get('/getUserShelves', getUserShelves);
router.post('/upsertShelf',upsertShelf);
router.post('/removeShelf',removeShelf);

module.exports = router;

/**
 * Retrieve user's shelves by name only
 */
function getUserShelves(req,res) {
    //console.log(req)
    //Build query: ? can be filled later
    const query = "SELECT shelf_type, shelf_id, shelf_created FROM shelf.shelves_by_username WHERE username = ?;";

    //Prepare parameters for ?'s: must be an array
    const params = [req.user];
    //const params = ['userTw'];
     
    //call client with query & params: 
    // {prepare: true} has some performance benifits for reusing the query
    // not sure if this is applicable.
    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //do something with 'result'
        let bookcase = [];
        let temp = {};

        for(let i = 0; i < result.rowLength; i++ ){
            //must convert names to app specifaction
            temp = { 
                shelfType: result.rows[i].shelf_type,
                shelfID: result.rows[i].shelf_id,
                shelfCreated: result.rows[i].shelf_created
            };
            bookcase.push(temp);
        }
        //send results with res back to caller.
        //if there are no shelves bookcase = []
        res.status(200).send({bookcase});
    })
    .catch (error => {
        console.log('error');
        console.log(error.message);
        res.status(500).send({ error: 'Server error' });
 
    })
}


/**
 * Create a new Shelf
 */

function upsertShelf(req,res){
    //validate input paramaters
    const keys = Object.keys(req.body);
    if( !keys.includes('shelfType') || !keys.includes('shelfID') || !keys.includes('shelfCreated')){
        res.status(400).send({ error: "Missing Parameters" });
    }
    
    
    
    const query =   'INSERT INTO shelf.shelves_by_username '+
                    '(username, shelf_type, shelf_id, shelf_created) '+
                    'VALUES (?,?,?,?);';
    const shelfID = req.body.shelfID ? req.body.shelfID : Uuid.random();
    const params = [
        req.user,
        req.body.shelfType,
        shelfID,
        req.body.shelfCreated 
    ];

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //if success 
        res.status(200).send({ success:true, shelfID});
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({ error: 'error' });
    })
}


/**
 * remove shelf by shelf_type and shelf_id
 * shelf_type is sufficent but shelf_id allows for shelves of the same name
 * and is required to not delete all instances of shelf_type
 */

function removeShelf(req,res){
    const keys = Object.keys(req.body);
    if( !keys.includes('shelfType') || !keys.includes('shelfID')){
        res.status(400).send({ error: "Missing Parameters" });
    }
    
    
    
    const query =   'DELETE FROM shelf.shelves_by_username '+
                    'WHERE username = ? AND shelf_type = ? AND shelf_id = ?;';
    const params = [
        req.user,
        req.body.shelfType,
        req.body.shelfID
    ];

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //check if success
        
        res.status(200).send({success: true});
        
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error:'Server error'});
    })
}

/**
 * edit shelf
 */



//scratch
/* 
cassClient.execute(query, params, { prepare: true })
.then(result => {})
.catch (error => {}) 
*/