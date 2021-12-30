/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const currentVersion = chrome.runtime.getManifest().version;
    const crc = new CRC32();
    var latestVersion = currentVersion;
    var checkin;
    var exchangeBcoin;
    var dk;
    var updateAvailable = false;
    var availableBranch = "https://gitee.com/tyrael-lee/HarukaEmoji/releases";
    var downloadFileName = "";

    var notificationPush = true;
    var checkinSwitch = true;
    var imageNotificationSwitch = false;
    var BCOIN = true;
    var QN = false;
    var QNV = "原画";
    var dynamicPush = false;
    var hiddenEntry = false;
    var dakaSwitch = true;

    var UUID = -1;
    var SESSDATA = -1;
    var JCT = -1;
    var P_UID = UUID;
    var P_SESS = SESSDATA;
    var FOLLOWING_LIST = new FollowingMemberList();
    var FOLLOWING_LIST_TEMP = new FollowingMemberList();
    var winIDList = new WindowIDList();
    var p = 0;

    chrome.browserAction.setBadgeBackgroundColor({color: "#00A0FF"});
    chrome.windows.getAll(function (wins){for (let i = 0; i < wins.length; i++) winIDList.push(wins[i].id);});
    chrome.windows.onCreated.addListener(function (win){winIDList.push(win.id);});
    chrome.windows.onRemoved.addListener(function (wID){winIDList.remove(wID);});
    chrome.windows.onFocusChanged.addListener(function (wID){if(wID!==-1) winIDList.push(wID);});
    chrome.runtime.onInstalled.addListener(function (obj){
        // init setting
        if(localStorage.getItem("rua_lastDK")===null)localStorage.setItem("rua_lastDK", "1970-01-01");
        chrome.storage.sync.set({"notification": true}, function(){notificationPush = true;});
        chrome.storage.sync.set({"medal": true}, function(){});
        chrome.storage.sync.set({"checkIn": true}, function(){checkinSwitch = true;});
        chrome.storage.sync.set({"imageNotice": false}, function(){imageNotificationSwitch = false;});
        chrome.storage.sync.set({"bcoin": true}, function(){BCOIN = true;});
        chrome.storage.sync.set({"qn": false}, function(){QN = false;});
        chrome.storage.sync.set({"qnvalue": "原画"}, function(){});
        chrome.storage.sync.set({"dynamicPush":true}, function (){dynamicPush = true});
        chrome.storage.sync.set({"hiddenEntry":false}, function (){hiddenEntry = false});
        chrome.storage.sync.set({"daka":true}, function (){dakaSwitch = true});
        chrome.tabs.create({url: "./readme.html"});
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            if(key === "notification") notificationPush = newValue;
            if(key === "checkIn") {
                checkinSwitch = newValue;
                if(checkinSwitch) checkIn();
            }
            if(key === "imageNotice")imageNotificationSwitch = newValue;
            if(key === "bcoin"){
                BCOIN = newValue;
                if(BCOIN) queryBcoin();
            }
            if(key === "dynamicPush")
                dynamicPush = newValue;
            if(key === "hiddenEntry")
                hiddenEntry = newValue;
            if(key === "daka"){
                dakaSwitch = newValue;
                if(dakaSwitch)
                    checkMedalDaka();
            }
        }
    });

    /**
     * Communicate with content script, since content script
     * cannot load some info, like cookie.
     * */
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
            if(request.msg === "get_LoginInfo"){
                chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
                    function (jct) {
                        (jct === null) ? JCT = -1 : JCT = jct.value;
                        chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'SESSDATA'},
                            function (sd) {
                                (sd === null) ? SESSDATA = -1 : SESSDATA = sd.value;
                                sendResponse({res:JCT+","+SESSDATA});
                            });
                    });
            }
            if(request.msg === "get_UUID") {sendResponse({res:UUID});}
            if(request.msg === "updateStatus") {sendResponse({res:updateAvailable, address:availableBranch});}
            if(request.msg === "popupfired"){setBadge("rua豹器", "");}
            if(request.msg === "requestDownload"){downloadFileName = request.fileName;}
            if(request.msg === "requestDanmaku"){
                let danmakuBulider = new DanmakuArr();
                for (let i = 0; i < request.danmakuObj.length; i++) {
                    if(request.danmakuObj[i]["progress"]===undefined)
                        request.danmakuObj[i]["progress"] = 0;
                    danmakuBulider.push(new DanmakuObj(convertMSToS(request.danmakuObj[i]["progress"]), crc.crack(request.danmakuObj[i]["midHash"]), request.danmakuObj[i]["content"]))
                }
                danmakuBulider.sort(1000);
                console.log(danmakuBulider)
                sendResponse({danmakuContent: danmakuBulider, danmakuPoolSize: request.danmakuObj.length});
            }
            if(request.msg.includes("QNV")){
                QNV = request.msg.split("?")[1];
                sendResponse({res:"ok"});
            }
            return true;
        }
    );

    function convertMSToS(time){
        time = time / 1000;
        let secs = Math.floor(time % 60);
        let mint = Math.floor((time / 60) % 60);
        let hour = Math.floor((time / 3600) % 60);
        hour = (hour === 0)?"":((hour < 10 && hour >0)?"0"+hour:hour)+":";
        mint = (mint < 10)?"0"+mint:mint;
        secs = (secs < 10)?"0"+secs:secs;
        return hour+mint+":"+secs;
    }

    chrome.runtime.onConnect.addListener(function (p){
        if(p.name==="popup"){
            p.onDisconnect.addListener(function (){
                chrome.storage.sync.set({"qnvalue": QNV}, function (){});
            });
        }
    });

    function loadSetting(){
        chrome.storage.sync.get(["notification"], (result)=>{
            notificationPush = result.notification;});

        chrome.storage.sync.get(["checkIn"], (result)=>{
            checkinSwitch = result.checkIn;});

        chrome.storage.sync.get(["imageNotice"], (result)=>{
            imageNotificationSwitch = result.imageNotice;});

        chrome.storage.sync.get(["bcoin"], (result)=>{
            BCOIN = result.bcoin;});

        chrome.storage.sync.get(["qn"], (result)=>{
            QN = result.qn;});

        chrome.storage.sync.get(["dynamicPush"], (result)=>{
            dynamicPush = result.dynamicPush;});

        chrome.storage.sync.get(["hiddenEntry"], (result)=>{
            hiddenEntry = result.hiddenEntry;});

        chrome.storage.sync.get(["daka"], (result)=>{
            dakaSwitch = result.daka;});
    }

    /**
     * Maintain and updated the following ups info.
     * Non-duplicated and shrank when unfollow someone.
     *
     * time O(n^2), may be quicker
     *
     * API: https://api.bilibili.com/x/relation/followings
     * method: GET
     * url param: vmid->uid, pn->page number.
     * */
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
                            FOLLOWING_LIST.push(member); // maintain the global list
                            FOLLOWING_LIST_TEMP.push(member); // push new to local list(this time only)
                        }
                        if (listLength === 0 && FOLLOWING_LIST.length() !== 0) {
                            // all elements enquired.
                            p = 0;
                            FOLLOWING_LIST.update(FOLLOWING_LIST_TEMP); // get intersection of global and local list.
                            FOLLOWING_LIST_TEMP.clearAll(); // empty local list for next turn.
                            console.log("Load following list complete. " + FOLLOWING_LIST.length() + " followings found.");
                            queryLivingRoom();
                        }
                        if (listLength !== 0) getFollowingList();
                    }
                },
                error: function (msg){p = 0;errorHandler(getFollowingList, msg);}
            });
        }
    }

    /**
     * Check live room status once for all.
     *
     * time O(n^2), may be quicker
     *
     * API: https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids
     * method: POST
     * attention: not accept cookie.
     * */
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
            error: function (msg) {p = 0;errorHandler(getFollowingList, msg);}
        });
    }

    /**
     * Update the following list for notification.
     *
     * time: O(n)
     *
     * If the element in the list not on air last time but
     * on air this time, then push a notification to users.
     * If the element in the list on air last time but
     * not on air this time, then clear the notification info
     * for that element for next time push.
     * Otherwise, do nothing.
     * */
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
                            if(notificationPush)
                                pushNotificationChrome(FOLLOWING_LIST.get(i).TITLE,
                                    FOLLOWING_LIST.get(i).NAME,
                                    FOLLOWING_LIST.get(i).ROOM_URL,
                                    FOLLOWING_LIST.get(i).COVER.length===0||FOLLOWING_LIST.get(i).COVER.length==null?(FOLLOWING_LIST.get(i).FACE.length===0||FOLLOWING_LIST.get(i).FACE.length==null?"../images/haruka128.png":FOLLOWING_LIST.get(i).FACE):FOLLOWING_LIST.get(i).COVER,
                                    FOLLOWING_LIST.get(i).TYPE,
                                    FOLLOWING_LIST.get(i).FACE.length===0||FOLLOWING_LIST.get(i).FACE.length==null?"../images/haruka128.png":FOLLOWING_LIST.get(i).FACE);
                        }
                    }
                }
            }
        }
        setTimeout(getFollowingList, 10000);
    }

    /**
     * Create notification. (Web API ver.)
     * */
    function pushNotification(roomTitle, liverName, roomUrl, cover, type) {
        var notification = new Notification(roomTitle, {
            icon: cover,
            body: liverName + " 开播啦!\r\n是"+(type===0?"正常的":"手机")+"直播呦！",
        });
        notification.onclick = function (){
            chrome.tabs.create({url: roomUrl});
            notification.close();
        }
    }

    function pushNotificationChrome(roomTitle, liverName, roomUrl, cover, type, face){
        let uid = Math.random();
        let msg = liverName + " 开播啦!\r\n是"+(type===0?"电脑":"手机")+"直播！";
        imageNotificationSwitch?imageNotification(uid, roomTitle, msg, roomUrl, cover, face, "https://live.bilibili.com/"):basicNotification(uid, roomTitle, msg, roomUrl, face, "https://live.bilibili.com/");
    }

    /**
     * Create notification. (Web Extension API ver.)
     * normal ver.
     *
     * @param uid, a random number for notification id.
     * @param roomTitle, live room title.
     * @param msg, notification content.
     * @param roomUrl, part of live URL for click jump to.
     * @param cover, notification icon, normally will be up's face.
     * @param URLPrefix, "live.bilibili.com/", will be combine with roomUrl to build a full link.
     * */
    function basicNotification(uid, roomTitle, msg, roomUrl, cover, URLPrefix){
        chrome.notifications.create(uid+":"+roomUrl, {
                type: "basic",
                iconUrl: cover,
                title: roomTitle,
                message: msg,
                contextMessage:"rua豹器"
            }, function (id) {notificationClickHandler(id,URLPrefix);}
        );
    }

    /**
     * Create notification. (Web Extension API ver.)
     * image ver.
     *
     * @param uid, a random number for notification id.
     * @param roomTitle, live room title.
     * @param msg, notification content.
     * @param roomUrl, part of live URL for click jump to.
     * @param cover, notification content image, normally will be live room face.
     * @param face, notification icon, normally will be up's face.
     * @param URLPrefix, "live.bilibili.com/", will be combine with roomUrl to build a full link.
     * */
    function imageNotification(uid, roomTitle, msg, roomUrl, cover, face, URLPrefix){
        chrome.notifications.create(uid+":"+roomUrl, {
                type: "image",
                iconUrl: face,
                title: roomTitle,
                message: msg,
                imageUrl: cover,
                contextMessage:"rua豹器"
            }, function (id) {notificationClickHandler(id, URLPrefix);}
        );
    }

    function messageNotification(uid, roomUrl, face, msg){
        chrome.notifications.create(uid+"", {
                type: "basic",
                iconUrl: face,
                title: msg,
                message:""
            }, function (id) {
                chrome.notifications.onClicked.addListener(function (nid) {
                    if (nid === id) {
                        chrome.windows.getAll(function (wins){
                            if(wins.length>0){
                                chrome.windows.update(winIDList.getCurrent(), {focused: true});
                                chrome.tabs.create({url: roomUrl});
                            }else
                                chrome.windows.create({url: roomUrl});
                        });
                        chrome.notifications.clear(id);
                    }
                });
            }
        );
    }

    /**
     * A handler for notification click event.
     * When click the notification, browser will
     * open the URL contained in notifications for
     * users.
     *
     * @param id, specific notification id,
     * @param URLPrefix, the url contained in notification is only a part of them
     * includes aid, bid or live room number, prefix will be used for build url.
     * */
    function notificationClickHandler(id, URLPrefix){
        chrome.notifications.onClicked.addListener(function (nid) {
            if (nid === id) {
                chrome.windows.getAll(function (wins){
                    if(wins.length>0){
                        // why google did not fix this bug over 6 years? WTF
                        // chrome.windows.getLastFocused(function (Lwin){
                        //     chrome.windows.update(Lwin.id, {focused: true});
                        //     chrome.tabs.create({url: "https://live.bilibili.com/"+nid.split(":")[1]});
                        // });
                        chrome.windows.update(winIDList.getCurrent(), {focused: true});/*ensure the browser will always open tabs in the most top window.*/
                        chrome.tabs.create({url: URLPrefix+nid.split(":")[1]});
                    }else
                        chrome.windows.create({url: URLPrefix+nid.split(":")[1]});
                });
                chrome.notifications.clear(id);
            }
        });
    }

    checkUpd("https://tyrael-lee.gitee.io/harukaemoji/?_=");
    setTimeout(loadSetting, 100);
    setTimeout(reloadCookies,200);
    setInterval(reloadCookies, 5000);
    setInterval(()=>{checkUpd("https://tyrael-lee.gitee.io/harukaemoji/?_=")}, 43200000);
    function scheduleCheckIn(){
        checkIn();
        queryBcoin();
        checkMedalDaka();
        checkin = setInterval(checkIn, 21600000);
        exchangeBcoin = setInterval(queryBcoin, 43200000);
        dk = setInterval(checkMedalDaka, 3600000);

    }

    /**
     * Load cookies to check users' login status.
     * All functions should work when users' login info is set only.
     * */
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
                            clearInterval(exchangeBcoin);
                            clearInterval(dk)
                        }
                        if (UUID !== -1 && SESSDATA !== -1 && UUID !== P_UID && SESSDATA !== P_SESS) {
                            // log in info changed then load following list and start update liver stream info every 3 min.
                            console.log("Session info got.");
                            FOLLOWING_LIST.clearAll(); // initial following list.
                            p=0;
                            videoNotify(false);

                            scheduleCheckIn();
                            getFollowingList();
                            // getUnread();
                            // exchangeVIPCoin();
                        }
                        P_UID = UUID;P_SESS = SESSDATA;
                    });
            });
        chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
            function (jct) {(jct === null)?JCT=-1:JCT = jct.value;});
    }

    function checkIn(){
        if(checkinSwitch){
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
                    errorHandler(checkIn, msg);
                }
            });
        }
    }

    /**
     * Handler for network error,
     * For 412 internal error wait for 15 mins,
     * others retry after 20 secs.
     *
     * @param handler, the function which need to be handled.
     * @param msg, the error message.
     * */
    function errorHandler(handler, msg){
        console.log("ERROR found @ "+new Date()+":");
        console.log(msg);
        (typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)?setTimeout(handler, 900000):setTimeout(handler,20000);
    }

    /**
     * Exchange B coin section.
     * */
    function exchangeBCoin(){
        $.ajax({
            url: "https://api.bilibili.com/x/vip/privilege/receive",
            type: "POST",
            data: {"type": 1,"csrf":JCT},
            dataType: "json",
            json: "callback",
            success: function (json) {
                console.log("兑换成功！好耶( •̀ ω •́ )✧");
                chrome.notifications.create(Math.random()+"", {
                        type: "basic",
                        iconUrl: "./images/abaaba.png",
                        title: "本月大会员的5B币兑换成功！",
                        message:""
                    }, function (id) {
                        setTimeout(function (){
                            chrome.notifications.clear(id);
                        },3000);
                    }
                );
            },
            error: function (msg) {
                errorHandler(queryBcoin, msg);
            }
        });
    }

    function queryBcoin(){
        if(BCOIN){
            $.ajax({
                url: "https://api.bilibili.com/x/vip/privilege/my",
                type: "GET",
                dataType: "json",
                json: "callback",
                success: function (json) {
                    console.log("checked vip status")
                    if (json["code"] === 0){
                        if(json["data"]["list"]["0"]["type"]===1&&json["data"]["list"]["0"]["state"]===0)
                            exchangeBCoin();
                        else if(json["data"]["list"]["0"]["type"]===1&&json["data"]["list"]["0"]["state"]===1)
                            console.log("这个月的已经兑换过了，好耶！( •̀ ω •́ )✧");
                    }
                },
                error: function (msg) {
                    errorHandler(queryBcoin, msg);
                }
            });
        }
    }

    /**
     * Check and notify dynamic update section.
     * */
    let dynamic_id_list = [];
    function videoNotify(push){
        $.ajax({
            url: "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?uid="+UUID+"&type_list=8,512,4097,4098,4099,4100,4101",
            type: "GET",
            dataType: "json",
            json: "callback",
            success: function (json) {
                if(json["code"] === 0 && dynamicPush){
                    let o = json["data"]["cards"];
                    for (let i = 0; i < o.length; i++) {
                        let c = JSON.parse(o[i+""]["card"]);
                        let type = o[i+""]["desc"]["type"];
                        if(!dynamic_id_list.includes(o[i+""]["desc"]["dynamic_id"])){
                            if(push || push === undefined){
                                if(type === 8){
                                    console.log("你关注的up "+c["owner"]["name"]+" 投稿了新视频！"+c["title"]+" see:"+o[i+""]["desc"]["bvid"]);
                                    basicNotification(o[i+""]["desc"]["dynamic_id"], "你关注的up "+c["owner"]["name"]+" 投稿了新视频！", c["title"], o[i+""]["desc"]["bvid"], c["owner"]["face"], "https://b23.tv/");
                                }else if(type >= 512 && type <= 4101){
                                    console.log("你关注的番剧 "+c["apiSeasonInfo"]["title"]+" 更新了！"+c["index"]+" see:"+c["url"]);
                                    basicNotification(o[i+""]["desc"]["dynamic_id"], "你关注的番剧 "+c["apiSeasonInfo"]["title"]+" 更新了！",c["new_desc"],c["url"].replace("https://www.bilibili.com/",""), c["cover"],"https://www.bilibili.com/");
                                }
                            }
                            dynamic_id_list.push(o[i+""]["desc"]["dynamic_id"]);
                        }
                    }
                }
                setTimeout(()=>{videoNotify(true)},10000);
            },
            error: function (msg) {
                errorHandler(videoNotify,msg);
            }
        });
    }

    /**
     * Web traffic control section.
     * */
    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
            let headers = details["requestHeaders"];
            for (let header in headers) {
                if (headers[header].name === "Cookie") {
                    headers[header].value = ""
                }
            }
            return {requestHeaders: details.requestHeaders};
        }, {urls: ["https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids"]}, ['blocking', "requestHeaders", "extraHeaders"]
    );
    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
            let headers = details["requestHeaders"];
            for (let header in headers) {
                if(headers[header].name === "Origin"){
                    headers[header].value = "https://www.bilibili.com/"
                }
            }
            return {requestHeaders: details.requestHeaders};
        }, {urls: ["https://api.bilibili.com/x/vip/privilege/receive", "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids"]}, ['blocking', "requestHeaders", "extraHeaders"]
    );
    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
            let headers = details["requestHeaders"];
            for (let header in headers) {
                if(headers[header].name === "Origin"){
                    headers[header].value = "https://live.bilibili.com"
                }
                if(headers[header].name === "Sec-Fetch-Site")
                    headers[header].value = "same-site"
            }
            details.requestHeaders.push({name: 'Referer', value:'https://live.bilibili.com/'});
            return {requestHeaders: details.requestHeaders};
        }, {urls: ["https://api.live.bilibili.com/msg/send"]}, ['blocking', "requestHeaders", "extraHeaders"]
    );
    chrome.webRequest.onBeforeRequest.addListener((details)=>{
            return hiddenEntry&&!details.url.includes("room_id=2842865")?{redirectUrl: "https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=2842865&from=0"}:undefined},
        {urls: ["*://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser*"]}, ["blocking"]);

    chrome.webRequest.onHeadersReceived.addListener((details)=>{
        if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="ruaDL"){
            console.log("rename");
            let fileFormat = new URL(details["url"])["pathname"].substr(new URL(details["url"])["pathname"].length-4,4);
            if(fileFormat === ".m4s") fileFormat = ".mp3";
            details.responseHeaders.push({name:"Content-Disposition", value:"attachment; filename="+downloadFileName+fileFormat+""});
        }
        return {responseHeaders: details.responseHeaders};
    }, {urls: ["*://*.bilivideo.com/upgcxcode/*", "*://*.akamaized.net/upgcxcode/*"]}, ["responseHeaders", 'blocking']);

    /**
     * Live room check in section.
     * */
    function checkMedalDaka(){
        console.log("Grabbing medal info");
        if(dakaSwitch && (localStorage.getItem("rua_lastDK")===null || isNewerThan(localStorage.getItem("rua_lastDK").split("-"), (getUTC8Time().getFullYear()+"-"+getUTC8Time().getMonth()+"-"+getUTC8Time().getDate()).split("-")))){
            let medals = [];
            localStorage.setItem("rua_lastDK", getUTC8Time().getFullYear()+"-"+getUTC8Time().getMonth()+"-"+getUTC8Time().getDate());
            $.ajax({
                url: "https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+UUID,
                type: "GET",
                dataType: "json",
                json: "callback",
                xhrFields: {
                    withCredentials: true
                },
                success: function (json) {
                    console.log(json["data"]["list"].length+" medal founded.")
                    for (let i = 0; i < json["data"]["list"].length; i++)
                        medals.push(json["data"]["list"][i]["medal_info"]["target_id"]);
                    daka(medals);
                },
                error: function (msg) {
                    localStorage.setItem("rua_lastDK", "1970-01-01");
                    errorHandler(checkMedalDaka,msg);
                }
            });
        }else console.log("No more grab needed.");
    }

    /**
     * Send damaku to each live room.
     * */
    function daka(medals){
        let index = 0;
        (function go(){
            $.ajax({
                url: "https://api.live.bilibili.com/live_user/v1/Master/info?uid="+medals[index],
                type: "GET",
                dataType: "json",
                json: "callback",
                xhrFields: {
                    withCredentials: true
                },
                success: function (json) {
                    if(json["code"]===0 || json["data"].length>0){
                        let DanMuForm = new FormData();
                        DanMuForm.append("bubble", "0");
                        DanMuForm.append("msg", "打卡");
                        DanMuForm.append("color", "16777215");
                        DanMuForm.append("mode", "1");
                        DanMuForm.append("fontsize", "25");
                        DanMuForm.append("rnd", Math.round(Date.now()/1000)+"");
                        DanMuForm.append("roomid", json["data"]["room_id"]);
                        DanMuForm.append("csrf", JCT);
                        DanMuForm.append("csrf_token", JCT);
                        fetch("https://api.live.bilibili.com/msg/send", {
                            method:"POST",
                            credentials: 'include',
                            body: DanMuForm
                        }).then(result=>{
                            console.log("打卡成功: https://live.bilibili.com/"+json["data"]["room_id"]);
                            if(index<medals.length){
                                setTimeout(()=>{go()},(Math.random()*5+10)*1000);
                                index++;
                            }
                        }).catch(error=>{console.error('Error:', error);});
                    }
                }
            });
        })();
    }

    /**
     * Context menu section.
     * */
    (function(){
        chrome.contextMenus.create({contexts: ["selection", "link"], title: "用bilibili搜索", type: "normal", id:"rua-contextMenu"});
        chrome.contextMenus.onClicked.addListener((info)=>{
            if(info.menuItemId==="rua-contextMenu"){
                legalVideoLink(info.selectionText).then(r => {
                    r?chrome.tabs.create({url: "https://www.bilibili.com/video/"+info.selectionText}):chrome.tabs.create({url:"https://search.bilibili.com/all?keyword="+info.selectionText});
                });
            }
        });
    })();

    /**
     * Analysis selected text is a/bv id or not.
     * */
    async function legalVideoLink(str){
        let headB = "AaBb";
        let headE = "Vv";
        if(headB.includes(str.charAt(0)) && headE.includes(str.charAt(1))){
            return headB.substr(0,2).includes(str.charAt(0))?await findVideo("aid="+str.substr(2,str.length-1)):await findVideo("bvid="+str);
        }
        return false;
    }

    /**
     * Query selected a/bv id is exist or not.
     * */
    function findVideo(vid){
        return new Promise(function (videoExist){
            let findVideoRequest = new XMLHttpRequest();
            findVideoRequest.open("GET", "https://api.bilibili.com/x/web-interface/view?"+vid, true);
            findVideoRequest.send(null);
            findVideoRequest.onload = function (e){
                findVideoRequest.status===200?videoExist(JSON.parse(findVideoRequest.responseText)["code"]===0):videoExist(false);
            }});
    }

    /**
     * Check updated section.
     * */
    function checkUpd(url){
        console.log("checking update at "+(new URL(url)).hostname);
        var request = new XMLHttpRequest();
        request.open("GET", url+new Date().getTime(), true);
        request.timeout = 5000;
        request.onreadystatechange = function() {
            if (request.responseText !== null && request.readyState == 4 && (/<title>(.*?)<\/title>/m).exec(request.responseText) !== null) {
                if(latestVersion !== (/<title>(.*?)<\/title>/m).exec(request.responseText)[1]){
                    latestVersion = (/<title>(.*?)<\/title>/m).exec(request.responseText)[1];
                    if(latestVersion!==currentVersion){
                        console.log("A newer version found: "+latestVersion);
                        updateAvailable = true;
                        availableBranch = new URL(url).hostname.includes("github")?"https://github.com/TyraelDLee/HarukaEmoji/releases/latest":"https://gitee.com/tyrael-lee/HarukaEmoji/releases";
                        setBadge("rua豹器 有更新可用", "1");
                    }else{
                        console.log("Current version is latest.");
                        updateAvailable = false;
                        setBadge("rua豹器", "");
                    }
                }
            }
        }
        request.send();
        request.ontimeout = function (){
            /*add alternative request here.*/
            checkUpd(url.includes("github")?"https://tyrael-lee.gitee.io/harukaemoji/?_=":"https://tyraeldlee.github.io/HarukaEmoji/?_=");
        };
        request.onerror = function (){
            setTimeout(()=>{
                checkUpd(url.includes("github")?"https://tyrael-lee.gitee.io/harukaemoji/?_=":"https://tyraeldlee.github.io/HarukaEmoji/?_=");},1800000);
        };
    }

    function isNewerThan(dateOld, dateNew){
        return parseInt(dateOld[0])<parseInt(dateNew[0])?true:parseInt(dateOld[0])>parseInt(dateNew[0])?false:parseInt(dateOld[1])<parseInt(dateNew[1])?true:parseInt(dateOld[1])>parseInt(dateNew[1])?false:parseInt(dateOld[2])<parseInt(dateNew[2]);
    }

    function getUTC8Time(){
        return new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + 28800000);
    }

    function setBadge(title, text){
        chrome.browserAction.setTitle({title: title});
        chrome.browserAction.setBadgeText({text: text});
    }


}();
// function getUnread(){
//     let totalUnread = 0;
//     $.ajax({
//         url: "https://api.bilibili.com/x/msgfeed/unread",
//         type: "GET",
//         dataType: "json",
//         json: "callback",
//         success: function (json) {
//             if (json["code"] === 0){
//                 if(json["data"]["reply"] > 0)
//                     setTimeout(function (){getReply("reply",json["data"]["reply"]);},10000);
//                 if(json["data"]["like"] > 0)
//                     setTimeout(function (){getReply("like",json["data"]["like"]);},10000);
//                 console.log("New unread: reply "+json["data"]["reply"]+", like "+json["data"]["like"]+", at "+json["data"]["at"]+", up "+json["data"]["up"]+", sys "+json["data"]["sys_msg"]+" , chat "+json["data"]["chat"]);
//             }
//             setTimeout(getUnread, 10000);
//         },
//         error: function (msg) {
//             console.log("ERROR found: "+msg.toString()+" "+new Date());
//             (typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)?setTimeout(getUnread, 900000):setTimeout(getUnread,20000);
//         }
//     });
// }
//
// function getReply(type, item){
//     let link;
//     if(type==="like")
//         link = "https://api.bilibili.com/x/msgfeed/like";
//     if(type==="reply")
//         link = "https://api.bilibili.com/x/msgfeed/reply";
//     $.ajax({
//         url: link,
//         type: "GET",
//         dataType: "json",
//         json: "callback",
//         success: function (json) {
//             if (json["code"] === 0){
//                 for (let i = 0; i < item; i++) {
//                     let o = type==="reply"?json["data"]["items"]:json["data"]["total"]["items"];
//                     console.log(o);
//                     let url = "";
//                     let msg = "";
//                     let face = "";
//                     if(type==="reply"){
//                         face = o[i+""]["user"]["avatar"].includes("https")?o[i+""]["user"]["avatar"]:o[i+""]["user"]["avatar"].replace("http", "https");
//                         url = o[i+""]["item"]["uri"]+"#reply"+o[i+""]["item"]["source_id"];
//                         msg = o[i+""]["user"]["nickname"]+"回复了你的"+o[i+""]["item"]["business"];
//                     }
//                     if(type==="like"){
//                         face = o[i+""]["users"]["0"]["avatar"].includes("https")?o[i+""]["users"]["0"]["avatar"]:o[i+""]["users"]["0"]["avatar"].replace("http", "https");
//                         url = "https://message.bilibili.com/#/love/"+o[i+""]["id"];
//                         msg = o[i+""]["users"]["0"]["nickname"]+"给你的"+o[i+""]["item"]["business"]+"点了个赞!";
//                     }
//                     messageNotification(Math.random(), url, face, msg);
//                 }
//             }
//         },
//         error: function (msg) {
//             console.log(msg.toString())
//         }
//     });
// }
