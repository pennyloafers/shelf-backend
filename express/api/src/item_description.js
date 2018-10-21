const express = require('express');
const cassClient = require('../services/cassandra-client');
const router = express();

router.post('/getItemDescript',getItemDescript);
router.post('/updateItemDescript',updateItemDescript);

module.exports = router;

/**
 * get item descriptions
 * will return an array
 */

function getItemDescript(req,res){
    const query =   'SELECT descriptions FROM shelf.item_props_by_item '+
                    'WHERE username = ? AND item_id = ?;';
    const params = [
        req.user,
        req.body.itemID,
    ];

    // const params = [
    //     'tim',
    //     '706cdd47-955f-417b-bf60-8547a6f51813'
    // ]

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        //check if success
        
        console.log(result.rows[0]);
        if(result.rows[0]){
            res.status(200).send({otherProps:result.rows[0].descriptions});
        }else{
            res.status(200).send({otherProps:[]});
        }
    })
    .catch (error => {
        console.log(error.message);
        res.send({error:'error'});
    })
}

/**
 * update item description
 * this will update all descriptions.
 * as an upsert.
 */
function updateItemDescript(req,res){
    const query = 'INSERT INTO shelf.item_props_by_item (username, item_id, descriptions) VALUES (?,?,?);'
    const params = [
        req.user,
        req.body.itemID,
        req.body.otherProps
    ];

    cassClient.execute(query, params, { prepare: true })
    .then(result => {
        res.status(200).send({message:'Success'});
    })
    .catch (error => {
        console.log(error.message);
        res.status(500).send({error:'Server error'});
    }) 
}

/* 
cassClient.execute(query, params, { prepare: true })
.then(result => {})
.catch (error => {}) 
*/
//insert into item_props_by_item (username, item_id , key , value ) values ('userTwo',e063e61b-b1b1-4e3c-a757-d1dbea74637f,'stats','3.0 liter engine, twin turbo, Dual manifold exhoust, 16 inch rims');