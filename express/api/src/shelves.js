const express = require('express');
const cassClient = require('../services/cassandra-client');

const router = express();

router.get('/getUserShelves', getUserShelves);
//get user shelf
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
        res.send({bookcase});
        
    })
    .catch (error => {
        console.log('error');
        console.log(error.message);
        res.send({ error: 'error' });
 
    })
}


//new shelf             *
//remove shelf          *
//edit shelf            *
//add item              *
//remove item           *
//edit item             *
//add item description       *
//remove item description    *
//add comment           *
//remove comment        *
//edit comment          *

module.exports = router;