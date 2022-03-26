/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    let room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
    let privilege = 0;
    let isFan = false;
    let exp =new RegExp("^\\d*$");
    if(exp.test(room_id)){
        var JCT = "-1";
        var UID = "-1";

        var WINDOW_HEIGHT;
        var WINDOW_WIDTH;
        var initWidth = window.innerWidth;
        var labFeatures=[];
        var zoomFactor = 1.0;

        function setSize(){
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
        const emojiTableSystem = document.createElement("table");
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
        var totalLength;

        /**
         * Get real room id.
         * */
        (function getRealRoomID(){
            fetch("https://api.live.bilibili.com/room/v1/Room/room_init?id="+room_id,{
                method:'GET',
                credentials:'include',
                body:null
            }).then(result => result.json())
                .then(json =>{
                    if (json['code'] === 0)
                        room_id = json['data']['room_id'];
                    else
                        setTimeout(getRealRoomID, 1000);

                }).catch(e=>{setTimeout(getRealRoomID, 1000)});
        })();
        (function getUserPrivilege(){
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?from=0&room_id="+room_id,{
                method:'GET',
                credentials:'include',
                body:null
            }).then(result => result.json())
                .then(json =>{
                    if (json['code'] === 0) {
                        privilege = json['data']['privilege']['privilege_type'];
                        isFan = json['data']['relation']['is_in_fansclub'];
                    }else
                        setTimeout(getUserPrivilege, 1000);
                }).catch(e=>{setTimeout(getUserPrivilege, 1000)});
        })();

        if(document.getElementsByTagName("article").length === 0) renderExtension();
        function renderExtension(){
            loadPopPos();
            popup.setAttribute("id", "emoji-popup");
            popup.style.background = "url("+chrome.runtime.getURL("../images/haruka/abaaba.svg")+") no-repeat center";
            try{
                popup.style.background = "url("+link+") no-repeat center";
            }catch (e){}


            popup.style.backgroundSize = "contain";
            popup.style.cursor = "pointer";
            popup.innerHTML = "<!---->";

            selec.setAttribute("id", "emoji-selection");
            selec.classList.add("emoji_sec");
            selec.style.display = "none";
            selec.innerHTML = "";

            emojiPad.setAttribute("id","emoji-tray");
            emojiPad.classList.add("emoji_sec");
            emojiPad.appendChild(emojiTable);
            emojiPad.appendChild(emojiTableSystem);

            emojiTable.setAttribute("class", "emoji-table");
            emojiTable.innerHTML = "<div id='load'>加载弹幕中...</div>";

            emojiTableSystem.setAttribute("class", "emoji-table");

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
            fullScreenInput.checked = true;
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
                                setTimeout(()=>{selec.style.display = "none";}, 300);
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
            setTimeout(delay,1000);
        }

        /***
         * @return true, not move | false, moved.
         */
        function isMoved(oX, oY, cX, cY){return Math.abs(oX - cX) === 0 && Math.abs(oY - cY) === 0;}

        function delay(){
            console.log("load complete");
            if(JCT === "-1" || UID === "-1"){
                emojiTable.innerHTML = "<div id='load'>加载失败，<br>请<a href="+window.location+">点击这里</a>重试<br><br>" +
                    "如未登录，请先登录</div>";
                document.getElementById("load").style.marginTop = "130px";
            }else{
                totalLength = document.getElementsByClassName("input-limit-hint").length>0?document.getElementsByClassName("input-limit-hint")[0].innerHTML.split("/")[1]:"20";
                textLength.innerHTML = " 0/"+totalLength;
                DanMuInput.style.display = "block";
                DanMuSub.style.display = "block";
                textLength.style.display = "block";
                fullScreenSection.style.display = "block";
                fullScreenText.style.display = "block";

                constructHTMLTable(4, DanMuInput, emojiTable, textLength);
                constructHTMLTableSystemEmoji(4,  emojiTableSystem);

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
                const fullscreenBackground = document.createElement("div");
                const fullscreenEmojiPad = document.createElement("div");
                const fullscreenEmojiTable = document.createElement("table");
                const fullscreenEmojiTableSystem = document.createElement("table");
                const fullscreenInputDiv = document.createElement("div");
                const fullscreenInputBtn = document.createElement("div");
                const fullscreenInput = document.createElement("input");
                const fullscreenTextLength = document.createElement("span");

                let originalInput, originalButton;
                setTimeout(()=>{
                    originalInput = document.getElementsByClassName("fullscreen-danmaku")[0].getElementsByTagName("div")[0];
                    originalButton = document.getElementsByClassName("fullscreen-danmaku")[0].getElementsByTagName("div")[1];
                    renderFullScreenMode();
                    displayFullScreenDanmaku();
                }, 2000);



                function renderFullScreenMode(){
                    document.getElementsByClassName("fullscreen-danmaku")[0].classList.add("emoji-fullscreen-danmaku");

                    fullscreenInputDiv.style.display = "none";
                    fullscreenInputBtn.style.display = "none";
                    fullscreenEmojiPad.style.display = "none";
                    fullscreenBackground.style.display = "none";

                    fullscreenEmojiPad.classList.add("emoji_sec");
                    fullscreenEmojiPad.setAttribute("id", "fullscreen-table");
                    fullscreenEmojiTable.classList.add("emoji-table");
                    constructHTMLTable(8, fullscreenInput, fullscreenEmojiTable, fullscreenTextLength);
                    constructHTMLTableSystemEmoji(8, fullscreenEmojiTableSystem);

                    fullscreenEmojiPad.appendChild(fullscreenEmojiTable);
                    fullscreenEmojiPad.appendChild(fullscreenEmojiTableSystem);
                    fullscreenBackground.setAttribute("id", "fs-emoji-bg");

                    fullscreenInput.placeholder = "发个弹幕呗~";
                    fullscreenInput.setAttribute("id", "fullscreen-input");

                    fullscreenTextLength.setAttribute("id", "fullscreen-text-length");
                    fullscreenTextLength.innerHTML = " 0/"+totalLength;

                    fullscreenInputDiv.setAttribute("id", "first-child");
                    fullscreenInputDiv.appendChild(fullscreenInput);
                    fullscreenInputDiv.appendChild(fullscreenTextLength);

                    fullscreenInputBtn.innerHTML = "发送";
                    fullscreenInputBtn.classList.add("send-danmaku");
                    fullscreenInputBtn.setAttribute("id", "fullscreen-sub-btn");

                    document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreenInputDiv);
                    document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreenInputBtn);
                    document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreenBackground);
                    document.getElementsByClassName("emoji-fullscreen-danmaku")[0].appendChild(fullscreenEmojiPad);
                }

                function displayFullScreenDanmaku(){
                    originalInput.style.display = "none";
                    originalButton.style.display = "none";

                    fullscreenInputDiv.style.display = "block";
                    fullscreenInputBtn.style.display = "block";
                    fullscreenEmojiPad.style.display = "block";
                    fullscreenBackground.style.display = "block";

                    document.getElementsByClassName("emoji-fullscreen-danmaku")[0].addEventListener("mouseenter", function (){
                        fullscreenEmojiPad.classList.remove("fullscreen-hoverout");
                        fullscreenEmojiPad.classList.add("fullscreen-hoverin");
                    });
                    document.getElementsByClassName("fullscreen-danmaku")[0].addEventListener("mouseleave", function (){
                        fullscreenEmojiPad.classList.remove("fullscreen-hoverin");
                        fullscreenEmojiPad.classList.add("fullscreen-hoverout");
                    });
                    document.getElementById("live-player").addEventListener("mousemove",fs_move);
                    fullscreenInputBtn.addEventListener("click", function (){
                        packaging(fullscreenInput.value);
                        fullscreenInput.value = "";
                        fullscreenTextLength.innerHTML = " 0/"+totalLength;
                    });
                }

                function hideFullScreenDanmaku(){
                    originalInput.style.display = "block";
                    originalButton.style.display = "block";

                    fullscreenInputDiv.style.display = "none";
                    fullscreenInputBtn.style.display = "none";
                    fullscreenEmojiPad.style.display = "none";
                    fullscreenBackground.style.display = "none";

                    document.getElementById("live-player").removeEventListener("mousemove",fs_move);
                }

                function fs_move(){
                    clearTimeout(timer);
                    timer = setTimeout(function(){
                        fullscreenEmojiPad.classList.remove("fullscreen-hoverout");
                    },2000);
                }
            }
        }

        function updateJCT(){
            try{
                chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
                    JCT = lf.res.split(",")[0];
                    UID = lf.res.split(",")[1];
                });
            }catch (e) {}
        }

        function getTimeSnap(){return Math.round(Date.now()/1000);}

        function packaging(msg, type){
            let DanMuForm = new FormData();
            DanMuForm.append("bubble", "0");
            DanMuForm.append("msg", msg);
            DanMuForm.append("color", "16777215");
            DanMuForm.append("mode", "1");
            if(type!==undefined&&type==="systemEmoji") DanMuForm.append("dm_type","1");
            DanMuForm.append("fontsize", "25");
            DanMuForm.append("rnd", getTimeSnap()+"");
            DanMuForm.append("roomid", room_id); // short id is not allowed.
            DanMuForm.append("csrf", JCT);
            DanMuForm.append("csrf_token", JCT);
            if(msg.length !== 0)
                send(DanMuForm);
        }

        function send(form){
            fetch("https://api.live.bilibili.com/msg/send?requestFrom=rua5", {
                method:"POST",
                credentials: 'include',
                body: form
            }).then(result=>{
                console.log("sent");
            }).catch(error=>{
                console.error('Error:', error);
            });
        }

        function constructHTMLTableSystemEmoji(num_per_line, HTMLObj){
            const privilegeSet = {0:"",1:"舰长",2:"提督",3:"总督"};
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+room_id, {
                method:"GET",
                credentials: 'include',
                body: null
            }).then(result => result.json())
                .then(json =>{
                    if(json['code']===0){
                        let html = '';
                        if(json['data']['data'][2]!==undefined && json['data']['data'][2]!==null){
                            html = '<thead><tr><th colspan="4" class="rua-table-header">房间专属表情</th></tr></thead><tbody><tr>';
                            for (let i = 0; i < json['data']['data'][2]['emoticons'].length; i++) {
                                if(i % num_per_line === 0 && i !== 0)
                                    html += '</tr><tr>';
                                html += `<td colspan="1" title="${json['data']['data'][2]['emoticons'][i]['emoji']}" class="rua-emoji-icon" id="${json['data']['data'][2]['emoticons'][i]['emoticon_unique']}" style="background-image:url('${json['data']['data'][2]['emoticons'][i]['url'].replace("http://", "https://")}');"><div class="rua-emoji-requirement" style="'background-color: ${json['data']['data'][2]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][2]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
                            }
                        }
                        if(json['data']['data'][1]!==undefined && json['data']['data'][1]!==null){
                            html+="</tr></tbody><thead><tr><th colspan='4' class='rua-table-header'>up大表情</th></tr></thead><tbody><tr>";
                            for (let i = 0; i < json['data']['data'][1]['emoticons'].length; i++) {
                                if(i % num_per_line === 0 && i !== 0)
                                    html += '</tr><tr>';
                                html += `<td colspan="1" title="${json['data']['data'][1]['emoticons'][i]['emoji']}" class="rua-emoji-icon" id="${json['data']['data'][1]['emoticons'][i]['emoticon_unique']}" style="background-image:url('${json['data']['data'][1]['emoticons'][i]['url'].replace("http://", "https://")}');"><div class="rua-emoji-requirement" style="'background-color: ${json['data']['data'][1]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][1]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
                            }
                        }
                        if(json['data']['data'][0]!==undefined && json['data']['data'][0]!==null){
                            html+="</tr></tbody><thead><tr><th colspan='4' class='rua-table-header'>系统表情</th></tr></thead><tbody><tr>";
                            for (let i = 0; i < json['data']['data'][0]['emoticons'].length; i++) {
                                if(i % num_per_line === 0 && i !== 0)
                                    html += '</tr><tr>';
                                html += `<td colspan="1" title="${json['data']['data'][0]['emoticons'][i]['emoji']}" class="rua-emoji-icon" id="${json['data']['data'][0]['emoticons'][i]['emoticon_unique']}" style="background-image:url('${json['data']['data'][0]['emoticons'][i]['url'].replace("http://", "https://")}');"><div class="rua-emoji-requirement" style="'background-color: ${json['data']['data'][0]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][0]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
                            }
                        }
                        html += '</tr></tbody>';
                        HTMLObj.innerHTML = html;

                        for (let i = 0; i < HTMLObj.rows.length; i++) {
                            var cell = HTMLObj.rows[i].cells;
                            for (let j = 0; j < cell.length; j++) {
                                cell[j].onclick = function (e){
                                    if(e.button === 0)
                                        packaging(this.id, "systemEmoji");
                                }
                            }
                        }
                    }
                    if(emojiTable.innerHTML.length===0 && emojiTableSystem.innerHTML.length<=25){
                        emojiTableSystem.innerHTML = `<div id="load">当前直播间没有表情包，<br>如显示不正确，请<a href="${window.location}">点击这里</a>重试<br><br></div>`;
                    }
                })
                .catch(msg =>{});
        }

        let enterLock = true, unlock = true;
        function constructHTMLTable(num_per_line, O, O1, span){
            // enter key shortcut listener
            try{
                let cursorSelection = [0,0];
                O.addEventListener('compositionstart', (e)=>{
                    enterLock = false;
                    unlock = false;
                });
                O.addEventListener('compositionend', (e)=>{
                    enterLock = true;
                    console.log('compositionend');
                });
                O.addEventListener("keyup", (e)=>{
                    if(e.keyCode === 13 && unlock){
                        e.preventDefault();
                        packaging(O.value);
                        O.value = "";
                    }
                    if(enterLock) unlock = true; // unlock enter key when the first key after composition end has been pressed.
                    cursorSelection = inputListener(span, O);
                });
                O.addEventListener("keydown", (e)=>{
                    if(e.code === "Enter") e.preventDefault();
                });

                // update the current courser location.
                O.addEventListener("select", (e)=>{cursorSelection = [e.target.selectionStart, e.target.selectionEnd];});

                // construct emoji table
                let html = '<thead><tr><th colspan="4" class="rua-table-header">弹幕机表情</th></tr></thead>';
                html += '<tbody><tr>';
                for (let i = 0; i < imgs.length; i++) {
                    if(i % num_per_line === 0 && i !== 0)
                        html += '</tr><tr>';
                    html += `<td colspan="${imgs[i].getSpan()}" title="${emoji[i]}" class="rua-emoji-icon" style="background-image:url('${imgs[i].getURL()}');"></td>`;
                }
                html += "</tr></tbody>";
                O1.innerHTML = html;

                // add listener for each emoji.
                for (let i = 1; i < O1.rows.length; i++) {
                    var cell = O1.rows[i].cells;
                    for (let j = 0; j < cell.length; j++) {
                        cell[j].onclick = function (e){
                            if(e.button === 0){
                                O.value = O.value.substr(0, cursorSelection[0]) + "(" +emoji[j+(i-1)*num_per_line]+ ")" + O.value.substr(cursorSelection[1]);
                                cursorSelection = inputListener(span, O);
                            }
                        }
                    }
                }
            }catch (e) {
                O1.innerHTML = "";
            }
        }

        function calculateTextLength(span, length){
            span.innerHTML = (length<10)?(" "+length+"/"+totalLength):(length+"/"+totalLength);
        }

        function inputListener(span, O){
            calculateTextLength(span, O.value.length);
            return [O.selectionStart, O.selectionEnd];
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
                    if(labStyle.getAttribute("lab-style")!==null){
                        labFeatures = labStyle.getAttribute("lab-style").split(",");
                        labFeatures.indexOf("dark")!==-1?darkMode(true):darkMode(false);
                    }else{
                        darkMode(false);
                    }
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
                emojiPad.style.opacity = "0.8";
                DanMuSub.style.opacity = "0.8";
                DanMuInput.style.background = "#151515";
                DanMuInput.style.borderColor = "#2b2b2b";

            }else{
                selec.style.removeProperty("background");
                emojiPad.style.removeProperty("opacity");
                DanMuSub.style.removeProperty("opacity");
                DanMuInput.style.removeProperty("background");
                DanMuInput.style.removeProperty("border-color");
            }
        }
    }
}();
