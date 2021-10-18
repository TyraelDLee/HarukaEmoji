/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
var NOTIFICATION_PUSH;
var checkin;
var CHECKIN_ON;
var IMAGE_NOTIFICATION;

var UUID = -1;
var SESSDATA = -1;
var JCT = -1;
var P_UID = UUID;
var P_SESS = SESSDATA;
var FOLLOWING_LIST = new FollowingMemberList();
var FOLLOWING_LIST_TEMP = new FollowingMemberList();
var winIDList = new WindowIDList();
var p = 0;

// https://api.bilibili.com/x/vip/privilege/receive
// exchange B coin api.
// form contain: type: 1 === B coin
//               | type: 2 === shop
//               & csrf
// request method: post
// header: cookie
// form type is not web form

chrome.windows.getAll(function (wins){for (let i = 0; i < wins.length; i++) winIDList.push(wins[i].id);});
chrome.windows.onCreated.addListener(function (win){winIDList.push(win.id);});
chrome.windows.onRemoved.addListener(function (wID){winIDList.remove(wID);});
chrome.windows.onFocusChanged.addListener(function (wID){if(wID!==-1) winIDList.push(wID);});
chrome.runtime.onInstalled.addListener(function (obj){
    // init setting
    chrome.storage.sync.set({"notification": true}, function(){NOTIFICATION_PUSH = true;});
    chrome.storage.sync.set({"medal": true}, function(){});
    chrome.storage.sync.set({"checkIn": true}, function(){CHECKIN_ON = true;});
    chrome.storage.sync.set({"imageNotice": false}, function(){IMAGE_NOTIFICATION = false;});
    chrome.tabs.create({url: "./readme.html"});
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
        if(key === "notification") NOTIFICATION_PUSH = newValue;
        if(key === "checkIn") CHECKIN_ON = newValue;
        if(key === "imageNotice")IMAGE_NOTIFICATION = newValue;
    }
});

function getFollowingList() {
    if(UUID !== -1 && SESSDATA !== -1){
        p++;
        let listLength = 0;
        $.ajax({
            url: "https://api.bilibili.com/x/relation/followings?vmid=" + UUID + "&pn=" + p,
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                if(typeof json["data"]!=="undefined" && json["data"].length !== 0) {
                    var data = json["data"]["list"];
                    listLength = data.length;
                    for (let i = 0; i < data.length; i++) {
                        let member = new FollowingMember(data[i]["mid"], data[i]["uname"]);
                        FOLLOWING_LIST.push(member);
                        FOLLOWING_LIST_TEMP.push(member);
                    }
                    if (listLength === 0 && FOLLOWING_LIST.length() !== 0) {
                        // all elements enquired.
                        p = 0;
                        FOLLOWING_LIST.update(FOLLOWING_LIST_TEMP);
                        FOLLOWING_LIST_TEMP.clearAll();
                        console.log("Load following list complete. " + FOLLOWING_LIST.length() + " followings found.");
                        queryLivingRoom();
                    }
                    if (listLength !== 0) getFollowingList();
                }
            },
            error: function (msg){errorHandler(msg);}
        });
    }
}

function queryLivingRoom() {
    $.ajax({
        url: "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids",
        type: "POST",
        data: {"uids": FOLLOWING_LIST.getUIDList()},
        dataType: "json",
        json: "callback",
        success: function (json) {
            if (json["code"] === 0) {
                let ON_AIR_LIST = new FollowingMemberList()
                let data = json["data"];
                for (let i = 0; i < FOLLOWING_LIST.getUIDList().length; i++) {
                    if (data[FOLLOWING_LIST.getUIDList()[i] + ""] !== undefined) {
                        if (data[FOLLOWING_LIST.getUIDList()[i] + ""].live_status === 1) {
                            let member = new FollowingMember(data[FOLLOWING_LIST.getUIDList()[i] + ""]["uid"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["uname"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["face"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["cover_from_user"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["keyframe"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["room_id"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["title"]);
                            member.ONAIR = true;
                            member.TYPE = data[FOLLOWING_LIST.getUIDList()[i] + ""]["broadcast_type"] === 1 ? 1 : 0;
                            ON_AIR_LIST.push(member);
                        }
                    }
                }
                if (ON_AIR_LIST.list.length > 0) updateList(ON_AIR_LIST);
            }
        },
        error: function (msg) {errorHandler(msg);}
    });
}

function updateList(ON_AIR_LIST){
    if(FOLLOWING_LIST.length() > 0){
        for (let i = 0; i < ON_AIR_LIST.length(); i++) {
            ON_AIR_LIST.updateStatus(i, FOLLOWING_LIST.get(FOLLOWING_LIST.indexOf(ON_AIR_LIST.get(i))).PUSHED);
            FOLLOWING_LIST.updateElementOnAirStatus(ON_AIR_LIST.get(i), true);
        }
        for (let i = 0; i < FOLLOWING_LIST.length(); i++) {
            if(FOLLOWING_LIST.get(i).ONAIR){
                if(ON_AIR_LIST.indexOf(FOLLOWING_LIST.get(i))===-1){
                    FOLLOWING_LIST.get(i).COVER = undefined;
                    FOLLOWING_LIST.get(i).FACE = undefined;
                    FOLLOWING_LIST.get(i).KEYFRAME = undefined;
                    FOLLOWING_LIST.get(i).ROOM_URL = undefined;
                    FOLLOWING_LIST.get(i).TITLE = undefined;
                    FOLLOWING_LIST.updateStatus(i, false);
                    FOLLOWING_LIST.updateElementOnAirStatus(FOLLOWING_LIST.get(i),false);
                }else{
                    if (!FOLLOWING_LIST.get(i).PUSHED){
                        FOLLOWING_LIST.updateStatus(i, true);
                        console.log(FOLLOWING_LIST.get(i).TITLE + " " + FOLLOWING_LIST.get(i).NAME+" "+new Date());
                        if(NOTIFICATION_PUSH)
                            pushNotificationChrome(FOLLOWING_LIST.get(i).TITLE,
                                FOLLOWING_LIST.get(i).NAME,
                                FOLLOWING_LIST.get(i).ROOM_URL,
                                FOLLOWING_LIST.get(i).COVER.length===0?FOLLOWING_LIST.get(i).FACE:FOLLOWING_LIST.get(i).COVER,
                                FOLLOWING_LIST.get(i).TYPE,
                                FOLLOWING_LIST.get(i).FACE);
                    }
                }
            }
        }
    }
    setTimeout(getFollowingList, 10000);
}

function pushNotification(roomTitle, liverName, roomUrl, cover, type) {
    var notification = new Notification(roomTitle, {
        icon: cover,
        body: liverName + " 开播啦!\r\n是"+(type===0?"正常的":"手机")+"直播呦！",
    });
    notification.onclick = function (){
        chrome.tabs.create({url: "https://live.bilibili.com/"+roomUrl});
        notification.close();
    }
}

function pushNotificationChrome(roomTitle, liverName, roomUrl, cover, type, face){
    let uid = Math.random();
    if(IMAGE_NOTIFICATION){
        chrome.notifications.create(uid+":"+roomUrl, {
                type: "image",
                iconUrl: face,
                title: roomTitle,
                message: liverName + " 开播啦!\r\n是"+(type===0?"正常的":"手机")+"直播呦！",
                imageUrl: cover
            }, function (id) {notificationClickHandler(id);}
        );
    }else{
        chrome.notifications.create(uid+":"+roomUrl, {
                type: "basic",
                iconUrl: cover,
                title: roomTitle,
                message: liverName + " 开播啦!\r\n是"+(type===0?"正常的":"手机")+"直播呦！"
            }, function (id) {notificationClickHandler(id);}
        );
    }
}

setTimeout(loadSetting, 100);
setTimeout(reloadCookies,200);
setInterval(reloadCookies, 5000);

function scheduleCheckIn(){
    checkIn();
    checkin = setInterval(checkIn, 43200000);
}

function reloadCookies() {
    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'DedeUserID'},
        function (uid) {
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'SESSDATA'},
                function (SD) {
                    (uid === null) ? UUID = -1 : UUID = uid.value;
                    (SD === null) ? SESSDATA = -1 : SESSDATA = SD.value;
                    if ((UUID === -1 || SESSDATA === -1) && UUID !== P_UID && SESSDATA !== P_SESS) {
                        // if not log in then stop update liver stream info.
                        console.log("Session info does not exist, liver stream info listener cleared.");
                        clearInterval(checkin);
                    }
                    if (UUID !== -1 && SESSDATA !== -1 && UUID !== P_UID && SESSDATA !== P_SESS) {
                        // log in info changed then load following list and start update liver stream info every 3 min.
                        console.log("Session info got.");
                        FOLLOWING_LIST.clearAll(); // initial following list.
                        getFollowingList();
                        scheduleCheckIn();
                        // exchangeVIPCoin();
                    }
                    P_UID = UUID;P_SESS = SESSDATA;
                });
        });
    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
        function (jct) {(jct === null)?JCT=-1:JCT = jct.value;});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        if(request.msg === "get_JCT"){
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
                function (jct) {
                    (jct === null) ? JCT = -1 : JCT = jct.value;
                    sendResponse({res:JCT});
                });
        }
        if(request.msg === "get_UUID") {sendResponse({res:UUID});}
        if(request.msg.includes("MID")){
            console.log(MADEL_LIST.get(request.msg.split("?")[1]))
            sendResponse({res:MADEL_LIST.get(request.msg.split("?")[1])});
        }
        return true;
    }
);

function checkIn(){
    if(CHECKIN_ON){
        $.ajax({
            url: "https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign",
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                console.log("签到成功 "+new Date().toUTCString())
            },
            error: function (msg){
                console.log("ERROR found");
                setTimeout(checkIn, 10000);
            }
        });
    }
}

function errorHandler(msg){
    console.log("ERROR found: "+msg.toString()+" "+new Date());
    p=0;
    (typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)?setTimeout(getFollowingList, 900000):setTimeout(getFollowingList,20000);
}

function notificationClickHandler(id){
    chrome.notifications.onClicked.addListener(function (nid) {
        if (nid === id) {
            chrome.windows.getAll(function (wins){
                if(wins.length>0){
                    // why google did not fix this bug over 6 years? WTF
                    // chrome.windows.getLastFocused(function (Lwin){
                    //     chrome.windows.update(Lwin.id, {focused: true});
                    //     chrome.tabs.create({url: "https://live.bilibili.com/"+nid.split(":")[1]});
                    // });
                    chrome.windows.update(winIDList.getCurrent(), {focused: true});
                    chrome.tabs.create({url: "https://live.bilibili.com/"+nid.split(":")[1]});
                }else
                    chrome.windows.create({url: "https://live.bilibili.com/"+nid.split(":")[1]});
            });
            chrome.notifications.clear(id);
        }
    });
}

function loadSetting(){
    chrome.storage.sync.get(["notification"], function(result){
        NOTIFICATION_PUSH = result.notification;});

    chrome.storage.sync.get(["checkIn"], function(result){
        CHECKIN_ON = result.checkIn;});

    chrome.storage.sync.get(["imageNotice"], function(result){
        IMAGE_NOTIFICATION = result.imageNotice;});
}

function exchangeVIPCoin(){
    $.ajax({
        url: "https://api.bilibili.com/x/vip/privilege/receive",
        type: "POST",
        data: {"type": 1,"csrf":JCT},
        dataType: "json",
        json: "callback",
        success: function (json) {
            console.log(json)
        },
        error: function (msg) {
            console.log(msg.toString())
        }
    });
}