/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const qn_table = {"原画PRO":10001, "原画":10000, "蓝光PRO":401, "蓝光":400, "超清PRO":251, "超清":250, "高清":150,"流畅":80};
    const wasmPath = chrome.runtime.getURL('../ffmpeg/ffmpeg-core.wasm');
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
    let bespokePageHref = window.location['href'].replace('https://live.bilibili.com/','').replaceAll('/','').replace("blanc","");
    if(exp.test(room_id) && room_id.length > 0 && bespokePageHref.charAt(bespokePageHref.length-1)!=='#'){
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

        const LiveRoomBtn = document.createElement('button');

// full screen function.
//         const fullScreenText = document.createElement("span");
//         const fullScreenSection = document.createElement("section");
//         const fullScreenButton = document.createElement("div");
//         const fullScreenInput = document.createElement("input");
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

        /**
         * Set quality.
         *
         * @param {string} qn the quality string.
         * */
        function q(qn){
            let e = document.createEvent("MouseEvents");
            e.initEvent("mousemove", false, false);
            if(document.getElementById("live-player") === undefined || document.getElementById("live-player").getElementsByClassName("web-player-controller-wrap").length===undefined||document.getElementById("live-player").getElementsByClassName("web-player-controller-wrap").length===0)
                setTimeout(()=>{q(qn)},200);
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
            wearMedal(medal_id, medal_name, false);
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
                                    wearMedal(medal_id, medal_name, true);
                            }
                        }
                    }
                })
                .catch(e=>{});
            if(renderRequest)
                delay();
        }

        function wearMedal(medal, name, upd){
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
            try{
                popup.style.background = "url("+link+") no-repeat center";
            }catch (e){
                popup.style.background = "url("+chrome.runtime.getURL("../images/haruka/abaaba.svg")+") no-repeat center";
            }
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
            danmakuSendEErr.style.opacity = '0';

            LiveRoomBtn.setAttribute('id', 'rua-go-to-live-room');
            LiveRoomBtn.innerHTML = `<span>去放映室看</span>`;
            LiveRoomBtn.style.display = 'none';
            // fullScreenSection.classList.add("button");
            // fullScreenButton.classList.add("checkbox");
            // fullScreenInput.type = "checkbox";
            // fullScreenInput.checked = true;
            // fullScreenButton.appendChild(fullScreenInput);
            // fullScreenButton.appendChild(document.createElement("label"));
            // fullScreenSection.appendChild(fullScreenButton);
            // fullScreenSection.style.display = "none";
            // fullScreenText.setAttribute("id", "fullscreen-label");
            // fullScreenText.innerHTML = "全屏显示";
            // fullScreenText.style.display = "none";

            selec.appendChild(DanMuInput);
            selec.appendChild(DanMuSub);
            selec.appendChild(LiveRoomBtn);
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
                                constructSystemEmoji(4, document.getElementById('emoji-tray'), DanMuInput);
                                selec.classList.remove("selection-fade-out");
                                selec.style.display = "block";
                                selec.classList.add("selection-fade-in");
                                DanMuInput.focus();
                            } else {
                                selec.classList.remove("selection-fade-in");
                                selec.classList.add("selection-fade-out");
                                document.getElementById('emoji-tray').innerHTML = '';
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
                LiveRoomBtn.style.display = 'block';

                LiveRoomBtn.addEventListener('click', (e)=>{
                    chrome.storage.local.set({'tempRoomNumber':room_id}, ()=>{});
                    chrome.runtime.sendMessage({msg: `launchLiveRoom`}, (callback)=>{});
                });
                // fullScreenSection.style.display = "block";
                // fullScreenText.style.display = "block";

                constructHTMLTable(4, DanMuInput, emojiTable, textLength);
                //constructSystemEmoji(4,  document.getElementById('emoji-tray'), DanMuInput);

                DanMuSub.onclick = function (){
                    packaging(DanMuInput.value);
                    textLength.innerHTML = " 0/"+document.getElementsByClassName("input-limit-hint")[0].innerHTML.split("/")[1];
                    DanMuInput.value = "";
                }

                // full screen functions.
                // fullScreenInput.addEventListener('change', function() {
                //     this.checked?displayFullScreenDanmaku():hideFullScreenDanmaku();
                // });
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

                !function getFullscreenControl(){
                    try{
                        originalInput = document.getElementsByClassName("fullscreen-danmaku")[0].getElementsByTagName("div")[0];
                        originalButton = document.getElementsByClassName("fullscreen-danmaku")[0].getElementsByTagName("div")[1];
                        renderFullScreenMode();
                        displayFullScreenDanmaku();
                    }catch (e) {
                        console.log(e);
                        console.log('retry in 2 seconds');
                        setTimeout(()=>{getFullscreenControl()}, 2000);
                    }
                }();

                function renderFullScreenMode(){
                    let fullScreenListener = new MutationObserver((m)=>{
                        m.forEach(function(mutation) {
                            if (mutation.type === "attributes") {
                                if(document.body.getAttribute("class")!==null){
                                    let fullScreen = document.body.getAttribute("class").split(" ");
                                    if(fullScreen.indexOf("fullscreen-fix")!==-1){
                                        constructHTMLTableSystemEmoji(8, fullscreenEmojiTableSystem, fullscreenInput);
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
                    constructHTMLTableSystemEmoji(8, fullscreenEmojiTableSystem, fullscreenInput);

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

                    let interval;
                    fullscreenEmojiTableSystem.addEventListener('mouseenter', ()=>{
                        interval = setInterval(fullscreenMousemoveEvent, 1000);
                    });
                    fullscreenEmojiTableSystem.addEventListener('mouseleave', ()=>{
                        clearInterval(interval);
                    });
                }

                function fullscreenMousemoveEvent(){
                    fullscreenEmojiTableSystem.parentElement.parentElement.parentElement.parentElement.dispatchEvent(new Event('mousemove'));
                }

                function displayFullScreenDanmaku(){
                    originalInput.style.display = "none";
                    originalButton.style.display = "none";

                    fullscreenInputDiv.style.display = "block";
                    fullscreenInputBtn.style.display = "block";
                    fullscreenEmojiPad.style.display = "block";
                    fullscreenBackground.style.display = "block";

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
            })
                .then(result=> result.json())
                .then(result =>{
                    console.log("sent");
                    if(result['message'].length!==0)
                        sendError('你的弹幕被系统吞了，重试一下吧。');
                    else if(result['message']==='你所在的地区暂无法发言')
                        sendError('你所在的地区暂无法发言');
                })
                .catch(error=>{
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
            setTimeout(()=>{danmakuSendEErr.style.opacity = '1';}, 400);
            setTimeout(()=>{danmakuSendEErr.style.opacity = '0';},1400);
            setTimeout(()=>{danmakuSendEErr.style.display = 'none'},1800);
        }

        let lastUsed = 0
        async function constructSystemEmoji(num_per_line, HTMLObj, inputArea){
            await getUserPrivilege(false);
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+room_id, {
                method:'GET',
                credentials:'include',
                body: null
            }).then(result => result.json())
                .then(json=>{
                    if (json['code'] === 0){
                        HTMLObj.innerHTML = '';
                        const emojiHeader = document.createElement('div');
                        const emojiHeaderContent = document.createElement('div');
                        emojiHeaderContent.classList.add('rua-emoji-header');
                        emojiHeader.appendChild(emojiHeaderContent);
                        HTMLObj.appendChild(emojiHeader);
                        emojiHeaderContent.addEventListener('wheel', (e)=>{
                            emojiHeaderContent.scrollLeft += e.deltaY;
                            e.preventDefault();
                        })

                        const data = json['data']['data'];
                        if (lastUsed > data.length) lastUsed = 0;
                        for (let i = 0; i < data.length; i++) {
                            const headerItem = document.createElement('div');
                            headerItem.classList.add('rua-header-item');

                            const emojiContainer = document.createElement('div');
                            emojiContainer.classList.add('rua-emoji-container');
                            if (i === lastUsed) {
                                headerItem.classList.add('active');
                                emojiContainer.style.display = 'flex';
                            }
                            headerItem.innerHTML += `<img src="${data[i]['current_cover']}"></div>`
                            headerItem.onclick = ()=>{
                                for (let j = 0; j < emojiHeaderContent.childNodes.length; j++) {
                                    emojiHeaderContent.childNodes.item(j).classList.remove('active');
                                    HTMLObj.getElementsByClassName('rua-emoji-container')[j].style.display = 'none';
                                    if (emojiHeaderContent.childNodes.item(j) === headerItem) {
                                        HTMLObj.getElementsByClassName('rua-emoji-container')[j].style.display = 'flex';
                                        lastUsed = j;
                                    }
                                }
                                headerItem.classList.add('active');
                            }
                            emojiHeaderContent.appendChild(headerItem);

                            for (let j = 0; j < data[i]['emoticons'].length; j++) {
                                const emoji = document.createElement('div');
                                emoji.classList.add('rua-emoji-icon');
                                emoji.classList.add('rua-emoji-item');
                                data[i]['emoticons'][j]['perm']===1?emoji.classList.add('rua-emoji-icon-active'):emoji.classList.add('rua-emoji-icon-inactive-new');
                                emoji.title = data[i]['emoticons'][j]['emoji'];
                                if (i === 0) emoji.classList.add('rua-emoji-item-xs');
                                emoji.innerHTML += `<div class="rua-emoji-requirement" style="background-color: ${data[i]['emoticons'][j]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${data[i]['emoticons'][j]['unlock_show_text']}</div></div><img src="${data[i]['emoticons'][j]['url']}">`;
                                emoji.onclick = ()=>{
                                    if (!emoji.classList.contains('rua-emoji-icon-inactive-new') && i!==0)
                                        packaging(data[i]['emoticons'][j]['emoticon_unique'], "systemEmoji");
                                    if (i===0){
                                        if (inputArea.selectionStart === inputArea.selectionEnd){
                                            inputArea.value = inputArea.value.substring(0,inputArea.selectionStart)+emoji.title+inputArea.value.substring(inputArea.selectionEnd, inputArea.value.length);
                                        }else{
                                            let p1 = inputArea.value.substring(0,inputArea.selectionStart), p2 = inputArea.value.substring(inputArea.selectionEnd, inputArea.value.length);
                                            inputArea.value=p1+emoji.title+p2;
                                        }
                                        inputArea.focus();
                                    }
                                }
                                emojiContainer.append(emoji);
                            }
                            HTMLObj.appendChild(emojiContainer);
                        }
                    }
                })
        }

        async function constructHTMLTableSystemEmoji(num_per_line, HTMLObj, inputArea){
            await getUserPrivilege(false);
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+room_id, {
                method:"GET",
                credentials: 'include',
                body: null
            }).then(result => result.json())
                .then(json =>{
                    if(json['code']===0){
                        let html = '';
                        for (let j = json['data']['data'].length; j >= 0; j--) {
                            if(json['data']['data'][j]!==undefined && json['data']['data'][j]!==null && (json['data']['data'][j]['pkg_name'] === '房间专属表情' || json['data']['data'][j]['pkg_name'] === 'UP主大表情')){
                                html += `</tr></tbody><thead><tr><th colspan='4' class='rua-table-header'>${json['data']['data'][j]['pkg_name']}</th></tr></thead><tbody><tr>`;
                                for (let i = 0; i < json['data']['data'][j]['emoticons'].length; i++) {
                                    let able = emojiRequiredPrivilege <= json['data']['data'][j]['emoticons'][i]['identity'] && json['data']['data'][j]['emoticons'][i]['unlock_need_level'] <= emojiRequiredMedalLevel;
                                    if(i % num_per_line === 0 && i !== 0)
                                        html += '</tr><tr>';
                                    html += `<td colspan="1" title="${json['data']['data'][j]['emoticons'][i]['emoji']}" id="${json['data']['data'][j]['emoticons'][i]['emoticon_unique']}"><div  class="rua-emoji-icon ${json['data']['data'][j]['emoticons'][i]['perm']===1?'rua-emoji-icon-active':'rua-emoji-icon-inactive'}" style="width:60px; height:60px; background-image:url('${json['data']['data'][j]['emoticons'][i]['url'].replace("http://", "https://")}');"></div><div class="rua-emoji-requirement" style="background-color: ${json['data']['data'][j]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][j]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
                                }
                            }
                        }
                        for (let j = json['data']['data'].length; j >= 0; j--) {
                            if(json['data']['data'][j]!==undefined && json['data']['data'][j]!==null && !(json['data']['data'][j]['pkg_name'] === '房间专属表情' || json['data']['data'][j]['pkg_name'] === 'UP主大表情')){
                                html += `</tr></tbody><thead><tr><th colspan='4' class='rua-table-header'>${json['data']['data'][j]['pkg_name']}</th></tr></thead><tbody><tr>`;
                                for (let i = 0; i < json['data']['data'][j]['emoticons'].length; i++) {
                                    let able = emojiRequiredPrivilege <= json['data']['data'][j]['emoticons'][i]['identity'] && json['data']['data'][j]['emoticons'][i]['unlock_need_level'] <= emojiRequiredMedalLevel;
                                    if(i % num_per_line === 0 && i !== 0)
                                        html += '</tr><tr>';
                                    html += `<td colspan="1" title="${json['data']['data'][j]['emoticons'][i]['emoji']}" id="${json['data']['data'][j]['emoticons'][i]['emoticon_unique']}"><div  class="rua-emoji-icon ${json['data']['data'][j]['emoticons'][i]['perm']===1?'rua-emoji-icon-active':'rua-emoji-icon-inactive'}" style="width:60px; height:60px; background-image:url('${json['data']['data'][j]['emoticons'][i]['url'].replace("http://", "https://")}');"></div><div class="rua-emoji-requirement" style="background-color: ${json['data']['data'][j]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][j]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
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
                                    if(e.button === 0 && cellButton.classList.contains('rua-emoji-icon-active') && !this.id.includes('emoji')){
                                        inputArea.focus();
                                        packaging(this.id, "systemEmoji");
                                    }
                                    if(e.button === 0 && cellButton.classList.contains('rua-emoji-icon-active') && this.id.includes('emoji')){
                                        if (inputArea.selectionStart === inputArea.selectionEnd){
                                            inputArea.value = inputArea.value.substring(0,inputArea.selectionStart)+this.title+inputArea.value.substring(inputArea.selectionEnd, inputArea.value.length);
                                        }else{
                                            let p1 = inputArea.value.substring(0,inputArea.selectionStart), p2 = inputArea.value.substring(inputArea.selectionEnd, inputArea.value.length);
                                            inputArea.value=p1+this.title+p2;
                                        }
                                        inputArea.focus();
                                    }
                                }
                            }
                        }
                    }
                    if(emojiTable.innerHTML.length===0 && emojiTableSystem.innerHTML.length<=25 && num_per_line === 4){
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
                                O.value = O.value.substr(0, cursorSelection[0]) + imgs[j+(i-1)*num_per_line].left +emoji[j+(i-1)*num_per_line]+ imgs[j+(i-1)*num_per_line].right + O.value.substr(cursorSelection[1]);
                                cursorSelection = inputListener(span, O);
                                DanMuInput.focus();
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

        // var obs = new MutationObserver(function (m){
        //     m.forEach(function(mutation) {
        //         if (mutation.type === "attributes") {
        //             if(labStyle.getAttribute("lab-style")!==null){
        //                 labFeatures = labStyle.getAttribute("lab-style").split(",");
        //                 labFeatures.indexOf("dark")!==-1?darkMode(true):darkMode(false);
        //             }else{
        //                 darkMode(false);
        //             }
        //         }
        //     });
        // });
        //
        // const labStyle = document.documentElement;
        // obs.observe(labStyle,{
        //     attributes: true
        // });

        // function darkMode(on){
        //     if(on){
        //         selec.style.background = "#151515";
        //         emojiPad.style.opacity = "0.8";
        //         DanMuSub.style.opacity = "0.8";
        //         DanMuInput.style.background = "#151515";
        //         DanMuInput.style.borderColor = "#2b2b2b";
        //         DanMuInput.style.color = "#fff";
        //         fullScreenText.style.color = "#fff";
        //     }else{
        //         selec.style.removeProperty("background");
        //         emojiPad.style.removeProperty("opacity");
        //         DanMuSub.style.removeProperty("opacity");
        //         DanMuInput.style.removeProperty("background");
        //         DanMuInput.style.removeProperty("border-color");
        //         DanMuInput.style.removeProperty("color");
        //         fullScreenText.style.removeProperty("color");
        //     }
        // }

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
                        chaseButtonDiv.removeEventListener("click", frameChasing);
                    }
                    if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].nodeName==="DIV"){
                        if (recordEnable){
                            drawRecording();
                            recordBtn.addEventListener("click", recordingListener);
                        }
                        traceButton();
                        chaseButtonDiv.addEventListener("click", frameChasing);
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
                            encode(blobURL, (recordTime - recordingDuration), room_title).then(r=>{
                                window.URL.revokeObjectURL(blobURL);
                            });
                            //chrome.runtime.sendMessage({msg: "requestEncode", blob: blobURL, filename: room_title, startTime: (recordTime - recordingDuration), duration: recordingDuration, requestType: 'videoRecord'});
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

        async function encode(blob, startTime, fileName){
            let out, downloadName, dl;
            const {createFFmpeg, fetchFile} = FFmpeg;
            const ffmpeg = createFFmpeg({
                corePath: wasmPath,
                mainName: 'main',
                log: false
            });
            await ffmpeg.load();
            ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(blob));
            if(startTime > 1){
                await ffmpeg.run('-i', 'video.mp4', '-ss', startTime + '', '-c', 'copy', 'footage.mp4');
                await ffmpeg.run('-i', 'footage.mp4', '-vcodec','copy', '-acodec','aac', 'final.mp4');
            }else{
                await ffmpeg.run('-i', 'video.mp4', '-vcodec','copy', '-acodec','aac', 'final.mp4');
            }
            out = ffmpeg.FS('readFile', 'final.mp4');
            downloadName = fileName + ".mp4";
            dl = URL.createObjectURL(new Blob([out.buffer], {type: 'video/mp4'}));
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = dl;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(dl);
        }

        // !function hb(){
        //     let hbObs = new MutationObserver((m)=>{
        //         console.log(m);
        //         if (m.type === "childList") {
        //             console.log(m.addedNodes[0])
        //         }
        //     });
        //
        //     try {
        //         hbObs.observe(document.getElementsByTagName('main')[0],{
        //             childList: true
        //         });
        //     }catch (e){
        //         console.log(e)
        //     }
        // }()

        const chaseButtonDiv = document.createElement('div');
        const button = `<div class="frame-chasing"><div><span class="icon"><svg class="squirtle-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path d="M16 5a1 1 0 00-1 1v4.615a1.431 1.431 0 00-.615-.829L7.21 5.23A1.439 1.439 0 005 6.445v9.11a1.44 1.44 0 002.21 1.215l7.175-4.555a1.436 1.436 0 00.616-.828V16a1 1 0 002 0V6C17 5.448 16.552 5 16 5z" style="transform: scale(0.75);transform-origin: center;"></path></svg></span></div></div></div>`;
        chaseButtonDiv.innerHTML += button;
        function findPlayer(){
            try {
                const playContainer = document.getElementById('live-player');

            }catch (e){
                setTimeout(findPlayer, 200);
            }
        }

        function frameChasing(){
            try{
                try{
                    document.getElementById('live-player').getElementsByTagName('video')[0].currentTime = document.getElementById('live-player').getElementsByTagName('video')[0].buffered.end(0) - 1;
                }catch (e){}//silence handling here which you should not, but doesn't matter here.
            }catch (e){}
        }

        function traceButton(){
            const controlHost = document.getElementById('web-player-controller-wrap-el').getElementsByClassName('control-area')[0].getElementsByClassName('left-area')[0];
            controlHost.appendChild(chaseButtonDiv);
        }
    }
}();