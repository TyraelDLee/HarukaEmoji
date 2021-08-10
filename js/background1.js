/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const API = "https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/GetWebList?page=";
const NOTIFICATION_PUSH = false;
var UUID = -1;
var SESSDATA = -1;
var JCT = -1;
var P_UID = UUID;
var P_SESS = SESSDATA;
var FOLLOWING_LIST = new FollowingMemberList();
var FOLLOWING_LIST_TEMP = new FollowingMemberList();
var INDEX = 0;
var p = 0;

var newlist = new FollowingMemberList();
var newtemp = new FollowingMemberList();
var c = 0;
function getOnAirFollowing(){
    c++;
    $.ajax({
        url: API+c,
        //ps maximum is 50
        type: "GET",
        dataType: "json",
        json: "callback",
        xhrFields: {
            withCredentials: true
        },
        success: function (json) {
            var data = json["data"]["list"];
            for (let i = 0; i < data.length; i++) {
                let member = new FollowingMember(data[i]["uid"], data[i]["uname"], data[i]["face"], data[i]["cover_from_user"], data[i]["keyframe"],data[i]["link"], data[i]["title"]);
                newtemp.push(member);
            }
            if (data.length === 0 && newtemp.length() !== 0){
                c=0;
                if(newlist.length() === 0)
                    newlist.copy(newtemp);
                newlist.update(newtemp);
                newtemp.updateRemove(newlist)
                console.log(newtemp.print());
                for (let i = 0; i < newtemp.length(); i++) {
                    newlist.maintainList(newtemp.get(i));
                }
                console.log(newtemp.length()+" "+newlist.length());
                newtemp.clearAll();
                setTimeout(getLiversInfo, 30000);
            }
            if (data.length !== 0)
                getOnAirFollowing();
        },
        error: function (msg){
            if(typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)
                setTimeout(getOnAirFollowing, 900000);
            // if blocked then retry after 15min.
            else
                setTimeout(getOnAirFollowing,1000);
            // others error retry immediately.
        }
    });
}

/***
 * Load user following list from bilibili api.
 * Ajax asynchronous method used. Thus, beware the code
 * is not execute in sequence.
 *
 * Attention: asynchronous operations used here.
 * Recursion used here.
 * @deprecated
 * */
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
            var data = json["data"]["list"];
            listLength = data.length;
            for (let i = 0; i < data.length; i++) {
                let member = new FollowingMember(data[i]["mid"], data[i]["uname"]);
                FOLLOWING_LIST.push(member);
                FOLLOWING_LIST_TEMP.push(member);
            }
            if (listLength === 0 && FOLLOWING_LIST.length() !== 0){
                p = 0;
                FOLLOWING_LIST.update(FOLLOWING_LIST_TEMP);
                FOLLOWING_LIST_TEMP.clearAll();
                console.log("Load following list complete. " + FOLLOWING_LIST.length() + " followings found.");
                getLiveInfo();
            }
            if (listLength !== 0)
                getFollowingList();
        },
        error: function (msg){
            if(typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)
                setTimeout(getLiversInfo, 900000);
            // if blocked then retry after 15min.
            else
                setTimeout(getLiversInfo,1000);
            // others error retry immediately.
        }
    });
}

/***
 * Once following list loaded, set 10 seconds gap(
 * to avoid the unexpected results caused by asynchronous
 * operations), then scan the live room info for
 * members who followed by user.
 * */
function getLiversInfo() {
    p = 0;
    INDEX = 0;
    // getFollowingList();
    getOnAirFollowing()
}

/***
 * If this room status is changed and current status
 * is 1 then push a notification to chrome.
 *
 * */
function getLiveInfo() {
    var latency = Date.now();
    $.ajax({
        url: "https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=" + FOLLOWING_LIST.get(INDEX).UID,
        type: "GET",
        dataType: "json",
        json: "callback",
        success: function (json) {
            let data = json["data"];
            if (data["liveStatus"] === 0)
                FOLLOWING_LIST.updateStatus(INDEX, false);
            if (data["liveStatus"] === 1 && !FOLLOWING_LIST.get(INDEX).PUSHED) {
                var coverURL = (data["cover"] === null || data["cover"].length < 1) ? "../images/abaaba.png" : data["cover"];
                if(NOTIFICATION_PUSH)
                    pushNotification(data["title"], FOLLOWING_LIST.get(INDEX).NAME, data["url"], coverURL);
                FOLLOWING_LIST.updateStatus(INDEX, true);
                console.log(data["title"] + " " + FOLLOWING_LIST.get(INDEX).NAME + " latency:" + (Date.now() - latency));
            }
            INDEX ++;
            if(INDEX < FOLLOWING_LIST.length())
                getLiveInfo();
            if(INDEX === FOLLOWING_LIST.length())
                getLiversInfo();
        },
        error: function (msg){
            if(typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)
                setTimeout(getLiversInfo, 900000);
            // if blocked then retry after 15min.
            else
                setTimeout(getLiversInfo,1000);
            // others error retry immediately.
        }
    });
}

function pushNotification(roomTitle, liverName, roomUrl, cover) {
    var notification = new Notification(roomTitle, {
        icon: cover,
        body: liverName + " 开播啦!",
    });
    notification.onclick = function (){
        chrome.tabs.create({url: roomUrl});
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

function reloadCookies() {
    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'DedeUserID'},
        function (uid) {
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'SESSDATA'},
                function (SD) {
                    (uid === null) ? UUID = -1 : UUID = uid.value;
                    (SD === null) ? SESSDATA = -1 : SESSDATA = SD.value;
                    if ((UUID === -1 || SESSDATA === -1) && UUID !== P_UID && SESSDATA !== P_SESS) {
                        // if not log in then stop update liver stream info.
                        clearInterval(getLiversInfo);
                        console.log("Session info does not exist, liver stream info listener cleared.");
                    }
                    if (UUID !== -1 && SESSDATA !== -1 && UUID !== P_UID && SESSDATA !== P_SESS) {
                        // log in info changed then load following list and start update liver stream info every 3 min.
                        console.log("Session info got.");
                        FOLLOWING_LIST.clearAll(); // initial following list.
                        getLiversInfo();
                        // setInterval(getLiversInfo, 60000 * interval); // should not below 3 min. Beware ERROR 412
                    }
                    P_UID = UUID;
                    P_SESS = SESSDATA;
                });
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
