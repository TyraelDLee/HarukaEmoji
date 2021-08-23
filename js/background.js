/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const NOTIFICATION_PUSH = true;

var api="https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign"
var TIMESTAMP = Date.now();
var UUID = -1;
var SESSDATA = -1;
var JCT = -1;
var P_UID = UUID;
var P_SESS = SESSDATA;
var FOLLOWING_LIST = new FollowingMemberList();
var FOLLOWING_LIST_TEMP = new FollowingMemberList();// for remove
var INDEX = 0;
var p = 0;


var latency = 0;

function getFollowingList() {
    p++;
    let listLength = 0;
    $.ajax({
        url: "https://api.bilibili.com/x/relation/followings?vmid=" + UUID + "&pn=" + p,
        //ps maximum is 50
        type: "GET",
        dataType: "json",
        json: "callback",
        xhrFields: {
            withCredentials: true
        },
        success: function (json) {
            console.log(json)
            if(typeof json["data"]!=="undefined") {
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
                    TIMESTAMP = Date.now();
                    query()
                }
                if (listLength !== 0) getFollowingList();
            }
        },
        error: function (msg){
            console.log("ERROR found")
            if(typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412) {
                clearInterval(run);
                setTimeout(grabData, 900000);
            }
            // if blocked then retry after 15min.
            else {
                clearInterval(run);
                setTimeout(grabData,1000);
            }
            // others error retry immediately.
        }
    });
}

function updateList(ON_AIR_LIST){
    console.log(ON_AIR_LIST)
    console.log(FOLLOWING_LIST)
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
                        console.log(FOLLOWING_LIST.get(i).TITLE + " " + FOLLOWING_LIST.get(i).NAME);
                        if(NOTIFICATION_PUSH)
                            pushNotification(FOLLOWING_LIST.get(i).TITLE,
                                FOLLOWING_LIST.get(i).NAME,
                                FOLLOWING_LIST.get(i).ROOM_URL,
                                (FOLLOWING_LIST.get(i).COVER.length===0?FOLLOWING_LIST.get(i).FACE:FOLLOWING_LIST.get(i).COVER));
                    }
                }
            }
        }
    }
    console.log("latency: " + (Date.now() - latency));
}

/***
 * Once following list loaded, set 10 seconds gap(
 * to avoid the unexpected results caused by asynchronous
 * operations), then scan the live room info for
 * members who followed by user.
 * */
function getLiversInfo() {
    latency = Date.now();
    p = 0;
    INDEX = 0;
    getFollowingList();
}


function pushNotification(roomTitle, liverName, roomUrl, cover) {
    //console.log(roomTitle + " " + liverName);
    var notification = new Notification(roomTitle, {
        icon: cover,
        body: liverName + " 开播啦!",
    });
    notification.onclick = function (){
        chrome.tabs.create({url: "https://live.bilibili.com/"+roomUrl});
        notification.close();
    }
}

/** @deprecated */
function pushNotificationChrome(roomTitle, liverName, roomUrl, cover){
    /***
     * Chrome notification api used.
     * */
    var id = roomUrl; // set a unique ID for each notification.
    chrome.notifications.create(id,
        {
            type: "basic",
            iconUrl: cover,
            title: roomTitle,
            message: liverName + " 开播啦!",
        },
        function (id) {
            chrome.notifications.onClicked.addListener(function (nid) {
                if (nid === id) {
                    chrome.tabs.create({url: roomUrl});
                    chrome.notifications.clear(id, function () {});
                }
            });
        }
    );
}
// Check cookies info every 5 seconds.

setInterval(reloadCookies, 5000);
var run;

function grabData(){
    run = setInterval(getLiversInfo, 10000);
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
                        clearInterval(run);
                        console.log("Session info does not exist, liver stream info listener cleared.");
                    }
                    if (UUID !== -1 && SESSDATA !== -1 && UUID !== P_UID && SESSDATA !== P_SESS) {
                        // log in info changed then load following list and start update liver stream info every 3 min.
                        console.log("Session info got.");
                        FOLLOWING_LIST.clearAll(); // initial following list.
                        grabData();
                    }
                    P_UID = UUID;
                    P_SESS = SESSDATA;
                });
        });
    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
        function (jct) {
            JCT = jct.value;
        });
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
        if(request.msg === "get_JCT"){
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
                function (jct) {
                    JCT = jct.value;
                    sendResponse(jct.value);
                });
        }
    }
);
