console.log("background is running");

function include(url) {
    var script = document.createElement('script');
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}
include("myscript/base64decode.js");

var current_token;
//*****************************************************************************************************
var GET_request = function (method, url, _async) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, _async);
    xhr.setRequestHeader('Authorization', 'Bearer ' + current_token);
    xhr.send();
    return (xhr.responseText);//xhr.responseText хранит в виде строки данные полученные от сервера. Чтобы обрабатывать эти данные нужен метод JSON.parse., теперь можно обращаться к каждому полю json файла
}
//*****************************************************************************************************
function POST_request(method, url, _async, params) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, _async);
    xhr.setRequestHeader('Authorization', 'Bearer ' + current_token);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(params));
    return (xhr.responseText);
}
//*****************************************************************************************************
function GetMessages(arr)//возвращает массив сообщений 
{
    let messages = [];
    for (i = 0; i < arr.history.length; i++) {
        id = arr.history[i].messagesAdded[0].message.id;
        let tmp = JSON.parse(GET_request("GET", "https://www.googleapis.com/gmail/v1/users/me/messages/" + id, false));
        messages.push(tmp);
    }
    return messages;
}
//*****************************************************************************************************
function GetSender(message)//функция для получения отправителя
{
    let maillers = [];
    let reg = /\<([^>]+)\>/;
    for (i = 0; i < message.length; i++) { // Слыш Макс ебать, находим отправителя
        for (j = 0; j < message[i].payload.headers.length; j++) {
            if (message[i].payload.headers[j].name === 'Sender' || message[i].payload.headers[j].name === 'From')
                maillers.push(message[i].payload.headers[j].value)
        }
    }
    for (i = 0; i < maillers.length; i++)
        maillers[i] = reg.exec(maillers[i])[1];
    return maillers;
}
//*****************************************************************************************************
var InSpamBySender=function(message,callback)// Отправляем массив сообщений в спам
{
    params = {
        "addLabelIds": [
            "SPAM"
        ] 
    };
    let sp, all;
    let cur_mes=0;
    senders = GetSender(message);
    chrome.storage.sync.get(function (data) {
        console.log(data);
        sp = data.spamNum;
        for (i = 0; i < senders.length; i++) {
            for (j in data) {
                if (j === senders[i]) {
                    POST_request("POST", "https://www.googleapis.com/gmail/v1/users/me/messages/" + (message[i].id) + "/modify", false, params);
                    sp++;
                    cur_mes++;
                    console.log(sp);
                }
            }
        }
        all = data.usedMesNum + senders.length;
        chrome.storage.sync.set({ 'usedMesNum': all }, function () {});
        chrome.storage.sync.set({ 'spamNum': sp }, function () {});
        chrome.runtime.sendMessage("changeStats");
        if(typeof(callback)=="function"&&cur_mes==0)
        {
            console.log("попали в if для callback");
            callback(message);
        }
    });

}

function InSpamByServer(message) {
    console.log("попали в callback функцию");
    params = {
        "addLabelIds": [
            "SPAM"
        ]
    };
    let body = {};
    let sp;
    chrome.storage.sync.get(function (data) {
        sp = data.spamNum;
        for (i = 0; i < message.length; i++) {
            let text_message = message[i].payload.parts[0].body.data
            body[message[i].id] = base64_decode(text_message)
        }
        body = JSON.stringify(body);
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "http://127.0.0.1:5000/processjson", false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(body);
        xhr = JSON.parse(xhr.responseText);
        for (i in xhr) {
            if (xhr[i] == 1) {
                POST_request("POST", "https://www.googleapis.com/gmail/v1/users/me/messages/" + i + "/modify", false, params);
                sp++;
            }
        }
        //all = data.usedMesNum + senders.length;
        //chrome.storage.sync.set({ 'usedMesNum': all }, function (){});
        chrome.storage.sync.set({ 'spamNum': sp }, function (){});
        chrome.runtime.sendMessage("changeStats");
    });
}

//*****************************************************************************************************
function listenSwitch() {
    chrome.runtime.onMessage.addListener(function (ms) {
        if (ms === "Switch off") {
            clearInterval(intervalId);
            console.clear();
            throw console.error("Скрипт был приостановлен");
        }
        else if (ms === "Switch on")
            location.reload();
    });
    chrome.storage.sync.get('flag1', function (result) {
        if (result.flag1 == "false") {
            clearInterval(intervalId);
            console.clear();
            throw console.error("Скрипт был приостановлен");
        }
    });
}
//*****************************************************************************************************
listenSwitch();
//*****************************************************************************************************
var intervalId = setInterval(function () {
    chrome.identity.getAuthToken({ interactive: false }, function (token) {
        current_token = token;
        if (current_token) {
            chrome.storage.sync.get("index", function (data) {
                if (data.index == 1) {

                }
                else {
                    let profile1 = JSON.parse(GET_request("GET", "https://www.googleapis.com/gmail/v1/users/me/profile", false));
                    chrome.storage.sync.set({ 'startHistoryId': profile1.historyId }, function () {
                        console.log("id истории сохранен в хранилище в первый раз");
                    });
                    chrome.storage.sync.set({ 'index': 1 }, function () { });
                }
            });
            let ms;
            let historyList;
            let profile = JSON.parse(GET_request("GET", " https://www.googleapis.com/gmail/v1/users/me/profile", false));
            let historyId = profile.historyId;
            chrome.storage.sync.get("startHistoryId", function (data) {
                historyList = JSON.parse(GET_request("GET", "https://www.googleapis.com/gmail/v1/users/me/history?historyTypes=messageAdded&labelId=UNREAD&startHistoryId=" + data.startHistoryId, false));
                ms = GetMessages(historyList);
                InSpamBySender(ms,InSpamByServer);
            });
            chrome.storage.sync.set({ 'startHistoryId': historyId }, function () {});
        }
    });
}, 10000);
//*****************************************************************************************************