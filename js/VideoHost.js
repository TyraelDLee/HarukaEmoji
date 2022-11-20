/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */

!function (){
    const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
    const wasmPath = chrome.runtime.getURL('../ffmpeg/ffmpeg-core.wasm');
    const assConvert = new AssConvert(1280, 720);

    var vid = window.location["pathname"].replaceAll("/", "").replace("video","").replace('bangumi','').replace('play','');// id for current page, av or bv or ss or ep.
    var aid = "";
    var bvid = "0";//bv id for current page. convert all id to bv id.
    var pid = new URLSearchParams(window.location["search"]).get("p")===null?0:new URLSearchParams(window.location["search"]).get("p")-1;// current part id.
    var cids = [];// actual id for each video (different parts).
    var acceptQn = {}; // quality info for current part.
    var vtitle = []; // video title, p title if page has more than 1 part.
    var downloadBlocks = [];
    var videoDuration = 0;
    var danmakuPoolSize = 0;
    var danmakuArr = new DanmakuArr();
    var danmakuSearchArr = new DanmakuArr();
    var initPrint = true;

    var WINDOW_HEIGHT;
    var WINDOW_WIDTH;
    var initWidth = window.innerWidth;
    var labFeatures=[];
    var zoomFactor = 1.0;

    let vipStatus = null;

    new MutationObserver(()=>{
        const p = new URLSearchParams(window.location["search"]).get("p")-1;
        const nvid = window.location["pathname"].replaceAll("/", "").replace("video","").replace('bangumi','').replace('play','');
        if(new URLSearchParams(window.location["search"]).get("p") !== null && pid!==p){
            pid = p;
            getQn(cids[p]);
        }
        if(nvid!==null && nvid!==vid){
            vid = nvid;
            grabVideoInfo();
        }
    }).observe(document, {subtree: true, childList: true});


    function setSize(){
        WINDOW_HEIGHT = window.innerHeight * zoomFactor;
        WINDOW_WIDTH = window.innerWidth * zoomFactor;
    }

    setSize();

    var moved = false;
    var absoluteLoc = [100,100,100];
    var isDrag = 0;
    const parent = document.body;
// popup button
    const popup = document.createElement("div");
// popup window
    const selec = document.createElement("div");

    const videoInfoSec = document.createElement("div");
    videoInfoSec.setAttribute("id","rua-video-info");
    videoInfoSec.style.paddingTop = "2px";
    const videoInfo = document.createElement("div");
    videoInfo.setAttribute("style","display: flex; padding-left:5px; justify-content: space-between;");
    videoInfoSec.appendChild(videoInfo);

    const danmakuTray = document.createElement("div");
    danmakuTray.setAttribute("id","rua-danmaku");
    danmakuTray.classList.add("emoji_sec");

    const danmakuTag = document.createElement("div");
    danmakuTag.setAttribute("style", "width: 300px; position: fixed;");
    danmakuTag.innerHTML = `<div style='float: left; padding-left: 5px; user-select: none;'><b>弹幕：</b></div><div style='float: right; padding-right: 5px; user-select: none;' id='rua-danmaku-size'>共${danmakuPoolSize} 弹幕</div><div style='float: right; padding-right: 5px;user-select: none;cursor: pointer' id='rua-danmaku-search' title='查询弹幕内容'><svg width='18' height='18' viewBox='0 0 18 18' xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"8\" cy=\"8\" r=\"5\" style=\"stroke:#aaa;stroke-width:2; fill: none\"/><line x1=\"11.5\" y1=\"11.5\" x2=\"15\" y2=\"15\" style=\"stroke:#aaa;stroke-width:2\" /></svg></div><div id='rua-input-container' style='width: ${calculateStringLength(danmakuPoolSize+"")}px'><textarea id='rua-danmaku-search-input' class='rua-danmaku-search-out' style='display: none' placeholder='输入要查询的弹幕内容'></textarea></div>`;
    const danmakuArea = document.createElement("div");
    danmakuArea.style.position = "relative";
    danmakuTray.appendChild(danmakuArea);


    const downloadTray = document.createElement("div");
    downloadTray.setAttribute("id","rua-download");
    downloadTray.classList.add("emoji_sec");

    const downloadTag = document.createElement("div");
    downloadTag.setAttribute("style", "width: 290px; position: fixed;");
    downloadTag.innerHTML = `<div style='float: left; user-select: none; padding-left: 5px'><b>视频下载：</b></div><div id="rua-danmaku-download" style="opacity: 0.8; cursor: not-allowed;" title="将弹幕保存为ass文件">加载中</div><div style="float: right; margin: -2px 10px 0 0"><label for="rua-danmaku-intense"></label><select id="rua-danmaku-intense"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10" selected>10</option></select></div><div style="float: right; margin-right: 5px;">弹幕强度</div></div>`;

    const downloadVideoTray = document.createElement("div");
    downloadVideoTray.setAttribute("style", "margin: 0 0 0 15px;");
    downloadTray.appendChild(downloadVideoTray);

    const coverSection = document.createElement('div');
    const coverButton = document.createElement('div');
    coverButton.classList.add('rua-cover');
    coverButton.innerText = '下载封面';
    coverSection.appendChild(coverButton);

    function calculateStringLength(string){
        return 180 - (string.length * 8);
    }

    /**
     * Popup UI render section
     * */
    if(document.getElementsByTagName("article").length === 0) renderPopup();
    function renderPopup(){
        loadPopPos();
        popup.setAttribute("id", "emoji-popup");
        popup.style.background = "url("+link+") no-repeat center";
        popup.style.backgroundSize = "contain";
        popup.style.cursor = "pointer";
        popup.innerHTML = "<!---->";

        selec.setAttribute("id", "emoji-selection");
        selec.classList.add("emoji_sec");
        selec.style.display = "none";
        selec.innerHTML = "";

        selec.appendChild(videoInfoSec);
        selec.appendChild(coverSection);
        selec.appendChild(danmakuTag);
        selec.appendChild(danmakuTray);
        selec.appendChild(downloadTag);
        selec.appendChild(downloadTray);

        parent.appendChild(selec);
        parent.appendChild(popup);

        popup.style.top = absoluteLoc[1]+"px";
        selec.style.top = (absoluteLoc[1]-5)+"px";

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
                    if(oevent.clientX - distanceX >= 0 && oevent.clientX - distanceX <= WINDOW_WIDTH - 70)
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

        document.getElementById('rua-danmaku-download').addEventListener('click', ()=>{
            if(document.getElementById('rua-danmaku-download').getAttribute('style').length===0){
                assConvert.feedDanmaku(danmakuArr);
                assConvert.downloadASS();
            }
        });

        document.getElementById('rua-danmaku-intense').addEventListener('change', function (){
            console.log(this.value);
            let intense = this.value-1+1;
            assConvert.setWeight(10-intense);
        });
    }

    function isMoved(oX, oY, cX, cY){return Math.abs(oX - cX) === 0 && Math.abs(oY - cY) === 0;}

    function getAbsLocation(id, offsetX, offsetY){
        let e = document.getElementById(id);
        let abs = [e.offsetLeft, e.offsetTop];
        let cur = e.offsetParent;
        while (cur!==null){
            abs[0] += cur.offsetLeft;abs[1] += (cur.offsetTop+cur.clientTop);
            cur = cur.offsetParent;
        }
        abs[0] += (e.clientWidth + offsetX);
        abs[1] += (e.clientHeight + offsetY);
        return abs;
    }

    function setPopupInitLocation(){
        let pos = getAbsLocation("danmukuBox", -60, -60);
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
    obs.observe(labStyle,{attributes: true});

    function darkMode(on){
        if(on){
            selec.style.background = "#151515";
        }else{
            selec.style.removeProperty("background");
        }
    }

    function copy(string, tips, tipsLocation, offsetX, offsetY){
        const copyTips = document.createElement('div');
        copyTips.setAttribute('id', 'rua-copy-tips');
        copyTips.setAttribute('style', `opacity: 0; display: block; left: ${getAbsLocation(tipsLocation, offsetX, offsetY)[0]}px; top: ${getAbsLocation(tipsLocation, offsetX, offsetY)[1]}px;`);
        copyTips.innerText = tips;
        document.getElementById('app').appendChild(copyTips);
        setTimeout(()=>{copyTips.style.opacity = '1';}, 10);
        setTimeout(()=>{copyTips.style.opacity = '0';},1000);
        setTimeout(()=>{copyTips.style.display = 'none';document.getElementById('app').removeChild(copyTips);},1400);
        navigator.clipboard.writeText(string).catch(e=>{
            console.log('Failed to access clipboard, using execCommand.');
            const videoInfo = document.createElement('textarea');
            videoInfo.value = string;
            document.body.appendChild(videoInfo);
            videoInfo.select();
            document.execCommand('Copy');
            videoInfo.remove();
        });
    }

    /**
     * Popup UI render section end.
     * */

    /**
     * Download section
     * */
    grabVideoInfo();
    
    /**
     * Get the video information.
     * Includes aid, bvid, cid.
     * Support video type: aid, bvid, epid, ssid.
     * */
    function grabVideoInfo(){
        console.log('new v');
        pid = pid<0?0:pid;
        cids = [];
        vtitle = [];
        document.getElementById("rua-danmaku-size").innerText = "共"+ 0 + " 弹幕";
        danmakuTray.getElementsByTagName('div')[0].style.height='0px';
        if(vid.substring(0,2)!=='ss' && vid.substring(0,2)!=='ep'){
            fetch("https://api.bilibili.com/x/web-interface/view?"+abv(vid), {
                method:"GET",
                credentials: 'include',
                body:null
            })
                .then(res => res.json())
                .then(json => {
                    if(json["code"]===0){
                        aid = json["data"]["aid"];
                        bvid = json["data"]["bvid"];
                        vtitle.push(json["data"]["title"]);
                        for (let i = 0; i < json["data"]["pages"].length; i++) {
                            cids.push(json["data"]["pages"][i]["cid"]);
                            if(json["data"]["pages"].length>1)vtitle.push(json["data"]["pages"][i]["part"]);
                        }
                        downloadCover(json['data']['pic']);
                        getQn(cids[pid]);
                    }
                });
        }else {
            document.getElementById('emoji-selection').style.fontSize = '12px';
            let found = false;
            for (const e of document.getElementById('media_module').getElementsByClassName('media-right')[0].getElementsByClassName('pub-wrapper')[0].getElementsByTagName('a')){
                if (e.classList.contains('av-link')){
                    found = true;
                    fetch("https://api.bilibili.com/pgc/view/web/season?"+sep(vid), {
                        method:"GET",
                        credentials: 'include',
                        body:null
                    })
                        .then(res => res.json())
                        .then(json => {
                            downloadCover(json['result']['cover']);
                            grabBangumi(json, e.innerText);
                        });
                }
            }
            if(!found){
                const bvObs = new MutationObserver(m=>{
                    m.forEach(function(mutation) {
                        if (mutation.type === "childList" && mutation.addedNodes[0]!==undefined && mutation.addedNodes[0].classList.contains('av-link')) {
                            const bv = mutation.addedNodes[0].innerText;
                            fetch("https://api.bilibili.com/pgc/view/web/season?"+sep(vid), {
                                method:"GET",
                                credentials: 'include',
                                body:null
                            })
                                .then(res => res.json())
                                .then(json => {
                                    downloadCover(json['result']['cover']);
                                    grabBangumi(json, bv);
                                });
                        }
                    });
                });
                bvObs.observe(document.getElementById('media_module').getElementsByClassName('media-right')[0].getElementsByClassName('pub-wrapper')[0],{
                    childList:true
                });
            }
        }
    }

    function downloadCover(dlURL){
        coverButton.onclick = null;
        coverButton.onclick = e=>{
            aDownload(dlURL, '');
        }
    }

    /**
     * Get the bangumi information.
     * */
    function grabBangumi(json, id){
        let reason, rightBadge;
        chrome.runtime.sendMessage({ msg: "get_LoginStatus" }, function (vip){
            if(json["code"]===0){
                let found = false;
                try{
                    for (let i = 0; i < json['result']['episodes'].length; i++) {
                        if (json['result']['episodes'][i]['bvid']+'' === id){
                            aid = json['result']['episodes'][i]['aid'];
                            bvid = json['result']['episodes'][i]['bvid'];
                            rightBadge = json['result']['episodes'][i]['badge_info']['text'];
                            vtitle.push(json['result']['season_title']+'-'+json['result']['episodes'][i]['long_title']);
                            cids.push(json['result']['episodes'][i]['cid']);
                            found = true;
                            break;
                        }
                    }
                    if(!found){
                        for (let i = 0; i < json['result']['section'][0]['episodes'].length; i++) {
                            if (json['result']['section'][0]['episodes'][i]['bvid']+'' === id){
                                aid = json['result']['section'][0]['episodes'][i]['aid'];
                                bvid = json['result']['section'][0]['episodes'][i]['bvid'];
                                rightBadge = json['result']['episodes'][i]['badge_info']['text'];
                                vtitle.push(json['result']['season_title']+'-花絮-'+json['result']['section'][0]['episodes'][i]['long_title']);
                                cids.push(json['result']['section'][0]['episodes'][i]['cid']);
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found){
                        for (let i = 0; i < json['result']['section'][1]['episodes'].length; i++) {
                            if (json['result']['section'][1]['episodes'][i]['bvid']+'' === id){
                                aid = json['result']['section'][1]['episodes'][i]['aid'];
                                bvid = json['result']['section'][1]['episodes'][i]['bvid'];
                                rightBadge = json['result']['episodes'][i]['badge_info']['text'];
                                vtitle.push(json['result']['season_title']+'-二创-'+json['result']['section'][1]['episodes'][i]['long_title']);
                                cids.push(json['result']['section'][1]['episodes'][i]['cid']);
                                found = true;
                                break;
                            }
                        }
                    }
                }catch (e) {
                    console.log(e);
                }
                if (found){
                    getQn(cids[0], rightBadge===''||(rightBadge==='会员' && vip.vip > 0)?'':`<span class="rua-video-right-info">${rightBadge==='会员'?'此视频需要大会员':'您所在的地区无法观看本片'}。</span>`);
                }
            }
        });
    }

    /**
     * Determine the type of input vid.
     *
     * @param {string} str video tag.
     * @return {string} the query string for url.
     * */
    function abv(str){
        let headB = "AaBb";
        let headE = "Vv";
        if(headB.includes(str.charAt(0)) && headE.includes(str.charAt(1))){
            return headB.substr(0,2).includes(str.charAt(0))?"aid="+str.replace("av",""):"bvid="+str;
        }
    }

    /**
     * Determine the type of input bangumi id.
     *
     * @param {string} str bangumi tag.
     * @return {string} the query string for url.
     * */
    function sep(str){
        str = str.toUpperCase();
        if (str.substring(0,2)==='SS'){
            return 'season_id='+str.replace('SS','');
        }
        else if (str.substring(0,2)==='EP'){
            return 'ep_id='+str.replace('EP','');
        }
    }

    /**
     * Get the quality information, render the download buttons and video information.
     *
     * @param {string | number} cid the video file id for download.
     * @param {string} trayText the default text shown at the download section.
     * */
    function getQn(cid, trayText = ``){
        videoInfo.innerHTML = `<b style='user-select: none'>视频ID：</b><div style="display: flex; margin-left: -45px"><span>av${aid}</span><span style='user-select: none; margin: 0 2px'>/</span><span>cid:${cid}</span><span title="复制ID" class="rua-video-info-copy" id="rua-video-info-copy"><svg viewBox="0 0 400 400" width="18" height="18" style="position: absolute" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill='#aaa' mask='url(#rua-copy-mask)'/><mask id="rua-copy-mask"><rect x='150' y='40' rx="20" ry="20" width="200" height="280" style="fill:#fff" /><rect x="190" y="110" width="120" height="20" fill="black"/><rect x="190" y="160" width="120" height="20" fill="black"/><rect x="190" y="210" width="120" height="20" fill="black"/><rect x='55' y='75' rx="20" ry="20" width="200" height="280" style="fill:#000"/><rect x='50' y='80' rx="20" ry="20" width="200" height="280" style="fill:#fff"/><rect x="90" y="150" width="120" height="20" fill="black"/><rect x="90" y="200" width="120" height="20" fill="black"/><rect x="90" y="250" width="120" height="20" fill="black"/></mask></svg></span></div><div style="padding-right:5px; user-select: none;">${(pid-0+1)}p/${cids.length}p</div>`;
        document.getElementById('rua-video-info-copy').addEventListener('click', ()=>{
            copy(`av号: av${aid}\r\nBV号: ${bvid}\r\ncid: ${cid}`, '视频ID已复制到粘贴板', 'rua-video-info-copy', -75, 18);
        });
        removeListener();
        downloadVideoTray.innerHTML = trayText;
        videoDuration = 0;
        danmakuPoolSize = 0;
        danmakuArr = new DanmakuArr();
        danmakuSearchArr = new DanmakuArr();
        document.getElementById("rua-danmaku-search-input").value = "";
        while (danmakuArea.hasChildNodes()){
            danmakuArea.firstChild.onmousedown = null;
            danmakuArea.removeChild(danmakuArea.firstChild);
        }
        initPrint = true;
        // refresh components.

        fetch("https://api.bilibili.com/x/player/playurl?bvid="+bvid+"&cid="+cid+"&qn=120&type=flv&fourk=1",{
            method:"GET",
            credentials: 'include',
            body:null
        })
        .then(res => res.json())
        .then(async json => {
            if(json['code']===-404){
                danmakuTag.style.display = 'none';
                danmakuTray.style.display = 'none';
                downloadTag.style.display = 'none';
            }
            if(json["code"]===0){
                await chrome.runtime.sendMessage({ msg: "get_LoginStatus" }, function (vip){
                    vipStatus = vip;
                });
                await getDASH(cid, 125, 'hdr', 'HDR');
                await getDASH(cid, 127, '8k', '8K 超高清');
                await getDASH(cid, 120, '4kdash', '4K DASH');
                await getDASH(cid, 116, 'fhd60', '1080P 60');
                for (let i = 0; i < json["data"]["durl"].length; i++) {
                    videoDuration += json["data"]["durl"][i]["length"]-1+1;
                }
                for (let i = 0; i < json["data"]["support_formats"].length; i++) {
                    acceptQn[i] = {
                        "accept_description": json["data"]["support_formats"][i]['new_description'],
                        "accept_format": json["data"]["support_formats"][i]['quality']}
                    let rua_download_block = document.createElement("div");
                    rua_download_block.setAttribute("id","qn-"+acceptQn[i]["accept_format"]);
                    rua_download_block.classList.add("rua-download-block");
                    rua_download_block.innerHTML = `<div class='rua-quality-des' title='${acceptQn[i]["accept_description"]}'>${acceptQn[i]["accept_description"]}</div>`;
                    if((!vipStatus.login && (acceptQn[i]["accept_format"]-0)>63)||(vipStatus.login && vipStatus.vip===0 && (acceptQn[i]["accept_format"]-0)>80))
                        rua_download_block.classList.add("rua-download-block-disabled");
                    downloadVideoTray.appendChild(rua_download_block);
                    downloadBlocks.push(rua_download_block);
                    let abortSignal = new AbortController();
                    rua_download_block.onclick = () =>{
                        if(!rua_download_block.classList.contains('rua-downloading')){
                            abortSignal = new AbortController();
                            rua_download_block.classList.add('rua-downloading');
                            if (!rua_download_block.classList.contains("rua-download-block-disabled")) {
                                download(bvid, cid, json["data"]["accept_quality"][i], vtitle[0] + (vtitle.length === 1 ? "" : vtitle[pid + 1]) + " " + acceptQn[i]["accept_description"], rua_download_block, abortSignal);
                            }
                        }else{
                            abortSignal.abort('User');
                            releaseDownloadButton(rua_download_block);
                        }
                    }
                    abortHandler(rua_download_block);

                }
                downloadVideoTray.style.height = Math.ceil(downloadBlocks.length / 3) * 40 + "px";
                getAudioOnly(cid, true, true, true);
                grabDanmaku(cid, aid, 1, getDMSegments(videoDuration));
            }
        });
    }

    /**
     * Grad the availability information for audio.
     * Based on DASH.
     *
     * @param {string | number} cid the video file id for download.
     * @param {boolean} dolby request dolby atmos.
     * @param {boolean} audio request audio.
     * @param {boolean} hires request hires audio.
     * */
    function getAudioOnly(cid, dolby, audio, hires){
        fetch("https://api.bilibili.com/x/player/playurl?bvid="+bvid+"&cid="+cid+"&qn=120&fnval=272",{
            method:"GET",
            credentials: 'include',
            body:null
        })
        .then(res => res.json())
        .then(json => {
            if(json["code"]===0 && json["data"]!==null && json['data']['dash']!==null && json['data']['dash']!==undefined){
                try{
                    if(json["data"]["dash"]["flac"]['audio']['base_url']!==null && hires){
                        innerDownloadBlock(cid, 'flac', 'Hi-Res');
                    }
                }catch (e) {}
                if(json["data"]["dash"]["dolby"]['audio']!==null && dolby){
                    innerDownloadBlock(cid, 'dolby', '杜比全景声');
                }
                if(json["data"]["dash"]["audio"][0]["base_url"]!==null && audio){
                    innerDownloadBlock(cid, 'audio', 'Sound Only');
                }
            }
        });
    }

    /**
     * Grad the availability information for HDR or 8k video.
     * Based on DASH.
     *
     * @param {string | number} cid the video file id for download.
     * @param {number} qn request dolby atmos.
     * @param {string} type request audio.
     * @param {string} title the text shown on button.
     * */
    async function getDASH(cid, qn, type, title){
        await fetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${qn}&fourk=1&fnver=0&fnval=4048`,{
            method:'GET',
            credentials:'include',
            body:null
        })
            .then(res => res.json())
            .then(json => {
                if(json["code"]===0 && json["data"]!==null && json['data']['dash']!==null && json['data']['dash']!==undefined){
                    if (json['data']['dash']['video'][0]['id']===qn){
                        innerDownloadBlock(cid, type, title);
                    }
                }
            });
    }

    /**
     * Grab the stream information and render download buttons
     * for all request based on DASH protocol.
     *
     * @param {string | number} cid the video file id for download.
     * @param {string} type the request type [hdr, 8k, audio, dolby].
     * @param {string} title the text shown on button.
     * */
    function innerDownloadBlock(cid, type, title){
        const url = [`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=125&fnval=336`, `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=120&fnval=272`, `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=127&fourk=1&fnver=0&fnval=4048`];
        let rua_download = document.createElement("div");
        rua_download.setAttribute("id",`qn-${type}`);
        rua_download.classList.add("rua-download-block");
        rua_download.innerHTML = `<div class='rua-quality-des' title='${title}'>${title}</div>`;
        downloadVideoTray.appendChild(rua_download);
        downloadBlocks.push(rua_download);
        downloadVideoTray.style.height = Math.ceil(downloadBlocks.length / 3) * 40+"px";
        let abortSignal = new AbortController();
        rua_download.onclick = async () =>{
            if(!rua_download.classList.contains('rua-downloading')){
                abortSignal = new AbortController();
                rua_download.classList.add('rua-downloading');
                rua_download.getElementsByClassName("rua-quality-des")[0].innerText = `取流中...`;
                let dlURL = [];
                await fetch(type==='hdr'?url[0]:(type==='8k'?url[2]:url[1]),{
                    method:'GET',
                    credentials:'include',
                    body:null
                }).then(res => res.json())
                    .then(json =>{
                        if(json["code"]===0 && json["data"]!==null){
                            switch (type) {
                                case 'hdr':
                                    dlURL[0] = json['data']['dash']['video'][0]['base_url'];
                                    dlURL[1] = json['data']['dash']['dolby']===null?json['data']['dash']['audio'][0]['base_url']:json['data']['dash']['audio'][0]['base_url'];
                                    break;
                                case 'audio':
                                    dlURL[0] = json["data"]["dash"]["audio"][0]["base_url"]
                                    break;
                                case 'dolby':
                                    dlURL[0] = json["data"]["dash"]["dolby"]["audio"][0]["base_url"];
                                    break;
                                case 'flac':
                                    dlURL[0] = json['data']['dash']['flac']['audio']['base_url'];
                                    break;
                                case '8k':
                                    dlURL[0] = json['data']['dash']['video'][0]['base_url'];
                                    dlURL[1] = json['data']['dash']['dolby']===null?json['data']['dash']['audio'][0]['base_url']:json['data']['dash']['audio'][0]['base_url'];
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                await internalDownload(dlURL, vtitle[0]+(vtitle.length===1?"":" "+vtitle[pid+1]), cid, rua_download, type+'Record', true,abortSignal);
            }else{
                abortSignal.abort('User');
                releaseDownloadButton(rua_download);
            }
        }
        abortHandler(rua_download);
    }

    function abortHandler(DOMObject){
        DOMObject.onmouseenter = () =>{
            if(DOMObject.classList.contains('rua-downloading')){
                let text = DOMObject.getElementsByTagName('div')[0].innerText;
                DOMObject.getElementsByTagName('div')[0].innerText = '取消下载';
                DOMObject.onmouseleave = () =>{
                    if(DOMObject.classList.contains('rua-downloading'))
                        DOMObject.getElementsByTagName('div')[0].innerText = text;
                    DOMObject.onmouseleave = null;
                }
            }
        }
    }

    function releaseDownloadButton(DOMObject){
        DOMObject.getElementsByTagName('div')[0].innerText = DOMObject.getElementsByTagName('div')[0].getAttribute('title');
        DOMObject.removeAttribute('style');
        DOMObject.classList.remove('rua-downloading');
    }

    /**
     * Fetch the stream file information and download the media from File Stream to local disk.
     * Will check the file size first.
     *
     * If the media is using DASH protocol and the video file size smaller than 1.5GB then the video and soundtrack will
     * be combined by FFmpeg before download to local disk. (Hard limit in wasm)
     * Otherwise, download to local disk directly.
     *
     * @param {array} url the stream url.
     * @param {string} fileName the file name.
     * @param {string | number} cid the video file id for download.
     * @param {object} hostObj the DOM object for download button.
     * @param {string} requestType the media type.
     * @param {boolean} dashRequest the request type ?DASH
     * @param {AbortController} controller the abort controller for user cancel download.
     * */
    async function internalDownload(url, fileName, cid, hostObj, requestType, dashRequest = true, controller){
        let headerController = new AbortController();
        let fileSize = 0, hostItem = hostObj.getElementsByClassName("rua-quality-des")[0].getAttribute('title'), blobURL = [], audioMeta = {};
        function releaseDownload(){
            hostObj.removeAttribute("style");
            hostObj.classList.remove('rua-downloading');
            hostObj.getElementsByClassName("rua-quality-des")[0].innerText = hostItem;
            window.URL.revokeObjectURL(blobURL[0]);
            if (requestType === 'hdrRecord' || requestType==='8kRecord')
                window.URL.revokeObjectURL(blobURL[1]);
        }
        await fetch(url[0], {
            method:"GET",
            body: null,
            signal:headerController.signal
        }).then(response => {
            fileSize = response.headers.get("Content-Length");
            headerController.abort();
        });
        if(dashRequest){
            if(fileSize < 1.5 * 1024 * 1024 * 1024){
                blobURL[0] = await dash(url[0], hostObj, cid, hostItem, requestType==='hdrRecord'||requestType==='8kRecord'?'视频':'', true, controller);
                if((requestType==='hdrRecord' || requestType==='8kRecord')&&!controller.signal.aborted)
                    blobURL[1] = await dash(url[1], hostObj, cid, hostItem, '音频', true, controller);
                if(requestType==='audioRecord')
                    audioMeta = await getAudioMeta();
                if (!controller.signal.aborted)
                    encode(blobURL, fileName, requestType, audioMeta).then(r=>{
                        releaseDownload();
                    });
            }else{
                blobURL[0] = await dash(url[0], hostObj, cid, hostItem, requestType==='hdrRecord'||requestType==='8kRecord'?'视频':'', false, controller);
                aDownload(blobURL[0], fileName+".mp4");
                if((requestType==='hdrRecord' || requestType==='8kRecord')&&!controller.signal.aborted){
                    blobURL[1] = await dash(url[1], hostObj, cid, hostItem, '音频', false, controller);
                    aDownload(blobURL[1], fileName+".m4a");
                }
                releaseDownload();
            }
        }else{
            blobURL[0] = await dash(url[0], hostObj, cid, hostItem, requestType.includes(':')?'分段'+requestType.split(':')[1]:'视频', false, controller);
            aDownload(blobURL[0], fileName+".flv");
            releaseDownload();
        }

    }

    /**
     * Download from blob url by <a> tag.
     *
     * @param{string} blobURL the blob url.
     * @param{string} fileName the name of downloaded file.
     * */
    function aDownload(blobURL, fileName){
        if(typeof blobURL !== 'undefined' && !blobURL.includes('undefined')){
            const a = document.createElement("a");
            a.href = blobURL;
            a.target = '_blank';
            a.style.display = 'none';
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    /**
     * Combined the video and soundtrack or write the metadata
     * for sound only download.
     *
     * Using Fmpeg.
     *
     * @param {array} blob the blob urls. Should not longer than 2.
     * @param {string} filename the file name.
     * @param {string} requestType the request type. [audioRecord, dolbyRecord, hdrRecord, 8kRecord]
     * @param {object} metadata the metadata for sound download.
     * */
    async function encode(blob, filename, requestType, metadata){
        let out, downloadName, dl;
        const {createFFmpeg, fetchFile} = FFmpeg;
        const ffmpeg = createFFmpeg({
            corePath: wasmPath,
            mainName: 'main',
            log: false,
        });
        await ffmpeg.load();
        if(requestType === 'audioRecord'){
            ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(blob[0]));
            await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', '-metadata', `title=${utf8Encode(metadata.title)}`,'-metadata', `artist=${utf8Encode(metadata.artist)}`, '-metadata', `year=${metadata.year}`, 'final.m4a');
            out = ffmpeg.FS('readFile', 'final.m4a');
            downloadName = filename + ".m4a";
            dl = URL.createObjectURL(new Blob([out.buffer], {type: 'audio/mp4'}));
        }
        if(requestType === 'dolbyRecord'){
            ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(blob[0]));
            await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', 'final.mp4');
            out = ffmpeg.FS('readFile', 'final.mp4');
            downloadName = filename + ".mp4";
            dl = URL.createObjectURL(new Blob([out.buffer], {type: 'audio/mp4'}));
        }
        if(requestType === 'flacRecord'){
            ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(blob[0]));
            await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', 'final.flac');
            out = ffmpeg.FS('readFile', 'final.flac');
            downloadName = filename + ".flac";
            dl = URL.createObjectURL(new Blob([out.buffer]));
        }
        if(requestType === 'hdrRecord'  || requestType==='8kRecord'){
            ffmpeg.FS('writeFile', 'video.m4s', await fetchFile(blob[0]));
            ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(blob[1]));
            await ffmpeg.run('-i', 'video.m4s', '-i', 'audio.m4s', '-map', '0:v', '-map', '1:a','-c', 'copy', 'final.mkv');
            out = ffmpeg.FS('readFile', 'final.mkv');
            downloadName = filename + ".mkv";
            dl = URL.createObjectURL(new Blob([out.buffer]));
        }
        aDownload(dl, downloadName);
        window.URL.revokeObjectURL(dl);
    }

    function utf8Encode(str){
        let encoder = new TextEncoder('utf8');
        let bytes = encoder.encode(str);
        let result = '';
        for(let i = 0; i < bytes.length; ++i)
            result += String.fromCharCode(bytes[i]);
        return result;
    }

    /**
     * Grab metadata for soundtracks.
     * The metadata object contains: title: the video title shown as video page, artist: up, year: the year that video uploaded.
     *
     * @return {Promise} the Promise which contain the metadata object.
     * */
    async function getAudioMeta(){
        return fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            method: 'GET',
            credentials: 'include',
            body: null
        })
            .then(r => r.json())
            .then(json=>{
                if(json["code"]===0 && json["data"]!==null){
                    let staff = '';
                    if(json['data']['staff'] === null || json['data']['staff'] === undefined)
                        staff = json['data']['owner']['name'];
                    else{
                        for (let up of json['data']['staff']) staff += up['name']+', ';
                        staff = staff.slice(0, staff.length-2);
                    }
                    return {"title":json["data"]["title"], "artist":staff, "year":new Date((json["data"]["pubdate"]-1+1)*1000).getFullYear(), "cover":json["data"]["pic"]};
                }
                return null;
            })
            .catch(e=>{});
    }

    /**
     * Download function for DASH protocol.
     *
     * @param {string} url the url for media stream.
     * @param {object} hostObj the front-end object to show the progress.
     * @param {number | string} cid the id for the specific media segment.
     * @param {object} hostItem the front-end to the status text.
     * @param {string} dispTag the status text.
     * @param {boolean} encode indicate the media require encode or not.
     * @param {AbortController} controller the controller for user cancel download.
     *
     * @return {Promise} the blob url.
     * */
    async function dash(url, hostObj, cid, hostItem, dispTag, encode, controller){
        let size=0, get=0;
        return fetch(url,{
            method:"GET",
            body:null,
            signal: controller.signal
        })
            .then(response => {
                hostObj.getElementsByClassName("rua-quality-des")[0].innerText = `下载${dispTag}中...`;
                size = response.headers.get("Content-Length");
                return response.body;
            })
            .then(body => {
                const reader = body.getReader();
                return new Response(
                    new ReadableStream({
                        async start(controller){
                            return push();
                            function push() {
                                return reader.read().then(async res => {
                                    const {done, value} = res;
                                    if (done) {
                                        controller.close();
                                        if (encode) hostObj.getElementsByClassName("rua-quality-des")[0].innerText = "转码中...";
                                    }
                                    get += value.length || 0;
                                    setProgress(hostObj, (get/size) * 100);
                                    controller.enqueue(value);
                                    return push();
                                });
                            }
                        }
                    })
                ).blob();
            })
            .then(blob => window.URL.createObjectURL(blob))
            .catch(e =>{
                if(!controller.signal.aborted)
                    downloadError(hostObj, cid, e.toString(), false, hostItem);
            });
    }

    function setProgress(obj, progress){
        obj.setAttribute("style", "background: linear-gradient(to right, var(--bili-blue) 0%, var(--bili-blue) "+progress+"%, var(--bili-pink) "+progress+"%, var(--bili-pink));");
    }

    function downloadError(obj, cid, errMsg, decode, hostItem){
        console.log(errMsg);
        obj.classList.remove('rua-downloading');
        function errorClick(){
            obj.removeAttribute("style");
            obj.getElementsByClassName("rua-quality-des")[0].innerText = hostItem;
            obj.removeEventListener('click', errorClick);
        }
        obj.setAttribute("style","background: #ff4650;");
        //obj.setAttribute("title",errMsg);
        obj.getElementsByClassName("rua-quality-des")[0].innerText = decode?"转码失败":"下载失败";
        obj.addEventListener('click', errorClick);
    }

    /**
     * Grab the segments information.
     *
     * @param{string} vid the video id.
     * @param{number | string} cid the cid for the specific video segment.
     * @param{number | string} qn the quality indicator.
     * @param{string} fileName the name of downloaded file.
     * @param{object} hostObj the front-end object to show the progress.
     * @param {AbortController} controller the controller for user cancel download.
     * */
    function download(vid, cid, qn, fileName, hostObj, controller){
        hostObj.getElementsByClassName("rua-quality-des")[0].innerText = `取流中...`;
        fetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${qn}&type=flv&fourk=1`,{
            method:"GET",
            credentials:"include",
            body:null
        })
            .then(r=>r.json())
            .then(json=>{
                if(json['code']===0 && json['data']['durl']!==null)
                    downloadSegments(json["data"]["durl"], fileName, 0, json["data"]["durl"].length, cid, hostObj, controller);
            })
            .catch(e=>{
                console.log(e);
            });
    }

    function downloadSegments(durl, fileName, currentLocation, totalSize, cid, hostObj, controller){
        internalDownload([durl[currentLocation]["url"]],fileName+((totalSize>1)?'-s'+currentLocation:''), cid, hostObj, 'video'+((totalSize>1)?':'+currentLocation:''), false, controller).then(r=>{
            currentLocation=currentLocation+1;
            if(currentLocation<totalSize){
                downloadSegments(durl, fileName, currentLocation, totalSize, cid, hostObj, controller);
            }
        });
        //chrome.runtime.sendMessage({msg:"requestDownload", url: durl[currentLocation]["url"], fileName:(fileName+(durl.length===1?"":"_p"+currentLocation))+new URL(durl[currentLocation]["url"])["pathname"].toString().substring(new URL(durl[currentLocation]["url"])["pathname"].toString().length-4,new URL(durl[currentLocation]["url"])["pathname"].toString().length)},(callback)=>{});
    }

    function removeListener(){
        for (let i = 0; i < downloadBlocks.length; i++) {downloadBlocks[i].onclick = null;}
        downloadBlocks = [];
    }

    /**
     * Danmaku section
     * */
    function grabDanmaku(cid, aid, segment, totalSegment){
        fetch("https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid="+cid+"&pid="+aid+"&segment_index="+segment, {
            method:"GET",
            credentials: 'include',
            body: null
        })
            .then(result=>result.arrayBuffer())
            .then(ab=>{
            const u8 = new Uint8Array(ab);
            chrome.runtime.sendMessage({msg: "requestDanmaku", danmakuObj: $root.bilibili.community.service.dm.v1.DmSegMobileReply.decode(u8)["elems"]}, function (callback){
                //danmakuArea.innerHTML += callback.danmakuContent;
                danmakuArr.concat(callback.danmakuContent);
                danmakuSearchArr.concat(callback.danmakuContent);
                danmakuPoolSize+=callback.danmakuPoolSize;
                document.getElementById("rua-danmaku-size").innerText = "共"+ danmakuPoolSize + " 弹幕";
                document.getElementById("rua-input-container").setAttribute("style", `width: ${calculateStringLength(danmakuPoolSize+"")}px`);
                danmakuArea.style.height = danmakuSearchArr.size * 20 +"px";

                if (initPrint){
                    for (let i = 0; i < 20; i++){
                        if(!findId(danmakuArea, "rua-danmaku-content","rua-danmaku-"+i) && i<danmakuSearchArr.size && danmakuSearchArr.get(i).look)
                            danmakuArea.appendChild(drawDanmaku(danmakuSearchArr.get(i).time, danmakuSearchArr.get(i).content, danmakuSearchArr.get(i).mid, i));
                    }
                    initPrint = danmakuSearchArr.size<20;
                }
                if(segment===totalSegment){
                    document.getElementById('rua-danmaku-download').setAttribute('style', '');
                    document.getElementById('rua-danmaku-download').innerText = '弹幕下载';
                    assConvert.setTitle(vtitle[0]+(vtitle.length===1?"":vtitle[pid+1]));
                }
            });

            if(segment<totalSegment){
                segment++;
                grabDanmaku(cid, aid, segment, totalSegment);
            }
        }).catch(error=>{console.log(error)});
    }

    function getDMSegments(duration){
        return Math.ceil(duration / 360000);
    }

    danmakuTray.onscroll = function (e){
        if(danmakuSearchArr.size>=20){
            updateDanmaku(e.target.scrollTop);
        }
    }

    document.getElementById("rua-danmaku-search-input").addEventListener("focus", ()=>{
        document.getElementById("rua-danmaku-search-input").style.borderColor = "#23ade5";
    });
    document.getElementById("rua-danmaku-search-input").addEventListener("blur", ()=>{
        document.getElementById("rua-danmaku-search-input").style.borderColor = "#aaa";
    });
    document.getElementById("rua-danmaku-search-input").addEventListener("input", (e)=>{
        danmakuSearchArr = danmakuArr.find(e.target.value);
        danmakuArea.style.height = danmakuSearchArr.size * 20 +"px";
        danmakuArea.scrollTop = 0;
        updateDanmaku(0);
    });

    let searchClick = false;
    document.getElementById("rua-danmaku-search").onclick = ()=>{
        if(searchClick){
            searchClick = false;
            document.getElementById("rua-danmaku-search-input").classList.remove("rua-danmaku-search-in");
            document.getElementById("rua-danmaku-search-input").classList.add("rua-danmaku-search-out");
            setTimeout(()=>{
                document.getElementById("rua-danmaku-search-input").style.display = "none";
            }, 800);
        }else{
            searchClick = true;
            document.getElementById("rua-danmaku-search-input").style.display = "block";
            document.getElementById("rua-danmaku-search-input").classList.remove("rua-danmaku-search-out");
            document.getElementById("rua-danmaku-search-input").classList.add("rua-danmaku-search-in");
        }
    }

    function updateDanmaku(position){
        let disposeLengthTop = Math.floor(position / 20) - 5;
        while (danmakuArea.hasChildNodes()){
            danmakuArea.firstChild.onmousedown = null;
            danmakuArea.removeChild(danmakuArea.firstChild);
        }
        for (let i = 0; i < 25; i++) {
            if(danmakuSearchArr.get(disposeLengthTop+i)!==undefined){
                danmakuArea.appendChild(drawDanmaku(danmakuSearchArr.get(i+disposeLengthTop).time, danmakuSearchArr.get(i+disposeLengthTop).content, danmakuSearchArr.get(i+disposeLengthTop).mid,i+disposeLengthTop));
            }
        }
    }

    function drawDanmaku(time, content, mid, index){
        const div = document.createElement("div");
        const spanTime = document.createElement("span");
        const spanContent = document.createElement("span");
        const spanCopy = document.createElement("span");
        const timearr = time.split(":");
        const timetable = [1,60,3600];
        let jumpTo = 0;
        for (let i = timearr.length-1; i >= 0; i--) {
            jumpTo += (timearr[timearr.length-1-i]-1+1) * timetable[i];
        }
        div.setAttribute("title", content);
        div.setAttribute("id", "rua-danmaku-"+index);
        div.style.top = index * 20 + "px";
        div.classList.add("rua-danmaku-content");
        spanTime.setAttribute("class", "seek-video rua-danmaku-time");
        spanTime.setAttribute("data-time",jumpTo);
        spanTime.innerText=time;
        div.appendChild(spanTime);
        spanContent.classList.add("rua-danmaku");
        spanContent.innerText=content;
        div.appendChild(spanContent);
        spanCopy.classList.add("rua-danmaku-copy");
        spanCopy.innerText="复制";
        div.appendChild(spanCopy);

        spanTime.onclick = e => {
            document.getElementsByTagName('video')[0].currentTime = jumpTo;
        }
        spanContent.onmousedown = function (e){
            if(e.button === 0)
                drawUserInfoDanmaku(document.body, mid, selec.style.left.replace("px","")-1+1,e.clientY-140, index);
        }
        spanCopy.onmousedown = function (e){
            copy(spanContent.innerText, '弹幕已复制到粘贴板', `rua-danmaku-${index}`, -200, -danmakuTray.scrollTop-18);
        }
        return div;
    }

    async function drawUserInfoDanmaku(parent, mid, posX, posY, index){
        const bg = document.createElement("div");
        bg.setAttribute("class", "rua-danmaku-user-info");
        bg.setAttribute("style", "top:"+posY+"px;"+"left:"+posX+"px;")
        const div = document.createElement("div");
        div.setAttribute("class", "rua-danmaku-user-host");
        //div.innerText = mid;
        const controlBar = document.createElement("div");
        controlBar.setAttribute("id", "rua-user-control-bar");
        controlBar.innerHTML = "<b style=\"padding-left: 20px;\">用户信息</b>";

        const controlBtn = document.createElement("div");
        controlBtn.setAttribute("style","position: absolute; top: 2px; left: 280px; width: 14px; height: 14px;");
        controlBtn.innerHTML = "<svg width=\"14\" height=\"14\"><circle cx=\"7\" cy=\"7\" r=\"7\" fill=\"#f16c59\"/><line class=\"rua-cross\" x1=\"4\" y1=\"4\" x2=\"10.5\" y2=\"10.5\" style=\"stroke:#ff5e57;stroke-width:1\"/><line class=\"rua-cross\" x1=\"10.5\" y1=\"4\" x2=\"4\" y2=\"10.5\" style=\"stroke:#ff5e57;stroke-width:1\"/></svg>"

        controlBar.appendChild(controlBtn);

        if(document.body.getElementsByClassName("rua-danmaku-user-info").length>0){
            controlBtn.onmouseenter = null;
            controlBtn.onmouseleave = null;
            controlBtn.onmousedown = null;
            document.getElementById("app").onmousedown = null;
            for (let i = 0; i < document.body.getElementsByClassName("rua-danmaku-user-info").length; i++) {
                document.body.removeChild(document.body.getElementsByClassName("rua-danmaku-user-info")[i]);
            }
        }

        controlBtn.onmouseenter = () =>{
            for (let i = 0; i < controlBtn.getElementsByClassName("rua-cross").length; i++) {
                controlBtn.getElementsByClassName("rua-cross")[i].style.stroke = "#A0000A";
            }
        }
        controlBtn.onmouseleave = () =>{
            for (let i = 0; i < controlBtn.getElementsByClassName("rua-cross").length; i++) {
                controlBtn.getElementsByClassName("rua-cross")[i].style.stroke = "#ff5e57";
            }
        }
        controlBtn.onmousedown = (e) =>{
            if(e.button === 0){
                controlBtn.onmouseenter = null;
                controlBtn.onmouseleave = null;
                controlBtn.onmousedown = null;
                document.getElementById("app").onmousedown = null;
                parent.removeChild(bg);
            }
        }
        const userHost = document.createElement("div");
        userHost.setAttribute("id", "rua-user-host");
        userHost.classList.add("emoji_sec");

        chrome.runtime.sendMessage({msg:'requestCrackUID', mid:mid}, r=>{
            for (let i = 0; i < r.response.length; i++) {
                chrome.runtime.sendMessage({msg:"requestUserInfo", mid:r.response[i]}, (callback)=>{
                    if(callback.response['fans']!==0 || callback.response['friend']!==0 || typeof r.response !=='undefined'){
                        const user = document.createElement("div");
                        user.setAttribute("class", "rua-user");
                        const face = document.createElement("a");
                        const faceIcon = document.createElement("img");
                        face.href = "https://space.bilibili.com/"+r.response[i];
                        face.target = "_Blank";
                        face.setAttribute("class","rua-user-avatar");
                        faceIcon.classList.add("bili-avatar-img");
                        faceIcon.setAttribute("src", callback.response["face"].replace("http://","https://"));
                        face.appendChild(faceIcon);
                        user.appendChild(face);

                        const name = document.createElement("div");
                        name.setAttribute("style", "padding-left: 50px; padding-top: 9px;min-width: 100px;");
                        const nameLink = document.createElement("a");
                        nameLink.href = "https://space.bilibili.com/"+r.response[i];
                        nameLink.target = "_Blank";
                        const uname = document.createElement("b");
                        uname.innerText=callback.response["name"];
                        const uid = document.createElement("a");
                        uid.href = "https://space.bilibili.com/"+r.response[i];
                        uid.target = "_Blank";
                        uid.innerText = "uid: "+r.response[i];

                        const white = document.createElement("br");
                        nameLink.appendChild(uname);
                        name.appendChild(nameLink);
                        name.appendChild(white);
                        name.appendChild(uid);
                        user.appendChild(name);

                        userHost.appendChild(user);
                    }
                });
            }

            div.appendChild(controlBar);
            div.appendChild(userHost);

            bg.appendChild(div);
            parent.appendChild(bg);
            document.getElementById("app").onmousedown = () =>{
                controlBtn.onmouseenter = null;
                controlBtn.onmouseleave = null;
                controlBtn.onmousedown = null;
                document.getElementById("app").onmousedown = null;
                parent.removeChild(bg);
            }
        });
    }

    function findId(DOMObj, className, idName){
        for (let i = 0; i < DOMObj.getElementsByClassName(className).length; i++) {
            if (DOMObj.getElementsByClassName(className)[i].id===idName) return true;
        }
        return false;
    }
}();

//todo: code review
//todo: 720p and 480p DASH protocol stream.
