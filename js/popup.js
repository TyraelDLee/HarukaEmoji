const setting  = document.getElementsByClassName("setting")[0];
const setting1 = document.getElementById("notification");
const setting2 = document.getElementById("medal");
const setting3 = document.getElementById("check-in");
const setting4 = document.getElementById("img-notice");
const setting5 = document.getElementById("b-coin");
const setting6 = document.getElementById("qn");
const setting7 = document.getElementById("btn7");
const loginInfo = document.getElementById("login");

const qn_table = ["原画", "蓝光","超清","高清","流畅"];
const qnItem = setting7.getElementsByClassName("qn-i");

var qnvalue = 0;
var qn;
var UUID = -2;
function en(e){e.preventDefault()}
chrome.runtime.connect({ name: "popup" });
function updateUID(){
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.runtime.sendMessage({ msg: "get_UUID" },function(uid){UUID = uid.res;
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

document.getElementById("bug-reporter").addEventListener("click", function (){
    chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji/issues"})
})

document.getElementById("logo").addEventListener("click", function (){
    chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/rua%E8%B1%B9%E5%99%A8/igapngheaefbfhikpbngjgakfnedkchb"})
});

document.getElementById("version").addEventListener("click", function (){
    chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji"})
});

document.getElementById("source").addEventListener("click", function (){
    chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji"})
});

document.getElementById("readme").addEventListener("click", function (){
    chrome.tabs.create({url: "./readme.html"})
});

setting1.addEventListener("change", function (){
    let checked = this.checked;
    buttonDisabled(this.checked, setting4);
    chrome.storage.sync.set({"notification": checked}, function(){
        console.log("notification on:"+checked);
    });
});

setting2.addEventListener("change", function (){
    let checked = this.checked;
    chrome.storage.sync.set({"medal": checked}, function(){});
});

setting3.addEventListener("change", function (){
    let checked = this.checked;
    chrome.storage.sync.set({"checkIn": checked}, function(){});
});

setting4.addEventListener("change", function (){
    let checked = this.checked;
    chrome.storage.sync.set({"imageNotice": checked}, function (){})
});

setting5.addEventListener("change", function (){
   let checked = this.checked;
    chrome.storage.sync.set({"bcoin": checked}, function (){})
});

setting6.addEventListener("change", function (){
    qn = this.checked;
    scrollDisabled(this.checked, setting7);
    chrome.storage.sync.set({"qn": qn}, function (){})
});

setting7.addEventListener("wheel", function (e){

    if(qn){
        e.deltaY>=0?qnvalue+=1:qnvalue-=1;
        if (qnvalue<=0)qnvalue=0;
        if(qnvalue>=4)qnvalue=4;
        scrollAnim(qnvalue);
        chrome.runtime.sendMessage({ msg: "QNV?"+qn_table[qnvalue] },function (){});
    }
});

setting7.addEventListener("mouseenter", function (){
    setting.addEventListener("wheel", en);
});
setting7.addEventListener("mouseleave", function (){
    setting.removeEventListener("wheel", en);
});

for (let i = 0; i < qnItem.length; i++) {
    qnItem[i].addEventListener("click",function (){
        if(qn){
            qnvalue = i;
            scrollAnim(qnvalue);
            chrome.runtime.sendMessage({ msg: "QNV?"+qn_table[qnvalue] },function (){});
        }
    });
}

window.addEventListener("focus", function (){
    chrome.storage.sync.get(["notification"], function(result){
        buttonDisabled(result.notification, setting4);
        setting1.checked = result.notification;});

    chrome.storage.sync.get(["medal"], function(result){
        setting2.checked = result.medal;});

    chrome.storage.sync.get(["checkIn"], function(result){
        setting3.checked = result.checkIn;});

    chrome.storage.sync.get(["imageNotice"], function(result){
        setting4.checked = result.imageNotice;});

    chrome.storage.sync.get(["bcoin"], function(result){
        setting5.checked = result.bcoin;});

    chrome.storage.sync.get(["qn"], function(result){
        setting6.checked = result.qn;
        qn = result.qn;
        scrollDisabled(result.qn, setting7);
    });

    chrome.storage.sync.get(["qnvalue"], function (result){
        qnvalue = qn_table.indexOf(result.qnvalue);
        scrollAnim(qnvalue)
        //document.getElementById("qn-items").style.marginTop = qnvalue*-20+"px";
    })

});

window.addEventListener("blur", function (){
    console.log("blur")
})

function buttonDisabled(checked, obj){
    if(checked) {
        obj.removeAttribute("disabled");
        obj.parentElement.getElementsByTagName("label")[0].classList.remove("btn-disabled");
    } else{
        obj.setAttribute("disabled", "true");
        obj.parentElement.getElementsByTagName("label")[0].classList.add("btn-disabled");
    }
}

function scrollDisabled(checked, obj){
    if(checked) {
        obj.classList.remove("btn-disabled");
    } else{
        obj.classList.add("btn-disabled");
    }
}

function scrollAnim(newPos){
    newPos*=-18;
    let currentPos = parseInt(document.getElementById("qn-items").style.marginTop.replace("px",""));
    let op = currentPos>newPos;
    if(currentPos - newPos !== 0)
        scroll();
    function scroll(){
        op?currentPos-=1:currentPos+=1;
        for (let i = 0; i < 5; i++)
            document.getElementsByClassName("qn-i")[i].style.transform = "rotateX("+(18*i+currentPos)*2.5+"deg)";
        document.getElementById("qn-items").style.marginTop = currentPos+"px";
        if(currentPos!==newPos){
            setTimeout(()=>{scroll();}, 10);
        }

    }
}

