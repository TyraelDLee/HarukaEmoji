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
