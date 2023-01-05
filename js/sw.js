/***
 * Copyright (c) 2021 Tyrael, Y. LI
 *
 * service worker for mv3
 * */
importScripts("./crypto-js.min.js");
//importScripts('../ffmpeg/ffmpeg.min.js','../ffmpeg/ffmpeg-core.js', '../ffmpeg/ffmpeg-core.worker.js');
class WindowIDList{
    static convertFromJSON(object){
        let o = new WindowIDList();
        o.list = object.id;
        return o;
    }
    constructor() {
        this.list = [];
    }
    push(id){
        this.remove(id);
        this.list.push(id);
    }
    remove(id){
        if (this.list.indexOf(id)>-1)
            this.list.splice(this.list.indexOf(id),1);
    }
    getCurrent(){
        if (this.list.length>0) return this.list[this.list.length-1]; else return -1;
    }
    length(){
        return this.list.length;
    }

    toJSONObject(){
        return {'id': this.list};
    }
}

class DanmakuObj{
    constructor(time, mid, content, color, mode, fontsize, ts, weight) {
        this.time = time;
        this.mid = mid;
        this.content = content;
        this.name = [];
        this.look = true;

        // for ass download
        this.color = color;
        this.mode = mode;
        this.fontsize = fontsize;
        this.ts = ts;
        this.weight = weight;
    }

    setName(name){
        this.name = name;
    }
}

class DanmakuArr{
    constructor() {
        this.list = []
        this.size = 0;
        this.displaySize = this.size;
    }
    push(danmakuObj){
        this.list.push(danmakuObj);
        this.size++;
    }

    concat(danmakuArrObj){
        this.list = this.list.concat(danmakuArrObj.list);
        this.size+=danmakuArrObj.size;
    }

    get(index){
        return this.list[index];
    }

    max(){
        let local_Max = 0;
        for (let i = 0; i < this.list.length; i++) {
            if (local_Max < this.list[i].time)
                local_Max = this.list[i].time;
        }
        return local_Max;
    }

    min(){
        let local_Min = Number.MAX_VALUE;
        for (let i = 0; i < this.list.length; i++) {
            if (local_Min > this.list[i].time)
                local_Min = this.list[i].time
        }
        return local_Min;
    }

    sort(num){
        function swap(arr, i, j){
            const t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        const max = this.max();
        const min = this.min();
        const buc = [];
        const bucSize = Math.floor((max - min) / num) + 1;
        for (let i = 0; i < this.size; i++) {
            const index = ~~(this.list[i].ts / bucSize);
            !buc[index] && (buc[index] = []);
            buc[index].push(this.list[i]);
            let localSize = buc[index].length;
            while (localSize > 0){
                if (buc[index][localSize]!==undefined && buc[index][localSize].ts < buc[index][localSize - 1].ts)
                    swap(buc[index], localSize, localSize - 1);
                localSize--;
            }
        }
        let wrap = [];
        for (let i = 0; i < buc.length; i++) {
            buc[i] && ((wrap = wrap.concat(buc[i])));
        }
        this.list = wrap;
    }

    find(content){
        function convertMark(str){
            return str.replaceAll(",","，").replaceAll(".","。").replaceAll("?","？").replaceAll("!","！").replaceAll(";","；").replaceAll(":","：").replaceAll("“", "\"").replaceAll("”","\"").replaceAll("(","（").replaceAll(")","）");
        }
        let temp = new DanmakuArr();
        content = convertMark(content);
        if (content === ""){
            return this;
        }else{
            for (let i = 0; i < this.size; i++) {
                if (convertMark(this.list[i].content).includes(content))
                    temp.push(this.list[i]);
            }
            return temp;
        }
    }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
     * License, v. 2.0. If a copy of the MPL was not distributed with this
     * file, You can obtain one at http://mozilla.org/MPL/2.0/.
     *
     * Originally from bilibili-helper at https://github.com/bilibili-helper/bilibili-helper-o/blob/master/src/js/libs/crc32.js
     *
     * */
class CRC32{
    static initCrc32Table(table){
        for (let i = 0; i < 256; i++) {
            let currCrc = i;
            for (let j = 0; j < 8; j++) {
                if (currCrc & 1) {
                    currCrc = (currCrc >>> 1) ^ 0xEDB88320;
                } else {
                    currCrc >>>= 1;
                }
            }
            table[i] = currCrc;
        }
    }

    constructor() {
        this.crc32Table = new Uint32Array(256);
        CRC32.initCrc32Table(this.crc32Table);
        this.rainbowTableHash = new Uint32Array(100000);
        this.rainbowTableValue = new Uint32Array(100000);
        let fullHashCache = new Uint32Array(100000),
            shortHashBuckets = new Uint32Array(65537);
        // Initialize the rainbow Table
        for (let i = 0; i < 100000; i++) {
            let hash = this.compute(i) >>> 0;
            fullHashCache[i] = hash;
            shortHashBuckets[hash >>> 16]++;
        }
        let runningSum = 0;
        this.shortHashBucketStarts = shortHashBuckets.map((n) => runningSum += n);
        for (let i = 0; i < 100000; i++) {
            let idx = --this.shortHashBucketStarts[fullHashCache[i] >>> 16];
            this.rainbowTableHash[idx] = fullHashCache[i];
            this.rainbowTableValue[idx] = i;
        }
    }

    compute(input, addPadding = false){
        let currCrc = 0;
        for (let digit of input.toString()) {
            currCrc = this.crc32Update(currCrc, Number(digit));
        }
        if (addPadding) {
            for (let i = 0; i < 5; i++) {
                currCrc = this.crc32Update(currCrc, 0);
            }
        }
        return currCrc;
    }
    crack(hash){
        let candidates = [];
        let hashVal = ~Number('0x' + hash) >>> 0;
        let baseHash = 0xFFFFFFFF;

        for (let digitCount = 1; digitCount < 10; digitCount++) {
            baseHash = this.crc32Update(baseHash, 0x30); // 0x30: '0'
            if (digitCount < 6) {
                // Direct lookup
                candidates = candidates.concat(this.lookup(hashVal ^ baseHash));
            } else {
                // Lookup with prefix
                let startPrefix = Math.pow(10, digitCount - 6);
                let endPrefix = Math.pow(10, digitCount - 5);

                for (let prefix = startPrefix; prefix < endPrefix; prefix++) {
                    for (let postfix of this.lookup(hashVal ^ baseHash ^
                        this.compute(prefix, true))) {
                        candidates.push(prefix * 100000 + postfix);
                    }
                }
            }
        }
        return candidates;
    }
    crc32Update(currCrc, code) {
        return (currCrc >>> 8) ^ this.crc32Table[(currCrc ^ code) & 0xFF];
    }
    lookup(hash) {
        hash >>>= 0;
        let candidates = [];
        let shortHash = hash >>> 16;
        for (let i = this.shortHashBucketStarts[shortHash];
             i < this.shortHashBucketStarts[shortHash + 1]; i++) {
            if (this.rainbowTableHash[i] === hash) {
                candidates.push(this.rainbowTableValue[i]);
            }
        }
        return candidates;
    }
}

chrome.action.setBadgeBackgroundColor({color: "#00A0FF"});
chrome.windows.getAll(function (wins){
    let winIDList = new WindowIDList();
    for (let i = 0; i < wins.length; i++)
        winIDList.push(wins[i].id);
    chrome.storage.local.set({'winIDList': winIDList.toJSONObject()}, ()=>{});
});
chrome.windows.onCreated.addListener(function (win){
    chrome.storage.local.get(['winIDList'], (info)=>{
        let winIDList = WindowIDList.convertFromJSON(info.winIDList);
        winIDList.push(win.id);
        chrome.storage.local.set({'winIDList': winIDList.toJSONObject()}, ()=>{});
    });
});
chrome.windows.onRemoved.addListener(function (wID){
    chrome.storage.local.get(['winIDList'], (info)=>{
        let winIDList = WindowIDList.convertFromJSON(info.winIDList);
        winIDList.remove(wID);
        chrome.storage.local.set({'winIDList': winIDList.toJSONObject()}, ()=>{});
    });
});
chrome.windows.onFocusChanged.addListener(function (wID){
    if(wID!==-1){
        chrome.storage.local.get(['winIDList'], (info)=>{
            let winIDList = WindowIDList.convertFromJSON(info.winIDList);
            winIDList.push(wID);
            chrome.storage.local.set({'winIDList': winIDList.toJSONObject()}, ()=>{});
        });
    }
});
chrome.runtime.onInstalled.addListener(initialize);

async function initialize(reload){
    // init setting
    await chrome.alarms.clearAll();
    chrome.notifications.getAll((notifications)=>{
        for (let k in notifications)
            chrome.notifications.clear(k);
    });
    await chrome.tabs.create({url: "./readme.html"});
    await chrome.storage.local.get(['rua_lastDK'],(info)=>{
        console.log(info.rua_lastDK)
        if (info.rua_lastDK === null || info.rua_lastDK === undefined)
            chrome.storage.local.set({'rua_lastDK':"1970-01-01"}, ()=>{});
    });
    await chrome.storage.local.set({"imageNotice": false}, function(){});
    // await chrome.storage.sync.set({"notification": true, "medal": true, "checkIn": true, "bcoin": true, "qn": true, "qnvalue": "原画",
    //     "dynamicPush":true, "hiddenEntry":false, "daka":true, "record":false, "prerecord":300,
    //     "enhancedHiddenEntry":false, "unreadSwitch":true, "dynamicSwitch":true}, function(){});
    setInitValue('notification', true);
    setInitValue('medal', true);
    setInitValue('checkIn', true);
    setInitValue('bcoin', true);
    setInitValue('qn', true);
    setInitValue('qnvalue', '原画');
    setInitValue('dynamicPush', true);
    setInitValue('videoPush', true);
    setInitValue('pgcPush', true);
    setInitValue('articlePush', true);
    setInitValue('hiddenEntry', false);
    setInitValue('daka', true);
    setInitValue('record', false);
    setInitValue('prerecord', 300);
    setInitValue('enhancedHiddenEntry', false);
    setInitValue('unreadSwitch', true);
    setInitValue('dynamicSwitch', true);
    setInitValue('blackListLive', []);
    setInitValue('blackListDynamic',[]);
    setInitValue('blackListVideo', []);
    setInitValue('blackListDK', []);
    setInitValue('blackListHB', []);
    setInitValue('darkMode', false);
    setInitValue('darkModeSystem', false);
    setInitValue('commentEmoji', true);
    setInitValue('heartBeatSwitch', true);
    setInitValue('squareCover', false);
    setInitValue('liveroom-medal-switch', 0);
    setInitValue('liveroom-reconnection-time', 10);
    setInitValue('liveroom-heart-beat', true);
    setInitValue('liveroom-quality', 10000);
    /**
     * Context menu section.
     *
     * no need change for mv3 update.
     * */
    if (!reload || typeof reload!=="boolean")
        chrome.contextMenus.create({contexts: ["selection", "link"], title: "用bilibili搜索", type: "normal", id:"rua-contextMenu-v3"});

    // local states
    chrome.alarms.create('checkUpd', {'when':Date.now(), periodInMinutes:60*12});
    await chrome.storage.local.set({'uuid':-1, 'jct':-1, 'p_uuid':-1, 'updateAvailable':false, 'availableBranch':"https://gitee.com/tyrael-lee/HarukaEmoji/releases", 'downloadFileName':'', "video_id_list": [],"pgc_id_list": [],"article_id_list": [], 'unreadData':'{"at":0,"chat":0,"like":0,"reply":0,"sys_msg":0,"up":0}', 'unreadMessage':0/*'{"biz_msg_follow_unread":0,"biz_msg_unfollow_unread":0,"dustbin_push_msg":0,"dustbin_unread":0,"follow_unread":0,"unfollow_push_msg":0,"unfollow_unread":0}'*/, 'dynamicList':[], 'notificationList':[], 'videoInit':true, 'dynamicInit':true, 'unreadInit':true, 'dakaUid':[], 'watchingList': {}, 'heartRhythm':[], 'medalList':[]}, ()=>{});
    chrome.alarms.create('getUID_CSRF', {'when': Date.now(), periodInMinutes:0.3});
    chrome.alarms.create('heartRate', {'when': Date.now()+60*1e3, periodInMinutes: 1});
    chrome.alarms.create('refreshHB', {'when': Date.now()+3600*1e3, periodInMinutes:60});
}

function getNextDay(){
    let nextDay = new Date();
    nextDay.setDate(nextDay.getDate()+1);
    nextDay.setUTCHours(0, 0, 0, 0);
    return nextDay.getTime() - 28800000;
}

function setInitValue(key, defaultVal){
    chrome.storage.sync.get([key], function (value){
        if (value[key]===null || value[key]===undefined)
            chrome.storage.sync.set({[key]:defaultVal},function (){});
    });
}

chrome.contextMenus.onClicked.addListener((info)=>{
    if(info.menuItemId==="rua-contextMenu-v3"){
        legalVideoLink(info.selectionText).then(r => {
            r?chrome.tabs.create({url: "https://www.bilibili.com/video/"+info.selectionText}):chrome.tabs.create({url:"https://search.bilibili.com/all?keyword="+info.selectionText});
        });
    }
});

// chrome.runtime.onConnect.addListener(function (p){
//     if(p.name==="popup"){
//         p.onDisconnect.addListener(function (){
//             //chrome.storage.sync.set({"qnvalue": QNV}, function (){});
//         });
//     }
// });

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
        if(key === "checkIn") {
            if(newValue) checkingIn();
        }
        if(key === "bcoin"){
            if(newValue) queryBcoin();
        }
        if(key === "hiddenEntry"){
            if (newValue){
                chrome.declarativeNetRequest.updateEnabledRulesets({
                    enableRulesetIds: ["redirect"]
                }, ()=>{});
            }else{
                chrome.declarativeNetRequest.updateEnabledRulesets({
                    disableRulesetIds: ["redirect"]
                }, ()=>{});
            }
        }
        if(key === 'enhancedHiddenEntry'){
            if (newValue){
                chrome.declarativeNetRequest.updateEnabledRulesets({
                    enableRulesetIds: ["cookieOmit"]
                }, ()=>{});
            }else{
                chrome.declarativeNetRequest.updateEnabledRulesets({
                    disableRulesetIds: ["cookieOmit"]
                }, ()=>{});
            }
        }
        if(key === "daka"){
            if(newValue)
                checkMedalDaka();
        }
    }
});

/**
 * Communicate with content scripts, since content scripts
 * cannot load some info.
 * */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        if(request.msg === "get_LoginInfo"){
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
                function (jct) {
                    (jct === null)?chrome.storage.local.set({'jct':-1}, ()=>{}):chrome.storage.local.set({'jct':jct.value}, ()=>{});
                    chrome.storage.local.get(['jct', 'uuid'], (info)=>{
                        sendResponse({res:info.jct+","+info.uuid+","+info.uuid});
                    });
                });
        }
        if (request.msg === "get_LIVE_BUVID"){
            chrome.cookies.get({url:'https://live.bilibili.com/', name:'LIVE_BUVID'}, function (cookie){
                (cookie === null)?chrome.storage.local.set({'buvid':-1}, ()=>{}):chrome.storage.local.set({'buvid':cookie.value}, ()=>{});
                sendResponse({res:cookie});
            })
        }
        if(request.msg === "get_UUID") {
            chrome.storage.local.get(['uuid'],(uid)=>{
                sendResponse({res:uid.uuid});
            });
        }
        if(request.msg === 'get_LoginStatus'){
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'DedeUserID'},(uid)=>{
                if (uid === null || uid === undefined)
                    sendResponse({login:false, vip:0});
                else{
                    fetch(`https://api.bilibili.com/x/space/acc/info?mid=${uid.value}`,{
                        method: 'GET',
                        credentials: 'include',
                        body: null
                    })
                        .then(res=>res.json())
                        .then(result=>{
                            result["code"]===0 && result["data"]!==null?sendResponse({login:true, vip:result["data"]['vip']['type']}):sendResponse({login:true, vip:1});
                        }).catch(e=>{
                        sendResponse({login:true, vip:1});
                    });
                }
            });
        }
        if(request.msg === "updateStatus") {
            chrome.storage.local.get(['updateAvailable', 'availableBranch'],(info)=>{
                sendResponse({res:info.updateAvailable, address:info.availableBranch});
            });
        }
        if(request.msg === "popupfired"){setBadge("rua豹器", "");sendResponse({res:'ok'});}
        if(request.msg === "requestDownload"){
            chrome.downloads.download({filename: request.fileName, url: request.url},()=>{});
            sendResponse({res:'ok'});
        }
        if(request.msg === "requestDanmaku"){
            let danmakuBulider = new DanmakuArr();
            for (let i = 0; i < request.danmakuObj.length; i++) {
                if(request.danmakuObj[i]["progress"]===undefined)
                    request.danmakuObj[i]["progress"] = 0;
                danmakuBulider.push(new DanmakuObj(convertMSToS(request.danmakuObj[i]["progress"]), request.danmakuObj[i]["midHash"], request.danmakuObj[i]["content"], request.danmakuObj[i]["color"], request.danmakuObj[i]["mode"], request.danmakuObj[i]["fontsize"], request.danmakuObj[i]["progress"], request.danmakuObj[i]["weight"]));
            }
            danmakuBulider.sort(danmakuBulider.size-1);
            sendResponse({danmakuContent: danmakuBulider, danmakuPoolSize: request.danmakuObj.length});
        }
        if(request.msg === "requestCrackUID"){
            sendResponse({response:new CRC32().crack(request.mid)});
        }
        if(request.msg === "requestUserInfo"){
            fetch("https://api.bilibili.com/x/web-interface/card?mid="+request.mid+"&photo=true&requestFrom=rua5", {
                method:"GET",
                headers: {'Accept': 'application/json'},
                credentials: 'include',
                body: null
            })
                .then(res => res.json())
                .then(result=>{
                    if(result["code"]===0 && result["data"]!==null){
                        sendResponse({response:result["data"]["card"]});
                    }
                });
        }
        if(request.msg === 'requestOSInfo'){
            chrome.runtime.getPlatformInfo((info)=>{
                sendResponse({'os':info.os});
            });
        }
        if(request.msg === 'requestReload'){
            initialize(true).then(r=>{
                sendResponse({res:"ok"});
            });
        }
        if(request.msg.includes("QNV")){
            chrome.storage.sync.set({"qnvalue": request.msg.split("?")[1]}, function (){});
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

function getFollowingList(){
    let flag = new AbortController();
    setTimeout(()=>{
        flag.abort('timeout');
    }, 3000);
    fetch(`https://api.bilibili.com/x/v2/reply/at`, {
        method:'GET',
        credentials: 'include',
        signal: flag.signal,
        body:null
    }).then(r=>r.json())
        .then(json=>{
            if (json['code']===0){
                chrome.storage.sync.get(["blackListLive", "blackListHB"], (result)=>{
                    let followList = [];
                    for (let i = 0; i < json['data']['groups'].length; i++) {
                        for (let j = 0; j < json['data']['groups'][''+i]['items'].length; j++) {
                            followList.push(json['data']['groups'][''+i]['items'][j+'']['mid']);
                        }
                    }
                    console.log(`Load following list complete. ${followList.length} followings found, ${result['blackListLive'].length} live notifications are ignored.`);
                    queryLivingRoom(followList, result['blackListLive'], result['blackListHB']);
                });
            }
        })
        .catch(e=>{
            errorHandler('getFollowing', e, 'getFollowingList(); line 500');
        });
}
/**
 * Check live room status once for all.
 *
 * API: https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids
 * method: POST
 * attention: not accept cookie.
 *
 * @param {array} uids the group of followed uid.
 * @param {array} blackListNT the group of followed but no notification.
 * @param {array} blackListHB the group of followed but stop send heart beat.
 * */
function queryLivingRoom(uids, blackListNT, blackListHB) {
    let flag = new AbortController();
    setTimeout(()=>{
        flag.abort('timeout');
    }, 3000);
    chrome.storage.local.get(['uuid', 'notificationList', 'watchingList', 'heartRhythm', 'buvid', 'medalList'],(info)=>{
        let notificationList = info.notificationList;
        let watchingList = info.watchingList;
        let liveInfo = info['heartRhythm'];
        let body = '{"uids": [' + uids +']}';
        fetch("https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?requestFrom=rua5",{
            method:"POST",
            credentials: "omit",
            signal:flag.signal,
            body:body
        })
            .then(res => res.json())
            .then(json => {
                if (json["code"] === 0) {
                    let data = json["data"];
                    chrome.notifications.getAll((n)=>{
                        for (let k in n){
                            if (uids.indexOf(k.split(':')[0]-0)===-1 && k.split(':')[2]==='live.bilibili.com/'){
                                chrome.notifications.clear(k);
                                if (notificationList.indexOf(k.split(':')[1]-0)!==-1)
                                    notificationList.splice(notificationList.indexOf(k.split(':')[1]-0),1);
                            }
                        }
                        for (let i = 0; i < uids.length; i++) {
                            if (data[uids[i]] !== undefined) {
                                if(data[uids[i]]["live_status"] !== 1 && notificationList.indexOf(data[uids[i]]["room_id"]) !== -1){
                                    chrome.notifications.clear(`${uids[i]}:${data[uids[i]]["room_id"]}:live.bilibili.com/`);
                                    notificationList.splice(notificationList.indexOf(data[uids[i]]["room_id"]),1);
                                    watchingList[data[uids[i]]["room_id"]+""] = -2;
                                    liveInfo.splice(liveInfo.findIndex(e => e.ruid === data[uids[i]]['uid']), 1);
                                }
                                if (data[uids[i]]["live_status"] === 1 && liveInfo.findIndex(e=>e.ruid === data[uids[i]]['uid'])===-1 && !blackListHB.includes(data[uids[i]]['uid'])){
                                    liveInfo.push({
                                        id: [data[uids[i]]['area_v2_parent_id'], data[uids[i]]['area_v2_id'], 0, data[uids[i]]['room_id']],
                                        device: [info['buvid'], getUUID()],
                                        ruid: data[uids[i]]['uid']
                                    });
                                }
                                let rhythmTemp = [];
                                for (const medalItem of info.medalList){
                                    for (let i = 0; i < liveInfo.length; i++) {
                                        if (medalItem['medal_info']['level']<20 && medalItem['medal_info']['target_id'] === liveInfo[i]['ruid'] && medalItem['medal_info']['today_feed'] < medalItem['medal_info']['day_limit'])
                                            rhythmTemp.push(liveInfo[i]);
                                    }
                                }
                                liveInfo = [];
                                liveInfo = rhythmTemp;
                                if (data[uids[i]]["live_status"] === 1 && notificationList.indexOf(data[uids[i]]["room_id"]) === -1) {
                                    if(!blackListNT.includes(data[uids[i]]['uid'])){
                                        notificationList.push(data[uids[i]]["room_id"]);
                                        watchingList[data[uids[i]]["room_id"]+""] = 0;
                                        chrome.storage.sync.get(["notification"], (result)=>{
                                            if(result.notification) {
                                                console.log(data[uids[i]]["title"] + " " + data[uids[i]]["uname"] + " " + new Date());
                                                pushNotificationChrome(data[uids[i]]["title"], data[uids[i]]["uname"], data[uids[i]]["room_id"], data[uids[i]]["cover_from_user"], data[uids[i]]["broadcast_type"] === 1 ? 1 : 0, data[uids[i]]["face"], uids[i]);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        chrome.storage.local.set({'notificationList': notificationList, 'watchingList': watchingList, 'heartRhythm': liveInfo}, ()=>{});
                    });

                }
            })
            .catch(msg =>{errorHandler('getFollowing', msg, 'queryLivingRoom(); line 500');});
    });
}

function getUUID(){
    let UUID = '';
    for (let i = 0; i < 36; i++) {
        const bit =  Math.floor(16 * Math.random());
        if (i===8 || i===13 || i===18 || i===23)
            UUID+='-';
        else if (i===14)
            UUID+='4';
        else if (i===19)
            UUID+=(3&bit|8).toString(16);
        else UUID+=bit.toString(16);
    }
    return UUID;
}

function pushNotificationChrome(roomTitle, liverName, roomUrl, cover, type, face, uid){
    try{
        let msg = liverName + " 开播啦!\r\n是"+(type===0?"电脑":"手机")+"直播！";
        chrome.storage.local.get(["imageNotice"], (result)=>{
            result.imageNotice?imageNotification(uid, roomTitle, msg, roomUrl, cover, face, "live.bilibili.com/"):basicNotification(uid, roomTitle, msg, roomUrl, face, "live.bilibili.com/");
        });
    }catch (e){}
}

/**
 * Create notification. (Web Extension API ver.)
 * normal ver.
 *
 * @param {number} uid, a random number for notification id.
 * @param {string} roomTitle, live room title.
 * @param {string} msg, notification content.
 * @param {string} roomUrl, part of live URL for click jump to.
 * @param {string} cover, notification icon, normally will be up's face.
 * @param {string} URLPrefix, "live.bilibili.com/", will be combined with roomUrl to build a full link.
 * */
function basicNotification(uid, roomTitle, msg, roomUrl, cover, URLPrefix){
    cover = cover.length==null||cover.length===0?"../images/haruka128.png":cover;
    chrome.notifications.create(uid+":"+roomUrl+":"+URLPrefix, {
            type: "basic",
            iconUrl: cover,
            title: roomTitle,
            message: msg,
            contextMessage:"rua豹器"
        }, function (id) {}
    );
}

/**
 * Create notification. (Web Extension API ver.)
 * image ver.
 *
 * @param {number} uid, a random number for notification id.
 * @param {string} roomTitle, live room title.
 * @param {string} msg, notification content.
 * @param {string} roomUrl, part of live URL for click jump to.
 * @param {string} cover, notification content image, normally will be live room face.
 * @param {string} face, notification icon, normally will be up's face.
 * @param {string} URLPrefix, "live.bilibili.com/", will be combined with roomUrl to build a full link.
 * */
function imageNotification(uid, roomTitle, msg, roomUrl, cover, face, URLPrefix){
    face = face.length==null||face.length===0?"../images/haruka128.png":face;
    cover = cover.length==null||cover.length===0?face:cover;
    chrome.notifications.create(uid+":"+roomUrl+":"+URLPrefix, {
            type: "image",
            iconUrl: face,
            title: roomTitle,
            message: msg,
            imageUrl: cover,
            contextMessage:"rua豹器"
        }, function (id) {}
    );
}

/**
 * A handler for notification click event.
 * When click the notification, browser will
 * open the URL contained in notifications for
 * users.
 * */
chrome.notifications.onClicked.addListener(function (nid) {
    chrome.storage.local.get(['winIDList'],(info)=>{
        let winIDList = WindowIDList.convertFromJSON(info.winIDList);
        chrome.windows.getAll(function (wins){
            if(wins.length>0){
                // why google did not fix this bug over 6 years? WTF
                // chrome.windows.getLastFocused(function (Lwin){
                //     chrome.windows.update(Lwin.id, {focused: true});
                //     chrome.tabs.create({url: "https://live.bilibili.com/"+nid.split(":")[1]});
                // });
                chrome.windows.update(winIDList.getCurrent(), {focused: true});/*ensure the browser will always open tabs in the most top window.*/
                chrome.tabs.create({url: `https://${nid.split(":")[2]}${nid.split(":")[1]}`});
            }else
                chrome.windows.create({url: `https://${nid.split(":")[2]}${nid.split(":")[1]}`});
        });
    });
    chrome.notifications.clear(nid);
});

//setTimeout(loadSetting, 100);
function scheduleCheckIn(shift){
    chrome.alarms.create('checkIn', {'when':Date.now()+shift, periodInMinutes:60*12});
    chrome.alarms.create('bcoin', {'when':Date.now()+1000+shift, periodInMinutes:60*12});
    chrome.alarms.create('daka', {'when':Date.now()+2000+shift, periodInMinutes:60*6});
    // chrome.alarms.create('watching', {'when':Date.now()+2000+shift, periodInMinutes:0.34});
}

/**
 * Load cookies to check users' login status.
 * All functions should work when users' login info is set only.
 * */
function reloadCookies() {
    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'DedeUserID'},
        function (uid) {
            uid === null || uid.expirationDate === null || uid.expirationDate<Date.parse(new Date())/1000?chrome.storage.local.set({'uuid':-1}, ()=>{}):chrome.storage.local.set({'uuid':uid.value}, ()=>{});
            chrome.storage.local.get(['uuid', 'p_uuid'], (uids)=>{
                if ((uids.uuid === -1) && uids.uuid !== uids.p_uuid) {
                    // if not log in then stop update liver stream info.
                    console.log("Session info does not exist, liver stream info listener cleared.");
                    chrome.alarms.getAll((alarms)=>{
                        for(let name of alarms){
                            console.log(`alarm ${name.name} found`);
                            if (name.name !== 'checkUpd' && name.name !== 'getUID_CSRF') chrome.alarms.clear(name.name).then(r=>{console.log(`${name.name} was cleared ${r}`)});
                        }
                    })
                }
                if (uids.uuid !== -1 && uids.uuid !== uids.p_uuid) {
                    // log in info changed then load following list and start update liver stream info every 3 min.
                    console.log("Session info got.");
                    refreshHeartBeatList();
                    chrome.alarms.create('getNewVideos',{'when': Date.now(), periodInMinutes: 0.33});
                    chrome.alarms.create('getFollowing', {'when': Date.now(), periodInMinutes: 0.2});
                    chrome.alarms.create('getNewUnreads', {'when': Date.now()+5000, periodInMinutes: 0.2});
                    chrome.alarms.create('getNewDynamics', {'when': Date.now()+11000, periodInMinutes: 0.33});
                    scheduleCheckIn(3000);
                }
                chrome.storage.local.set({'p_uuid': uids.uuid},()=>{});
            });
        });

    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
        function (jct) {(jct === null)?chrome.storage.local.set({'jct':-1}, ()=>{}):chrome.storage.local.set({'jct':jct.value}, ()=>{})});
    chrome.cookies.get({url: 'https://live.bilibili.com/', name: 'LIVE_BUVID'},
        function (buvid) {(buvid === null)?chrome.storage.local.set({'buvid':-1}, ()=>{}):chrome.storage.local.set({'buvid':buvid.value}, ()=>{})});
}

chrome.alarms.onAlarm.addListener((alarm)=>{
    //console.log(alarm.name)
    if (alarm.name === 'getUID_CSRF'){
        reloadCookies();
    }
    if (alarm.name === 'checkUpd'){
        checkUpdate("https://tyrael-lee.gitee.io/harukaemoji/?_=")
    }
    chrome.storage.local.get(['uuid', 'jct', "dakaUid"], (info)=>{
        switch (alarm.name) {
            case 'getFollowing':
                getFollowingList();
                break;
            case 'getNewVideos':
                videoNotify(info.uuid);
                break;
            case 'getNewUnreads':
                getNewUnread();
                break;
            case 'getNewDynamics':
                dynamicNotify();
                break;
            case 'checkIn':
                checkingIn();
                break;
            case 'daka':
                checkMedalDaka();
                break;
            case 'bcoin':
                queryBcoin();
                break;
            case 'dakaRoom':
                daka(info.dakaUid, info.jct, "打卡");
                break;
            case 'heartRate':
                chrome.storage.sync.get(['heartBeatSwitch'], (synced)=>{
                    if (synced['heartBeatSwitch'])heartBeat();
                });
                //heartBeat();
                break;
            case 'refreshHB':
                refreshHeartBeatList();
                break;
            case 'refreshHBRetry':
                refreshHeartBeatList();
                break;
        }
    });
});

function checkingIn(){
    chrome.storage.sync.get(["checkIn"], (result)=>{
        if(result.checkIn){
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign",{
                method:"GET",
                credentials: 'include',
                body: null
            }).then(res => {
                console.log("签到成功 "+new Date().toUTCString());
            }).catch(msg =>{errorHandler('checkIn', msg, 'checkIn(); line 673');});
        }
    });
}

/**
 * Handler for network error,
 * For 412 internal error wait for 20 mins,
 * others retry after 20 secs.
 *
 * @param handler, the function which need to be handled.
 * @param msg, the error message.
 * @param at, the location where this error occurs.
 * */
function errorHandler(handler, msg, at){
    console.log("ERROR found @ "+new Date()+":");
    console.log(`${msg} at function ${at}`);
    let minutes = 0.2;
    if(handler.includes('checkIn') || handler.includes('bcoin')) minutes = 60 * 12;
    else if(handler.includes('daka')) minutes = 60 * 6;
    else minutes = 0.2;
    if (handler.includes('Dynamic')){
        chrome.storage.local.set({'dynamicInit':true},()=>{});
    }else if (handler.includes('Video')){
        chrome.storage.local.set({'videoInit':true},()=>{});
    }else if (handler.includes('Unread')){
        chrome.storage.local.set({'unreadInit':true},()=>{});
    }
    if(typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412  || msg == -412){
        chrome.alarms.clear(handler).then(c =>{
            chrome.alarms.create(handler, {'when': Date.now()+1500000, periodInMinutes: minutes});
        });
    }else if (!(msg+"").includes('AbortError: The user aborted a request')){
        chrome.alarms.clear(handler).then(c =>{
            chrome.alarms.create(handler, {'when': Date.now()+20000, periodInMinutes: minutes});
        });
    }
}

/**
 * Exchange B coin section.
 * */
function exchangeBCoin(JCT){
    let form = new FormData();
    form.append('type', '1');
    form.append('csrf', JCT);
    fetch("https://api.bilibili.com/x/vip/privilege/receive?requestFrom=rua5",{
        method:"POST",
        credentials: 'include',
        body:form
    })
        .then(res => res.json())
        .then(json => {
            switch (json['code']) {
                case 0:
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
                    break;
                case 69155:
                    console.log("当前非大会员");
                    break;
                default:
                    console.log("兑换失败，位置错误");
                    break;
            }
        }).catch(msg =>{errorHandler('bcoin', msg, 'exchangeBCoin(); line 742');});
}

function queryBcoin(){
    chrome.storage.sync.get(["bcoin"], (result)=>{
        if(result.bcoin){
            fetch("https://api.bilibili.com/x/vip/privilege/my",{
                method:"GET",
                credentials: 'include',
                body: null
            })
                .then(res => res.json())
                .then(json => {
                    console.log("checked vip status");
                    if (json["code"] === 0){
                        if(json["data"]["list"]["0"]["type"]===1&&json["data"]["list"]["0"]["state"]===0){
                            chrome.storage.local.get(['jct'], (info)=>{
                                exchangeBCoin(info.jct);
                            });
                        }
                        else if(json["data"]["list"]["0"]["type"]===1&&json["data"]["list"]["0"]["state"]===1)
                            console.log("这个月的已经兑换过了，好耶！( •̀ ω •́ )✧");
                    }
                }).catch(msg =>{errorHandler('bcoin', msg, 'queryBcoin(); line 765');});
        }
    });
}

/**
 * Check and notify dynamic update section.
 *
 * new video part.
 * */

function getNewPost(requestType){
    let flag = new AbortController();
    setTimeout(()=>{
        flag.abort('timeout');
    }, 3000);
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get(['video_id_list', 'pgc_id_list', 'article_id_list', 'videoInit'], (info)=>{
            let dynamic_id_list = requestType==='video'?info.video_id_list:(requestType==='pgc'?info.pgc_id_list:info.article_id_list);
            fetch(`https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?page=1&type=${requestType}`, {
                method:'GET',
                credentials: 'include',
                signal: flag.signal,
                body:null
            }).then(r=>r.json())
                .then(json=>{
                    chrome.storage.sync.get(["dynamicPush", "blackListVideo", "videoPush", "pgcPush", "articlePush"], (result)=>{
                        if (json['code']!==0) reject(json['code']);
                        else if(json["code"] === 0){
                            if(result.dynamicPush){
                                let o = json["data"]["items"];
                                for (let i = 0; i < o.length; i++) {
                                    let dynamicMajor = o[i+""]["modules"]['module_dynamic']['major'];
                                    let dynamicContent = requestType==='video'?dynamicMajor['archive']:(requestType==='pgc'?dynamicMajor['pgc']:dynamicMajor['article']);
                                    let dynamicUser = o[i+""]["modules"]["module_author"];
                                    let uid = dynamicUser['mid']-0;
                                    if(!dynamic_id_list.includes(o[i+""]["id_str"]) && !result['blackListVideo'].includes(uid)){
                                        if (!info.videoInit && requestType==='video' && result.videoPush && isNew(dynamicUser['pub_ts']) /*&& !dynamicContent['title'].includes("【直播回放】")*/){
                                            console.log(`你关注的up ${dynamicUser['name']} 投稿了新视频！${dynamicContent['title']} see:${dynamicContent['bvid']}`);
                                            basicNotification(o[i+""]["id_str"], `你关注的up ${dynamicUser['name']} 投稿了新视频！`, dynamicContent["title"], dynamicContent['bvid'], dynamicUser["face"], "b23.tv/");
                                        }
                                        if (!info.videoInit && requestType === 'pgc' && result.pgcPush){
                                            console.log("你关注的番剧 "+dynamicUser['name']+" 更新了！"+dynamicContent["title"]+" see:"+dynamicContent["jump_url"]);
                                            basicNotification(o[i+""]["id_str"], "你关注的番剧 "+dynamicUser['name']+" 更新了！",dynamicContent["title"],dynamicContent["jump_url"].replaceAll('https://','').replaceAll('http://',''), dynamicContent["cover"],"");
                                        }
                                        if (!info.videoInit && requestType === 'article' && result.articlePush && isNew(dynamicUser['pub_ts'])){
                                            console.log(`你关注的up ${dynamicUser['name']} 投稿了文章！${dynamicContent['title']} see:${dynamicContent['id']}`);
                                            basicNotification(o[i+'']['id_str'], `你关注的up ${dynamicUser['name']} 投稿了文章！`, dynamicContent['title'], dynamicContent['id'], dynamicUser["face"], "www.bilibili.com/read/cv");
                                        }
                                        dynamic_id_list.push(o[i+""]["id_str"]);
                                    }
                                }
                                if (dynamic_id_list.length >= 40){
                                    dynamic_id_list.splice(0,10);
                                }
                                switch (requestType){
                                    case 'video':
                                        chrome.storage.local.set({"video_id_list": dynamic_id_list}, ()=>{});
                                        break;
                                    case 'pgc':
                                        chrome.storage.local.set({"pgc_id_list": dynamic_id_list}, ()=>{});
                                        break;
                                    case 'article':
                                        chrome.storage.local.set({"article_id_list": dynamic_id_list}, ()=>{});
                                        break;
                                }
                                resolve(200);
                            }
                        }
                    });
                }).catch(e=>{reject(e);});
        });
    });

}

function isNew(ts){
    return ((Date.now() / 1000.0) - (ts-0)) < 600
}

async function videoNotify(UUID){
    try {
        await getNewPost('video');
        await getNewPost('pgc');
        await getNewPost('article');
    }catch (e) {
        console.log(e);
        errorHandler('getNewVideos',e, 'videoNotify(); line 934');
    }

    await chrome.storage.local.set({'videoInit': false}, ()=>{});
}

/**
 * Check and notify dynamic update section.
 *
 * new dynamic part. Basically as same as above but with different types in the API link,
 * and different callback cards.
 * */
function dynamicNotify(){
    let flag = new AbortController();
    setTimeout(()=>{
        flag.abort('timeout');
    }, 3000);
    chrome.storage.local.get(['dynamicList', 'dynamicInit'], (r)=>{
        let dynamic_id_list = r.dynamicList, nowTS = Date.now() / 1000.0;
        fetch(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?type_list=1,2,4`,{
            method:'GET',
            credentials:'include',
            signal: flag.signal,
            body:null
        })
            .then(r=>r.json())
            .then(json=>{
                if(json['code']!==0){
                    errorHandler('getNewDynamics', json['code'], 'dynamicNotify(); line 841');
                }else{
                    chrome.storage.sync.get(['dynamicSwitch', 'blackListDynamic'], (result=>{
                        let o = json["data"]["cards"];
                        for (let i = 0; i < o.length; i++){
                            let c = JSON.parse(o[i+""]["card"]);
                            let type = o[i+""]["desc"]["type"], uid = o[i+""]["desc"]["uid"]-0;
                            if(!dynamic_id_list.includes(o[i+""]["desc"]["dynamic_id"]) && (nowTS - (o[i+""]["desc"]["timestamp"]-0)) < 300){
                                if(!r.dynamicInit && result.dynamicSwitch && !result['blackListDynamic'].includes(uid)){
                                    switch (type){
                                        case 1:
                                            console.log("你关注的up "+c["user"]["uname"]+" 转发了一条新动态 "+c['item']['content']+" see:"+`https://t.bilibili.com/${o[i+""]["desc"]["dynamic_id_str"]}`);
                                            basicNotification(o[i+""]["desc"]["dynamic_id"], `你关注的up ${c["user"]["uname"]} 转发了一条动态`,c['item']['content']+"", o[i+""]["desc"]["dynamic_id_str"], c["user"]['face'],"t.bilibili.com/");
                                            break;
                                        case 2:
                                            console.log("你关注的up "+c["user"]["name"]+" 发了一条新动态 "+c['item']['description']+" see: "+ `https://t.bilibili.com/${o[i+""]["desc"]["dynamic_id_str"]}`);
                                            basicNotification(o[i+""]["desc"]["dynamic_id"], `你关注的up ${c["user"]["name"]} 发了一条图片动态`,c['item']['description']+"", o[i+""]["desc"]["dynamic_id_str"], c["user"]['head_url'],"t.bilibili.com/");
                                            break;
                                        case 4:
                                            console.log("你关注的up "+c["user"]["uname"]+" 发了一条新动态 "+c['item']['content']+" see: " + `https://t.bilibili.com/${o[i+""]["desc"]["dynamic_id_str"]}`);
                                            basicNotification(o[i+""]["desc"]["dynamic_id"], `你关注的up ${c["user"]["uname"]} 发了一条新动态`,c['item']['content']+"", o[i+""]["desc"]["dynamic_id_str"], c["user"]['face'],"t.bilibili.com/");
                                            break;
                                    }
                                }
                                dynamic_id_list.push(o[i+""]["desc"]["dynamic_id"]);
                                if(dynamic_id_list.length>40)
                                    dynamic_id_list.splice(0,1);
                            }
                        }
                        chrome.storage.local.set({'dynamicList':dynamic_id_list}, ()=>{});
                    }));
                }
                chrome.storage.local.set({'dynamicInit': false},()=>{});
            })
            .catch(e=>{errorHandler('getNewDynamics', e, 'dynamicNotify(); line 875')});
    });
}

/**
 * Check the new unread message and push a notification.
 **/
function getNewUnread(){
    chrome.storage.local.get(["unreadData", "unreadInit", "unreadMessage"], async (result)=>{
        let unreadData = JSON.parse(result.unreadData);
        await fetch('https://api.bilibili.com/x/msgfeed/unread',{
            method:'GET',
            credentials: 'include',
            body: null
        })
            .then(result => result.json())
            .then(json =>{
                if(json.code === 0){
                    chrome.storage.sync.get(['unreadSwitch'], (r)=>{
                        if(r.unreadSwitch){
                            if(!result.unreadInit && (json['data']['at'] - unreadData['at']>0 || json['data']['like'] - unreadData['like']>0 || json['data']['reply'] - unreadData['reply']>0 || json['data']['sys_msg'] - unreadData['sys_msg']>0 || json['data']['up'] - unreadData['up']>0)) {
                                let msgContent = `${json['data']['at'] - unreadData['at'] > 0 ? json['data']['at'] - unreadData['at'] + '个@, ' : ''}${json['data']['like'] - unreadData['like'] > 0 ? json['data']['like'] - unreadData['like'] + '个赞, ' : ''}${json['data']['reply'] - unreadData['reply'] > 0 ? json['data']['reply'] - unreadData['reply'] + '个回复, ' : ''}${json['data']['sys_msg'] - unreadData['sys_msg'] > 0 ? json['data']['sys_msg'] - unreadData['sys_msg'] + '个系统通知, ' : ''}${json['data']['up'] - unreadData['up'] > 0 ? json['data']['up'] - unreadData['up'] + '个up助手提醒, ' : ''}`;
                                chrome.notifications.clear('-276492:reply:message.bilibili.com/#/');
                                basicNotification(-276492, "你收到了新的消息:", msgContent.substring(0, msgContent.length-2), `reply`, '', `message.bilibili.com/#/`);
                            }
                            unreadData = json.data;
                            chrome.storage.local.set({"unreadData":JSON.stringify(unreadData)}, ()=>{});
                        }
                    });
                }else{
                    errorHandler('getNewUnreads', json.code, 'getUnread(); line 905');
                }
            })
            .catch(e=>{
                errorHandler('getNewUnreads', e, 'getUnread(); line 909');
            });
        await fetch('https://api.vc.bilibili.com/session_svr/v1/session_svr/single_unread', {
            method:'GET',
            credentials:'include',
            body:null
        })
            .then(r => r.json())
            .then(json =>{
                if (json.code === 0){
                    chrome.storage.sync.get(['unreadSwitch'], (r)=>{
                        if(r.unreadSwitch){
                            if(!result.unreadInit && (json['data']['biz_msg_follow_unread']+json['data']['biz_msg_unfollow_unread']+json['data']['dustbin_push_msg']+json['data']['dustbin_unread']+json['data']['follow_unread']+json['data']['unfollow_push_msg']+json['data']['unfollow_unread']) - result.unreadMessage > 0){
                                chrome.notifications.clear('-276491:reply:message.bilibili.com/#/');
                                basicNotification(-276491, `你收到了${(json['data']['biz_msg_follow_unread']+json['data']['biz_msg_unfollow_unread']+json['data']['dustbin_push_msg']+json['data']['dustbin_unread']+json['data']['follow_unread']+json['data']['unfollow_push_msg']+json['data']['unfollow_unread']) - result.unreadMessage}条新私信`, '', `reply`, '', `message.bilibili.com/#/`);
                            }
                        }
                        chrome.storage.local.set({"unreadMessage":(json['data']['biz_msg_follow_unread']+json['data']['biz_msg_unfollow_unread']+json['data']['dustbin_push_msg']+json['data']['dustbin_unread']+json['data']['follow_unread']+json['data']['unfollow_push_msg']+json['data']['unfollow_unread'])}, ()=>{});
                    });
                }else{
                    errorHandler('getUnread', json.code,'getUnread(); line 929');
                }
            })
            .catch(e=>{
                errorHandler('getUnread', e, 'getUnread(; line 933)');
            });
        chrome.storage.local.set({'unreadInit': false},()=>{});
    });
}

/**
 * Live room check in section.
 * */
function checkMedalDaka(){
    chrome.storage.sync.get(["daka", "blackListDK"], (result)=>{
        console.log("Grabbing medal info");
        chrome.storage.local.get(['rua_lastDK', 'uuid', 'dakaUid'], (info=>{
            if(result.daka && (info.rua_lastDK===null || isNewerThan(info.rua_lastDK.split("-"), (getUTC8Time().getFullYear()+"-"+getUTC8Time().getMonth()+"-"+getUTC8Time().getDate()).split("-")))){
                let medals = [];
                chrome.storage.local.set({'rua_lastDK':getUTC8Time().getFullYear()+"-"+getUTC8Time().getMonth()+"-"+getUTC8Time().getDate()}, ()=>{});
                fetch("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+info.uuid, {
                    method:"GET",
                    credentials: 'include',
                    body: null
                })
                    .then(res => res.json())
                    .then(json => {
                        console.log(json["data"]["list"].length+" medal founded.");
                        console.log(`${json["data"]["list"].length} medal founded, ${result['blackListDK'].length} ignored.`)
                        console.log(info.dakaUid)
                        for (let i = 0; i < json["data"]["list"].length; i++){
                            if(result['blackListDK'].indexOf(json["data"]["list"][i]["medal_info"]["target_id"])===-1 && info.dakaUid.indexOf(json["data"]["list"][i]["medal_info"]["target_id"])===-1 && json["data"]["list"][i]["medal_info"]["today_feed"]<100)
                                medals.push(json["data"]["list"][i]["medal_info"]["target_id"]);
                        }
                        chrome.storage.local.set({'dakaUid': medals}, ()=>{
                            chrome.alarms.create('dakaRoom', {'when':Date.now(), periodInMinutes:0.1});
                        });
                    })
                    .catch(msg => {
                        chrome.storage.local.set({'rua_lastDK':"1970-01-01"}, ()=>{});
                        errorHandler('daka',msg, 'checkMedalDaka(); line 968');
                    });
            }else console.log("No more grab needed.");
        }));

    });
}

/**
 * Send damaku to all live rooms you are following.
 *
 * @param {array} dakaUid the group of uid which is following, for query the true(long) room id.
 * @param {string} jct the csrf token.
 * @param {string} dkMsg the context to send.
 * */
function daka(dakaUid, jct, dkMsg){
    if (dakaUid.length===0){
        chrome.alarms.clear('dakaRoom',()=>{});
    }else{
        fetch("https://api.live.bilibili.com/live_user/v1/Master/info?uid="+dakaUid[0], {
            method:"GET",
            credentials: 'include',
            body: null
        })
            .then(res => res.json())
            .then(json => {
                if(json["code"]===0 || json["data"].length>0){
                    let DanMuForm = new FormData();
                    DanMuForm.append("bubble", "0");
                    DanMuForm.append("msg", dkMsg);
                    DanMuForm.append("color", "16777215");
                    DanMuForm.append("mode", "1");
                    DanMuForm.append("fontsize", "25");
                    DanMuForm.append("rnd", Math.round(Date.now()/1000)+"");
                    DanMuForm.append("roomid", json["data"]["room_id"]);
                    DanMuForm.append("csrf", jct);
                    DanMuForm.append("csrf_token", jct);
                    fetch("https://api.live.bilibili.com/msg/send?requestFrom=rua5", {
                        method:"POST",
                        credentials: 'include',
                        body: DanMuForm
                    }).then(result=>{
                        console.log("打卡成功: https://live.bilibili.com/"+json["data"]["room_id"]);
                        let list = dakaUid;
                        list.splice(0,1);
                        chrome.storage.local.set({'dakaUid':list},()=>{}); // check here
                    }).catch(error=>{console.error('Error:', error);});
                }
            });
    }
}

/**
 * Analysis selected text is a/bv id or not.
 *
 * @param {string} videoTag the selected context in the context menu.
 * @return {Promise} is an a/bv number or not.
 * */
async function legalVideoLink(videoTag){
    let headB = "AaBb";
    let headE = "Vv";
    if(headB.includes(videoTag.charAt(0)) && headE.includes(videoTag.charAt(1))){
        return headB.substr(0,2).includes(videoTag.charAt(0))?await findVideo("aid="+videoTag.substr(2,videoTag.length-1)):await findVideo("bvid="+videoTag);
    }
    return false;
}

/**
 * Query selected a/bv id is exists or not.
 *
 * @param {string} vid the video tag/id.
 * @return {Promise} contain result for that video is exists or not.
 * */
function findVideo(vid){
    return fetch("https://api.bilibili.com/x/web-interface/view?"+vid, {
        method: 'GET',
        credentials:"include",
        body:null
    })
        .then(r => r.json())
        .then(json =>{
            return json['code'] === 0;
        })
}

/**
 * Check updated section.
 * */
function checkUpdate(url){
    console.log("checking update at "+(new URL(url)).hostname);
    let latestVersion = chrome.runtime.getManifest().version.split('.');
    fetch(url+new Date().getTime(), {
        method:'GET',
        credentials: 'omit',
        body:null
    }).then(t=>t.text())
        .then(text=>{
            if (text !== null && (/<meta name="current-version" content="(.*?)">/m).exec(text) !== null) {
                if(latestVersion !== (/<meta name="current-version" content="(.*?)">/m).exec(text)[1]){
                    latestVersion = (/<meta name="current-version" content="(.*?)">/m).exec(text)[1].split('.');
                    if(latestVersion[0]-0>chrome.runtime.getManifest().version.split('.')[0]-0||latestVersion[0]-0>=chrome.runtime.getManifest().version.split('.')[0]-0 && latestVersion[1]-0>chrome.runtime.getManifest().version.split('.')[1]-0){
                        console.log(`A newer version found: ${latestVersion[0]}.${latestVersion[1]}`);
                        chrome.storage.local.set({'updateAvailable':true},()=>{});
                        chrome.storage.local.set({'availableBranch':new URL(url).hostname.includes("github")?"https://github.com/TyraelDLee/HarukaEmoji/releases/latest":"https://gitee.com/tyrael-lee/HarukaEmoji/releases"},()=>{});
                        setBadge("rua豹器 有更新可用", "1");
                    }else{
                        console.log("Current version is latest.");
                        chrome.storage.local.set({'updateAvailable':false},()=>{});
                        setBadge("rua豹器", "");
                    }
                }
            }
        })
        .catch(e=>{
            console.log(e);
            checkUpdate(url.includes("github")?"https://tyrael-lee.gitee.io/harukaemoji/?_=":"https://tyraeldlee.github.io/HarukaEmoji/?_=");
    });
}

function isNewerThan(dateOld, dateNew){
    return parseInt(dateOld[0])<parseInt(dateNew[0])?true:parseInt(dateOld[0])>parseInt(dateNew[0])?false:parseInt(dateOld[1])<parseInt(dateNew[1])?true:parseInt(dateOld[1])>parseInt(dateNew[1])?false:parseInt(dateOld[2])<parseInt(dateNew[2]);
}

function getUTC8Time(){
    return new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);
    // 早8点后才是新的一天。
    //return new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + 28800000);
}

function setBadge(title, text){
    chrome.action.setTitle({title: title});
    chrome.action.setBadgeText({text: text});
}

function heartBeat(){
    chrome.storage.local.get(['jct', 'uuid', 'heartRhythm'], async (info)=>{
        if (info.uuid === -1 || info.jct === -1){
            chrome.storage.local.set({'heartRhythm': []}, ()=>{});
        }
        let rhythm = info['heartRhythm'];
        if (rhythm.length>0){
            for (let i = 0; i < rhythm.length; i++) {
                rhythm[i] = await QRSComplex(rhythm[i], info.jct);
            }
        }
        chrome.storage.local.set({'heartRhythm': rhythm}, ()=>{});
    });
}

function QRSComplex(rhythm, jct){
    let payload;
    if (rhythm['id'][2]===0){
        payload = {
            id: rhythm['id'],
            device: rhythm['device'],
            ruid: rhythm['ruid'],
            ts: Date.now(),
            is_patch: 0,
            heart_beat: [],
        }
    }else{
        payload = {
            id: rhythm['id'],
            device: rhythm['device'],
            ruid: rhythm['ruid'],
            ets: rhythm['ets'],
            benchmark: rhythm['benchmark'],
            ts: Date.now(),
            time: rhythm['time']
        }
        payload = Object.assign({s: encrypt(payload, rhythm['secret_rule'])}, payload);
    }
    // server only check the s key by given data from client. So the ts, id are not required accurate
    return fetch(`https://live-trace.bilibili.com/xlive/data-interface/v1/x25Kn/${rhythm['id'][2]===0?'E':'X'}`, {
        method: "POST",
        credentials:"include",
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        },
        body: `${objToStr(payload)}&ua=${self.navigator.userAgent}&csrf_token=${jct}&csrf=${jct}&visit_id:`
    }).then(r=>r.json())
        .then(json=>{
            if (json['code'] === 0){
                let seq = rhythm['id'][2]+1;
                return {
                    id: [rhythm['id'][0], rhythm['id'][1],seq, rhythm['id'][3]],
                    device: rhythm['device'],
                    ruid: rhythm['ruid'],
                    ets: json['data']['timestamp'],
                    benchmark: json['data']['secret_key'],
                    time: json['data']['heartbeat_interval'],
                    secret_rule: json['data']['secret_rule']
                };
            }else{
                console.log(`${json['code']} at ${payload}`)
                return {
                    id: [rhythm['id'][0], rhythm['id'][1], 0, rhythm['id'][3]],
                    device: rhythm['device'],
                    ruid: rhythm['ruid']
                }
            }
        });

    function objToStr(object) {
        let out = "";
        for (const i in object) out += `${i}=${encodeURIComponent(i==='id'||i==='device'?JSON.stringify(object[i]):object[i])}&`;
        return out.slice(0, -1);
    }

    function encrypt(object, rule){
        let message = JSON.stringify({
            platform: 'web',
            parent_id: object['id'][0],
            area_id: object['id'][1],
            seq_id: object['id'][2],
            room_id: object['id'][3],
            buvid: object['device'][0],
            uuid: object['device'][1],
            ets: object['ets'],
            time: object['time'],
            ts: object['ts']
        });
        for(let i of rule){
            switch (i){
                case 0:
                    message = CryptoJS.HmacMD5(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                    break;
                case 1:
                    message = CryptoJS.HmacSHA1(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                    break;
                case 2:
                    message = CryptoJS.HmacSHA256(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                    break;
                case 3:
                    message = CryptoJS.HmacSHA224(message,object['benchmark']).toString(CryptoJS.enc.Hex);
                    break;
                case 4:
                    message = CryptoJS.HmacSHA512(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                    break;
                case 5:
                    message = CryptoJS.HmacSHA384(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                    break;
            }
        }
        return message;
    }
}

function refreshHeartBeatList(){
    chrome.storage.local.get(['uuid'], (info)=>{
        fetch(`https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=${info.uuid}`,{
            method:'GET',
            credentials:'include',
            body:null
        }).then(r=>r.json())
            .then(json=>{
                if (json['code'] === 0){
                    chrome.storage.local.set({'medalList': json['data']['list']}, ()=>{});
                }else
                    chrome.alarms.create('refreshHBRetry', {delayInMinutes:1});
            }).catch(e=>{
            chrome.alarms.create('refreshHBRetry', {delayInMinutes:1});
        });
    });
}

// This is the service worker for mv3 which some functions may not support yet.

//todo: check in mv3 √
//todo: stream notification mv3 √
//todo: video update mv3 √
//todo: b coin mv3 √
//todo: daka √
//todo: error handler √
//todo: update check √
//todo: context menu √
//todo: web traffic control. no needed anymore
//todo: hidden √
//todo: mock Android app request. no needed anymore
//todo: add support for mv2.😅 √
//todo: change the dynamic api. √
