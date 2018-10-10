const express = require('express');
const cassClient = require('./services/cassandra-client');

const router = express();

router.post('/getUserShelves', getUserShelves);
//get user shelf
function getUserShelves(req,res) {
    console.log(req)
    //Build query: ? can be filled later
    let query = "SELECT * FROM shelves WHERE username = ?";

    //Prepare parameters for ?'s: must be an array
    const params = [req.user];
 
    //call client with query & params: {prepare: true}
    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        console.log(result);
        //do something with 'result' 
        //send results with res back to caller.
        res.send({ /*data*/ });
 
    })
    .catch (error => {
        console.log(error.message);
        res.send({ /*error*/ });
 
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