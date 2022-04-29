/***
 * Copyright (c) 2021 Tyrael, Y. LI
 *
 * service worker for mv3
 * */
importScripts('../ffmpeg/ffmpeg.min.js','../ffmpeg/ffmpeg-core.js', '../ffmpeg/ffmpeg-core.worker.js');
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

class FollowingMember{
    static convertFromJSON(object){
        let o = new FollowingMember();
        o.UID = object.uid;
        o.NAME = object.name;
        o.PUSHED = object.pushed;
        o.ONAIR = object.onair;
        o.FACE = object.face;
        o.COVER = object.cover;
        o.KEYFRAME = object.keyframe;
        o.ROOM_URL = object.rid;
        o.TITLE = object.title;
        o.TYPE = object.type;
        return o;
    }

    constructor(UID, NAME, FACE, COVER, KEYFRAME, ROOM_URL, TITLE) {
        this.UID = UID;
        this.NAME = NAME;
        this.PUSHED = false;
        this.ONAIR = false;
        this.FACE = FACE;
        this.COVER = COVER;
        this.KEYFRAME = KEYFRAME;
        this.ROOM_URL = ROOM_URL;
        this.TITLE = TITLE;
        this.TYPE = 0;
    }

    print(){
        return "uid:"+this.UID + " name:" + this.NAME + " rid:" + this.ROOM_URL + " title:" + this.TITLE;
    }

    toJSONObject(){
        return {'uid': this.UID, 'name':this.NAME, 'pushed':this.PUSHED, 'onair':this.ONAIR, 'face':this.FACE, 'cover':this.COVER, 'keyframe':this.KEYFRAME, 'rid':this.ROOM_URL, 'title':this.TITLE, 'type':this.TYPE};
    }
}

class FollowingMemberList{
    static convertFromJSON(object){
        let o = new FollowingMemberList();
        for (let i = 0; i < Object.keys(object).length; i++) {
            let m = FollowingMember.convertFromJSON(object[i]);
            o.push(m);
        }
        return o;
    }

    constructor() {
        this.list = [];
    }

    push(member){
        for (let i = 0; i < this.list.length; i++) {
            if(this.list[i].UID === member.UID)
                return false;
        }
        this.list.push(member);
        return true;
    }

    get(index){
        return this.list[index];
    }

    concat(list){
        for (let m of list.list){
            this.push(m);
        }
    }

    getUIDList(){
        if(this.list.length < 1)
            return [];
        let L = [];
        for (let i = 0; i < this.list.length; i++) L.push(this.list[i].UID);
        return L;
    }

    clearAll(){
        this.list = [];
    }

    update(members){
        // intersection
        this.list = this.list.filter(function (member) {
            return members.indexOf(member) !== -1;
        });
    }

    updateRemove(members){
        // complementary
        this.list = this.list.filter(function (member) {
            return members.indexOf(member) === -1;
        });
        return this.list.length > 0;
    }

    updateStatus(index, bool){
        this.list[index].PUSHED = bool;
    }

    updateElementOnAirStatus(o, bool){
        this.list[this.indexOf(o)] = o;
        this.list[this.indexOf(o)].ONAIR = bool;
    }

    length(){
        return this.list.length;
    }

    indexOf(member){
        for (let i = 0; i < this.list.length; i++) {
            if(member.UID === this.list[i].UID)
                return i;
        }
        return -1;
    }

    remove(member){
        let index = this.indexOf(member);
        if(index > -1)
            this.list.splice(index,1);
    }

    print(){
        let str = this.list.length+" ";
        for (let i = 0; i < this.list.length; i++) {
            str += this.list[i].print() + "\r\n";
        }
        return str;
    }

    copy(FMlist){
        this.list = FMlist.list;
    }

    maintainList(member){
        if(this.indexOf(member) !== -1)
            this.remove(member);
        else
            this.push(member);
    }

    toJSONObject(){
        let obj = {};
        for (let i = 0; i < this.list.length; i++) {
            obj[i] = this.list[i].toJSONObject();
        }
        return obj;
    }
}

class Notification{
    static convertFromJSON(object){
        let o = new Notification(object.id);
        o.notificationList = object.list;
        return o;
    }

    constructor(rid) {
        this.rid = rid;
        this.notificationList = [];
    }

    add(id){
        this.notificationList.push(id);
    }

    clearNotification(){
        for (let i = 0; i < this.notificationList.length; i++) {
            chrome.notifications.clear(this.notificationList[i]);
        }
    }

    toJSONObject(){
        return {'id': this.rid, 'list': this.notificationList}
    }
}

class NotificationList{
    static convertFromJSON(object){
        let o = new NotificationList();
        for (let i = 0; i < Object.keys(object).length; i++) {
            let m = Notification.convertFromJSON(object[i]);
            o.push(m);
        }
        return o;
    }
    constructor(){
        this.list = [];
    }
    push(rid, nid){
        for (let i = 0; i < this.list.length; i++) {
            if(this.list[i].rid === rid){
                this.list[i].add(nid);
                return;
            }
        }
        let n = new Notification(rid);
        n.add(nid);
        this.list.push(n);
    }
    indexOf(rid){
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].rid === rid) return i;
        }
        return -1;
    }
    remove(rid){
        let index = this.indexOf(rid);
        if(index>-1){
            this.list[index].clearNotification();
            this.list.splice(index,1);
        }
    }

    toJSONObject(){
        let obj = {};
        for (let i = 0; i < this.list.length; i++) {
            obj[i] = this.list[i].toJSONObject();
        }
        return obj;
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

var hiddenEntry = false;
let enhancedHiddenEntry = false;

!function (){
    chrome.storage.local.set({'uuid':-1}, ()=>{});
    chrome.storage.local.set({'jct':-1}, ()=>{});
    chrome.storage.local.set({'p_uuid':-1}, ()=>{});
    chrome.storage.local.set({'updateAvailable':false}, ()=>{});
    chrome.storage.local.set({'availableBranch':"https://gitee.com/tyrael-lee/HarukaEmoji/releases"}, ()=>{});
    chrome.storage.local.set({'downloadFileName':''}, ()=>{});
    chrome.storage.local.set({"dynamic_id_list": []}, ()=>{});
    let NOTIFICATION_LIST = new NotificationList();
    chrome.storage.local.set({'notificationList':NOTIFICATION_LIST.toJSONObject()}, ()=>{});
    let l = new FollowingMemberList();
    chrome.storage.local.set({'following_list': l.toJSONObject()}, ()=>{});
    reloadCookies();
}();
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
chrome.runtime.onInstalled.addListener(function (obj){
    // init setting
    chrome.storage.local.get(['rua_lastDK'],(info)=>{
        chrome.storage.local.set({'rua_lastDK':"1970-01-01"}, ()=>{});
    });
    chrome.storage.sync.set({"notification": true}, function(){});
    chrome.storage.sync.set({"medal": true}, function(){});
    chrome.storage.sync.set({"checkIn": true}, function(){});
    chrome.storage.local.set({"imageNotice": false}, function(){});
    chrome.storage.sync.set({"bcoin": true}, function(){});
    chrome.storage.sync.set({"qn": true}, function(){});
    chrome.storage.sync.set({"qnvalue": "原画"}, function(){});
    chrome.storage.sync.set({"dynamicPush":true}, function (){});
    chrome.storage.sync.set({"hiddenEntry":false}, function (){hiddenEntry = false});
    chrome.storage.sync.set({"daka":true}, function (){});
    chrome.storage.sync.set({"record":true});
    chrome.storage.sync.set({"prerecord":300}, function (){});
    chrome.storage.sync.set({'enhancedHiddenEntry':false}, function (){})
    chrome.tabs.create({url: "./readme.html"});

    /**
     * Context menu section.
     *
     * no need change for mv3 update.
     * */
    chrome.contextMenus.create({contexts: ["selection", "link"], title: "用bilibili搜索", type: "normal", id:"rua-contextMenu-v3"});
});

chrome.contextMenus.onClicked.addListener((info)=>{
    if(info.menuItemId==="rua-contextMenu-v3"){
        legalVideoLink(info.selectionText).then(r => {
            r?chrome.tabs.create({url: "https://www.bilibili.com/video/"+info.selectionText}):chrome.tabs.create({url:"https://search.bilibili.com/all?keyword="+info.selectionText});
        });
    }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
        if(key === "checkIn") {
            if(newValue) checkIn();
        }
        if(key === "bcoin"){
            if(newValue) queryBcoin();
        }
        if(key === "hiddenEntry")
            hiddenEntry = newValue;
        if(key === 'enhancedHiddenEntry')
            enhancedHiddenEntry = newValue;
        if(key === "daka"){
            if(newValue)
                checkMedalDaka();
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
                    (jct === null)?chrome.storage.local.set({'jct':-1}, ()=>{}):chrome.storage.local.set({'jct':jct.value}, ()=>{});
                    chrome.storage.local.get(['jct', 'uuid'], (info)=>{
                        sendResponse({res:info.jct+","+info.uuid+","+info.uuid});
                    });
                });
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
                function (jct) {(jct === null)?chrome.storage.local.set({'jct':-1}, ()=>{}):chrome.storage.local.set({'jct':jct.value}, ()=>{})});
        }
        if(request.msg === "get_UUID") {
            chrome.storage.local.get(['uuid'],(uid)=>{
                sendResponse({res:uid.uuid});
            })
        }
        if(request.msg === "updateStatus") {
            chrome.storage.local.get(['updateAvailable', 'availableBranch'],(info)=>{
                sendResponse({res:info.updateAvailable, address:info.availableBranch});
            })
        }
        if(request.msg === "popupfired"){setBadge("rua豹器", "");}
        if(request.msg === "requestDownload"){
            chrome.storage.local.set({'downloadFileName':request.fileName},()=>{});
        }
        if(request.msg === "requestDanmaku"){
            let danmakuBulider = new DanmakuArr(), crc = new CRC32();
            for (let i = 0; i < request.danmakuObj.length; i++) {
                if(request.danmakuObj[i]["progress"]===undefined)
                    request.danmakuObj[i]["progress"] = 0;
                danmakuBulider.push(new DanmakuObj(convertMSToS(request.danmakuObj[i]["progress"]), crc.crack(request.danmakuObj[i]["midHash"]), request.danmakuObj[i]["content"], request.danmakuObj[i]["color"], request.danmakuObj[i]["mode"], request.danmakuObj[i]["fontsize"], request.danmakuObj[i]["progress"], request.danmakuObj[i]["weight"]));
            }
            danmakuBulider.sort(danmakuBulider.size-1);
            console.log(danmakuBulider);
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
                log: true,
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
                    await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', 'final.m4a');
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
            chrome.runtime.getPlatformInfo((info)=>{
                sendResponse({'os':info.os});
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

function loadSetting(){
    chrome.storage.sync.get(["hiddenEntry"], (result)=>{
        hiddenEntry = result.hiddenEntry;});
    chrome.storage.sync.get(['enhancedHiddenEntry'],(result)=>{
        enhancedHiddenEntry = result.enhancedHiddenEntry;
    });
}

/**
 * Maintain and updated the following ups info.
 * Non-duplicated and shrank when unfollow someone.
 *
 * time O(n)
 *
 * API: https://api.bilibili.com/x/relation/followings
 * method: GET
 * url param: vmid->uid, pn->page number.
 * */
function getFollowing(uuid){
    getFollowingList(uuid, 0);
}
function getFollowingList(UUID, p) {
    if(UUID !== -1){
        p++;
        let listLength = 0;
        fetch("https://api.bilibili.com/x/relation/followings?vmid=" + UUID + "&pn=" + p,{
            method:"GET",
            credentials: 'include',
            body:null
        })
            .then(res => res.json())
            .then(json => {
                if(typeof json["data"]!=="undefined" && json["data"].length !== 0) {
                    let data = json["data"]["list"];
                    listLength = data.length;
                    let list = new FollowingMemberList();
                    for (let i = 0; i < data.length; i++) {
                        let member = new FollowingMember(data[i]["mid"], data[i]["uname"]);
                        list.push(member); // maintain the global list
                    }
                    chrome.storage.local.get(['following_list'],(flist)=>{
                        let l = FollowingMemberList.convertFromJSON(flist.following_list);
                        l.concat(list);
                        chrome.storage.local.set({'following_list':l.toJSONObject()},()=>{});
                        if (listLength < 50 && l.length() !== 0){
                            console.log("Load following list complete. " + l.length() + " followings found.");
                            queryLivingRoom();
                        }else getFollowingList(UUID, p);
                    });
                    if(json['code']!==0)errorHandler(()=>{getFollowingList(UUID, p)}, json['code']);
                }
            })
            .catch(msg =>{errorHandler(()=>{getFollowingList(UUID, 0)}, msg);});
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
    chrome.storage.local.get(['following_list', 'uuid', 'pushed_list'],(info)=>{
        if (info.pushed_list === null || info.pushed_list === undefined)
            chrome.storage.local.set({'pushed_list': []},()=>{});
        let FOLLOWING_LIST = FollowingMemberList.convertFromJSON(info.following_list);
        let body = '{"uids": [' + FOLLOWING_LIST.getUIDList().toString()+']}';
        fetch("https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?requestFrom=rua5",{
            method:"POST",
            credentials: "omit",
            body:body
        })
            .then(res => res.json())
            .then(json => {
                if (json["code"] === 0) {
                    let ON_AIR_LIST = new FollowingMemberList();
                    let FOLLOWING_LIST = FollowingMemberList.convertFromJSON(info.following_list);
                    let data = json["data"];
                    for (let i = 0; i < FOLLOWING_LIST.getUIDList().length; i++) {
                        if (data[FOLLOWING_LIST.getUIDList()[i] + ""] !== undefined) {
                            if (data[FOLLOWING_LIST.getUIDList()[i] + ""]["live_status"] === 1) {
                                let member = new FollowingMember(data[FOLLOWING_LIST.getUIDList()[i] + ""]["uid"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["uname"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["face"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["cover_from_user"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["keyframe"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["room_id"], data[FOLLOWING_LIST.getUIDList()[i] + ""]["title"]);
                                member.ONAIR = true;
                                member.TYPE = data[FOLLOWING_LIST.getUIDList()[i] + ""]["broadcast_type"] === 1 ? 1 : 0;
                                ON_AIR_LIST.push(member);
                            }
                        }
                    }
                    if (ON_AIR_LIST.list.length > 0) updateList(ON_AIR_LIST);
                }
                else errorHandler(()=>{getFollowingList(info.uuid, 0)}, json['code']);

            })
            .catch(msg =>{console.log(msg);errorHandler(()=>{getFollowingList(info.uuid, 0)}, msg);});
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
    chrome.storage.local.get(['following_list', 'notificationList'],(info)=>{
        let FOLLOWING_LIST = FollowingMemberList.convertFromJSON(info.following_list);
        if(FOLLOWING_LIST.length() > 0){
            for (let i = 0; i < ON_AIR_LIST.length(); i++) {
                ON_AIR_LIST.updateStatus(i, FOLLOWING_LIST.get(FOLLOWING_LIST.indexOf(ON_AIR_LIST.get(i))).PUSHED);
                FOLLOWING_LIST.updateElementOnAirStatus(ON_AIR_LIST.get(i), true);
            }
            for (let i = 0; i < FOLLOWING_LIST.length(); i++) {
                if(FOLLOWING_LIST.get(i).ONAIR){
                    if(ON_AIR_LIST.indexOf(FOLLOWING_LIST.get(i))===-1){
                        let NOTIFICATION_LIST = NotificationList.convertFromJSON(info.noticationList);
                        NOTIFICATION_LIST.remove(FOLLOWING_LIST.get(i).ROOM_URL);
                        chrome.storage.local.set({'notificationList': NOTIFICATION_LIST.toJSONObject()},()=>{});
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
                            chrome.storage.sync.get(["notification"], (result)=>{
                                if(result.notification)
                                    pushNotificationChrome(FOLLOWING_LIST.get(i).TITLE,
                                        FOLLOWING_LIST.get(i).NAME,
                                        FOLLOWING_LIST.get(i).ROOM_URL,
                                        FOLLOWING_LIST.get(i).COVER,
                                        FOLLOWING_LIST.get(i).TYPE,
                                        FOLLOWING_LIST.get(i).FACE);
                            });
                        }
                    }
                }
            }
            chrome.storage.local.set({'following_list':FOLLOWING_LIST.toJSONObject()},()=>{});
        }
    });
    chrome.alarms.clear('getNewLive').then(a=>{
        chrome.alarms.create('getNewLive', {'when':Date.now()+10000});
    });
}

function pushNotificationChrome(roomTitle, liverName, roomUrl, cover, type, face){
    try{
        chrome.storage.local.get('notificationList', (info)=>{
            let uid = Math.random();
            let NOTIFICATION_LIST = NotificationList.convertFromJSON(info.notificationList);
            NOTIFICATION_LIST.push(roomUrl, uid+":"+roomUrl);
            chrome.storage.local.set({'notificationList':NOTIFICATION_LIST.toJSONObject()},()=>{});
            let msg = liverName + " 开播啦!\r\n是"+(type===0?"电脑":"手机")+"直播！";
            chrome.storage.local.get(["imageNotice"], (result)=>{
                result.imageNotice?imageNotification(uid, roomTitle, msg, roomUrl, cover, face, "https://live.bilibili.com/"):basicNotification(uid, roomTitle, msg, roomUrl, face, "https://live.bilibili.com/");
            });
        });

    }catch (e){}
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
    cover = cover.length==null||cover.length===0?"../images/haruka128.png":cover;
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
    face = face.length==null||face.length===0?"../images/haruka128.png":face;
    cover = cover.length==null||cover.length===0?face:cover;
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
                    chrome.storage.local.get(['winIDList'],(info)=>{
                        let winIDList = WindowIDList.convertFromJSON(info.winIDList);
                        chrome.windows.getAll(function (wins){
                            if(wins.length>0){
                                chrome.windows.update(winIDList.getCurrent(), {focused: true});
                                chrome.tabs.create({url: roomUrl});
                            }else
                                chrome.windows.create({url: roomUrl});
                        });
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
                        chrome.tabs.create({url: URLPrefix+nid.split(":")[1]});
                    }else
                        chrome.windows.create({url: URLPrefix+nid.split(":")[1]});
                });
            });
            chrome.notifications.clear(id);
        }
    });
}

//setTimeout(loadSetting, 100);
chrome.alarms.create('checkUpd', {'when':Date.now(), periodInMinutes:60*12});
function scheduleCheckIn(){
    chrome.alarms.create('checkIn', {'when':Date.now(), periodInMinutes:60*12});
    chrome.alarms.create('bcoin', {'when':Date.now(), periodInMinutes:60*12});
    chrome.alarms.create('daka', {'when':Date.now(), periodInMinutes: 60});
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
                    chrome.alarms.clearAll();
                }
                if (uids.uuid !== -1 && uids.uuid !== uids.p_uuid) {
                    // log in info changed then load following list and start update liver stream info every 3 min.
                    console.log("Session info got.");
                    getFollowing(uids.uuid);
                    videoNotify(false, uids.uuid);
                    scheduleCheckIn();
                }
                chrome.storage.local.set({'p_uuid': uids.uuid},()=>{});
            });
        });

    chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'bili_jct'},
        function (jct) {(jct === null)?chrome.storage.local.set({'jct':-1}, ()=>{}):chrome.storage.local.set({'jct':jct.value}, ()=>{})});
    chrome.alarms.clear('getUID_CSRF').then(c =>{
        chrome.alarms.create('getUID_CSRF', {'when': Date.now()+20000})
    });
}

chrome.alarms.onAlarm.addListener((alarm)=>{
    console.log(alarm.name);
    if (alarm.name === 'getUID_CSRF'){
        reloadCookies();
    }
    if (alarm.name === 'checkUpd'){
        checkUpd("https://tyrael-lee.gitee.io/harukaemoji/?_=")
    }
    chrome.storage.local.get(['uuid', 'jct'], (info)=>{
        if(alarm.name === 'getNewVideo'){
            videoNotify(true, info.uuid);
        }
        if (alarm.name === 'getNewLive'){
            getFollowing(info.uuid);
        }
        if(alarm.name === 'checkIn'){
            checkIn();
        }
        if (alarm.name === 'daka'){
            checkMedalDaka();
        }
        if(alarm.name === 'bcoin'){
            queryBcoin();
        }
    });
});

function checkIn(){
    chrome.storage.sync.get(["checkIn"], (result)=>{
        if(result.checkIn){
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign",{
                method:"GET",
                credentials: 'include',
                body: null
            }).then(res => {
                console.log("签到成功 "+new Date().toUTCString())
            }).catch(msg =>{errorHandler(checkIn, msg);});
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
 * */
function errorHandler(handler, msg){
    console.log("ERROR found @ "+new Date()+":");
    console.log(msg);
    (typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412)?setTimeout(handler, 1200000):setTimeout(handler,20000);
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
        }).catch(msg =>{errorHandler(queryBcoin, msg);});
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
                }).catch(msg =>{errorHandler(queryBcoin, msg);});
        }
    });

}

/**
 * Check and notify dynamic update section.
 * */
function videoNotify(push, UUID){
    chrome.storage.local.get('dynamic_id_list', (info)=>{
        let dynamic_id_list = info.dynamic_id_list;
        fetch("https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?uid="+UUID+"&type_list=8,512,4097,4098,4099,4100,4101",{
            method:"GET",
            credentials: 'include',
            body: null
        })
            .then(res => res.json())
            .then(json => {
                chrome.storage.sync.get(["dynamicPush"], (result)=>{
                    if(json["code"] === 0 && result.dynamicPush){
                        let o = json["data"]["cards"];
                        for (let i = 0; i < o.length; i++) {
                            let c = JSON.parse(o[i+""]["card"]);
                            let type = o[i+""]["desc"]["type"];
                            if(!dynamic_id_list.includes(o[i+""]["desc"]["dynamic_id"])){
                                if(push || push === undefined){
                                    if(type === 8){
                                        console.log("你关注的up "+o[i+'']["desc"]["user_profile"]["info"]["uname"]+" 投稿了新视频！"+c["title"]+" see:"+o[i+""]["desc"]["bvid"]);
                                        basicNotification(o[i+""]["desc"]["dynamic_id"], "你关注的up "+o[i+'']["desc"]["user_profile"]["info"]["uname"]+" 投稿了新视频！", c["title"], o[i+""]["desc"]["bvid"], o[i+'']["desc"]["user_profile"]["info"]["face"], "https://b23.tv/");
                                    }else if(type >= 512 && type <= 4101){
                                        console.log("你关注的番剧 "+c["apiSeasonInfo"]["title"]+" 更新了！"+c["index"]+" see:"+c["url"]);
                                        basicNotification(o[i+""]["desc"]["dynamic_id"], "你关注的番剧 "+c["apiSeasonInfo"]["title"]+" 更新了！",c["new_desc"],c["url"].replace("https://www.bilibili.com/",""), c["cover"],"https://www.bilibili.com/");
                                    }
                                }
                                dynamic_id_list.push(o[i+""]["desc"]["dynamic_id"]);
                            }
                        }
                        chrome.storage.local.set({"dynamic_id_list": dynamic_id_list}, ()=>{});
                    }
                });
                chrome.alarms.clear('getNewVideo').then(a=>{
                    chrome.alarms.create('getNewVideo', {'when':Date.now()+10000});
                });
            }).catch(msg =>{errorHandler(()=>{videoNotify(true, UUID)},msg);});
    })

}

/**
 * Web traffic control section.
 * */
// chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
//     let headers = details["requestHeaders"];
//         if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="rua5"){
//             for (let header in headers) {
//                 if(headers[header].name === "Origin"){
//                     headers[header].value = "https://www.bilibili.com/"
//                 }
//             }
//         }
//         return {requestHeaders: details.requestHeaders};
//     }, {urls: ["https://api.bilibili.com/x/vip/privilege/receive*", "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids*", "https://api.bilibili.com/x/web-interface/card*"]}, ['blocking', "requestHeaders", "extraHeaders"]
// );
// chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
//     let headers = details["requestHeaders"];
//     if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="rua5"){
//         for (let header in headers) {
//             if(headers[header].name === "Origin"){
//                 headers[header].value = "https://live.bilibili.com"
//             }
//             if(headers[header].name === "Sec-Fetch-Site")
//                 headers[header].value = "same-site"
//         }
//         details.requestHeaders.push({name: 'Referer', value:'https://live.bilibili.com/'});
//     }
//         return {requestHeaders: details.requestHeaders};
//     }, {urls: ["https://api.live.bilibili.com/msg/send*"]}, ['blocking', "requestHeaders", "extraHeaders"]
// );
// chrome.webRequest.onBeforeRequest.addListener( (details)=>{
//         let hiddenEntry = chrome.storage.sync.get("hiddenEntry").then(t=>{return t.hiddenEntry});
//
//         return hiddenEntry&&!enhancedHiddenEntry&&!details.url.includes("room_id=2842865")?{redirectUrl: "https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=2842865&from=0"}:undefined},
//     {urls: ["*://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser*"]}, ["blocking"]);
//
// chrome.webRequest.onBeforeSendHeaders.addListener((details)=>{
//     let headers = details["requestHeaders"];
//     if(enhancedHiddenEntry){
//         for (let header in headers) {
//             if(headers[header].name === "Cookie"){
//                 headers[header].value = ""
//             }
//         }
//     }
//     return {requestHeaders: details.requestHeaders};
// }, {urls: ["*://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo*",
//         "*://api.live.bilibili.com/room/v1/Room/room_init*",
//         "*://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo*",
//         "*://api.live.bilibili.com/xlive/web-room/v1/index/roomEntryAction",
//         "*://api.live.bilibili.com/xlive/web-room/v1/index/getIpInfo*",
//         "*://api.live.bilibili.com/xlive/web-interface/v1/index/getWebAreaList*",
//         "*://api.live.bilibili.com/relation/v1/Feed/heartBeat*",
//         "*://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?*",
//         "*://api.bilibili.com/x/web-interface/nav*",
//         "*://api.live.bilibili.com/xlive/activity-interface/v1/widgetBanner/GetWidgetBannerList*",
//         "*://api.live.bilibili.com/xlive/web-room/v1/index/getOffLiveList*",
//         "*://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfoWeb*",
//         "*://api.live.bilibili.com/xlive/web-room/v1/giftPanel/giftData*",
//         "*://api.live.bilibili.com/xlive/web-room/v1/giftPanel/giftConfig*",
//         "*://api.live.bilibili.com/xlive/open-interface/v1/query_resource*",
//         "*://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory*"]}, ['blocking', "requestHeaders", "extraHeaders"]);
//
// chrome.webRequest.onHeadersReceived.addListener((details)=>{
//     if(new URLSearchParams(new URL(details["url"])["search"]).get("requestFrom")==="ruaDL"){
//         let fileFormat = new URL(details["url"])["pathname"].substr(new URL(details["url"])["pathname"].length-4,4);
//         if(fileFormat === ".m4s") fileFormat = ".mp3";
//         chrome.storage.local.get(['downloadFileName'],(info)=>{
//             details.responseHeaders.push({name:"Content-Disposition", value:"attachment; filename=\""+info.downloadFileName+fileFormat+"\"; filename*=\"UTF-8''"+info.downloadFileName+fileFormat+"\""});
//         });
//     }
//     return {responseHeaders: details.responseHeaders};
// }, {urls: ["*://*.bilivideo.com/upgcxcode/*", "*://*.akamaized.net/upgcxcode/*"]}, ["responseHeaders", 'blocking']);

/**
 * Live room check in section.
 * */
function checkMedalDaka(){
    chrome.storage.sync.get(["daka"], (result)=>{
        console.log("Grabbing medal info");
        chrome.storage.local.get(['rua_lastDK', 'jct', 'uuid'], (info=>{
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
                        console.log(json["data"]["list"].length+" medal founded.")
                        for (let i = 0; i < json["data"]["list"].length; i++){
                            if(json["data"]["list"][i]["medal_info"]["today_feed"]<100)
                                medals.push(json["data"]["list"][i]["medal_info"]["target_id"]);
                        }
                        daka(medals, info.jct);
                    })
                    .catch(msg => {
                        chrome.storage.local.set({'rua_lastDK':"1970-01-01"}, ()=>{});
                        errorHandler(checkMedalDaka,msg);
                    });
            }else console.log("No more grab needed.");
        }));

    });

}

/**
 * Send damaku to each live room.
 * */
function daka(medals, JCT){
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
function checkUpd(url){
    console.log("checking update at "+(new URL(url)).hostname);
    let latestVersion = chrome.runtime.getManifest().version;
    fetch(url+new Date().getTime(), {
        method:'GET',
        credentials: 'omit',
        body:null
    }).then(t=>t.text())
        .then(text=>{
            if (text !== null && (/<title>(.*?)<\/title>/m).exec(text) !== null) {
                if(latestVersion !== (/<title>(.*?)<\/title>/m).exec(text)[1]){
                    latestVersion = (/<title>(.*?)<\/title>/m).exec(text)[1];
                    if(latestVersion!==chrome.runtime.getManifest().version){
                        console.log("A newer version found: "+latestVersion);
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
            checkUpd(url.includes("github")?"https://tyrael-lee.gitee.io/harukaemoji/?_=":"https://tyraeldlee.github.io/HarukaEmoji/?_=");
    });
}

function isNewerThan(dateOld, dateNew){
    return parseInt(dateOld[0])<parseInt(dateNew[0])?true:parseInt(dateOld[0])>parseInt(dateNew[0])?false:parseInt(dateOld[1])<parseInt(dateNew[1])?true:parseInt(dateOld[1])>parseInt(dateNew[1])?false:parseInt(dateOld[2])<parseInt(dateNew[2]);
}

function getUTC8Time(){
    return new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + 28800000);
}

function setBadge(title, text){
    chrome.action.setTitle({title: title});
    chrome.action.setBadgeText({text: text});
}

// This is the service worker for mv3 which some functions are not support yet.
// Since wasm cannot be loaded in mv3, ffmpeg and related functions are not supported.
//todo: check in mv3 
//todo: stream notification mv3 √
//todo: video update mv3 √
//todo: b coin mv3
//todo: daka √
//todo: hidden
//todo: update check 
//todo: context menu √
//todo: web traffic control