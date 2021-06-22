console.log("injecting")
var link = chrome.extension.getURL("../images/abaaba.png")
var popupLocHor = 100;
var popupLocVac = 100;
var absLocHor = 100;
var isDrag = 0;
var parent = document.body
var popup = document.createElement("div");
var selec = document.createElement("div");
var emojiTable = document.createElement("table");
var sideBar = document.getElementById("aside-area-vm");
var commentsTextArea;

popup.setAttribute("id", "emoji-popup");
popup.style.background = "url("+link+") no-repeat center";
popup.style.backgroundSize = "contain";
popup.innerHTML = "<!---->";

selec.setAttribute("id", "emoji-selection");
selec.innerHTML = ""
emojiTable.setAttribute("class", "emoji-table");
emojiTable.innerHTML = "<div id='load'>loading...</div>";
selec.appendChild(emojiTable)
parent.appendChild(selec);
parent.appendChild(popup);
popup.style.left = document.body.clientWidth - absLocHor + 'px';
popup.style.top = "100px";
selec.style.left = document.body.clientWidth - absLocHor - 160 +"px";
selec.style.top = "95px"
window.onload=function(){
    var popupLoc = document.getElementById("emoji-popup");
    popupLoc.onmousedown = function (ev) {
        var oevent = ev || event;

        var distanceX = oevent.clientX - popupLoc.offsetLeft;
        var distanceY = oevent.clientY - popupLoc.offsetTop;

        document.onmousemove = function (ev) {
            isDrag = 1;
            var oevent = ev || event;
            popupLocHor = oevent.clientX - distanceX
            popupLocVac = oevent.clientY - distanceY
            popupLoc.style.left = popupLocHor + 'px';
            popupLoc.style.top = popupLocVac + 'px';
            selec.style.left = popupLocHor - 160 + "px";
            selec.style.top = popupLocVac - 5 + "px";
            absLocHor = document.body.clientWidth - popupLocHor;
        };
        document.onmouseup = function () {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}

window.addEventListener("resize", function(){
    popup.style.left = document.body.clientWidth - absLocHor + 'px';
    popup.style.top = popupLocHor+"px";

    selec.style.left = document.body.clientWidth - absLocHor - 160 + "px";
    selec.style.top = popupLocVac - 5 + "px";
});

document.getElementById("emoji-popup").addEventListener("click", clickHandler);

function clickHandler(e){
    if(isDrag === 0){
        if(selec.style.display === "none"){
            selec.style.display = "block";
        }else{
            selec.style.display = "none";
        }
    }else
        isDrag = 0;

}

var button;

setTimeout(delay,5000);
function delay(){
    console.log("load complete")
    button = sideBar.getElementsByTagName("button")[sideBar.getElementsByTagName("button").length-1];
    button.addEventListener("click", buttonHandler);
    function buttonHandler(){
        emojiText = "";
    }

    commentsTextArea = sideBar.getElementsByTagName("textarea")[0];
    commentsTextArea.addEventListener("focus", textareaHandler);
    function textareaHandler(){
        commentsTextArea.value = emojiText;
    }

    emojiTable.innerHTML = "<tbody><tr><td>(傻豹)</td><td>(吃桃)</td></tr>" +
        "<tr><td>(rua豹)</td><td>(问号豹)</td></tr>"+
        "<tr><td>(打滚)</td><td>(跳脸豹)</td></tr>"+
        "<tr><td>(打call)</td><td>(打豹)</td></tr>" +
        "<tr><td>(猜拳)</td><td>(困)</td></tr>"+
        "<tr><td>(摇摆)</td><td>(耶)</td></tr>"+
        "<tr><td>(豹睡)</td><td>(我不玩了)</td></tr>" +
        "<tr><td>(阿巴)</td><td>(豹条)</td></tr>"+
        "<tr><td>(玩手机)</td><td>(豹豹！)</td></tr>"+
        "<tr><td>(横豹)</td></tr>"+
        "<tr><td>(1)</td><td>(2)</td><td>(3)</td></tr></tbody>";

    var emojiText = "";
    for (let i = 0; i < emojiTable.rows.length; i++) {
        var cell = emojiTable.rows[i].cells;
        for (let j = 0; j < cell.length; j++) {
            cell[j].onclick = function (){
                addText(this.innerHTML);
            }
        }
    }

    function addText(text){
        emojiText += text;
        sideBar.getElementsByTagName("textarea")[0].value += text;
    }
}