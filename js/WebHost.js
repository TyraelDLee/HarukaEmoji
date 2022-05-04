/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const qn_table = {"原画PRO":10001, "原画":10000, "蓝光PRO":401, "蓝光":400, "超清PRO":251, "超清":250, "高清":150,"流畅":80};
    let qn;
    let qnv = "原画";
    let medalSwitch;
    let hiddenEntry = false;
    let JCT = "-1";
    let room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
    let exp =new RegExp("^\\d*$");
    let room_title = document.title.replace(" - 哔哩哔哩直播，二次元弹幕直播平台","").replaceAll(" ","");
    let recordEnable = true;
    let prerecordingDuration = 300;
    let recorder;
    let medal_id = -1, medal_name = '';
    let emojiRequiredPrivilege = 0, emojiRequiredMedalLevel = 0, upID = -1, totalLength = 20;
    let enhancedHiddenEntry = false;

    chrome.storage.sync.get(['enhancedHiddenEntry'],function(result){enhancedHiddenEntry = result.enhancedHiddenEntry});
    chrome.storage.sync.get(["qn"], function(result){qn = result.qn});
    chrome.storage.sync.get(["qnvalue"], function(result){qnv = result.qnvalue});
    chrome.storage.sync.get(["medal"], (result)=>{medalSwitch = result.medal});
    chrome.storage.sync.get(["hiddenEntry"], (result)=>{hiddenEntry = result.hiddenEntry});
    chrome.storage.sync.get(["record"], (result)=>{recordEnable = result.record});
    chrome.storage.sync.get(["prerecord"], (result)=>{prerecordingDuration = result.prerecord-1+1});
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if(key === "medal") medalSwitch = newValue;
            if(key === "record") {
                recordEnable = newValue;
                if(prerecordingDuration>0)recording();
            }
        }
    });

    if(exp.test(room_id) && room_id.length > 0){
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
        const danmakuSendEErr = document.createElement('div');


        setTimeout(function (){
            if(qn && document.getElementsByTagName("article").length === 0)q(qnv);
            if(hiddenEntry && JCT !== "-1" && document.getElementsByTagName("article").length === 0)hideEntry();
        }, 10);
        /**
         * Get real room id.
         * */
        function getRealRoomID(){
            return fetch("https://api.live.bilibili.com/room/v1/Room/room_init?id="+room_id,{
                method:'GET',
                credentials:'include',
                body:null
            }).then(result => result.json())
                .then(json =>{
                    if (json['code'] === 0){
                        room_id = json['data']['room_id'];
                        upID = json['data']['uid'];
                    }
                    else
                        setTimeout(getRealRoomID, 1000);

                }).catch(e=>{setTimeout(getRealRoomID, 1000)});
        }

        function q(qn){
            let e = document.createEvent("MouseEvents");
            e.initEvent("mousemove", false, false);
            if(document.getElementById("live-player") === undefined || document.getElementById("live-player").getElementsByClassName("web-player-controller-wrap").length===undefined||document.getElementById("live-player").getElementsByClassName("web-player-controller-wrap").length===0)
                setTimeout(q,200);
            else{
                let v = document.getElementById("live-player");
                let s = v.getElementsByClassName("web-player-controller-wrap");
                if(s!==undefined){
                    s[0].style.visibility = "hidden";
                    s[1].style.visibility = "hidden";
                }
                v.dispatchEvent(e);
                setTimeout(function (){
                    e.initEvent("mouseenter", false, true);
                    let vp = v.getElementsByClassName("quality-wrap")[0];
                    if(vp !== undefined){
                        vp.dispatchEvent(e);
                        e.initEvent("click", false, true);
                        setTimeout(function (){
                            let vps = vp.getElementsByClassName("panel")[0].getElementsByClassName("quality-it");
                            if(vps.length>1){
                                let obj=[];
                                for (let i = 0; i < vps.length; i++)
                                    obj.push(vps[i].innerHTML.replaceAll(" ",""));
                                vps[getAvailableQN(qn,obj)].dispatchEvent(e);
                                e.initEvent("mouseleave",false,false);
                                v.dispatchEvent(e);
                            }
                        },100);
                    }
                    setTimeout(()=>{
                        if(s!==undefined){
                            s[0].style.visibility = "visible";
                            s[1].style.visibility = "visible";
                        }
                    },250);
                },100);
            }
        }

        function getAvailableQN(qn, obj){
            let index = 0;
            for (let i = 0; i < obj.length; i++) {
                if (qn_table[obj[i]]>=qn_table[qn]) index=i;
            }
            return index;
        }

        (function harunaHdpi(){
            //You enhanced haruna for over 6 years and still not support hdpi? OMG
            let scale = 1 / window.devicePixelRatio;
            getHaruna();
            function getHaruna(){
                if(document.getElementsByClassName("live-haruna-ctnr")[0]===undefined)
                    setTimeout(getHaruna, 200);
                else{
                    let css = document.getElementsByClassName("live-haruna-ctnr")[0].getAttribute("style").replace(";","");
                    document.getElementsByClassName("live-haruna-ctnr")[0].setAttribute("style",css+" scale("+scale+");");
                    var obs = new MutationObserver(function (m){
                        m.forEach(function(mutation) {
                            if (mutation.type === "attributes") {
                                if(mutation.attributeName === "style"){
                                    let css = document.getElementsByClassName("live-haruna-ctnr")[0].getAttribute("style").replace(";","");
                                    if(!css.includes("scale")){
                                        document.getElementsByClassName("live-haruna-ctnr")[0].setAttribute("style",css+" scale("+scale+");");
                                    }
                                }
                            }
                        });
                    });
                    obs.observe(document.getElementsByClassName("live-haruna-ctnr")[0],{
                        attributes: true
                    });
                }
            }
        })();

        window.addEventListener("focus", function (){
            wareMedal(medal_id, medal_name, false);
        });

        function hideEntry(){
            if(document.getElementById("chat-items")===undefined) setTimeout(hideEntry, 100);
            else{
                if(document.getElementById("chat-items").getElementsByClassName("important-prompt-item").length===0)
                    setTimeout(hideEntry, 10);
                else
                    document.getElementById("chat-items").getElementsByClassName("important-prompt-item")[0].style.display = "none";}
        }

        getUserPrivilege(true);
        async function getUserPrivilege(renderRequest){
            let uid = document.cookie.replaceAll(' ','').split('DedeUserID')[1].split(';')[0].replaceAll('=','');
            if (renderRequest) await getRealRoomID();
            if (!enhancedHiddenEntry){
                await fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?from=0&room_id="+room_id,{
                    method:'GET',
                    credentials:'include',
                    body:null
                }).then(result => result.json())
                    .then(json =>{
                        if (json['code'] === 0) {
                            emojiRequiredPrivilege = (json['data']['privilege']['privilege_type']-1+1)===0?4:json['data']['privilege']['privilege_type'];
                            uid = json['data']['info']['uid'];
                            totalLength = json['data']['property']['danmu']['length'];
                        }
                    }).catch(e=>{setTimeout(getUserPrivilege, 1000)});
            }
            await fetch("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+uid,{
                method:"GET",
                credentials: 'include',
                body:null
            })
                .then(res => res.json())
                .then(json=>{
                    if(json['code']===0){
                        for(let medalInfo of json['data']['list']){
                            if(medalInfo['medal_info']['target_id'] === upID){
                                emojiRequiredMedalLevel = medalInfo['medal_info']['level'];
                                medal_id = medalInfo['medal_info']['medal_id'];
                                medal_name = medalInfo['medal_info']['medal_name'];
                                if(renderRequest)
                                    wareMedal(medal_id, medal_name, true);
                            }
                        }
                    }
                })
                .catch(e=>{});
            if(renderRequest)
                delay();
        }

        function wareMedal(medal, name, upd){
            if(JCT !== "-1" && medalSwitch && medal !==-1){
                var madelForm = new FormData();
                madelForm.append("medal_id", medal);
                madelForm.append("csrf", JCT);
                madelForm.append("csrf_token", JCT);
                fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear",{
                    method:"POST",
                    credentials: 'include',
                    body:madelForm,
                })
                    .then(res => {
                        console.log("ware medal successful, MID="+medal);
                        if(upd) c(name);
                    });
            }
        }

        function c(medal){
            let e = document.createEvent("MouseEvents");
            e.initEvent("click", false, true);
            if(document.getElementsByClassName("medal-section").length === 0 || document.getElementsByClassName("medal-section")[0].getElementsByTagName("span").length === 0 || document.getElementsByClassName("medal-section")[0].getElementsByTagName("span")[0].getElementsByTagName("span").length === 0)
                setTimeout(()=>{c(medal)},200);
            else{
                let m = document.getElementsByClassName("medal-section")[0].getElementsByTagName("span")[0];
                m.dispatchEvent(e);
                setTimeout(function (){
                    let i =  document.getElementById("control-panel-ctnr-box").getElementsByClassName("medal")[0];
                    if(i!==undefined) i.style.display = "none";
                    let s = document.getElementById("control-panel-ctnr-box").getElementsByClassName("fans-medal-content")[0].innerText;
                    if(s===undefined || s !== medal)
                        setTimeout(()=>{c(medal)}, 1000);
                },20);
            }
        }

        // function revokeListener(element){
        //     for (let i = 0; i < element.rows.length; i++) {
        //         let cell = element.rows[i].cells;
        //         for (let j = 0; j < cell.length; j++)
        //             cell[j].onclick = null;
        //     }
        // }


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

            emojiTable.setAttribute("class", "rua-emoji-table");
            emojiTable.innerHTML = "<div id='load'>加载弹幕中...</div>";

            emojiTableSystem.setAttribute("class", "rua-system-emoji-table");



            popup.style.top = absoluteLoc[1]+"px";
            selec.style.top = (absoluteLoc[1]-5)+"px";

            DanMuSub.setAttribute("id", "input-button");
            DanMuSub.innerHTML = "<span>发送</span>";
            DanMuSub.style.display = "none";

            DanMuInput.setAttribute("id", "rua-dm-input-form");
            DanMuInput.placeholder = "这里也可以发弹幕~";
            DanMuInput.style.display = "none";

            textLength.setAttribute("id", "length-indicator");
            textLength.style.display = "none";

            danmakuSendEErr.setAttribute('id', 'rua-err-bubble');
            danmakuSendEErr.style.display = 'none';

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
            selec.appendChild(emojiPad);

            parent.appendChild(selec);
            parent.appendChild(popup);
            parent.appendChild(danmakuSendEErr);

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
                                constructHTMLTableSystemEmoji(4, emojiTableSystem);
                                selec.classList.remove("selection-fade-out");
                                selec.style.display = "block";
                                selec.classList.add("selection-fade-in");
                                DanMuInput.focus();
                            } else {
                                selec.classList.remove("selection-fade-in");
                                selec.classList.add("selection-fade-out");
                                setTimeout(()=>{
                                    selec.style.display = "none";
                                    //revokeListener(emojiTableSystem);
                                    //document.body.getElementsByClassName('rua-system-emoji-table')[0].innerHTML = '';
                                    }, 300);
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
                    let fullScreenListener = new MutationObserver((m)=>{
                        m.forEach(function(mutation) {
                            if (mutation.type === "attributes") {
                                if(document.body.getAttribute("class")!==null){
                                    let fullScreen = document.body.getAttribute("class").split(" ");
                                    if(fullScreen.indexOf("fullscreen-fix")!==-1){
                                        constructHTMLTableSystemEmoji(8, fullscreenEmojiTableSystem);
                                    }else{
                                        fullscreenEmojiTableSystem.innerHTML = '';
                                        //revokeListener(fullscreenEmojiTableSystem);
                                    }
                                }
                            }
                        });
                    });
                    fullScreenListener.observe(document.body, {attributes:true});

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
                if(result.json()['message']==='f')
                    sendError('你的弹幕被系统吞了，重试一下吧。');
            }).catch(error=>{
                console.error('Error:', error);
                sendError('发送失败');
            });
        }

        function sendError(reason){
            let abs = getAbsLocation('rua-dm-input-form');
            danmakuSendEErr.style.left = `${abs[0]-140}px`;
            danmakuSendEErr.style.top = `${abs[1]+15}px`;
            danmakuSendEErr.style.display = 'block';
            danmakuSendEErr.innerHTML = `<span>&nbsp;&nbsp;&nbsp;&nbsp;${reason}&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
            setTimeout(()=>{danmakuSendEErr.style.opacity = '1';}, 10);
            setTimeout(()=>{danmakuSendEErr.style.opacity = '0';},1000);
            setTimeout(()=>{danmakuSendEErr.style.display = 'none'},1400);
        }


        async function constructHTMLTableSystemEmoji(num_per_line, HTMLObj){
            await getUserPrivilege(false);
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+room_id, {
                method:"GET",
                credentials: 'include',
                body: null
            }).then(result => result.json())
                .then(json =>{
                    if(json['code']===0){
                        let html = '';
                        for (let j = 2; j >= 0; j--) {
                            if(json['data']['data'][j]!==undefined && json['data']['data'][j]!==null){
                                html += `</tr></tbody><thead><tr><th colspan='4' class='rua-table-header'>${json['data']['data'][j]['pkg_name']}</th></tr></thead><tbody><tr>`;
                                for (let i = 0; i < json['data']['data'][j]['emoticons'].length; i++) {
                                    let able = emojiRequiredPrivilege <= json['data']['data'][j]['emoticons'][i]['identity'] && json['data']['data'][j]['emoticons'][i]['unlock_need_level'] <= emojiRequiredMedalLevel;
                                    if(i % num_per_line === 0 && i !== 0)
                                        html += '</tr><tr>';
                                    html += `<td colspan="1" title="${json['data']['data'][j]['emoticons'][i]['emoji']}" id="${json['data']['data'][j]['emoticons'][i]['emoticon_unique']}"><div  class="rua-emoji-icon ${able?'rua-emoji-icon-active':'rua-emoji-icon-inactive'}" style="width:60px; height:60px; background-image:url('${json['data']['data'][j]['emoticons'][i]['url'].replace("http://", "https://")}');"></div><div class="rua-emoji-requirement" style="background-color: ${json['data']['data'][j]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][j]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
                                }
                            }
                        }
                        html += '</tr></tbody>';
                        HTMLObj.innerHTML = html;

                        for (let i = 0; i < HTMLObj.rows.length; i++) {
                            var cell = HTMLObj.rows[i].cells;
                            for (let j = 0; j < cell.length; j++) {
                                const cellButton = cell[j].getElementsByTagName('div')[0];
                                cell[j].onclick = function (e){
                                    if(e.button === 0 && cellButton.classList.contains('rua-emoji-icon-active'))
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

        /**
         * Recording section
         * */
        const recordBtn = document.createElement("div");
        const recordDuration = document.createElement("div");
        let startRecording = false, stopRecoding = false, recordingDuration = 0,
            controlBar = document.getElementById("web-player-controller-wrap-el");
        recordBtn.classList.add("rua-record");
        recordDuration.classList.add("rua-recording-time");

        function setRoomTitle(){
            try{
                const header = document.getElementById('head-info-vm');
                const title = header.getElementsByClassName('live-title')[0].getElementsByClassName('text')[0].innerText;
                const name = header.getElementsByClassName('lower-row')[0].getElementsByClassName('left-ctnr')[0].getElementsByTagName('a')[0].innerText;
                return changTitle(title+"-"+name);
            }catch (e){}
            return room_title;
        }
        function changTitle (title){
            const memeName = {'21652717': '全世界最好的豹豹', '1603600': '伟大的山猪王星汐Seki陛下', '545':'塔宝', '22486793': '夏鹤1？夏鹤0！', '21775601':'紫色叔叔'};
            if(memeName[room_id] !== undefined){
                if (title.includes('-')) title = title.split('-')[0]+'-'+memeName[room_id];
                else title+='-'+memeName[room_id];
            }
            return title;
        }

        const controlBarObserver = new MutationObserver(function (m){
            m.forEach(function(mutation) {
                if (mutation.type === "childList") {
                    if(mutation.addedNodes.length===0){
                        recordBtn.removeEventListener("click", recordingListener);
                    }
                    if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].nodeName==="DIV" && recordEnable){
                        drawRecording();
                        recordBtn.addEventListener("click", recordingListener);
                    }
                }
            });
        });

        const videoReconnect = new MutationObserver(function (m){
            m.forEach(function(mutation) {
                if (mutation.type === "childList") {
                    if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].nodeName==="VIDEO"&&recordEnable && prerecordingDuration>0)
                        recording();
                    if(controlBar===null){
                        if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].nodeName==="DIV"&&mutation.addedNodes[0].id==="web-player-controller-wrap-el"){
                            controlBar = mutation.addedNodes[0];
                            controlBarObserver.observe(controlBar,{
                                childList: true
                            });
                        }
                    }
                }
            });
        });

        try{
            if(controlBar!==null){
                controlBarObserver.observe(controlBar,{
                    childList: true
                });
            }
            videoReconnect.observe(document.getElementById("live-player"),{
                childList: true
            });
        }catch (e) {}

        function drawRecording(){
            updateRecordingInfo();
            controlBar.getElementsByClassName("right-area")[0].appendChild(recordBtn);
        }

        function updateRecordingInfo(){
            recordBtn.innerHTML = "<span class='text'>"+(startRecording?"结束录制":"开始录制")+"</span>";
            if(startRecording){
                recordDuration.innerHTML = "<span class='text'>录制时长 "+secondToMinutes(recordingDuration)+"</span>";
                controlBar.getElementsByClassName("left-area")[0].appendChild(recordDuration);
            }else{
                recordDuration.innerHTML = "<span class='text'></span>";
            }
        }

        function recordingListener(){
            startRecording = !startRecording;
            updateRecordingInfo();
            console.log("Start recording");
            if(prerecordingDuration===0 && startRecording)
                recording();
            if(!startRecording){
                stopRecoding = true;
                recorder.stop();
            }
        }

        function recording(){
            try{
                const stream = document.getElementById("live-player").getElementsByTagName("video")[0].captureStream();
                //not support 60fps yet. And for all resolution above 1080p will involve performance issue.
                let streamChunks = [], recordTime = 0, videotype="", recordingSize = 0;//(size unit: MiB 1024^2 Byte)
                recordingDuration = 0;
                if(recordEnable){
                    console.log(stream);
                    recorder = new MediaRecorder(stream);
                    recorder.ondataavailable = (e) =>{
                        if(e.data.size > 0){
                            if(streamChunks.length >= prerecordingDuration && !startRecording){
                                streamChunks.splice(1,1);// first chunk contains headers.
                            }
                            if (streamChunks.length===0){
                                videotype = e.data.type;
                            }
                            streamChunks.push(e.data);
                            recordingSize += e.data.size / (1024**2);
                            if(startRecording) {
                                recordingDuration = streamChunks.length;
                                recordDuration.innerHTML = "<span class='text'>录制时长 "+secondToMinutes(recordingDuration)+"</span>";
                            }
                            recordTime++;
                        }
                    }
                    recorder.onstart = ()=>{
                        console.log("start recording");
                    }
                    recorder.onstop = ()=>{
                        if(stopRecoding){
                            const videoBlob = new Blob(streamChunks, {'type': videotype});
                            const blobURL = window.URL.createObjectURL(videoBlob);
                            stopRecoding = false;
                            room_title = setRoomTitle();
                            console.log("clip sent to process: \r\nfileName: "+room_title+"\r\nvideo duration: "+recordingDuration+"s\r\nfile size: "+videoBlob.size / (1024**2)+"MiB\r\nmime type: "+videoBlob.type);
                            chrome.runtime.sendMessage({msg: "requestEncode", blob: blobURL, filename: room_title, startTime: (recordTime - recordingDuration), duration: recordingDuration, requestType: 'videoRecord'});
                        }
                        streamChunks = [];
                        if(prerecordingDuration>0)
                            recording();
                    }
                    recorder.start(1000);
                }else{
                    recorder.ondataavailable = null;
                    recorder.onstart = null;
                    recorder.onstop = null;
                    recorder = null;
                }
            }catch (e) {}
        }

        function secondToMinutes(sec){
            return Math.floor(sec / 60.0) +" : "+(sec % 60<10?"0":"")+sec%60;
        }

    }
}();