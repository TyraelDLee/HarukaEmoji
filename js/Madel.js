/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */

var JCT = -1;
var MADEL_LIST = new MadelList();
var mp = 1;
var MID = -1;
var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
var exp =new RegExp("^[0-9]*$");
var on;
chrome.storage.sync.get(["medal"], function(result){on = result.medal});
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if(key === "medal") on = newValue;
    }
});
getUserInfo();
setTimeout(function (){
    if(exp.test(room_id))
        getMadel();
}, 10);

function init(){
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.runtime.sendMessage({ msg: "MID?"+room_id },function(mid){
            MID = mid.res;
            wareMadel();});
    }
}

function getMadel(){
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
                let madel_list = data["fansMedalList"];
                for (let i = 0; i < madel_list.length; i++)
                    MADEL_LIST.push(new Madel(madel_list[i]["medal_id"]+"", madel_list[i]["roomid"]+"", madel_list[i]["target_id"]+""));
                if(data["pageinfo"]["totalpages"] === mp){
                    console.log("load list complete");
                    if(MADEL_LIST.get(room_id) !== "-1")
                        MID = MADEL_LIST.get(room_id);
                        wareMadel();
                }else{
                    mp++;
                    getMadel();
                }
            }
        }
    });
}

function wareMadel(){
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
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.runtime.sendMessage({ msg: "get_JCT" },function(jct){JCT = jct.res;});
    }
}

window.addEventListener("focus", function (){
    wareMadel();
});