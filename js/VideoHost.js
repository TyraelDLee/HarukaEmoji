/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
    var vid = window.location["pathname"].replaceAll("/", "").replace("video","");// id for current page, av or bv.
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
    var wavFile = false;
    chrome.storage.sync.get(["wav"], function(result){wavFile = result.wav});
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            if(key === "wav") wavFile = newValue;
        }
    });

    var WINDOW_HEIGHT;
    var WINDOW_WIDTH;
    var initWidth = window.innerWidth;
    var labFeatures=[];
    var zoomFactor = 1.0;
    new MutationObserver(()=>{
        const p = new URLSearchParams(window.location["search"]).get("p")-1;
        const nvid = window.location["pathname"].replaceAll("/", "").replace("video","");
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
    videoInfo.setAttribute("style","float: left; padding-left:5px");
    videoInfoSec.appendChild(videoInfo);
    const pInfo = document.createElement("span");
    pInfo.setAttribute("style", "float: right; padding-right:5px; user-select: none;");
    videoInfoSec.appendChild(pInfo);

    const danmakuTray = document.createElement("div");
    danmakuTray.setAttribute("id","rua-danmaku");
    danmakuTray.classList.add("emoji_sec");

    const danmakuTag = document.createElement("div");
    danmakuTag.setAttribute("style", "width: 300px; position: fixed; background: #fff");
    danmakuTag.innerHTML = "<div style='float: left; padding-left: 5px; user-select: none;'><b>弹幕：</b></div><div style='float: right; padding-right: 5px; user-select: none;' id='rua-danmaku-size'>共"+ danmakuPoolSize + " 弹幕</div><div style='float: right; padding-right: 5px;user-select: none;cursor: pointer' id='rua-danmaku-search' title='查询弹幕内容'><svg width='18' height='18' viewBox='0 0 18 18' xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"8\" cy=\"8\" r=\"5\" style=\"stroke:#aaa;stroke-width:2; fill: none\"/><line x1=\"11.5\" y1=\"11.5\" x2=\"15\" y2=\"15\" style=\"stroke:#aaa;stroke-width:2\" /></svg></div><textarea id='rua-danmaku-search-input' class='rua-danmaku-search-out' style='display: none' placeholder='输入要查询的弹幕内容'></textarea>";
    const danmakuArea = document.createElement("div");
    danmakuArea.style.position = "relative";
    danmakuTray.appendChild(danmakuArea);


    const downloadTray = document.createElement("div");
    downloadTray.setAttribute("id","rua-download");
    downloadTray.classList.add("emoji_sec");

    const downloadTag = document.createElement("div");
    downloadTag.setAttribute("style", "width: 290px; position: fixed; background: #fff");
    downloadTag.innerHTML = "<div style='float: left; user-select: none; padding-left: 5px'><b>视频下载：</b></div>";

    const downloadVideoTray = document.createElement("div");
    downloadVideoTray.setAttribute("style", "margin: 0 0 0 15px;");
    downloadTray.appendChild(downloadVideoTray);

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
    }

    function isMoved(oX, oY, cX, cY){return Math.abs(oX - cX) === 0 && Math.abs(oY - cY) === 0;}

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
        let pos = getAbsLocation("danmukuBox");
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
    /**
     * Popup UI render section end.
     * */

    /**
     * Download section
     * */
    function getQn(cid){
        videoInfo.innerHTML = "<b style='user-select: none'>视频ID：</b> "+ "<span>av" + aid + "</span><span style='user-select: none'> / </span><span>"+bvid + "</span>";
        pInfo.innerText = (pid-1+2)+ "p/"+cids.length+"p";
        removeListener();
        downloadVideoTray.innerHTML = "";
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

        $.ajax({
            url: "https://api.bilibili.com/x/player/playurl?bvid="+bvid+"&cid="+cid+"&qn=120&type=flv&fourk=1",
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                if(json["code"]===0){
                    for (let i = 0; i < json["data"]["durl"].length; i++) {
                        videoDuration += json["data"]["durl"][i]["length"]-1+1;
                    }
                    for (let i = 0; i < json["data"]["accept_quality"].length; i++) {
                        acceptQn[json["data"]["accept_quality"][i]] = {
                            "accept_description": json["data"]["accept_description"][i],
                            "accept_format": json["data"]["accept_format"].split(",")[i]}
                        let rua_download_block = document.createElement("div");
                        rua_download_block.setAttribute("id","qn-"+json["data"]["accept_quality"][i]);
                        rua_download_block.classList.add("rua-download-block");
                        rua_download_block.innerHTML = "<div class='rua-quality-des'>"+acceptQn[json["data"]["accept_quality"][i]]["accept_description"]+"</div>";
                        downloadVideoTray.appendChild(rua_download_block);
                        downloadBlocks.push(rua_download_block);
                        rua_download_block.onclick = () =>{
                            download(bvid, cid, json["data"]["accept_quality"][i], vtitle[0]+(vtitle.length===1?"":vtitle[pid+1])+" "+json["data"]["accept_description"][i]);
                        }
                    }
                    downloadVideoTray.style.height = Math.ceil(downloadBlocks.length / 3) * 40 + "px";
                    getAudioOnly(cid);
                    grabDanmaku(cid, aid, 1, getDMSegments(videoDuration));
                }
            }
        });
    }

    function getAudioOnly(cid){
        $.ajax({
            url: "https://api.bilibili.com/x/player/playurl?bvid="+bvid+"&cid="+cid+"&qn=120&fnval=16",
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                if(json["code"]===0 && json["data"]!==null){
                    if(json["data"]["dash"]["audio"][0]["baseUrl"]!==null){
                        let rua_download_block = document.createElement("div");
                        rua_download_block.setAttribute("id","qn-sound");
                        rua_download_block.classList.add("rua-download-block");
                        rua_download_block.innerHTML = "<div class='rua-quality-des'>Sound Only</div>";
                        downloadVideoTray.appendChild(rua_download_block);
                        downloadBlocks.push(rua_download_block);
                        downloadVideoTray.style.height = Math.ceil(downloadBlocks.length / 3) * 40+"px";
                        rua_download_block.onclick = () =>{
                            wavFile&&json["data"]["timelength"]<3600000?getAudioOnlyWav(json["data"]["dash"]["audio"][0]["baseUrl"], vtitle[0]+(vtitle.length===1?"":" "+vtitle[pid+1]), cid):getAudioOnlyRaw(json["data"]["dash"]["audio"][0]["baseUrl"]);
                        }
                    }
                }
            }
        });
    }

    function getAudioOnlyRaw(url){
        url += "&requestFrom=ruaDL";
        chrome.runtime.sendMessage({msg:"requestDownload", fileName:(vtitle[0]+(vtitle.length===1?"":" "+vtitle[pid+1]))});
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.target = "_Blank";
        a.referrerPolicy = "unsafe-url";
        a.download;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function getAudioOnlyWav(url, fileName, cid){
        let hostObj = downloadBlocks[downloadBlocks.length-1];
        hostObj.onclick = null;
        let size=0, get=0;
        hostObj.removeAttribute("title");
        fetch(url,{
            method:"GET",
            body:null
        })
        .then(response => {
            hostObj.getElementsByClassName("rua-quality-des")[0].innerText = "下载中...";
            size = response.headers.get("Content-Length");
            return response.body;
        })
        .then(body => {
            const reader = body.getReader();
            return new Response(
                new ReadableStream({
                    start(controller){
                        return push();
                        function push() {
                            return reader.read().then(res => {
                                const {done, value} = res;
                                if (done) {
                                    controller.close();
                                    hostObj.getElementsByClassName("rua-quality-des")[0].innerText = "转码中...";
                                }
                                get += value.length || 0;
                                setProgress(hostObj, (get/size) * 100);
                                controller.enqueue(value);
                                return push();
                            });
                        }
                    }
                })
            ).arrayBuffer();
        })
        .then(arrayBuffer=>{
            new AudioContext().decodeAudioData(arrayBuffer, (audioBuffer) => {
                const url = window.URL.createObjectURL(bufferToWave(audioBuffer, audioBuffer.length));
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName + ".wav";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                hostObj.removeAttribute("style");
                hostObj.removeAttribute("title");
                hostObj.getElementsByClassName("rua-quality-des")[0].innerText = "Sound Only";
                renewSoundDLObj(hostObj, cid);
            }).catch(e => {
                downloadError(hostObj, cid, "请在设置中关闭音频转码后重试。",true);
            });
        })
        .catch(e =>{
            downloadError(hostObj, cid, e.toString(), false);
        });
    }

    function setProgress(obj, progress){
        obj.setAttribute("style", "background: linear-gradient(to right, #23ade5 0%, #23ade5 "+progress+"%, #fb7299 "+progress+"%, #fb7299);");
    }

    function downloadError(obj, cid, errMsg, decode){
        console.log(errMsg);
        obj.setAttribute("style","background: #ff4650;");
        obj.setAttribute("title",errMsg);
        obj.getElementsByClassName("rua-quality-des")[0].innerText = decode?"转码失败":"下载失败";
        obj.onclick = () => {
            obj.onclick = null;
            renewSoundDLObj(obj, cid);
        }
    }

    function renewSoundDLObj(obj, cid){
        obj.removeAttribute("title");
        obj.onclick = null;
        downloadBlocks.splice(downloadBlocks.length-1,1);
        getAudioOnly(cid);
        obj.parentElement.removeChild(obj);
    }

    function bufferToWave(audioBuffer, len) {
        let length = len * audioBuffer.numberOfChannels * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample,
            offset = 0,
            pos = 0;

        setUint32(0x46464952);
        setUint32(length - 8);
        setUint32(0x45564157);
        setUint32(0x20746d66);
        setUint32(16);
        setUint16(1);
        setUint16(audioBuffer.numberOfChannels);
        setUint32(audioBuffer.sampleRate);
        setUint32(audioBuffer.sampleRate * 2 * audioBuffer.numberOfChannels);
        setUint16(audioBuffer.numberOfChannels * 2);
        setUint16(16);
        setUint32(0x61746164);
        setUint32(length - pos - 4);

        for(i = 0; i < audioBuffer.numberOfChannels; i++)
            channels.push(audioBuffer.getChannelData(i));

        while(pos < length) {
            for(i = 0; i < audioBuffer.numberOfChannels; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++
        }

        return new Blob([buffer], {type: "audio/wav"});

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }

    grabVideoInfo();
    function grabVideoInfo(){
        pid = pid<0?0:pid;
        cids = [];
        vtitle = [];
        $.ajax({
            url: "https://api.bilibili.com/x/web-interface/view?"+abv(vid),
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {

                if(json["code"]===0){
                    aid = json["data"]["aid"];
                    bvid = json["data"]["bvid"];
                    vtitle.push(json["data"]["title"]);
                    for (let i = 0; i < json["data"]["pages"].length; i++) {
                        cids.push(json["data"]["pages"][i]["cid"]);
                        if(json["data"]["pages"].length>1)vtitle.push(json["data"]["pages"][i]["part"]);
                    }
                    getQn(cids[pid]);
                }
            }
        });
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

    function download(vid, cid, qn, fileName){
        let grabDownloadURL = new XMLHttpRequest();
        grabDownloadURL.withCredentials = true;
        grabDownloadURL.open("GET","https://api.bilibili.com/x/player/playurl?bvid="+bvid+"&cid="+cid+"&qn="+qn+"&type=flv&fourk=1");
        grabDownloadURL.send(null);
        grabDownloadURL.onload = function (e){
            if(grabDownloadURL.status===200) {
                if(JSON.parse(grabDownloadURL.responseText)["code"]===0 && JSON.parse(grabDownloadURL.responseText)["data"]["durl"]!==null){
                    downloadSegments(JSON.parse(grabDownloadURL.responseText)["data"]["durl"], fileName, 0, JSON.parse(grabDownloadURL.responseText)["data"]["durl"].length);
                }
            }
        }
    }

    function downloadSegments(durl, fileName, currentLocation, totalSize){
        const url = durl[currentLocation]["url"]+"&requestFrom=ruaDL";
        chrome.runtime.sendMessage({msg:"requestDownload", fileName:(fileName+(durl.length===1?"":"_p"+currentLocation))});
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.target = "_Blank";
        a.referrerPolicy = "unsafe-url";
        a.download;
        a.click();
        document.body.removeChild(a);
        currentLocation=currentLocation+1;
        if(currentLocation<totalSize){
            setTimeout(()=>{
                downloadSegments(durl, fileName, currentLocation, totalSize);
            }, 2000);
        }
    }

    function removeListener(){
        for (let i = 0; i < downloadBlocks.length; i++) {downloadBlocks[i].onclick = null;}
        downloadBlocks = [];
    }

    function abv(str){
        let headB = "AaBb";
        let headE = "Vv";
        if(headB.includes(str.charAt(0)) && headE.includes(str.charAt(1))){
            return headB.substr(0,2).includes(str.charAt(0))?"aid="+str.replace("av",""):"bvid="+str;
        }
    }

    /**
     * Danmaku section
     * */
    function grabDanmaku(cid, aid, segment, totalSegment){
        fetch("https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid="+cid+"&pid="+aid+"&segment_index="+segment, {
            method:"GET",
            credentials: 'include',
            body: null
        }).then(result=>{
            return result.arrayBuffer();
        }).then(ab=>{
            const u8 = new Uint8Array(ab);
            const root = protobuf.Root.fromJSON(dmObj);
            var DMMessage = root.lookupType("bilibili.community.service.dm.v1.DmSegMobileReply");
            chrome.runtime.sendMessage({msg: "requestDanmaku", danmakuObj: DMMessage.decode(u8)["elems"]}, function (callback){
                //danmakuArea.innerHTML += callback.danmakuContent;
                danmakuArr.concat(callback.danmakuContent);
                danmakuSearchArr.concat(callback.danmakuContent);
                danmakuPoolSize+=callback.danmakuPoolSize;
                document.getElementById("rua-danmaku-size").innerText = "共"+ danmakuPoolSize + " 弹幕";
                danmakuArea.style.height = danmakuSearchArr.size * 20 +"px";

                if (initPrint){
                    for (let i = 0; i < 20; i++){
                        if(!findId(danmakuArea, "rua-danmaku-content","rua-danmaku-"+i) && i<danmakuSearchArr.size && danmakuSearchArr.get(i).look)
                            danmakuArea.appendChild(drawDanmaku(danmakuSearchArr.get(i).time, danmakuSearchArr.get(i).content, danmakuSearchArr.get(i).mid, i));
                    }
                    initPrint = danmakuSearchArr.size<20;
                }
            });

            if(segment<totalSegment){
                segment++;
                grabDanmaku(cid, aid, segment, totalSegment);
            }
        }).catch(error=>{});
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

        div.onmousedown = function (e){
            if(e.button === 0)
                drawUserInfoDanmaku(document.body, mid, selec.style.left.replace("px","")-1+1,e.clientY-140, index);
        }
        return div;
    }

    function drawUserInfoDanmaku(parent, mid, posX, posY, index){
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
        controlBtn.innerHTML = "<svg width=\"14\" height=\"14\"><circle cx=\"7\" cy=\"7\" r=\"7\" fill=\"#f16c59\"/><line class=\"rua-cross\" x1=\"4\" y1=\"4\" x2=\"10.5\" y2=\"10.5\" style=\"stroke:#f16c59;stroke-width:1\"/><line class=\"rua-cross\" x1=\"10.5\" y1=\"4\" x2=\"4\" y2=\"10.5\" style=\"stroke:#f16c59;stroke-width:1\"/></svg>"

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
                controlBtn.getElementsByClassName("rua-cross")[i].style.stroke = "#f16c59";
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
        for (let i = 0; i < mid.length; i++) {
            chrome.runtime.sendMessage({msg:"requestUserInfo", mid:mid[i]}, (callback)=>{
                const user = document.createElement("div");
                user.setAttribute("class", "rua-user");
                const face = document.createElement("a");
                const faceIcon = document.createElement("img");
                face.href = "https://space.bilibili.com/"+mid[i];
                face.target = "_Blank";
                face.setAttribute("class","rua-user-avatar");
                faceIcon.classList.add("bili-avatar-img");
                faceIcon.setAttribute("src", callback.response["face"].replace("http://","https://"));
                face.appendChild(faceIcon);
                user.appendChild(face);

                const name = document.createElement("div");
                name.setAttribute("style", "padding-left: 50px; padding-top: 9px;min-width: 100px;");
                const nameLink = document.createElement("a");
                nameLink.href = "https://space.bilibili.com/"+mid[i];
                nameLink.target = "_Blank";
                const uname = document.createElement("b");
                uname.innerText=callback.response["name"];
                const uid = document.createElement("a");
                uid.href = "https://space.bilibili.com/"+mid[i];
                uid.target = "_Blank";
                uid.innerText = "uid: "+mid[i];

                const white = document.createElement("br");
                nameLink.appendChild(uname);
                name.appendChild(nameLink);
                name.appendChild(white);
                name.appendChild(uid);
                user.appendChild(name);

                userHost.appendChild(user);
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
    }

    function findId(DOMObj, className, idName){
        for (let i = 0; i < DOMObj.getElementsByClassName(className).length; i++) {
            if (DOMObj.getElementsByClassName(className)[i].id===idName) return true;
        }
        return false;
    }
}();


const dmObj = {
    "nested": {
        "bilibili": {
            "nested": {
                "community": {
                    "nested": {
                        "service": {
                            "nested": {
                                "dm": {
                                    "nested": {
                                        "v1": {
                                            "nested": {
                                                "DM": {
                                                    "methods": {
                                                        "DmSegMobile": {
                                                            "requestType": "DmSegMobileReq",
                                                            "responseType": "DmSegMobileReply"
                                                        },
                                                        "DmView": {
                                                            "requestType": "DmViewReq",
                                                            "responseType": "DmViewReply"
                                                        },
                                                        "DmPlayerConfig": {
                                                            "requestType": "DmPlayerConfigReq",
                                                            "responseType": "Response"
                                                        },
                                                        "DmSegOtt": {
                                                            "requestType": "DmSegOttReq",
                                                            "responseType": "DmSegOttReply"
                                                        },
                                                        "DmSegSDK": {
                                                            "requestType": "DmSegSDKReq",
                                                            "responseType": "DmSegSDKReply"
                                                        }
                                                    }
                                                },
                                                "DmSegSDKReq": {
                                                    "fields": {
                                                        "pid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "oid": {
                                                            "type": "int64",
                                                            "id": 2
                                                        },
                                                        "type": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "segmentIndex": {
                                                            "type": "int64",
                                                            "id": 4
                                                        }
                                                    }
                                                },
                                                "DmSegSDKReply": {
                                                    "fields": {
                                                        "closed": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "elems": {
                                                            "rule": "repeated",
                                                            "type": "DanmakuElem",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "DmSegOttReq": {
                                                    "fields": {
                                                        "pid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "oid": {
                                                            "type": "int64",
                                                            "id": 2
                                                        },
                                                        "type": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "segmentIndex": {
                                                            "type": "int64",
                                                            "id": 4
                                                        }
                                                    }
                                                },
                                                "DmSegOttReply": {
                                                    "fields": {
                                                        "closed": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "elems": {
                                                            "rule": "repeated",
                                                            "type": "DanmakuElem",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "DmSegMobileReq": {
                                                    "fields": {
                                                        "pid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "oid": {
                                                            "type": "int64",
                                                            "id": 2
                                                        },
                                                        "type": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "segmentIndex": {
                                                            "type": "int64",
                                                            "id": 4
                                                        },
                                                        "teenagersMode": {
                                                            "type": "int32",
                                                            "id": 5
                                                        }
                                                    }
                                                },
                                                "DmSegMobileReply": {
                                                    "fields": {
                                                        "elems": {
                                                            "rule": "repeated",
                                                            "type": "DanmakuElem",
                                                            "id": 1
                                                        },
                                                        "state": {
                                                            "type": "int32",
                                                            "id": 2
                                                        },
                                                        "aiFlag": {
                                                            "type": "DanmakuAIFlag",
                                                            "id": 3
                                                        }
                                                    }
                                                },
                                                "DmViewReq": {
                                                    "fields": {
                                                        "pid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "oid": {
                                                            "type": "int64",
                                                            "id": 2
                                                        },
                                                        "type": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "spmid": {
                                                            "type": "string",
                                                            "id": 4
                                                        },
                                                        "isHardBoot": {
                                                            "type": "int32",
                                                            "id": 5
                                                        }
                                                    }
                                                },
                                                "DmViewReply": {
                                                    "fields": {
                                                        "closed": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "mask": {
                                                            "type": "VideoMask",
                                                            "id": 2
                                                        },
                                                        "subtitle": {
                                                            "type": "VideoSubtitle",
                                                            "id": 3
                                                        },
                                                        "specialDms": {
                                                            "rule": "repeated",
                                                            "type": "string",
                                                            "id": 4
                                                        },
                                                        "aiFlag": {
                                                            "type": "DanmakuFlagConfig",
                                                            "id": 5
                                                        },
                                                        "playerConfig": {
                                                            "type": "DanmuPlayerViewConfig",
                                                            "id": 6
                                                        },
                                                        "sendBoxStyle": {
                                                            "type": "int32",
                                                            "id": 7
                                                        },
                                                        "allow": {
                                                            "type": "bool",
                                                            "id": 8
                                                        },
                                                        "checkBox": {
                                                            "type": "string",
                                                            "id": 9
                                                        },
                                                        "checkBoxShowMsg": {
                                                            "type": "string",
                                                            "id": 10
                                                        },
                                                        "textPlaceholder": {
                                                            "type": "string",
                                                            "id": 11
                                                        },
                                                        "inputPlaceholder": {
                                                            "type": "string",
                                                            "id": 12
                                                        },
                                                        "reportFilterContent": {
                                                            "rule": "repeated",
                                                            "type": "string",
                                                            "id": 13
                                                        }
                                                    }
                                                },
                                                "DmWebViewReply": {
                                                    "fields": {
                                                        "state": {
                                                            "type": "int32",
                                                            "id": 1
                                                        },
                                                        "text": {
                                                            "type": "string",
                                                            "id": 2
                                                        },
                                                        "textSide": {
                                                            "type": "string",
                                                            "id": 3
                                                        },
                                                        "dmSge": {
                                                            "type": "DmSegConfig",
                                                            "id": 4
                                                        },
                                                        "flag": {
                                                            "type": "DanmakuFlagConfig",
                                                            "id": 5
                                                        },
                                                        "specialDms": {
                                                            "rule": "repeated",
                                                            "type": "string",
                                                            "id": 6
                                                        },
                                                        "checkBox": {
                                                            "type": "bool",
                                                            "id": 7
                                                        },
                                                        "count": {
                                                            "type": "int64",
                                                            "id": 8
                                                        },
                                                        "commandDms": {
                                                            "rule": "repeated",
                                                            "type": "CommandDm",
                                                            "id": 9
                                                        },
                                                        "playerConfig": {
                                                            "type": "DanmuWebPlayerConfig",
                                                            "id": 10
                                                        },
                                                        "reportFilterContent": {
                                                            "rule": "repeated",
                                                            "type": "string",
                                                            "id": 11
                                                        }
                                                    }
                                                },
                                                "CommandDm": {
                                                    "fields": {
                                                        "id": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "oid": {
                                                            "type": "int64",
                                                            "id": 2
                                                        },
                                                        "mid": {
                                                            "type": "string",
                                                            "id": 3
                                                        },
                                                        "command": {
                                                            "type": "string",
                                                            "id": 4
                                                        },
                                                        "content": {
                                                            "type": "string",
                                                            "id": 5
                                                        },
                                                        "progress": {
                                                            "type": "int32",
                                                            "id": 6
                                                        },
                                                        "ctime": {
                                                            "type": "string",
                                                            "id": 7
                                                        },
                                                        "mtime": {
                                                            "type": "string",
                                                            "id": 8
                                                        },
                                                        "extra": {
                                                            "type": "string",
                                                            "id": 9
                                                        },
                                                        "idStr": {
                                                            "type": "string",
                                                            "id": 10
                                                        }
                                                    }
                                                },
                                                "DmSegConfig": {
                                                    "fields": {
                                                        "pageSize": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "total": {
                                                            "type": "int64",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "VideoMask": {
                                                    "fields": {
                                                        "cid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "plat": {
                                                            "type": "int32",
                                                            "id": 2
                                                        },
                                                        "fps": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "time": {
                                                            "type": "int64",
                                                            "id": 4
                                                        },
                                                        "maskUrl": {
                                                            "type": "string",
                                                            "id": 5
                                                        }
                                                    }
                                                },
                                                "VideoSubtitle": {
                                                    "fields": {
                                                        "lan": {
                                                            "type": "string",
                                                            "id": 1
                                                        },
                                                        "lanDoc": {
                                                            "type": "string",
                                                            "id": 2
                                                        },
                                                        "subtitles": {
                                                            "rule": "repeated",
                                                            "type": "SubtitleItem",
                                                            "id": 3
                                                        }
                                                    }
                                                },
                                                "DanmuWebPlayerConfig": {
                                                    "fields": {
                                                        "dmSwitch": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "aiSwitch": {
                                                            "type": "bool",
                                                            "id": 2
                                                        },
                                                        "aiLevel": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "blocktop": {
                                                            "type": "bool",
                                                            "id": 4
                                                        },
                                                        "blockscroll": {
                                                            "type": "bool",
                                                            "id": 5
                                                        },
                                                        "blockbottom": {
                                                            "type": "bool",
                                                            "id": 6
                                                        },
                                                        "blockcolor": {
                                                            "type": "bool",
                                                            "id": 7
                                                        },
                                                        "blockspecial": {
                                                            "type": "bool",
                                                            "id": 8
                                                        },
                                                        "preventshade": {
                                                            "type": "bool",
                                                            "id": 9
                                                        },
                                                        "dmask": {
                                                            "type": "bool",
                                                            "id": 10
                                                        },
                                                        "opacity": {
                                                            "type": "float",
                                                            "id": 11
                                                        },
                                                        "dmarea": {
                                                            "type": "int32",
                                                            "id": 12
                                                        },
                                                        "speedplus": {
                                                            "type": "float",
                                                            "id": 13
                                                        },
                                                        "fontsize": {
                                                            "type": "float",
                                                            "id": 14
                                                        },
                                                        "screensync": {
                                                            "type": "bool",
                                                            "id": 15
                                                        },
                                                        "speedsync": {
                                                            "type": "bool",
                                                            "id": 16
                                                        },
                                                        "fontfamily": {
                                                            "type": "string",
                                                            "id": 17
                                                        },
                                                        "bold": {
                                                            "type": "bool",
                                                            "id": 18
                                                        },
                                                        "fontborder": {
                                                            "type": "int32",
                                                            "id": 19
                                                        },
                                                        "drawType": {
                                                            "type": "string",
                                                            "id": 20
                                                        }
                                                    }
                                                },
                                                "SubtitleItem": {
                                                    "fields": {
                                                        "id": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "idStr": {
                                                            "type": "string",
                                                            "id": 2
                                                        },
                                                        "lan": {
                                                            "type": "string",
                                                            "id": 3
                                                        },
                                                        "lanDoc": {
                                                            "type": "string",
                                                            "id": 4
                                                        },
                                                        "subtitleUrl": {
                                                            "type": "string",
                                                            "id": 5
                                                        },
                                                        "author": {
                                                            "type": "UserInfo",
                                                            "id": 6
                                                        }
                                                    }
                                                },
                                                "UserInfo": {
                                                    "fields": {
                                                        "mid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "name": {
                                                            "type": "string",
                                                            "id": 2
                                                        },
                                                        "sex": {
                                                            "type": "string",
                                                            "id": 3
                                                        },
                                                        "face": {
                                                            "type": "string",
                                                            "id": 4
                                                        },
                                                        "sign": {
                                                            "type": "string",
                                                            "id": 5
                                                        },
                                                        "rank": {
                                                            "type": "int32",
                                                            "id": 6
                                                        }
                                                    }
                                                },
                                                "DanmakuElem": {
                                                    "fields": {
                                                        "id": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "progress": {
                                                            "type": "int32",
                                                            "id": 2
                                                        },
                                                        "mode": {
                                                            "type": "int32",
                                                            "id": 3
                                                        },
                                                        "fontsize": {
                                                            "type": "int32",
                                                            "id": 4
                                                        },
                                                        "color": {
                                                            "type": "uint32",
                                                            "id": 5
                                                        },
                                                        "midHash": {
                                                            "type": "string",
                                                            "id": 6
                                                        },
                                                        "content": {
                                                            "type": "string",
                                                            "id": 7
                                                        },
                                                        "ctime": {
                                                            "type": "int64",
                                                            "id": 8
                                                        },
                                                        "weight": {
                                                            "type": "int32",
                                                            "id": 9
                                                        },
                                                        "action": {
                                                            "type": "string",
                                                            "id": 10
                                                        },
                                                        "pool": {
                                                            "type": "int32",
                                                            "id": 11
                                                        },
                                                        "idStr": {
                                                            "type": "string",
                                                            "id": 12
                                                        },
                                                        "attr": {
                                                            "type": "int32",
                                                            "id": 13
                                                        }
                                                    }
                                                },
                                                "DMAttrBit": {
                                                    "values": {
                                                        "DMAttrBitProtect": 0,
                                                        "DMAttrBitFromLive": 1,
                                                        "DMAttrHighLike": 2
                                                    }
                                                },
                                                "DmPlayerConfigReq": {
                                                    "fields": {
                                                        "ts": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "switch": {
                                                            "type": "PlayerDanmakuSwitch",
                                                            "id": 2
                                                        },
                                                        "switchSave": {
                                                            "type": "PlayerDanmakuSwitchSave",
                                                            "id": 3
                                                        },
                                                        "useDefaultConfig": {
                                                            "type": "PlayerDanmakuUseDefaultConfig",
                                                            "id": 4
                                                        },
                                                        "aiRecommendedSwitch": {
                                                            "type": "PlayerDanmakuAiRecommendedSwitch",
                                                            "id": 5
                                                        },
                                                        "aiRecommendedLevel": {
                                                            "type": "PlayerDanmakuAiRecommendedLevel",
                                                            "id": 6
                                                        },
                                                        "blocktop": {
                                                            "type": "PlayerDanmakuBlocktop",
                                                            "id": 7
                                                        },
                                                        "blockscroll": {
                                                            "type": "PlayerDanmakuBlockscroll",
                                                            "id": 8
                                                        },
                                                        "blockbottom": {
                                                            "type": "PlayerDanmakuBlockbottom",
                                                            "id": 9
                                                        },
                                                        "blockcolorful": {
                                                            "type": "PlayerDanmakuBlockcolorful",
                                                            "id": 10
                                                        },
                                                        "blockrepeat": {
                                                            "type": "PlayerDanmakuBlockrepeat",
                                                            "id": 11
                                                        },
                                                        "blockspecial": {
                                                            "type": "PlayerDanmakuBlockspecial",
                                                            "id": 12
                                                        },
                                                        "opacity": {
                                                            "type": "PlayerDanmakuOpacity",
                                                            "id": 13
                                                        },
                                                        "scalingfactor": {
                                                            "type": "PlayerDanmakuScalingfactor",
                                                            "id": 14
                                                        },
                                                        "domain": {
                                                            "type": "PlayerDanmakuDomain",
                                                            "id": 15
                                                        },
                                                        "speed": {
                                                            "type": "PlayerDanmakuSpeed",
                                                            "id": 16
                                                        },
                                                        "enableblocklist": {
                                                            "type": "PlayerDanmakuEnableblocklist",
                                                            "id": 17
                                                        },
                                                        "inlinePlayerDanmakuSwitch": {
                                                            "type": "InlinePlayerDanmakuSwitch",
                                                            "id": 18
                                                        }
                                                    }
                                                },
                                                "Response": {
                                                    "fields": {
                                                        "code": {
                                                            "type": "int32",
                                                            "id": 1
                                                        },
                                                        "message": {
                                                            "type": "string",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "DanmakuFlag": {
                                                    "fields": {
                                                        "dmid": {
                                                            "type": "int64",
                                                            "id": 1
                                                        },
                                                        "flag": {
                                                            "type": "uint32",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "DanmakuFlagConfig": {
                                                    "fields": {
                                                        "recFlag": {
                                                            "type": "int32",
                                                            "id": 1
                                                        },
                                                        "recText": {
                                                            "type": "string",
                                                            "id": 2
                                                        },
                                                        "recSwitch": {
                                                            "type": "int32",
                                                            "id": 3
                                                        }
                                                    }
                                                },
                                                "DanmakuAIFlag": {
                                                    "fields": {
                                                        "dmFlags": {
                                                            "rule": "repeated",
                                                            "type": "DanmakuFlag",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "DanmuPlayerViewConfig": {
                                                    "fields": {
                                                        "danmukuDefaultPlayerConfig": {
                                                            "type": "DanmuDefaultPlayerConfig",
                                                            "id": 1
                                                        },
                                                        "danmukuPlayerConfig": {
                                                            "type": "DanmuPlayerConfig",
                                                            "id": 2
                                                        },
                                                        "danmukuPlayerDynamicConfig": {
                                                            "rule": "repeated",
                                                            "type": "DanmuPlayerDynamicConfig",
                                                            "id": 3
                                                        }
                                                    }
                                                },
                                                "DanmuDefaultPlayerConfig": {
                                                    "fields": {
                                                        "playerDanmakuUseDefaultConfig": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "playerDanmakuAiRecommendedSwitch": {
                                                            "type": "bool",
                                                            "id": 4
                                                        },
                                                        "playerDanmakuAiRecommendedLevel": {
                                                            "type": "int32",
                                                            "id": 5
                                                        },
                                                        "playerDanmakuBlocktop": {
                                                            "type": "bool",
                                                            "id": 6
                                                        },
                                                        "playerDanmakuBlockscroll": {
                                                            "type": "bool",
                                                            "id": 7
                                                        },
                                                        "playerDanmakuBlockbottom": {
                                                            "type": "bool",
                                                            "id": 8
                                                        },
                                                        "playerDanmakuBlockcolorful": {
                                                            "type": "bool",
                                                            "id": 9
                                                        },
                                                        "playerDanmakuBlockrepeat": {
                                                            "type": "bool",
                                                            "id": 10
                                                        },
                                                        "playerDanmakuBlockspecial": {
                                                            "type": "bool",
                                                            "id": 11
                                                        },
                                                        "playerDanmakuOpacity": {
                                                            "type": "float",
                                                            "id": 12
                                                        },
                                                        "playerDanmakuScalingfactor": {
                                                            "type": "float",
                                                            "id": 13
                                                        },
                                                        "playerDanmakuDomain": {
                                                            "type": "float",
                                                            "id": 14
                                                        },
                                                        "playerDanmakuSpeed": {
                                                            "type": "int32",
                                                            "id": 15
                                                        },
                                                        "inlinePlayerDanmakuSwitch": {
                                                            "type": "bool",
                                                            "id": 16
                                                        }
                                                    }
                                                },
                                                "DanmuPlayerConfig": {
                                                    "fields": {
                                                        "playerDanmakuSwitch": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "playerDanmakuSwitchSave": {
                                                            "type": "bool",
                                                            "id": 2
                                                        },
                                                        "playerDanmakuUseDefaultConfig": {
                                                            "type": "bool",
                                                            "id": 3
                                                        },
                                                        "playerDanmakuAiRecommendedSwitch": {
                                                            "type": "bool",
                                                            "id": 4
                                                        },
                                                        "playerDanmakuAiRecommendedLevel": {
                                                            "type": "int32",
                                                            "id": 5
                                                        },
                                                        "playerDanmakuBlocktop": {
                                                            "type": "bool",
                                                            "id": 6
                                                        },
                                                        "playerDanmakuBlockscroll": {
                                                            "type": "bool",
                                                            "id": 7
                                                        },
                                                        "playerDanmakuBlockbottom": {
                                                            "type": "bool",
                                                            "id": 8
                                                        },
                                                        "playerDanmakuBlockcolorful": {
                                                            "type": "bool",
                                                            "id": 9
                                                        },
                                                        "playerDanmakuBlockrepeat": {
                                                            "type": "bool",
                                                            "id": 10
                                                        },
                                                        "playerDanmakuBlockspecial": {
                                                            "type": "bool",
                                                            "id": 11
                                                        },
                                                        "playerDanmakuOpacity": {
                                                            "type": "float",
                                                            "id": 12
                                                        },
                                                        "playerDanmakuScalingfactor": {
                                                            "type": "float",
                                                            "id": 13
                                                        },
                                                        "playerDanmakuDomain": {
                                                            "type": "float",
                                                            "id": 14
                                                        },
                                                        "playerDanmakuSpeed": {
                                                            "type": "int32",
                                                            "id": 15
                                                        },
                                                        "playerDanmakuEnableblocklist": {
                                                            "type": "bool",
                                                            "id": 16
                                                        },
                                                        "inlinePlayerDanmakuSwitch": {
                                                            "type": "bool",
                                                            "id": 17
                                                        },
                                                        "inlinePlayerDanmakuConfig": {
                                                            "type": "int32",
                                                            "id": 18
                                                        }
                                                    }
                                                },
                                                "DanmuPlayerDynamicConfig": {
                                                    "fields": {
                                                        "progress": {
                                                            "type": "int32",
                                                            "id": 1
                                                        },
                                                        "playerDanmakuDomain": {
                                                            "type": "float",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuSwitch": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        },
                                                        "canIgnore": {
                                                            "type": "bool",
                                                            "id": 2
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuSwitchSave": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuUseDefaultConfig": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuAiRecommendedSwitch": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuAiRecommendedLevel": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuBlocktop": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuBlockscroll": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuBlockbottom": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuBlockcolorful": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuBlockrepeat": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuBlockspecial": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuOpacity": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "float",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuScalingfactor": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "float",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuDomain": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "float",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuSpeed": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "int32",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "PlayerDanmakuEnableblocklist": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                },
                                                "InlinePlayerDanmakuSwitch": {
                                                    "fields": {
                                                        "value": {
                                                            "type": "bool",
                                                            "id": 1
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}