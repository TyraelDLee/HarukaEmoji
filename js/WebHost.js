/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
var JCT = -1;

var WINDOW_HEIGHT;
var WINDOW_WIDTH;
var initWidth = window.innerWidth;
var labFeatures=[];
var zoomFactor = 1.0;

function setSize(){
    // if (labFeatures.indexOf("adaptive")!==-1){
    //     if (window.innerWidth<1930)
    //         zoomFactor = 1.0;
    //     if (window.innerWidth>=1930 && window.innerWidth <2058)
    //         zoomFactor = 15.0/16.0;
    //     if(window.innerWidth>=2058)
    //         zoomFactor = 3.0/4.0;
    // }
    WINDOW_HEIGHT = window.innerHeight * zoomFactor;
    WINDOW_WIDTH = window.innerWidth * zoomFactor;
}

setSize();
updateJCT();
setInterval(updateJCT, 3000);

var moved = false;
var absoluteLoc = [100,100,100];
var isDrag = 0;
const parent = document.body;
// popup button
const popup = document.createElement("div");
// popup window
const selec = document.createElement("div");
// emoji table
const emojiPad = document.createElement("div");
const emojiTable = document.createElement("table");
// danmaku input window
const DanMuInput = document.createElement("textarea");
// send button
const DanMuSub = document.createElement("button");
// show the text length
const textLength = document.createElement("span");

// full screen function.
const fullScreenText = document.createElement("span");
const fullScreenSection = document.createElement("section");
const fullScreenButton = document.createElement("div");
const fullScreenInput = document.createElement("input");

// let commentsTextArea = null;
// check event
if(document.getElementsByTagName("article").length === 0) renderExtension();
function renderExtension(){
    loadPopPos();
    popup.setAttribute("id", "emoji-popup");
    popup.style.background = "url("+link+") no-repeat center";
    popup.style.backgroundSize = "contain";
    popup.innerHTML = "<!---->";

    selec.setAttribute("id", "emoji-selection");
    selec.classList.add("emoji_sec");
    selec.style.display = "none";
    selec.innerHTML = "";

    emojiPad.setAttribute("id","emoji-tray");
    emojiPad.classList.add("emoji_sec");
    emojiPad.appendChild(emojiTable);

    emojiTable.setAttribute("class", "emoji-table");
    emojiTable.innerHTML = "<div id='load'>加载弹幕中...</div>";

    selec.appendChild(emojiPad);
    parent.appendChild(selec);
    parent.appendChild(popup);

    popup.style.top = absoluteLoc[1]+"px";
    selec.style.top = (absoluteLoc[1]-5)+"px";

    DanMuSub.setAttribute("id", "input-button");
    DanMuSub.innerHTML = "<span>发送</span>";
    DanMuSub.style.display = "none";

    DanMuInput.setAttribute("id", "input-form");
    DanMuInput.placeholder = "这里也可以发弹幕~";
    DanMuInput.style.display = "none";

    textLength.setAttribute("id", "length-indicator");
    textLength.style.display = "none";

    fullScreenSection.classList.add("button");
    fullScreenButton.classList.add("checkbox");
    fullScreenInput.type = "checkbox";
    fullScreenButton.appendChild(fullScreenInput);
    fullScreenButton.appendChild(document.createElement("label"));
    fullScreenSection.appendChild(fullScreenButton);
    fullScreenSection.style.display = "none";
    fullScreenText.setAttribute("id", "fullscreen-label");
    fullScreenText.innerHTML = "全屏显示";
    fullScreenText.style.display = "none";

    selec.appendChild(DanMuInput);
    selec.appendChild(DanMuSub);
    selec.appendChild(fullScreenSection);
    selec.appendChild(fullScreenText);
    selec.appendChild(textLength);

    var oLoc = [0,0];
    var cLoc = [0,0];
    window.onload=function(){
        popup.onmousedown = function (ev) {
            let popupLocHor;
            let popupLocVac;
            document.body.style.userSelect = "none";
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
                if(popupLocVac===undefined)popupLocVac=popup.offsetTop;
                if(popupLocHor > -1)
                    absoluteLoc = [WINDOW_WIDTH - popupLocHor, popupLocVac, popupLocHor];
            };
            document.onmouseup = function () {
                document.body.style.userSelect = "auto";
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
                }else{
                    moved = true;
                    localStorage.setItem("rua_pos", absoluteLoc[0]+","+absoluteLoc[1]+","+absoluteLoc[2]);
                }
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
        popup.onmouseenter = function (){popup.className = "popup-click-hoverin";};
        popup.onmouseleave = function (){popup.className = "popup-click-hoverout";};
    }

    /***
     * Resize handler
     * */
    window.addEventListener("resize", function(){
        let popleft;
        let relativeX = (absoluteLoc[0] < absoluteLoc[2])?absoluteLoc[0]/initWidth:absoluteLoc[2] / initWidth;
        setSize();
        if(moved){
            absoluteLoc[0] < absoluteLoc[2]?popleft = WINDOW_WIDTH - absoluteLoc[0]:popleft = absoluteLoc[2];
            popup.style.left = popleft + 'px';
        }else
           setPopupInitLocation();
        if(absoluteLoc[1] > WINDOW_HEIGHT-60){
            popup.style.top = WINDOW_HEIGHT - 60 + "px";
            selec.style.top = WINDOW_HEIGHT - 360 + "px";
        }
        popleft < 320?selec.style.left = popleft + 60 + "px":selec.style.left = popleft - 310 + "px";
    });
    setTimeout(delay,5000);
}

function hide(){selec.style.display = "none";}

/***
 * @return true, not move | false, moved.
 */
function isMoved(oX, oY, cX, cY){return Math.abs(oX - cX) === 0 && Math.abs(oY - cY) === 0;}

function delay(){
    console.log("load complete");
    if(JCT === -1){
        emojiTable.innerHTML = "<div id='load'>加载失败，<br>请<a href="+window.location+">点击这里</a>重试<br><br>" +
            "如未登录，请先登录</div>";
        document.getElementById("load").style.marginTop = "130px";
    }else{
        textLength.innerHTML = " 0/"+document.getElementsByClassName("input-limit-hint")[0].innerHTML.split("/")[1];
        DanMuInput.style.display = "block";
        DanMuSub.style.display = "block";
        textLength.style.display = "block";
        fullScreenSection.style.display = "block";
        fullScreenText.style.display = "block";

        constructHTMLTable(4, DanMuInput, emojiTable, selec, textLength);

        DanMuSub.onclick = function (){
            packaging(DanMuInput.value);
            textLength.innerHTML = " 0/"+document.getElementsByClassName("input-limit-hint")[0].innerHTML.split("/")[1];
            DanMuInput.value = "";
        }

        // full screen functions.
        fullScreenInput.addEventListener('change', function() {
            this.checked?displayFullScreenDanmaku():hideFullScreenDanmaku();
        });
        let timer = null;
        let fullscreen_input_div = document.createElement("div");
        let fullscreen_input_btn = document.createElement("div");
        let fullscreen_emoji_pad = document.createElement("div");
        let fullscreen_input = document.createElement("input");
        let fullscreen_text_length = document.createElement("span");
        let fullscreen_emoji_table = document.createElement("table");
        let fullscreen_background = document.createElement("div");

        let original_input = document.getElementsByClassName("fullscreen-danmaku")[0].getElementsByTagName("div")[0];
        let original_button =document.getElementsByClassName("fullscreen-danmaku")[0].getElementsByTagName("div")[1];
        renderFullScreenMode();
        function renderFullScreenMode(){
            document.getElementsByClassName("fullscreen-danmaku")[0].classList.add("emoji-fullscreen-danmaku");

            fullscreen_input_div.style.display = "none";
            fullscreen_input_btn.style.display = "none";
            fullscreen_emoji_pad.style.display = "none";
            fullscreen_background.style.display = "none";

            fullscreen_emoji_pad.classList.add("emoji_sec");
            fullscreen_emoji_pad.setAttribute("id", "fullscreen-table");
            fullscreen_emoji_table.classList.add("emoji-table");
            constructHTMLTable(8, fullscreen_input, fullscreen_emoji_table, fullscreen_emoji_pad, fullscreen_text_length);
            fullscreen_emoji_pad.appendChild(fullscreen_emoji_table);
            fullscreen_background.setAttribute("id", "fs-emoji-bg");

            fullscreen_input.placeholder = "发个弹幕呗~";
            fullscreen_input.setAttribute("id", "fullscreen-input");

            fullscreen_text_length.setAttribute("id", "fullscreen-text-length");
            fullscreen_text_length.innerHTML = " 0/30";

            fullscreen_input_div.setAttribute("id", "first-child");
            fullscreen_input_div.appendChild(fullscreen_input);
            fullscreen_input_div.appendChild(fullscreen_text_length);

            fullscreen_input_btn.innerHTML = "发送";
            fullscreen_input_btn.classList.add("send-danmaku");
            fullscreen_input_btn.setAttribute("id", "fullscreen-sub-btn");

            document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreen_input_div);
            document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreen_input_btn);
            document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreen_background);
            document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreen_emoji_pad);
        }
        function displayFullScreenDanmaku(){
            original_input.style.display = "none";
            original_button.style.display = "none";

            fullscreen_input_div.style.display = "block";
            fullscreen_input_btn.style.display = "block";
            fullscreen_emoji_pad.style.display = "block";
            fullscreen_background.style.display = "block";

            document.getElementsByClassName("emoji-fullscreen-danmaku")[0].addEventListener("mouseenter", function (){
                fullscreen_emoji_pad.classList.remove("fullscreen-hoverout");
                fullscreen_emoji_pad.classList.add("fullscreen-hoverin");
            });
            document.getElementsByClassName("fullscreen-danmaku")[0].addEventListener("mouseleave", function (){
                fullscreen_emoji_pad.classList.remove("fullscreen-hoverin");
                fullscreen_emoji_pad.classList.add("fullscreen-hoverout");
            });
            document.getElementById("live-player").addEventListener("mousemove",fs_move);
            fullscreen_input_btn.addEventListener("click", function (){
                packaging(fullscreen_input.value);
                fullscreen_input.value = "";
                fullscreen_text_length.innerHTML = " 0/30";
            });
        }

        function hideFullScreenDanmaku(){
            original_input.style.display = "block";
            original_button.style.display = "block";

            fullscreen_input_div.style.display = "none";
            fullscreen_input_btn.style.display = "none";
            fullscreen_emoji_pad.style.display = "none";
            fullscreen_background.style.display = "none";

            document.getElementById("live-player").removeEventListener("mousemove",fs_move);
        }

        function fs_move(){
            clearTimeout(timer);
            timer = setTimeout(function(){
                fullscreen_emoji_pad.classList.remove("fullscreen-hoverout");
            },2000);
        }
    }
}

function updateJCT(){
    if(typeof chrome.app.isInstalled!=="undefined")
        chrome.runtime.sendMessage({ msg: "get_JCT" },function(jct){JCT = jct.res;});
}

function getTimeSnap(){return Date.now();}

function packaging(msg){
    let DanMuForm = new FormData();
    DanMuForm.append("bubble", "0");
    DanMuForm.append("msg", msg);
    DanMuForm.append("color", "16777215");
    DanMuForm.append("mode", "1");
    DanMuForm.append("fontsize", "25");
    DanMuForm.append("rnd", getTimeSnap()+"");
    DanMuForm.append("roomid", ROOM_ID);
    DanMuForm.append("csrf", JCT);
    DanMuForm.append("csrf_token", JCT);
    if(msg.length !== 0)
        send(DanMuForm);
}

function send(form){
    $.ajax({
        url: "https://api.live.bilibili.com/msg/send",
        type: "POST",
        data: form,
        dataType: "JSON",
        processData: false,
        contentType: false,
        cache: false,
        xhrFields: {
            withCredentials: true
        },
        success: function (){
            console.log("sent");
        }
    })
}

function constructHTMLTable(num_per_line, O, O1, sel, span){
    // enter key shortcut listener
    O.addEventListener("keyup", function (e){
        // console.log(e.keyCode);
        if(e.keyCode === 13){
            e.preventDefault();
            packaging(O.value);
            O.value = "";
        }
    });
    O.addEventListener("keydown", function (e){
        if(e.code === "Enter") e.preventDefault();
    });

    // update the current courser location.
    let cursorSelection = [0,0];
    O.onkeyup = function (){cursorSelection = inputListener(span, O);};
    sel.addEventListener("mousemove", function (){cursorSelection = inputListener(span, O);});

    // construct emoji table
    let html = "<tbody><tr>";
    for (let i = 0; i < imgs.length; i++) {
        if(i % num_per_line === 0 && i !== 0)
            html += "</tr><tr>";
        html += "<td colspan="+imgs[i].getSpan()+" style=\" background:url("+ imgs[i].getURL() +") no-repeat bottom center; background-size: contain\"></td>";
    }
    html += "</tr></tbody>";
    O1.innerHTML = html;

    // add listener for each emoji.
    for (let i = 0; i < O1.rows.length; i++) {
        var cell = O1.rows[i].cells;
        for (let j = 0; j < cell.length; j++) {
            cell[j].onclick = function (){
                O.value = O.value.substr(0, cursorSelection[0]) + "(" +emoji[j+i*num_per_line]+ ")" + O.value.substr(cursorSelection[1]);
                cursorSelection = inputListener(span, O);
            }
        }
    }
}

function calculateTextLength(span, length){
    span.innerHTML = (length<10)?(" "+length+"/30"):(length+"/30");
}

function inputListener(span, O){
    let Start = O.selectionStart;
    let End = O.selectionEnd;
    calculateTextLength(span, O.value.length);
    return [Start, End];
}

function getAbsLocation(id){
    let e = document.getElementById(id);
    let abs = [e.offsetLeft, e.offsetTop];
    let cur = e.offsetParent;
    while (cur!==null){
        abs[0] += cur.offsetLeft;abs[1] += (cur.offsetTop+cur.clientTop);
        cur = cur.offsetParent;
    }
    abs[0] += (e.clientWidth - 60);
    abs[1] += (e.clientHeight - 60);
    return abs;
}

function setPopupInitLocation(){
    let pos = getAbsLocation("rank-list-vm");
    absoluteLoc = [WINDOW_WIDTH - pos[0], pos[1], pos[0]];
    if(absoluteLoc[2]>(WINDOW_WIDTH-60)){
        popup.style.left = WINDOW_WIDTH-60 + 'px';
        selec.style.left = (WINDOW_WIDTH-370)+"px";
    }else{
        popup.style.left = absoluteLoc[2] + 'px';
        selec.style.left = (absoluteLoc[2]-310)+"px";
    }
}

function loadPopPos(){
    if(localStorage.getItem("rua_pos")===null){
        setPopupInitLocation();
        moved=false;
    }else if(localStorage.getItem("rua_pos").includes("undefined")){
        localStorage.removeItem("rua_pos");
        setPopupInitLocation();
        moved=false;
    }else{
        moved=true;
        for (let i = 0; i < 3; i++)
            absoluteLoc[i] = parseInt(localStorage.getItem("rua_pos").split(",")[i]);
        let offsetLeft = 0;
        absoluteLoc[0] < absoluteLoc[2]?offsetLeft = WINDOW_WIDTH - absoluteLoc[0]:offsetLeft = absoluteLoc[2];
        if(absoluteLoc[1] > WINDOW_HEIGHT - 50)absoluteLoc[1]=WINDOW_HEIGHT - 50;
        popup.style.left = offsetLeft + 'px';
        offsetLeft<320?selec.style.left = offsetLeft + 60 + "px":selec.style.left = offsetLeft - 310 + "px";
    }
}

var obs = new MutationObserver(function (m){
    m.forEach(function(mutation) {
        if (mutation.type === "attributes") {
            labFeatures = labStyle.getAttribute("lab-style").split(",");
            labFeatures.indexOf("dark")!==-1?darkMode(true):darkMode(false);
        }
    });
});

const labStyle = document.documentElement;
obs.observe(labStyle,{
    attributes: true
});

function darkMode(on){
    if(on){
        selec.style.background = "#151515";
        DanMuInput.style.background = "#151515";
        DanMuInput.style.borderColor = "#2b2b2b";
    }else{
        selec.style.removeProperty("background");
        DanMuInput.style.removeProperty("background");
        DanMuInput.style.removeProperty("border-color");
    }
}