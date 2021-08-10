/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */

var JCT = -1;
var MADEL_LIST = new MadelList();
var room_id = window.location["pathname"].replace("/", "");
var exp =new RegExp("^[0-9]*$");

console.log(room_id)
updateJCT();
if(exp.test(room_id))
    getMadel();

var page = 1;
function getMadel(){
    $.ajax({
        url: "https://api.live.bilibili.com/fans_medal/v5/live_fans_medal/iApiMedal?page="+page,
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
                if(data["pageinfo"]["totalpages"] === page){
                    console.log("load list complete");
                    if(MADEL_LIST.get(room_id) !== "-1")
                        wareMadel(MADEL_LIST.get(room_id));
                }else{
                    page++;
                    getMadel();
                }
            }
        }
    });
}

function wareMadel(mid){
    if(JCT !== -1){
        var madelForm = new FormData();
        madelForm.append("medal_id", mid);
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
                console.log("ware madel successful, MID="+mid);
            }
        })
    }
}

function updateJCT(){
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.extension.sendRequest({ msg: "get_JCT" },function(jct){JCT = jct;});
    }
}
