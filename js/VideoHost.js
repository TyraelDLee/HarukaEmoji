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
    var initPrint = true;

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
    danmakuTag.innerHTML = "<div style='float: left; user-select: none; padding-left: 5px'><b>弹幕：</b></div><div style='float: right; padding-right: 5px; user-select: none' id='rua-danmaku-size'>共查询到"+ danmakuPoolSize + " 弹幕</div>";
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

    function delay(){

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

    function getQn(cid){
        videoInfo.innerHTML = "<b style='user-select: none'>视频ID: </b> "+ "<span>av" + aid + "</span><span style='user-select: none'> / </span><span>"+bvid + "</span>";
        pInfo.innerText = (pid-1+2)+ "p/"+cids.length+"p";
        removeListener();
        downloadVideoTray.innerHTML = "";
        videoDuration = 0;
        danmakuPoolSize = 0;
        danmakuArr = new DanmakuArr();
        danmakuArea.innerHTML = "";
        initPrint = true;

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
                    console.log(acceptQn);
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
                    console.log(json["data"]["dash"]["audio"][0]["baseUrl"]);
                    if(json["data"]["dash"]["audio"][0]["baseUrl"]!==null){
                        let rua_download_block = document.createElement("div");
                        rua_download_block.setAttribute("id","qn-sound");
                        rua_download_block.classList.add("rua-download-block");
                        rua_download_block.innerHTML = "<div class='rua-quality-des'>Sound Only</div>";
                        downloadVideoTray.appendChild(rua_download_block);
                        downloadBlocks.push(rua_download_block);
                        downloadVideoTray.style.height = Math.ceil(downloadBlocks.length / 3) * 40+"px";
                        rua_download_block.onclick = () =>{
                            const url = json["data"]["dash"]["audio"][0]["baseUrl"]+"&requestFrom=ruaDL";
                            chrome.runtime.sendMessage({msg:"requestDownload", fileName:(vtitle[0]+(vtitle.length===1?"":vtitle[pid+1])+" SoundOnly")});
                            const a = document.createElement('a');
                            document.body.appendChild(a);
                            a.style.display = 'none';
                            a.href = url;
                            a.target = "_Blank";
                            a.referrerPolicy = "unsafe-url";
                            a.download;
                            a.click();
                            document.body.removeChild(a);
                        }
                    }
                }
            }
        });
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
                danmakuPoolSize+=callback.danmakuPoolSize;
                document.getElementById("rua-danmaku-size").innerText = "共查询到"+ danmakuArr.size + " 弹幕";
                danmakuArea.style.height = danmakuArr.size * 20 +"px";

                if (initPrint){
                    for (let i = 0; i < 20; i++){
                        if(!findId(danmakuArea, "rua-danmaku-content","rua-danmaku-"+i))
                        danmakuArea.appendChild(drawDanmaku(danmakuArr.get(i).time, danmakuArr.get(i).content, danmakuArr.get(i).mid, i));
                    }
                    initPrint = false;
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
        if(danmakuArr.size>=20){
            let disposeLengthTop = Math.floor(e.target.scrollTop / 20);
            danmakuArea.innerHTML = "";
            for (let i = 0; i < 20; i++) {
                if(disposeLengthTop+i<danmakuArr.size){
                    danmakuArea.appendChild(drawDanmaku(danmakuArr.get(i+disposeLengthTop).time, danmakuArr.get(i+disposeLengthTop).content, danmakuArr.get(i+disposeLengthTop).mid,i+disposeLengthTop));
                }
            }
        }
    }

    function drawDanmaku(time, content, mid, index){
        const div = document.createElement("div");
        const spanTime = document.createElement("a");
        const spanContent = document.createElement("span");
        const spanMid = document.createElement("span");
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
        spanMid.setAttribute("class","rua-mid rua-danmaku");
        spanMid.setAttribute("title","用户ID:"+mid);
        spanMid.innerText=mid;
        div.appendChild(spanMid);
        return div;
    }

    function findId(DOMObj, className, idName){
        for (let i = 0; i < DOMObj.getElementsByClassName(className).length; i++) {
            if (DOMObj.getElementsByClassName(className)[i].id===idName) return true;
        }
        return false;
    }
}();


var dmObj = {
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