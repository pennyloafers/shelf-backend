const express = require('express');
const cassClient = require('../services/cassandra-client');
const router = express();

//add item description       *
//remove item description    *
//edit item description      *



router.post('/removeShelf',removeShelf);
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
            res.send({success: true});
        } else {
            res.send({success: false});
        }
    })
    .catch (error => {
        console.log(error.message);
        res.send({error:'error'});
    })
}

module.exports = router;

/* 
cassClient.execute(query, params, { prepare: true })
.then(result => {})
.catch (error => {}) 
*/