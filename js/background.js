/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const interval = 1; // the interval between each scan, unit: minute
const UID = 477332594; // guess what it is
var UUID = -1;
var SESSDATA = -1;
var P_UID = UUID;
var P_SESS = SESSDATA;
var FOLLOWING_LIST_UID = [];
var FOLLOWING_LIST_NAME = [];
var NOTIFICATION_PUSHED = [];
var p = 0;

function getFollowingList() {
    /***
     * Load user following list from bilibili api.
     * Ajax asynchronous method used. Thus, beware the code
     * is not execute in sequence.
     *
     * Attention: asynchronous operations used here.
     * Recursion used here.
     * */
    p++;
    let listLength = 0;
    $(function () {
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
                    FOLLOWING_LIST_NAME.push(data[i]["uname"]);
                    FOLLOWING_LIST_UID.push(data[i]["mid"]);
                    NOTIFICATION_PUSHED.push(false);
                }
                if (listLength === 0 && FOLLOWING_LIST_UID.length !== 0)
                    console.log("Load following list complete. " + FOLLOWING_LIST_UID.length + " followings found.")
                if (listLength !== 0)
                    getFollowingList();
            }
        })
    });
}

function getLiversInfo() {
    /***
     * Once following list loaded, set 10 seconds gap(
     * to avoid the unexpected results caused by asynchronous
     * operations), then scan the live room info for
     * members who followed by user.
     * */
    getFollowingList();
    setTimeout(getLivesInfo, 10000);
}

function getLivesInfo() {
    for (let i = 0; i < FOLLOWING_LIST_NAME.length; i++) {
        getLiveInfo(i, FOLLOWING_LIST_UID[i], FOLLOWING_LIST_NAME[i]);
    }
}

function getLiveInfo(i, uid, uname) {
    /***
     * If this room status is changed and current status
     * is 1 then push a notification to chrome.
     *
     * Attention: asynchronous operations used here.
     * */
    $.ajax({
        url: "https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=" + uid,
        type: "GET",
        dataType: "json",
        json: "callback",
        success: function (json) {
            let data = json["data"];
            if (data["liveStatus"] === 0)
                NOTIFICATION_PUSHED[i] = false;
            if (data["liveStatus"] === 1 && !NOTIFICATION_PUSHED[i]) {
                var coverURL = (data["cover"] === null || data["cover"].length < 1) ? "../images/abaaba.png" : data["cover"];
                pushNotification(data["title"], uname, data["url"], coverURL, i);
                NOTIFICATION_PUSHED[i] = true;
                console.log(data["title"] + " " + FOLLOWING_LIST_NAME[i]);
            }
        }
    });
}

function pushNotification(roomTitle, liverName, roomUrl, cover, i) {
    /***
     * Chrome notification api used.
     * */
    var id = "rua" + Math.random() + i; // set a unique ID for each notification.
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
                    chrome.notifications.clear(id, function () {
                    });
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
                        setInterval(getLiversInfo, 60000 * interval); // should not below 3 min. Beware ERROR 412
                    }
                    P_UID = UUID;
                    P_SESS = SESSDATA;
                });
        });
}
