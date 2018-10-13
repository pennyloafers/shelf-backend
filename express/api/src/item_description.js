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
//insert into item_props_by_item (username, item_id , key , value ) values ('userTwo',e063e61b-b1b1-4e3c-a757-d1dbea74637f,'stats','3.0 liter engine, twin turbo, Dual manifold exhoust, 16 inch rims');