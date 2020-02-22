// CafeMasterの処理
var db = require('../helper/db');
var Chat = db.Chat;
const chatsv = require('../models/chat.service');

//DialogFlowの設定
const dialogflow = require('dialogflow');
const uuid = require('uuid');
var sessionId = "";

//console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);
var fs = require("fs");
var use_readFile_json = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
const project_id = use_readFile_json.project_id;
//console.log(project_id);



exports.start = function(){
	//  最初の挨拶を登録
	if(FrName == 'CafeMaster') {
		// CafeMaster
        sessionId = uuid.v4();
        console.log('Session ID = ' + sessionId);

		chatsv.create({
            fromAddress : FrID,
            toAddress : MyID,
            message : 'いらっしゃいませ。コーヒーはいかがですか？'
		});
        // 2秒ごとに新しいメッセージを検索する
		botTimer = setInterval(function(){
		    serachNewMessages();
		},2000);
	}
};


var resentMsg ="";

async function serachNewMessages() {
	if(FrName == 'CafeMaster') {
        // CafeMasterの最後の発言を取得する
        var query = { "fromAddress": FrID ,"toAddress": MyID};
        
        Chat.find(query,{},{sort:{timeStamp: -1},limit:1}, function(err, data){
            if(err){
                console.log("serachNewMessages err",err);
            }
            if(data.length > 0){
                // CafeMasterの最後の発言以降の自分の発言を取得する.
                var lastMessageTime = data[0].timeStamp;
                query = { "fromAddress": MyID ,"toAddress": FrID,"timeStamp": {$gt : lastMessageTime}};
                Chat.find(query,{},{sort:{timeStamp: -1},limit:1}, async function(err, data){
                    if(err){
                        console.log("serachNewMessages err",err);
                    }
                    if(data.length > 0){
                        // 応答メッセージの設定
                        var resMessage="";
                        
                        const {struct} = require('pb-util');
                        // Create a new session
                        const sessionClient = new dialogflow.SessionsClient();
                        const sessionPath = sessionClient.sessionPath(project_id, sessionId);
                        // The text query request.
                        const request = {
                            session: sessionPath,
                            queryInput: {
                                text: {
                                    // The query to send to the dialogflow agent
                                    text: data[0].message,
                                    // The language used by the client (en-US)
                                    languageCode: 'ja-JP', //'ja'
                                },
                            },
                        };


                        //DialogFlowへ会話を送って返事を待つ
                        const responses = await sessionClient.detectIntent(request);
                        const result = responses[0].queryResult;
                        
                        const parameters = JSON.stringify(struct.decode(result.parameters));
                        var obj = JSON.parse(parameters);	 
                        console.log(`  Query: ${result.queryText}`);
                        console.log(`  Response: ${result.fulfillmentText}`);
                        resMessage = result.fulfillmentText;

                        // 退避メッセージと異なってれば発話する
                        if ( resMessage !== "" && resentMsg != data[0].timeStamp + data[0].message) {
                            resentMsg = data[0].timeStamp + data[0].message;
                    		chatsv.create({
                                fromAddress : FrID,
                                toAddress : MyID,
                                message : resMessage
                    		});
                        }
                    }
                });
            }
        });
    }
}




