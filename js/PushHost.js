chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        let headers = details["requestHeaders"];
        for (let header in headers) {
            if (headers[header].name === "Cookie") {
                headers[header].value = ""
            }
        }
    return {requestHeaders: details.requestHeaders};
    }, {urls: ["https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids"]}, ['blocking', "requestHeaders", "extraHeaders"]
);
chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        let headers = details["requestHeaders"];
        for (let header in headers) {
            if(headers[header].name === "Origin"){
                headers[header].value = "https://www.bilibili.com/"
            }
        }
        return {requestHeaders: details.requestHeaders};
    }, {urls: ["https://api.bilibili.com/x/vip/privilege/receive", "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids"]}, ['blocking', "requestHeaders", "extraHeaders"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        let headers = details["requestHeaders"];
        for (let header in headers) {
            if(headers[header].name === "Origin"){
                headers[header].value = "https://live.bilibili.com"
            }
            if(headers[header].name === "Sec-Fetch-Site")
                headers[header].value = "same-site"
        }
        details.requestHeaders.push({name: 'Referer', value:'https://live.bilibili.com/'});
        return {requestHeaders: details.requestHeaders};
    }, {urls: ["https://api.live.bilibili.com/msg/send"]}, ['blocking', "requestHeaders", "extraHeaders"]
);