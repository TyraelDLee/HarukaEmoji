/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */

/**
 * ONLY used for block cookie @https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids
 * Since that API do not accept cookie in header.
 * DO NOT USE THIS EXCEPT THE API ABOVE.
 * key: ExtraHeaders, is necessary since build 72.
 * */
chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
    let headers = details["requestHeaders"];
    for (let header in headers) {
        if (headers[header].name === "Cookie") {
            headers[header].value = ""
            return {requestHeaders: details.requestHeaders};
        }
    }
}, {urls: ["https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids"]}, ['blocking', "requestHeaders", "extraHeaders"]
);

function query() {
    $.ajax({
        url: "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids",
        type: "POST",
        data: {"uids": FOLLOWING_LIST.getUIDList()},
        dataType: "json",
        json: "callback",
        success: function (json) {
            if(json["code"] === 0){
                let ON_AIR_LIST = new FollowingMemberList()
                let data = json["data"];
                for (let i = 0; i < FOLLOWING_LIST.getUIDList().length; i++) {
                    if(data[FOLLOWING_LIST.getUIDList()[i]+""] !== undefined){
                        if(data[FOLLOWING_LIST.getUIDList()[i]+""].live_status === 1){
                            let member = new FollowingMember(data[FOLLOWING_LIST.getUIDList()[i]+""]["uid"], data[FOLLOWING_LIST.getUIDList()[i]+""]["uname"], data[FOLLOWING_LIST.getUIDList()[i]+""]["face"], data[FOLLOWING_LIST.getUIDList()[i]+""]["cover_from_user"], data[FOLLOWING_LIST.getUIDList()[i]+""]["keyframe"],data[FOLLOWING_LIST.getUIDList()[i]+""]["room_id"], data[FOLLOWING_LIST.getUIDList()[i]+""]["title"])
                            member.ONAIR = true;
                            member.TYPE = data[FOLLOWING_LIST.getUIDList()[i]+""]["broadcast_type"]===1?1:0;
                            ON_AIR_LIST.push(member);
                        }
                    }
                }
                if(ON_AIR_LIST.list.length>0) updateList(ON_AIR_LIST)
            }
        },
        error: function (msg) {
            errorHandler(msg)
        }
    });
}
