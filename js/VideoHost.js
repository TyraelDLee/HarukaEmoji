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
    videoInfo.style.float = "left";
    videoInfo.style.paddingLeft = "5px";
    videoInfoSec.appendChild(videoInfo);

    const damakuTable = document.createElement("table");
    const damakuTray = document.createElement("div");
    damakuTray.setAttribute("id","rua-damaku");
    damakuTray.classList.add("emoji_sec");
    damakuTray.appendChild(damakuTable);
    const downloadTray = document.createElement("div");
    downloadTray.setAttribute("id","rua-download");
    downloadTray.classList.add("emoji_sec");

    const downloadTag = document.createElement("div");
    downloadTag.setAttribute("style", "width: 290px; position: fixed; background: #fff");
    downloadTag.innerHTML = "<div style='float: left; user-select: none; padding-left: 5px'><b>视频下载：</b></div>";
    downloadTray.appendChild(downloadTag);

    const downloadVideoTray = document.createElement("div");
    downloadVideoTray.setAttribute("style", "margin: 20px 0 0 15px;");
    downloadTray.appendChild(downloadVideoTray);

    function getQn(cid){
        $.ajax({
            url: "https://api.bilibili.com/x/player/playurl?bvid="+bvid+"&cid="+cid+"&qn=120&type=flv&fourk=1",
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                videoInfo.innerHTML = "<b style='user-select: none'>视频ID:</b> "+ "av" + aid + " / "+bvid + " "+(pid-1+2)+ "p/"+cids.length+"p";
                removeListener();
                downloadVideoTray.innerHTML = "";
                if(json["code"]===0){
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
                            download(bvid, cid, json["data"]["accept_quality"][i], vtitle[pid]+" "+json["data"]["accept_description"][i]);
                        }
                    }
                    downloadVideoTray.style.height = Math.ceil(downloadBlocks.length / 3) * 40 + "px";
                    getAudioOnly(cid);
                    console.log(acceptQn);
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
                            chrome.runtime.sendMessage({msg:"requestDownload", fileName:(vtitle[pid]+" SoundOnly").replaceAll(" ", "_")});
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
        $.ajax({
            url: "https://api.bilibili.com/x/web-interface/view?"+abv(vid),
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                pid = pid<0?0:pid;
                cids = [];
                vtitle = [];
                if(json["code"]===0){
                    aid = json["data"]["aid"];
                    bvid = json["data"]["bvid"];
                    for (let i = 0; i < json["data"]["pages"].length; i++) {
                        cids.push(json["data"]["pages"][i]["cid"]);
                        (json["data"]["pages"].length===1)?vtitle.push(json["data"]["title"]):vtitle.push(json["data"]["pages"][i]["part"]);
                    }
                    console.log(bvid);
                    console.log(cids);
                    getQn(cids[pid]);
                }
            }
        });
    }

    if(document.getElementsByTagName("article").length === 0) renderPopup();
    function renderPopup(){
        damakuTable.innerText = "加载弹幕中...";
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
        selec.appendChild(damakuTray);
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

    /***
     * @return true, not move | false, moved.
     */
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
        chrome.runtime.sendMessage({msg:"requestDownload", fileName:(fileName+(durl.length===1?"":"_p"+currentLocation)).replaceAll(" ", "_")});
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
        for (let i = 0; i < downloadBlocks.length; i++) {
            downloadBlocks[i].onclick = null;
        }
        downloadBlocks = [];
    }

    function abv(str){
        let headB = "AaBb";
        let headE = "Vv";
        if(headB.includes(str.charAt(0)) && headE.includes(str.charAt(1))){
            return headB.substr(0,2).includes(str.charAt(0))?"aid="+str.replace("av",""):"bvid="+str;
        }
    }
}();
