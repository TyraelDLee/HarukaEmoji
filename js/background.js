/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
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

!function (){
    const currentVersion = chrome.runtime.getManifest().version;
    const crc = new CRC32();
    var latestVersion = currentVersion.split('.');
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
    var QN = true;
    var QNV = "原画";
    var dynamicPush = false;
    var hiddenEntry = false;
    var dakaSwitch = true;
    var OSInfo = "";
    let enhancedHiddenEntry = false;

    var UUID = -1;
    var JCT = -1;
    var P_UID = UUID;

    var winIDList = new WindowIDList();

    let followingList = [];
    let notificationList = [];

    chrome.notifications.getAll((notifications)=>{
        for (let k in notifications)
            chrome.notifications.clear(k);
    });
    chrome.storage.local.set({'unreadData':'{"at":0,"chat":0,"like":0,"reply":0,"sys_msg":0,"up":0}', 'unreadMessage':0, 'dynamicList':[]}, function (){});

    chrome.runtime.getPlatformInfo((info)=>{OSInfo = info.os;});

    chrome.browserAction.setBadgeBackgroundColor({color: "#00A0FF"});
    chrome.windows.getAll(function (wins){for (let i = 0; i < wins.length; i++) winIDList.push(wins[i].id);});
    chrome.windows.onCreated.addListener(function (win){winIDList.push(win.id);});
    chrome.windows.onRemoved.addListener(function (wID){winIDList.remove(wID);});
    chrome.windows.onFocusChanged.addListener(function (wID){if(wID!==-1) winIDList.push(wID);});
    chrome.runtime.onInstalled.addListener(function (obj){
        // init setting
        if(localStorage.getItem("rua_lastDK")===null)localStorage.setItem("rua_lastDK", "1970-01-01");
        setInitValue('notification', true);
        setInitValue('medal', true);
        setInitValue('checkIn', true);
        setInitValue('bcoin', true);
        setInitValue('qn', true);
        setInitValue('qnvalue', '原画');
        setInitValue('dynamicPush', true);
        setInitValue('hiddenEntry', false);
        setInitValue('daka', true);
        setInitValue('record', false);
        setInitValue('prerecord', 300);
        setInitValue('enhancedHiddenEntry', false);
        setInitValue('unreadSwitch', true);
        setInitValue('dynamicSwitch', true);
        chrome.storage.local.set({"imageNotice": false}, function(){imageNotificationSwitch = false;});
        chrome.tabs.create({url: "./readme.html"});
    });

    function setInitValue(key, defaultVal){
        chrome.storage.sync.get([key], function (value){
            if (value[key]===null || value[key]===undefined)
                chrome.storage.sync.set({[key]:defaultVal},function (){});
        });
    }

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            switch (key) {
                case 'notification':
                    notificationPush = newValue;
                    break;
                case 'checkIn':
                    checkinSwitch = newValue;
                    if(checkinSwitch) checkIn();
                    break;
                case 'imageNotice':
                    imageNotificationSwitch = newValue;
                    break;
                case 'bcoin':
                    BCOIN = newValue;
                    if(BCOIN) queryBcoin();
                    break;
                case 'dynamicPush':
                    dynamicPush = newValue;
                    break;
                case 'hiddenEntry':
                    hiddenEntry = newValue;
                    break;
                case 'enhancedHiddenEntry':
                    enhancedHiddenEntry = newValue;
                    break;
                case 'daka':
                    dakaSwitch = newValue;
                    if(dakaSwitch) checkMedalDaka();
                    break;
            }
        }
    });

    /**
     * Communicate with content script, since content script
     * cannot load some info.
     * */
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        //importScripts("./../ffmpeg/ffmpeg.min.js","./../ffmpeg/ffmpeg-core.js");
            if(request.msg === "get_LoginInfo"){
                chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
                    function (jct) {
                        (jct === null) ? JCT = -1 : JCT = jct.value;
                        sendResponse({res:JCT+","+UUID+","+UUID});
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
                            });
                    }
                });
            }
            if(request.msg === "get_UUID") {sendResponse({res:UUID});}
            if(request.msg === "updateStatus") {sendResponse({res:updateAvailable, address:availableBranch});}
            if(request.msg === "popupfired"){setBadge("rua豹器", "");}
            if(request.msg === "requestDownload"){
                chrome.downloads.download({filename: request.fileName, url: request.url},()=>{});
                sendResponse({res:'ok'});
            }
            if(request.msg === "requestDanmaku"){
                let danmakuBulider = new DanmakuArr();
                for (let i = 0; i < request.danmakuObj.length; i++) {
                    if(request.danmakuObj[i]["progress"]===undefined)
                        request.danmakuObj[i]["progress"] = 0;
                    danmakuBulider.push(new DanmakuObj(convertMSToS(request.danmakuObj[i]["progress"]), crc.crack(request.danmakuObj[i]["midHash"]), request.danmakuObj[i]["content"], request.danmakuObj[i]["color"], request.danmakuObj[i]["mode"], request.danmakuObj[i]["fontsize"], request.danmakuObj[i]["progress"], request.danmakuObj[i]["weight"]));
                }
                danmakuBulider.sort(danmakuBulider.size-1);
                sendResponse({danmakuContent: danmakuBulider, danmakuPoolSize: request.danmakuObj.length});
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
            if(request.msg === "requestEncode"){
                const {createFFmpeg, fetchFile} = FFmpeg;
                const ffmpeg = createFFmpeg({
                    corePath: "./ffmpeg/ffmpeg-core.js",
                    log: false,
                });
                (async ()=>{
                    let out, downloadName, dl;
                    await ffmpeg.load();
                    if(request.requestType === 'videoRecord'){
                        ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(request.blob));
                        if(request.startTime > 1){
                            await ffmpeg.run('-i', 'video.mp4', '-ss', request.startTime + '', '-c', 'copy', 'footage.mp4');
                            await ffmpeg.run('-i', 'footage.mp4', '-threads', '4', '-vcodec','copy', '-acodec','aac', 'final.mp4');
                        }else{
                            await ffmpeg.run('-i', 'video.mp4', '-threads', '4', '-vcodec','copy', '-acodec','aac', 'final.mp4');
                        }
                        out = ffmpeg.FS('readFile', 'final.mp4');
                        downloadName = request.filename + ".mp4";
                        dl = URL.createObjectURL(new Blob([out.buffer], {type: 'video/mp4'}));
                    }
                    if(request.requestType === 'audioRecord'){
                        ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(request.blob[0]));
                        await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', '-metadata', `title=${utf8Encode(request.metadata.title)}`,'-metadata', `artist=${utf8Encode(request.metadata.artist)}`, '-metadata', `year=${request.metadata.year}`, 'final.m4a');
                        out = ffmpeg.FS('readFile', 'final.m4a');
                        downloadName = request.filename + ".m4a";
                        dl = URL.createObjectURL(new Blob([out.buffer], {type: 'audio/mp4'}));
                    }
                    if(request.requestType === 'dolbyRecord'){
                        ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(request.blob[0]));
                        await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', 'final.mp4');
                        out = ffmpeg.FS('readFile', 'final.mp4');
                        downloadName = request.filename + ".mp4";
                        dl = URL.createObjectURL(new Blob([out.buffer], {type: 'audio/mp4'}));
                    }
                    if(request.requestType === 'hdrRecord'){
                        ffmpeg.FS('writeFile', 'video.m4s', await fetchFile(request.blob[0]));
                        ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(request.blob[1]));
                        await ffmpeg.run('-i', 'video.m4s', '-i', 'audio.m4s', '-map', '0:v', '-map', '1:a','-c', 'copy', 'final.mkv');
                        out = ffmpeg.FS('readFile', 'final.mkv');
                        downloadName = request.filename + ".mkv";
                        dl = URL.createObjectURL(new Blob([out.buffer]));
                    }
                    if(request.requestType === 'songRecord'){
                        ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(request.blob));
                        await ffmpeg.run('-i', 'audio.m4s','-c', 'copy', '-metadata', `title=${utf8Encode(request.metadata.title)}`,'-metadata', `artist=${utf8Encode(request.metadata.artist)}`,'-metadata', `description=${utf8Encode(request.metadata.description)}`, '-metadata', `lyrics=${request.metadata.lyrics}`, '-metadata', `year=${request.metadata.year}`, 'final.m4a');
                        out = ffmpeg.FS('readFile', 'final.m4a');
                        downloadName = request.filename + ".m4a";
                        dl = URL.createObjectURL(new Blob([out.buffer], {type: 'audio/mp4'}));
                    }
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = dl;
                    a.download = downloadName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(dl);
                    sendResponse({'status':'ok'});
                })();
            }
            if(request.msg === 'requestOSInfo'){
                sendResponse({'os':OSInfo});
            }
            if(request.msg.includes("QNV")){
                QNV = request.msg.split("?")[1];
                sendResponse({res:"ok"});
            }
            return true;
        }
    );

    function utf8Encode(str){
        let encoder = new TextEncoder('utf8');
        let bytes = encoder.encode(str);
        let result = '';
        for(let i = 0; i < bytes.length; ++i) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }

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
        chrome.storage.sync.get(["notification", "checkIn", "bcoin", "qn", "dynamicPush", "hiddenEntry", "daka", 'enhancedHiddenEntry'], (result)=>{
            notificationPush = result.notification;
            checkinSwitch = result.checkIn;
            BCOIN = result.bcoin;
            QN = result.qn;
            dynamicPush = result.dynamicPush;
            hiddenEntry = result.hiddenEntry;
            dakaSwitch = result.daka;
            enhancedHiddenEntry = result.enhancedHiddenEntry;
        });

        chrome.storage.local.get(["imageNotice"], (result)=>{
            imageNotificationSwitch = result.imageNotice;});
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
    // function getFollowingList() {
    //     if(UUID !== -1){
    //         fetch(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?type_list=8`,{
    //             method:"GET",
    //             credentials: 'include',
    //             body:null
    //         })
    //         .then(res => res.json())
    //         .then(json => {
    //             if(json['code']!==0)errorHandler(getFollowingList, json['code'], 'getFollowingList()');
    //             else if(typeof json["data"]!=="undefined" && json["data"].length !== 0) {
    //                 let data = json["data"]["attentions"]['uids'];
    //                 data.splice(json["data"]["attentions"]['uids'].indexOf(UUID-1+1),1);
    //                 FOLLOWING_LIST.update(data);
    //                 for(let uid of data)
    //                     FOLLOWING_LIST.push(new FollowingMember(uid, ''));
    //                 console.log(`Load following list complete. ${FOLLOWING_LIST.length()} followings found.`);
    //                 queryLivingRoom();
    //             }
    //
    //         }).catch(msg =>{errorHandler(getFollowingList, msg, 'getFollowingList()');});
    //     }
    // }

    /**
     * Check live room status once for all.
     *
     * time O(n^2), may be quicker
     *
     * API: https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids
     * method: POST
     * attention: not accept cookie.
     * */
    function queryLivingRoom(uids) {
        let body = '{"uids": [' + uids+']}';
        fetch("https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?requestFrom=rua5",{
            method:"POST",
            credentials: "omit",
            body:body
        })
            .then(res => res.json())
            .then(json => {
                if (json["code"] === 0) {
                    let data = json["data"];
                    chrome.notifications.getAll((n)=>{
                        for (let k in n){
                            if (uids.indexOf(k.split(':')[0]-1+1)===-1 && k.split(':')[2]==='live.bilibili.com/'){
                                chrome.notifications.clear(k);
                                if (notificationList.indexOf(k.split(':')[1]-1+1)!==-1)
                                    notificationList.splice(notificationList.indexOf(k.split(':')[1]-1+1),1);
                            }
                        }
                        for (let i = 0; i < uids.length; i++) {
                            if (data[uids[i]] !== undefined) {
                                if(data[uids[i]]["live_status"] !== 1 && notificationList.indexOf(data[uids[i]]["room_id"]) !== -1){
                                    chrome.notifications.clear(`${uids[i]}:${notificationList.indexOf(data[uids[i]]["room_id"])}:live.bilibili.com/`);
                                    notificationList.splice(notificationList.indexOf(data[uids[i]]["room_id"]),1);
                                }
                                if (data[uids[i]]["live_status"] === 1 && notificationList.indexOf(data[uids[i]]["room_id"]) === -1) {
                                    notificationList.push(data[uids[i]]["room_id"]);
                                    if(notificationPush) {
                                        console.log(data[uids[i]]["title"] + " " + data[uids[i]]["uname"]+" "+new Date());
                                        pushNotificationChrome(data[uids[i]]["title"], data[uids[i]]["uname"], data[uids[i]]["room_id"], data[uids[i]]["cover_from_user"], data[uids[i]]["broadcast_type"] === 1 ? 1 : 0, data[uids[i]]["face"], uids[i]);
                                    }
                                }
                            }
                        }
                    });
                }
            })
            .catch(msg =>{errorHandler(videoNotify, msg, 'queryLivingRoom()');});
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
    // function updateList(ON_AIR_LIST){
    //     if(FOLLOWING_LIST.length() > 0){
    //         for (let i = 0; i < ON_AIR_LIST.length(); i++) {
    //             ON_AIR_LIST.updateStatus(i, FOLLOWING_LIST.get(FOLLOWING_LIST.indexOf(ON_AIR_LIST.get(i))).PUSHED);
    //             FOLLOWING_LIST.updateElementOnAirStatus(ON_AIR_LIST.get(i), true);
    //         }
    //         for (let i = 0; i < FOLLOWING_LIST.length(); i++) {
    //             if(FOLLOWING_LIST.get(i).ONAIR){
    //                 if(ON_AIR_LIST.indexOf(FOLLOWING_LIST.get(i))===-1){
    //                     NOTIFICATION_LIST.remove(FOLLOWING_LIST.get(i).ROOM_URL);
    //                     FOLLOWING_LIST.get(i).COVER = undefined;
    //                     FOLLOWING_LIST.get(i).FACE = undefined;
    //                     FOLLOWING_LIST.get(i).KEYFRAME = undefined;
    //                     FOLLOWING_LIST.get(i).ROOM_URL = undefined;
    //                     FOLLOWING_LIST.get(i).TITLE = undefined;
    //                     FOLLOWING_LIST.updateStatus(i, false);
    //                     FOLLOWING_LIST.updateElementOnAirStatus(FOLLOWING_LIST.get(i),false);
    //                 }else{
    //                     if (!FOLLOWING_LIST.get(i).PUSHED){
    //                         FOLLOWING_LIST.updateStatus(i, true);
    //                         console.log(FOLLOWING_LIST.get(i).TITLE + " " + FOLLOWING_LIST.get(i).NAME+" "+new Date());
    //                         if(notificationPush)
    //                             pushNotificationChrome(FOLLOWING_LIST.get(i).TITLE,
    //                                 FOLLOWING_LIST.get(i).NAME,
    //                                 FOLLOWING_LIST.get(i).ROOM_URL,
    //                                 FOLLOWING_LIST.get(i).COVER,
    //                                 FOLLOWING_LIST.get(i).TYPE,
    //                                 FOLLOWING_LIST.get(i).FACE);
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //     //setTimeout(getFollowingList, 10000);
    // }

    function pushNotificationChrome(roomTitle, liverName, roomUrl, cover, type, face, uid){
        try{
            let msg = liverName + " 开播啦!\r\n是"+(type===0?"电脑":"手机")+"直播！";
            imageNotificationSwitch?imageNotification(uid, roomTitle, msg, roomUrl, cover, face, "live.bilibili.com/"):basicNotification(uid, roomTitle, msg, roomUrl, face, "live.bilibili.com/");
        }catch (e){}
    }

    /**
     * Create notification. (Web Extension API ver.)
     * normal ver.
     *
     * @param uid, a random number for notification id.
     * @param title, live room title.
     * @param msg, notification content.
     * @param url, part of live URL for click jump to.
     * @param cover, notification icon, normally will be up's face.
     * @param URLPrefix, "live.bilibili.com/", will be combine with roomUrl to build a full link.
     * */
    function basicNotification(uid, title, msg, url, cover, URLPrefix){
        cover = cover.length==null||cover.length===0?"../images/haruka128.png":cover;
        chrome.notifications.create(uid+":"+url+":"+URLPrefix, {
                type: "basic",
                iconUrl: cover,
                title: title,
                message: msg,
                contextMessage:"rua豹器"
            }, function (id) {}
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
     *
     * @param id, specific notification id,
     * @param URLPrefix, the url contained in notification is only a part of them
     * includes aid, bid or live room number, prefix will be used for build url.
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
                uid === null || uid.expirationDate === null || uid.expirationDate<Date.parse(new Date())/1000?UUID = -1:UUID = uid.value;
                if ((UUID === -1) && UUID !== P_UID) {
                    // if not log in then stop update liver stream info.
                    console.log("Session info does not exist, liver stream info listener cleared.");
                    clearInterval(checkin);
                    clearInterval(exchangeBcoin);
                    clearInterval(dk);
                }
                if (UUID !== -1 && UUID !== P_UID) {
                    // log in info changed then load following list and start update liver stream info every 3 min.
                    console.log("Session info got.");
                    notificationList = []
                    videoNotify(false);
                    getUnread(true);
                    dynamicNotify(true);
                    scheduleCheckIn();
                    //getFollowingList();
                }

                P_UID = UUID;
            });
        chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
            function (jct) {(jct === null)?JCT=-1:JCT = jct.value;});
    }

    function checkIn(){
        if(checkinSwitch){
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign",{
                method:"GET",
                credentials: 'include',
                body: null
            }).then(res => {
                    console.log("签到成功 "+new Date().toUTCString())
                }).catch(msg =>{errorHandler(checkIn, msg, 'checkIn()');});
        }
    }

    /**
     * Handler for network error,
     * For 412 internal error wait for 25 mins,
     * others retry after 20 secs.
     *
     * @param handler, the function which need to be handled.
     * @param msg, the error message.
     * @param at, the location where this error occurs.
     * */
    function errorHandler(handler, msg, at){
        console.log("ERROR found @ "+new Date()+":");
        console.log(`${msg} at function ${at}`);
        (typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412 || msg == -412)?setTimeout(handler, 1500000):setTimeout(handler,20000);
    }

    /**
     * Exchange B coin section.
     * */
    function exchangeBCoin(){
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
            }).catch(msg =>{errorHandler(queryBcoin, msg, 'exchangeBCoin()');});
    }

    function queryBcoin(){
        if(BCOIN){
            fetch("https://api.bilibili.com/x/vip/privilege/my",{
                method:"GET",
                credentials: 'include',
                body: null
            })
                .then(res => res.json())
                .then(json => {
                    console.log("checked vip status")
                    if (json["code"] === 0){
                        if(json["data"]["list"]["0"]["type"]===1&&json["data"]["list"]["0"]["state"]===0)
                            exchangeBCoin();
                        else if(json["data"]["list"]["0"]["type"]===1&&json["data"]["list"]["0"]["state"]===1)
                            console.log("这个月的已经兑换过了，好耶！( •̀ ω •́ )✧");
                    }
                }).catch(msg =>{errorHandler(queryBcoin, msg, 'queryBcoin()');});
        }
    }

    /**
     * Check and notify dynamic update section.
     * */
    let dynamic_id_list = [];
    function videoNotify(push){
        fetch("https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?type_list=8,512,4097,4098,4099,4100,4101",{
            method:"GET",
            credentials: 'include',
            body: null
        })
            .then(res => res.json())
            .then(json => {
                if(json["code"] === 0){
                    if(typeof json["data"]!=="undefined" && json["data"].length !== 0) {
                        let data = json["data"]["attentions"]['uids'];
                        data.splice(json["data"]["attentions"]['uids'].indexOf(UUID-1+1),1);
                        console.log(`Load following list complete. ${data.length} followings found.`);
                        queryLivingRoom(data);
                    }
                    if(dynamicPush){
                        let o = json["data"]["cards"];
                        for (let i = 0; i < o.length; i++) {
                            let c = JSON.parse(o[i+""]["card"]);
                            let type = o[i+""]["desc"]["type"];
                            if(!dynamic_id_list.includes(o[i+""]["desc"]["dynamic_id"])){
                                if(push || push === undefined){
                                    if(type === 8){
                                        console.log("你关注的up "+o[i+'']["desc"]["user_profile"]["info"]["uname"]+" 投稿了新视频！"+c["title"]+" see:"+o[i+""]["desc"]["bvid"]);
                                        basicNotification(o[i+""]["desc"]["dynamic_id"], "你关注的up "+o[i+'']["desc"]["user_profile"]["info"]["uname"]+" 投稿了新视频！", c["title"], o[i+""]["desc"]["bvid"], o[i+'']["desc"]["user_profile"]["info"]["face"], "b23.tv/");
                                    }else if(type >= 512 && type <= 4101){
                                        console.log("你关注的番剧 "+c["apiSeasonInfo"]["title"]+" 更新了！"+c["index"]+" see:"+c["url"]);
                                        basicNotification(o[i+""]["desc"]["dynamic_id"], "你关注的番剧 "+c["apiSeasonInfo"]["title"]+" 更新了！",c["new_desc"],c["url"].replace("https://www.bilibili.com/",""), c["cover"],"www.bilibili.com/");
                                    }
                                }
                                dynamic_id_list.push(o[i+""]["desc"]["dynamic_id"]);
                            }
                        }
                    }
                }
                setTimeout(()=>{videoNotify(true)},10000);
            }).catch(msg =>{errorHandler(videoNotify,msg, 'videoNotify()');});
    }

    function dynamicNotify(push){
        chrome.storage.local.get(['dynamicList'], (r)=>{
            let dynamic_id_list = r.dynamicList;
            fetch(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?type_list=1,2,4`,{
                method:'GET',
                credentials:'include',
                body:null
            })
                .then(r=>r.json())
                .then(json=>{
                    if(json['code']!==0){
                        errorHandler(dynamicNotify, json['code'], 'dynamicNotify()');
                    }else{
                        chrome.storage.sync.get(['dynamicSwitch'], (result=>{
                            let o = json["data"]["cards"];
                            for (let i = 0; i < o.length; i++){
                                let c = JSON.parse(o[i+""]["card"]);
                                let type = o[i+""]["desc"]["type"];
                                if(!dynamic_id_list.includes(o[i+""]["desc"]["dynamic_id"])){
                                    if(!push && result.dynamicSwitch){
                                        switch (type){
                                            case 1:
                                                console.log("你关注的up "+c["user"]["uname"]+" 转发了一条新动态 "+c['item']['content']+" see:"+`https://t.bilibili.com/${o[i+""]["desc"]["dynamic_id_str"]}`);
                                                basicNotification(o[i+""]["desc"]["dynamic_id"], `你关注的up ${c["user"]["uname"]}  转发了一条新动态`,c['item']['content']+"", o[i+""]["desc"]["dynamic_id_str"], c["user"]['face'],"t.bilibili.com/");
                                                break;
                                            case 2:
                                                console.log("你关注的up "+c["user"]["name"]+" 发了一条新动态 "+c['item']['description']+" see: "+ `https://t.bilibili.com/${o[i+""]["desc"]["dynamic_id_str"]}`);
                                                basicNotification(o[i+""]["desc"]["dynamic_id"], `你关注的up ${c["user"]["name"]}  发了一条图片动态`,c['item']['description']+"", o[i+""]["desc"]["dynamic_id_str"], c["user"]['head_url'],"t.bilibili.com/");
                                                break;
                                            case 4:
                                                console.log("你关注的up "+c["user"]["uname"]+" 发了一条新动态 "+c['item']['content']+" see: " + `https://t.bilibili.com/${o[i+""]["desc"]["dynamic_id_str"]}`);
                                                basicNotification(o[i+""]["desc"]["dynamic_id"], `你关注的up ${c["user"]["uname"]}  发了一条新动态`,c['item']['content']+"", o[i+""]["desc"]["dynamic_id_str"], c["user"]['face'],"t.bilibili.com/");
                                                break;
                                        }
                                    }
                                    dynamic_id_list.push(o[i+""]["desc"]["dynamic_id"]);
                                }
                            }
                            chrome.storage.local.set({'dynamicList':dynamic_id_list}, ()=>{});
                            setTimeout(()=>{dynamicNotify()}, 10000);
                        }));
                    }
                })
                .catch(e=>{errorHandler(dynamicNotify, e, 'dynamicNotify()')});
        });
    }

    /**
     * Web traffic control section.
     * */
    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        let headers = details["requestHeaders"];
            if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="rua5"){
                for (let header in headers) {
                    if(headers[header].name === "Origin"){
                        headers[header].value = "https://www.bilibili.com/"
                    }
                }
            }
            return {requestHeaders: details.requestHeaders};
        }, {urls: ["https://api.bilibili.com/x/vip/privilege/receive*", "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids*", "https://api.bilibili.com/x/web-interface/card*"]}, ['blocking', "requestHeaders", "extraHeaders"]
    );
    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        let headers = details["requestHeaders"];
        if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="rua5"){
            for (let header in headers) {
                if(headers[header].name === "Origin"){
                    headers[header].value = "https://live.bilibili.com"
                }
                if(headers[header].name === "Sec-Fetch-Site")
                    headers[header].value = "same-site"
            }
            details.requestHeaders.push({name: 'Referer', value:'https://live.bilibili.com/'});
        }
            return {requestHeaders: details.requestHeaders};
        }, {urls: ["https://api.live.bilibili.com/msg/send*"]}, ['blocking', "requestHeaders", "extraHeaders"]
    );

    chrome.webRequest.onBeforeRequest.addListener((details)=>{
            return hiddenEntry&&!enhancedHiddenEntry&&!details.url.includes("room_id=2842865")?{redirectUrl: "https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=2842865&from=0"}:undefined},
        {urls: ["*://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser*"]}, ["blocking"]);

    chrome.webRequest.onBeforeSendHeaders.addListener((details)=>{
        let headers = details["requestHeaders"];
        if(enhancedHiddenEntry){
            for (let header in headers) {
                if(headers[header].name === "Cookie"){
                    headers[header].value = ""
                }
            }
        }
        return {requestHeaders: details.requestHeaders};
    }, {urls: ["*://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo*",
            "*://api.live.bilibili.com/room/v1/Room/room_init*",
            "*://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo*",
            "*://api.live.bilibili.com/xlive/web-room/v1/index/roomEntryAction",
            "*://api.live.bilibili.com/xlive/web-room/v1/index/getIpInfo*",
            "*://api.live.bilibili.com/xlive/web-interface/v1/index/getWebAreaList*",
            "*://api.live.bilibili.com/relation/v1/Feed/heartBeat*",
            "*://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?*",
            //"*://api.bilibili.com/x/web-interface/nav*",
            "*://api.live.bilibili.com/xlive/activity-interface/v1/widgetBanner/GetWidgetBannerList*",
            "*://api.live.bilibili.com/xlive/web-room/v1/index/getOffLiveList*",
            "*://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfoWeb*",
            "*://api.live.bilibili.com/xlive/web-room/v1/giftPanel/giftData*",
            "*://api.live.bilibili.com/xlive/web-room/v1/giftPanel/giftConfig*",
            "*://api.live.bilibili.com/xlive/open-interface/v1/query_resource*",
            "*://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory*"]}, ['blocking', "requestHeaders", "extraHeaders"]);

    chrome.webRequest.onHeadersReceived.addListener((details)=>{
        if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="ruaDL"){
            let fileFormat = new URL(details["url"])["pathname"].substr(new URL(details["url"])["pathname"].length-4,4);
            if(fileFormat === ".m4s") fileFormat = ".mp3";
            details.responseHeaders.push({name:"Content-Disposition", value:"attachment; filename=\""+downloadFileName+fileFormat+"\"; filename*=\"UTF-8''"+downloadFileName+fileFormat+"\""});
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
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+UUID, {
                method:"GET",
                credentials: 'include',
                body: null
            })
                .then(res => res.json())
                .then(json => {
                    console.log(json["data"]["list"].length+" medal founded.")
                    for (let i = 0; i < json["data"]["list"].length; i++){
                        if(json["data"]["list"][i]["medal_info"]["today_feed"]<100)
                            medals.push(json["data"]["list"][i]["medal_info"]["target_id"]);
                    }
                    daka(medals);
                })
                .catch(msg => {
                    localStorage.setItem("rua_lastDK", "1970-01-01");
                    errorHandler(checkMedalDaka,msg,'checkMedalDaka()');
                });
        }else console.log("No more grab needed.");
    }

    /**
     * Send damaku to each live room.
     * */
    function daka(medals){
        let index = 0;
        (function go(){
            fetch("https://api.live.bilibili.com/live_user/v1/Master/info?uid="+medals[index], {
                method:"GET",
                credentials: 'include',
                body: null
            })
                .then(res => res.json())
                .then(json => {
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
                        fetch("https://api.live.bilibili.com/msg/send?requestFrom=rua5", {
                            method:"POST",
                            credentials: 'include',
                            body: DanMuForm
                        }).then(result=>{
                            console.log("打卡成功: https://live.bilibili.com/"+json["data"]["room_id"]);
                            index++;
                            if(index < medals.length){
                                setTimeout(()=>{go()},(Math.random()*5+10)*1000);
                            }
                        }).catch(error=>{console.error('Error:', error);});
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
     * Query selected a/bv id is existed or not.
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
        chrome.browserAction.setTitle({title: title});
        chrome.browserAction.setBadgeText({text: text});
    }

    function getUnread(init){
        chrome.storage.local.get(["unreadData", "unreadMessage"], async (result)=>{
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
                                if(!init && (json['data']['at'] - unreadData['at']>0 || json['data']['like'] - unreadData['like']>0 || json['data']['reply'] - unreadData['reply']>0 || json['data']['sys_msg'] - unreadData['sys_msg']>0 || json['data']['up'] - unreadData['up']>0)) {
                                    let msgContent = `${json['data']['at'] - unreadData['at'] > 0 ? json['data']['at'] - unreadData['at'] + '个@, ' : ''}${json['data']['like'] - unreadData['like'] > 0 ? json['data']['like'] - unreadData['like'] + '个赞, ' : ''}${json['data']['reply'] - unreadData['reply'] > 0 ? json['data']['reply'] - unreadData['reply'] + '个回复, ' : ''}${json['data']['sys_msg'] - unreadData['sys_msg'] > 0 ? json['data']['sys_msg'] - unreadData['sys_msg'] + '个系统通知, ' : ''}${json['data']['up'] - unreadData['up'] > 0 ? json['data']['up'] - unreadData['up'] + '个up助手提醒, ' : ''}`;
                                    chrome.notifications.clear('-276492:reply:message.bilibili.com/#/');
                                    basicNotification(-276492, "你收到了新的消息:", msgContent.substring(0, msgContent.length-2), `reply`, '', `message.bilibili.com/#/`);
                                }
                                unreadData = json.data;
                                chrome.storage.local.set({"unreadData":JSON.stringify(unreadData)}, ()=>{});
                            }
                        });
                    }else{
                        errorHandler(getUnread, json.code, 'getUnread()');
                    }
                })
                .catch(e=>{
                    errorHandler(getUnread, e, 'getUnread()');
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
                                if(!init && (json['data']['biz_msg_follow_unread']+json['data']['biz_msg_unfollow_unread']+json['data']['dustbin_push_msg']+json['data']['dustbin_unread']+json['data']['follow_unread']+json['data']['unfollow_push_msg']+json['data']['unfollow_unread']) - result.unreadMessage > 0){
                                    chrome.notifications.clear('-276491:reply:message.bilibili.com/#/');
                                    basicNotification(-276491, `你收到了${(json['data']['biz_msg_follow_unread']+json['data']['biz_msg_unfollow_unread']+json['data']['dustbin_push_msg']+json['data']['dustbin_unread']+json['data']['follow_unread']+json['data']['unfollow_push_msg']+json['data']['unfollow_unread']) - result.unreadMessage}条新私信`, '', `reply`, '', `message.bilibili.com/#/`);
                                }
                            }
                            chrome.storage.local.set({"unreadMessage":(json['data']['biz_msg_follow_unread']+json['data']['biz_msg_unfollow_unread']+json['data']['dustbin_push_msg']+json['data']['dustbin_unread']+json['data']['follow_unread']+json['data']['unfollow_push_msg']+json['data']['unfollow_unread'])}, ()=>{});
                        });
                        setTimeout(()=>{getUnread()}, 10000);
                    }else{
                        errorHandler(getUnread, json.code, 'getUnread()');
                    }
                })
                .catch(e=>{
                    errorHandler(getUnread, e, 'getUnread()');
                });
        });
    }
}();