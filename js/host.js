const link = chrome.extension.getURL("../images/abaaba.svg");
// add new emoji images here.
const img0 = chrome.extension.getURL("../images/傻豹.gif");
const img1 = chrome.extension.getURL("../images/吃桃.gif");
const img2 = chrome.extension.getURL("../images/rua豹.gif");
const img3 = chrome.extension.getURL("../images/问号豹.gif");
const img4 = chrome.extension.getURL("../images/打滚.gif");
const img5 = chrome.extension.getURL("../images/跳脸豹.gif");
const img6 = chrome.extension.getURL("../images/打call.gif");
const img7 = chrome.extension.getURL("../images/打豹.gif");
const img8 = chrome.extension.getURL("../images/猜拳.gif");
const img9 = chrome.extension.getURL("../images/困.gif");
const img10 = chrome.extension.getURL("../images/摇摆.gif");
const img11 = chrome.extension.getURL("../images/耶.gif");
const img12 = chrome.extension.getURL("../images/豹睡.gif");
const img13 = chrome.extension.getURL("../images/我不玩了.gif");
const img14 = chrome.extension.getURL("../images/阿巴.png");
const img15 = chrome.extension.getURL("../images/玩手机.gif");
const img16 = chrome.extension.getURL("../images/豹豹.png");
const img17 = chrome.extension.getURL("../images/豹条h.gif");
var popupLocHor = 100;
var popupLocVac = 100;
var absLocHor = 100;
var isDrag = 0;
const parent = document.body;
const popup = document.createElement("div");
const selec = document.createElement("div");
var emojiTable = document.createElement("table");
var sideBar = document.getElementById("aside-area-vm");
var commentsTextArea = null;
// add new emoji text here.
const emoji = [["(傻豹)","(吃桃)"],
    ["(rua豹)","(问号豹)"],
    ["(打滚)","(跳脸豹)"],
    ["(打call)","(打豹)"],
    ["(猜拳)","(困)"],
    ["(摇摆)","(耶)"],
    ["(豹睡)","(我不玩了)"],
    ["(阿巴)","(玩手机)"],
    ["(豹豹！)"],
    ["(豹条)"]];

popup.setAttribute("id", "emoji-popup");
popup.style.background = "url("+link+") no-repeat center";
popup.style.backgroundSize = "contain";
popup.innerHTML = "<!---->";

selec.setAttribute("id", "emoji-selection");
selec.innerHTML = "";
emojiTable.setAttribute("class", "emoji-table");
emojiTable.innerHTML = "<div id='load'>加载弹幕中...</div>";
selec.appendChild(emojiTable)
parent.appendChild(selec);
parent.appendChild(popup);
popup.style.left = document.body.clientWidth - absLocHor + 'px';
popup.style.top = "100px";
selec.style.left = document.body.clientWidth - absLocHor - 160 +"px";
selec.style.top = "95px";
var oLoc = [0,0];
var cLoc = [0,0];
window.onload=function(){
    popup.onmousedown = function (ev) {
        popup.className = "popup-click-in";
        var oevent = ev || event;
        var distanceX = oevent.clientX - popup.offsetLeft;
        var distanceY = oevent.clientY - popup.offsetTop;
        oLoc = [popup.offsetLeft, popup.offsetTop];
        cLoc = [popup.offsetLeft, popup.offsetTop];
        popup.onmousemove = function (ev) {
            isDrag = 1;
            var oevent = ev || event;
            popupLocHor = oevent.clientX - distanceX;
            popupLocVac = oevent.clientY - distanceY;
            cLoc = [popupLocHor, popupLocVac];
            popup.style.left = popupLocHor + 'px';
            popup.style.top = popupLocVac + 'px';
            selec.style.left = popupLocHor - 160 + "px";
            selec.style.top = popupLocVac - 5 + "px";
            absLocHor = document.body.clientWidth - popupLocHor;
        };
        popup.onmouseup = function () {
            popup.className = "popup-click-out";
            if(isMoved(oLoc[0], oLoc[1], cLoc[0], cLoc[1])){
                if (selec.style.display === "none") {
                    selec.style.display = "block";
                    selec.className = "selection-fade-in";
                } else {
                    selec.className = "selection-fade-out";
                    setTimeout(hide, 150);
                }
            }
            popup.onmousemove = null;
            popup.onmouseup = null;
        };
    };

    popup.onmouseenter = function (){
        popup.className = "popup-click-hoverin";
    };

    popup.onmouseleave = function (){
        popup.className = "popup-click-hoverout";
    };
}

function hide(){
    selec.style.display = "none";
}

function isMoved(oX, oY, cX, cY){
    return Math.abs(oX - cX) === 0 && Math.abs(oY - cY) === 0;
}

window.addEventListener("resize", function(){
    popup.style.left = document.body.clientWidth - absLocHor + 'px';
    selec.style.left = document.body.clientWidth - absLocHor - 160 + "px";
});

setTimeout(delay,5000);
function delay(){
    console.log("load complete")
    var button = sideBar.getElementsByTagName("button")[sideBar.getElementsByTagName("button").length-1];
    var emojiText = "";
    button.addEventListener("click", buttonHandler);
    function buttonHandler(){
        emojiText = "";
    }

    commentsTextArea = sideBar.getElementsByTagName("textarea")[0];

    if(sideBar.getElementsByTagName("textarea").length < 1){
        emojiTable.innerHTML = "<div id='load'>加载失败，<br>请<a href='https://live.bilibili.com/21652717'>点击这里</a>重试<br><br>" +
            "如未登录，请先登录</div>";
        document.getElementById("load").style.marginTop = "130px";
    }else{
        commentsTextArea.addEventListener("focus", textareaHandler);
        commentsTextArea.addEventListener("blur", textareaHandler);
        function textareaHandler(){
            commentsTextArea.value = emojiText;
        }

        commentsTextArea.onkeyup = function (ev){
            emojiText = commentsTextArea.value;
        }
        // add new emoji here to show in web.
        emojiTable.innerHTML =
            "<tbody><tr><td style=\" background:url("+ img0 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img1 +") no-repeat bottom center; background-size: contain\"></td></tr>" +
            "<tr><td style=\" background:url("+ img2 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img3 +") no-repeat bottom center; background-size: contain\"></td></tr>"+
            "<tr><td style=\" background:url("+ img4 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img5 +") no-repeat bottom center; background-size: contain\"></td></tr>"+
            "<tr><td style=\" background:url("+ img6 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img7 +") no-repeat bottom center; background-size: contain\"></td></tr>" +
            "<tr><td style=\" background:url("+ img8 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img9 +") no-repeat bottom center; background-size: contain\"></td></tr>"+
            "<tr><td style=\" background:url("+ img10 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img11 +") no-repeat bottom center; background-size: contain\"></td></tr>"+
            "<tr><td style=\" background:url("+ img12 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img13 +") no-repeat bottom center; background-size: contain\"></td></tr>" +
            "<tr><td style=\" background:url("+ img14 +") no-repeat bottom center; background-size: contain\"></td><td style=\" background:url("+ img15 +") no-repeat bottom center; background-size: contain\"></td></tr>"+
            "<tr><td style=\" background:url("+ img16 +") no-repeat bottom center; background-size: contain\"></td></tr>"+
            "<tr><td colspan=\"2\" style=\" background:url("+ img17 +") no-repeat bottom center; background-size: contain\"></td></tr></tbody>";


        for (let i = 0; i < emojiTable.rows.length; i++) {
            var cell = emojiTable.rows[i].cells;
            for (let j = 0; j < cell.length; j++) {
                cell[j].onclick = function (){
                    addText(emoji[i][j]);
                }
            }
        }

        function addText(text){
            emojiText += text;
            sideBar.getElementsByTagName("textarea")[0].value += text;
        }
    }

}