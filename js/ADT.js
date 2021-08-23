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
        this.list.slice(index,1);
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

function Madel(MID, RID, UID){
    this.MID = MID; // madel id
    this.RID = RID; // room id
    this.UID = UID;
}

function MadelList(){
    this.list = [];
}

MadelList.prototype.push = function (madel){
    this.list.push(madel);
}

MadelList.prototype.existsRID = function (id){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].RID === id) return true;
    }
    return false;
}

MadelList.prototype.existsUID = function (id){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].UID === id) return true;
    }
    return false;
}

MadelList.prototype.get = function (rid){
    for (let i = 0; i < this.list.length; i++) {
        if(this.list[i].RID === rid) return this.list[i].MID;
    }
    return -1+"";
}
