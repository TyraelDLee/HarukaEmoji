/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */

const API_LINK = "https://api.live.bilibili.com/msg/send";

var JCT = -1;

var WINDOW_HEIGHT;
var WINDOW_WIDTH;

var DanMuForm = new FormData();

function setSize(){
    WINDOW_HEIGHT = window.innerHeight;
    WINDOW_WIDTH = window.innerWidth;
}

setSize();
updateJCT();
var absoluteLoc = [100, 100, WINDOW_WIDTH - 100];
var isDrag = 0;
const parent = document.body;
const popup = document.createElement("div");
const selec = document.createElement("div");
const emojiPad = document.createElement("div");
const emojiTable = document.createElement("table");
const DanMuInput = document.createElement("textarea");
const DanMuSub = document.createElement("button");
const textLength = document.createElement("span");

// let commentsTextArea = null;


popup.setAttribute("id", "emoji-popup");
popup.style.background = "url("+link+") no-repeat center";
popup.style.backgroundSize = "contain";
popup.innerHTML = "<!---->";

selec.setAttribute("id", "emoji-selection");
selec.classList.add("emoji_sec");
selec.style.display = "none"
selec.innerHTML = "";

emojiPad.setAttribute("id","emoji-tray");
emojiPad.classList.add("emoji_sec");
emojiPad.appendChild(emojiTable);

emojiTable.setAttribute("class", "emoji-table");
emojiTable.innerHTML = "<div id='load'>加载弹幕中...</div>";

selec.appendChild(emojiPad);
parent.appendChild(selec);
parent.appendChild(popup);

popup.style.left = WINDOW_WIDTH - 100 + 'px';
popup.style.top = "100px";
selec.style.left = WINDOW_WIDTH - 410 +"px";
selec.style.top = "95px";

DanMuSub.setAttribute("id", "input-button");
DanMuSub.innerHTML = "<span>发送</span>";
DanMuSub.style.display = "none";

DanMuInput.setAttribute("id", "input-form");
DanMuInput.placeholder = "这里也可以发弹幕~";
DanMuInput.style.display = "none";

textLength.setAttribute("id", "length-indicator");
textLength.innerHTML = " 0/30";
textLength.style.display = "none";

selec.appendChild(DanMuInput);
selec.appendChild(DanMuSub);
selec.appendChild(textLength);
var oLoc = [0,0];
var cLoc = [0,0];
window.onload=function(){
    popup.onmousedown = function (ev) {
        let popupLocHor;
        let popupLocVac;
        popup.className = "popup-click-in";
        const oevent = ev || event;
        const distanceX = oevent.clientX - popup.offsetLeft;
        const distanceY = oevent.clientY - popup.offsetTop;
        oLoc = [popup.offsetLeft, popup.offsetTop];
        cLoc = [popup.offsetLeft, popup.offsetTop];
        document.onmousemove = function (ev) {
            isDrag = 1;
            const oevent = ev || event;
            if(oevent.clientX - distanceX >= 0 && oevent.clientX - distanceX <= WINDOW_WIDTH - 60)
                popupLocHor = oevent.clientX - distanceX;
            if(oevent.clientY - distanceY >= 0 && oevent.clientY - distanceY <= WINDOW_HEIGHT - 60)
                popupLocVac = oevent.clientY - distanceY;
            cLoc = [popupLocHor, popupLocVac];
            popup.style.left = popupLocHor + 'px';
            popup.style.top = popupLocVac + 'px';
            popupLocHor < 320?selec.style.left = popupLocHor + 60 + "px":selec.style.left = popupLocHor - 310 + "px";
            popupLocVac > WINDOW_HEIGHT - 360?selec.style.top = WINDOW_HEIGHT - 360 + "px":selec.style.top = popupLocVac - 5 + "px";
            if(popupLocHor > -1)
                absoluteLoc = [WINDOW_WIDTH - popupLocHor, popupLocVac, popupLocHor];
        };
        document.onmouseup = function () {
            popup.className = "popup-click-out";
            if(isMoved(oLoc[0], oLoc[1], cLoc[0], cLoc[1])){
                if (selec.style.display === "none") {
                    selec.classList.remove("selection-fade-out");
                    selec.style.display = "block";
                    selec.classList.add("selection-fade-in");
                } else {
                    selec.classList.remove("selection-fade-in");
                    selec.classList.add("selection-fade-out");
                    setTimeout(hide, 150);
                }
            }
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    popup.onmouseenter = function (){popup.className = "popup-click-hoverin";};

    popup.onmouseleave = function (){popup.className = "popup-click-hoverout";};
}

function hide(){selec.style.display = "none";}

function isMoved(oX, oY, cX, cY){return Math.abs(oX - cX) === 0 && Math.abs(oY - cY) === 0;}
/***
 * Resize handler
 * */
window.addEventListener("resize", function(){
    let popleft;
    setSize();
    absoluteLoc[0] < absoluteLoc[2]?popleft = WINDOW_WIDTH - absoluteLoc[0]:popleft = absoluteLoc[2];
    popup.style.left = popleft + 'px';
    if(absoluteLoc[1] > WINDOW_HEIGHT){
        popup.style.top = WINDOW_HEIGHT - 60 + "px";
        selec.style.top = WINDOW_HEIGHT - 360 + "px";
    }
    popleft < 320?selec.style.left = popleft + 60 + "px":selec.style.left = popleft - 310 + "px";
});

setTimeout(delay,5000);
function delay(){
    console.log("load complete");
    if(JCT === -1){
        emojiTable.innerHTML = "<div id='load'>加载失败，<br>请<a href="+window.location+">点击这里</a>重试<br><br>" +
            "如未登录，请先登录</div>";
        document.getElementById("load").style.marginTop = "130px";
    }else{
        var cursorSelectionStart = 0;
        var cursorSelectionEnd = 0;
        DanMuInput.style.display = "block";
        DanMuSub.style.display = "block";
        textLength.style.display = "block";
        DanMuInput.onkeyup = function (ev){
            console.log(ev.keyCode);
            if(ev.keyCode === 13){
                ev.preventDefault();
                packaging(DanMuInput.value);
                send();
                DanMuInput.value = "";

            }
            calculateTextLength(DanMuInput.value.length);
            cursorSelectionStart = DanMuInput.selectionStart;
            cursorSelectionEnd = DanMuInput.selectionEnd;

        }
        DanMuInput.onkeydown = function (ev){
            if(ev.code === "Enter") ev.preventDefault();
        }
        selec.addEventListener("mousemove", function (ev){
            cursorSelectionStart = DanMuInput.selectionStart;
            cursorSelectionEnd = DanMuInput.selectionEnd;
        });

        emojiTable.innerHTML = construcateHTMLTable();

        for (let i = 0; i < emojiTable.rows.length; i++) {
            var cell = emojiTable.rows[i].cells;
            for (let j = 0; j < cell.length; j++) {
                cell[j].onclick = function (){
                    DanMuInput.value = DanMuInput.value.substr(0, cursorSelectionStart) + "(" +emoji[i][j]+ ")" + DanMuInput.value.substr(cursorSelectionEnd);
                    cursorSelectionStart = DanMuInput.selectionStart;
                    cursorSelectionEnd = DanMuInput.selectionEnd;
                    calculateTextLength(DanMuInput.value.length);
                }
            }
        }

        DanMuSub.onclick = function (){
            if(DanMuInput.value !== ""){
                packaging(DanMuInput.value);
                send();
                textLength.innerHTML = " 0/30";
            }
            DanMuInput.value = "";
        }

    }
}

setInterval(updateJCT, 3000);

function updateJCT(){
    if(typeof chrome.app.isInstalled!=="undefined"){
        chrome.extension.sendRequest({ msg: "get_JCT" },function(jct){JCT = jct;});
    }
}

function getTimeSnap(){return Date.now();}

function packaging(msg){
    DanMuForm.append("bubble", "0");
    DanMuForm.append("msg", msg);
    DanMuForm.append("color", "16777215");
    DanMuForm.append("mode", "1");
    DanMuForm.append("fontsize", "25");
    DanMuForm.append("rnd", getTimeSnap()+"");
    DanMuForm.append("roomid", ROOM_ID);
    DanMuForm.append("csrf", JCT);
    DanMuForm.append("csrf_token", JCT);
}

function send(){
    $.ajax({
        url: API_LINK,
        type: "POST",
        data: DanMuForm,
        dataType: "JSON",
        processData: false,
        contentType: false,
        cache: false,
        xhrFields: {
            withCredentials: true
        },
        success: function (){
            console.log("sent");
            DanMuForm = new FormData();
        }
    })
}

function construcateHTMLTable(){
    let html = "<tbody><tr>"
    for (let i = 0; i < imgs.length; i++) {
        if(i % 4 === 0 && i !== 0)
            html += "</tr><tr>";
        html += "<td colspan="+imgs[i].getSpan()+" style=\" background:url("+ imgs[i].getURL() +") no-repeat bottom center; background-size: contain\"></td>";
    }
    html += "</tr></tbody>"
    return html;
}

function calculateTextLength(length){
    textLength.innerHTML =  (length<10)?(" "+length+"/30"):(length+"/30");
}

