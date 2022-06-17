/***
 * Copyright (c) 2021 Tyrael, Y. LI
 *
 * Abstract Data Type class.
 * */
function ImageButton(URL, span, left, right){
    this.URL = URL;
    this.span = span;
    this.left = left;
    this.right = right;
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