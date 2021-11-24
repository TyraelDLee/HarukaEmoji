/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
var JCT = -1;
var MEDAL_LIST = new MedalList();
var mp = 1;
var MID = -1;
var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
var exp =new RegExp("^[0-9]*$");
var on;
var medalName = "";
chrome.storage.sync.get(["medal"], function(result){on = result.medal});
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if(key === "medal") on = newValue;
    }
});
getUserInfo();
setTimeout(function (){
    if(exp.test(room_id)){
        getMedal();
    }
}, 10);

function init(){
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.runtime.sendMessage({ msg: "MID?"+room_id },function(mid){
            MID = mid.res;
            wareMedal();});
    }
}

function getMedal(){
    $.ajax({
        url: "https://api.live.bilibili.com/fans_medal/v5/live_fans_medal/iApiMedal?page="+mp,
        type: "GET",
        dataType: "json",
        json: "callback",
        xhrFields: {
            withCredentials: true
        },
        success: function (json) {
            let data = json["data"];
            if(data.length !== 0){
                let medal_list = data["fansMedalList"];
                for (let i = 0; i < medal_list.length; i++)
                    MEDAL_LIST.push(new Medal(medal_list[i]["medal_id"]+"", medal_list[i]["roomid"]+"", medal_list[i]["target_id"]+"", medal_list[i]["medalName"]));
                if(data["pageinfo"]["totalpages"] === mp){
                    console.log("load list complete");
                    if(MEDAL_LIST.get(room_id) !== "-1"){
                        MID = MEDAL_LIST.get(room_id);
                        medalName = MEDAL_LIST.getName(room_id);
                        wareMedal();
                    }else
                        medalName = "none";
                }else{
                    mp++;
                    getMedal();
                }
            }
        }
    });
}

function wareMedal(){
    if(JCT !== -1 && on && MID !== -1){
        var madelForm = new FormData();
        madelForm.append("medal_id", MID);
        madelForm.append("csrf", JCT);
        madelForm.append("csrf_token", JCT);
        $.ajax({
            url: "https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear",
            type: "POST",
            data: madelForm,
            dataType: "JSON",
            processData: false,
            contentType: false,
            cache: false,
            xhrFields: {
                withCredentials: true
            },
            success: function (){
                console.log("ware medal successful, MID="+MID);
            }
        });
    }
}

function getUserInfo(){
    if(typeof chrome.app.isInstalled!=="undefined") {
        chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
            JCT = lf.res.split(",")[0];
        });
    }
}

window.addEventListener("focus", function (){
    wareMedal();
});