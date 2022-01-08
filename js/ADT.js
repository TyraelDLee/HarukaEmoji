/***
 * Copyright (c) 2021 Tyrael, Y. LI
 *
 * Abstract Data Type class.
 * */

function FollowingMember(UID, NAME, FACE, COVER, KEYFRAME, ROOM_URL, TITLE){
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

FollowingMember.prototype.print = function (){
    return "uid:"+this.UID + " name:" + this.NAME + " rid:" + this.ROOM_URL +
        " title:" + this.TITLE;
}

function FollowingMemberList(){
    this.list = [];
}

FollowingMemberList.prototype.push = function (member){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].UID === member.UID)
            return false;
    }
    this.list.push(member);
    return true;
}

FollowingMemberList.prototype.get = function(index){
    return this.list[index];
}

FollowingMemberList.prototype.getUIDList = function (){
    if(this.list.length < 1)
        return [];
    let L = [];
    for (let i = 0; i < this.list.length; i++) L.push(this.list[i].UID);
    return L;
}

FollowingMemberList.prototype.clearAll = function (){
    this.list = [];
}

FollowingMemberList.prototype.update = function (members){
    // intersection
    this.list = this.list.filter(function (member) {
        return members.indexOf(member) !== -1;
    });
}

FollowingMemberList.prototype.updateRemove = function (members){
    // complementary
    this.list = this.list.filter(function (member) {
        return members.indexOf(member) === -1;
    });
    return this.list.length > 0;
}

FollowingMemberList.prototype.updateStatus = function (index, bool){
    this.list[index].PUSHED = bool;
}

FollowingMemberList.prototype.updateElementOnAirStatus = function (o, bool){
    this.list[this.indexOf(o)] = o;
    this.list[this.indexOf(o)].ONAIR = bool;
}

FollowingMemberList.prototype.length = function (){
    return this.list.length;
}

FollowingMemberList.prototype.indexOf = function (member){
    for (let i = 0; i < this.list.length; i++) {
        if(member.UID === this.list[i].UID)
            return i;
    }
    return -1;
}

FollowingMemberList.prototype.remove = function (member){
    let index = this.indexOf(member);
    if(index > -1)
        this.list.splice(index,1);
}

FollowingMemberList.prototype.print = function (){
    let str = this.list.length+" ";
    for (let i = 0; i < this.list.length; i++) {
        str += this.list[i].print() + "\r\n";
    }
    return str;
}

FollowingMemberList.prototype.copy = function (FMlist){
    this.list = FMlist.list;
}

FollowingMemberList.prototype.maintainList = function (member){
    if(this.indexOf(member) !== -1)
        this.remove(member);
    else
        this.push(member);
}


function ImageButton(URL, span){
    this.URL = URL;
    this.span = span;
}

ImageButton.prototype.getURL = function (){
    return this.URL;
}

ImageButton.prototype.getSpan = function (){
    if(this.span < 1)
        return 1;
    if(this.span > 4)
        return 4;
    else
        return this.span;
}

function Medal(MID, RID, UID, mName, mLevel, mColourStart, mColourEnd, mColourBorder){
    this.MID = MID; // madel id
    this.RID = RID; // room id
    this.UID = UID;
    this.mName = mName;
    this.mLevel = mLevel;
    this.mColourStart = mColourStart;
    this.mColourEnd = mColourEnd;
    this.mColourBorder = mColourBorder;
}
Medal.prototype.toString = function (){
    return this.MID+" "+ this.UID + " " + this.mName;
}

function MedalList(){
    this.list = [];
}

MedalList.prototype.push = function (madel){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].MID === madel.MID)
            return false;
    }
    this.list.push(madel);
    return true;
}

MedalList.prototype.existsRID = function (id){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].RID === id) return true;
    }
    return false;
}

MedalList.prototype.existsUID = function (id){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].UID === id) return true;
    }
    return false;
}

MedalList.prototype.get = function (rid){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].RID === rid) return this.list[i];
    }
    return new Medal("-1","-1","-1","null","-1","0","0","0");
}

MedalList.prototype.getByUid = function (uid){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].UID === uid) return this.list[i];
    }
    return new Medal("-1","-1","-1","null","-1","0","0","0");
}

MedalList.prototype.getUID = function (rid){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].RID === rid) return this.list[i].UID;
    }
    return -1+"";
}

MedalList.prototype.getName = function (rid){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].RID === rid) return this.list[i].mName;
    }
    return -1+"";
}

MedalList.prototype.length = function (){
    return this.list.length;
}

MedalList.prototype.clearAll = function (){
    this.list = [];
}


function WindowIDList(){
    this.list = [];
}
WindowIDList.prototype.push = function (id){
    this.remove(id);
    this.list.push(id);
}
WindowIDList.prototype.remove = function (id){
    if (this.list.indexOf(id)>-1)
        this.list.splice(this.list.indexOf(id),1);
}
WindowIDList.prototype.getCurrent = function (){
    if (this.list.length>0) return this.list[this.list.length-1]; else return -1;
}
WindowIDList.prototype.length = function (){
    return this.list.length;
}

function ReplyPayload(){
    this.uid = "";
    this.type = "";
    this.name = "";
    this.url = "";
    this.face = "";
    this.time = "";
}
ReplyPayload.prototype.isSame = function (replyPayload){
    return this.uid === replyPayload.uid;
}
ReplyPayload.prototype.isOlderThan = function (str){
    return parseInt(this.time)>parseInt(str);
}


function DanmakuObj(time, mid, content){
    this.time = time;
    this.mid = mid;
    this.content = content;
    this.name = [];
    this.look = true;
}
DanmakuObj.prototype.setName = function (name){
    this.name = name;
}

function DanmakuArr(){
    this.list = []
    this.size = 0;
    this.displaySize = this.size;
}

DanmakuArr.prototype.push = function (danmakuObj){
    this.list.push(danmakuObj);
    this.size++;
}

DanmakuArr.prototype.concat = function (danmakuArrObj){
    this.list = this.list.concat(danmakuArrObj.list);
    this.size+=danmakuArrObj.size;
}

DanmakuArr.prototype.get = function (index){
    return this.list[index];
}

DanmakuArr.prototype.max = function (){
    let local_Max = 0;
    for (let i = 0; i < this.list.length; i++) {
        if (local_Max < this.list[i].time)
            local_Max = this.list[i].time;
    }
    return local_Max;
}

DanmakuArr.prototype.min = function (){
    let local_Min = Number.MAX_VALUE;
    for (let i = 0; i < this.list.length; i++) {
        if (local_Min > this.list[i].time)
            local_Min = this.list[i].time
    }
    return local_Min;
}

DanmakuArr.prototype.sort = function (num){
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
        const index = ~~(this.list[i].time / bucSize);
        !buc[index] && (buc[index] = []);
        buc[index].push(this.list[i]);
        let localSize = buc[index].length;
        while (localSize > 0){
            if (buc[index][localSize]!==undefined && buc[index][localSize].time < buc[index][localSize - 1].time)
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

DanmakuArr.prototype.find = function (content){
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

/* This Source Code Form is subject to the terms of the Mozilla Public
     * License, v. 2.0. If a copy of the MPL was not distributed with this
     * file, You can obtain one at http://mozilla.org/MPL/2.0/.
     *
     * Originally from bilibili-helper at https://github.com/bilibili-helper/bilibili-helper-o/blob/master/src/js/libs/crc32.js
     *
     * */
function CRC32(){
    this.crc32Table = new Uint32Array(256);
    this.initCrc32Table(this.crc32Table);
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
CRC32.prototype.initCrc32Table = function (table){
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
CRC32.prototype.compute = function (input, addPadding = false){
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
CRC32.prototype.crack = function (hash){
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
CRC32.prototype.crc32Update = function (currCrc, code) {
    return (currCrc >>> 8) ^ this.crc32Table[(currCrc ^ code) & 0xFF];
}
CRC32.prototype.lookup = function (hash) {
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