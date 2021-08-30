const setting1 = document.getElementById("notification");
const setting2 = document.getElementById("medal");
const setting3 = document.getElementById("check-in");
const loginInfo = document.getElementById("login");
var UUID = -2;
function updateUID(){
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.extension.sendRequest({ msg: "get_UUID" },function(uid){UUID = uid;
            let logText = "";
            if(UUID === -1){
                logText = "未登录";
                loginInfo.style.color = "#f44336";
            }else if(UUID !== -2){
                logText = "已登录";
                loginInfo.style.color = "#6dc781";
            }
            logText+="<span class=\"tooltiptext tooltiptext-middle\">b站登录状态。插件要在b站登录后才能启用全部功能。</span>";
            loginInfo.innerHTML = logText;
        });
    }
}

setInterval(updateUID,1000);

document.getElementById("logo").addEventListener("click", function (){
    chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/rua%E8%B1%B9%E5%99%A8/igapngheaefbfhikpbngjgakfnedkchb"})
});

document.getElementById("version").addEventListener("click", function (){
    chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji"})
});

document.getElementById("logo").style.cursor = "pointer";
document.getElementById("version").style.cursor = "pointer";




setting1.addEventListener("change", function (){
    let checked = this.checked;
    chrome.storage.sync.set({"notification": checked}, function(){
        console.log("notification on:"+checked);
    });
})

setting2.addEventListener("change", function (){
    let checked = this.checked;
    chrome.storage.sync.set({"medal": checked}, function(){});
})

setting3.addEventListener("change", function (){
    let checked = this.checked;
    chrome.storage.sync.set({"checkIn": checked}, function(){});
})

window.addEventListener("focus", function (){
    chrome.storage.sync.get(["notification"], function(result){
        setting1.checked = result.notification;});

    chrome.storage.sync.get(["medal"], function(result){
        setting2.checked = result.medal;});

    chrome.storage.sync.get(["checkIn"], function(result){
        setting3.checked = result.checkIn;});
});
