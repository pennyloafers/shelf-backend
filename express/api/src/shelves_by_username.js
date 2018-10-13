const express = require('express');
const cassClient = require('../services/cassandra-client');

const router = express();

router.post('/getUserShelves', getUserShelves);
router.post('/newShelf',newShelf);
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
    //const params = [req.User];
    const params = ['ti'];
     
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

function newShelf(req,res){
    const query =   'INSERT INTO shelf.shelves_by_username '+
                    '(username, shelf_type, shelf_id, shelf_created) '+
                    'VALUES (?,?,?,?);';
    const params = [
        req.User,
        req.body.shelfType,
        req.body.shelfID,
        req.body.shelfCreated 
    ];

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //if success 
        if(true){
            res.status(200).send({success: true});
        } else {
            res.status(400).send({success: false});
        }
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
    const query =   'DELETE FROM shelf.shelves_by_username '+
                    'WHERE username = ? AND shelf_type = ? AND shelf_id = ?;';
    const params = [
        req.User,
        req.body.shelfType,
        req.body.shelfID
    ];

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //check if success
        if(true){
            res.status(200).send({success: true});
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
 * edit shelf
 */



//scratch
/* 
cassClient.execute(query, params, { prepare: true })
.then(result => {})
.catch (error => {}) 
*/