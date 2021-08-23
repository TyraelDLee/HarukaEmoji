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
            let ON_AIR_LIST = new FollowingMemberList()
            let data = json["data"];
            for (let i = 0; i < FOLLOWING_LIST.getUIDList().length; i++) {
                if(data[FOLLOWING_LIST.getUIDList()[i]+""] !== undefined){
                    if(data[FOLLOWING_LIST.getUIDList()[i]+""].live_status === 1){
                        let member = new FollowingMember(data[FOLLOWING_LIST.getUIDList()[i]+""]["uid"], data[FOLLOWING_LIST.getUIDList()[i]+""]["uname"], data[FOLLOWING_LIST.getUIDList()[i]+""]["face"], data[FOLLOWING_LIST.getUIDList()[i]+""]["cover_from_user"], data[FOLLOWING_LIST.getUIDList()[i]+""]["keyframe"],data[FOLLOWING_LIST.getUIDList()[i]+""]["room_id"], data[FOLLOWING_LIST.getUIDList()[i]+""]["title"])
                        member.ONAIR = true;
                        ON_AIR_LIST.push(member);
                    }
                }
            }
            updateList(ON_AIR_LIST)
        },
        error: function (msg) {
            console.log("ERROR found")
            if (typeof msg["responseJSON"] !== "undefined" && msg["responseJSON"]["code"] === -412) setTimeout(getOnAirFollowing, 900000);
            // if blocked then retry after 15min.
            else setTimeout(getOnAirFollowing, 1000);
            // others error retry immediately.
        }
    });
}
