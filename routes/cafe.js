var express = require('express');
var router = express.Router();
var db = require('../helper/db');
var User = db.User;
var Chat = db.Chat;
const verifyToken = require('../helper/VerifyToken');
var { check, validationResult } = require('express-validator');
var fs = require('fs');
const chatsv = require('../models/chat.service');
var basicAuth = require('basic-auth-connect');


//DialogFlowからのコールバックを処理する
//ベーシック認証
router.post('/', basicAuth('userid','passcode'), function (req, res, next) {

    //console.log("req.body.session "+ req.body.session);   
    //console.log(req.body.queryResult.outputContexts[1].parameters.drink);
    //console.log(req.body.queryResult.outputContexts[1].parameters.size);
    //console.log(req.body.queryResult.outputContexts[1].parameters.delivery);

    var cafeImageFile = req.body.queryResult.outputContexts[1].parameters.drink + ".png";
    var baseStr = "data:image/png;base64,";
    var cafeImage;

    fs.readFile('./public/files/' + cafeImageFile, function (err, data) {
        if (err) throw err;
        cafeImage = baseStr.concat(new Buffer(data).toString('base64'));
        chatsv.create({
            fromAddress : FrID,
            toAddress : MyID,
            image : cafeImage,
        })
    });
    
    let responseObj={
     "fulfillmentText":'おまたせいたしました。'
    }
    return res.json(responseObj);

});

module.exports = router;