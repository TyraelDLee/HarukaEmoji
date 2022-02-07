/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const qn_table = {"原画":10000, "蓝光HEVC":401, "蓝光":400, "超清HEVC":251, "超清":250,"高清":150,"流畅":80};
    var qn;
    var qnv = "原画";
    var medalSwitch;
    var hiddenEntry = false;
    var JCT = "-1";
    var MEDAL_LIST = new MedalList();
    var uid = "";
    var mid = "";
    var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
    var exp =new RegExp("^[0-9]*$");
    var room_title = document.title.replace(" - 哔哩哔哩直播，二次元弹幕直播平台","").replaceAll(" ","");
    var recordEnable = true;
    var prerecordingDuration = 300;
    var recorder;

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

    (function getUserInfo(){
        chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
            JCT = lf.res.split(",")[0];
            uid = lf.res.split(",")[1];
        });
    })();

    setTimeout(function (){
        if(exp.test(room_id) && room_id.length>0) getRoomInfo();
        if(qn && exp.test(room_id) && room_id.length>0 && document.getElementsByTagName("article").length === 0)q(qnv);
        if(hiddenEntry && JCT !== "-1" && exp.test(room_id) && room_id.length>0 && document.getElementsByTagName("article").length === 0)hideEntry();
    }, 10);

    function hideEntry(){
        if(document.getElementById("chat-items")===undefined) setTimeout(hideEntry, 100);
        else{
            if(document.getElementById("chat-items").getElementsByClassName("important-prompt-item").length===0)
                setTimeout(hideEntry, 10);
            else
                document.getElementById("chat-items").getElementsByClassName("important-prompt-item")[0].style.display = "none";}
    }

    function getRoomInfo(){
        fetch("https://api.live.bilibili.com/room/v1/Room/room_init?id="+room_id,{
            method:"GET",
            credentials: 'include',
            body:null
        })
            .then(res => res.json())
            .then(json => {
                if(json["code"] === 0){
                    mid = json["data"]["uid"];
                    getMedal(json["data"]["uid"]);
                }
            });
    }

    function getMedal(mid){
        fetch("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+uid,{
            method:"GET",
            credentials: 'include',
            body:null
        })
            .then(res => res.json())
            .then(json => {
                if(json["code"] === 0){
                    let medalList = json["data"]["list"];
                    for (let i = 0; i < medalList.length; i++) {
                        MEDAL_LIST.push(new Medal(medalList[i]["medal_info"]["medal_id"],medalList[i]["medal_info"]["target_id"],medalList[i]["medal_info"]["target_id"],medalList[i]["medal_info"]["medal_name"],medalList[i]["medal_info"]["level"], medalList[i]["medal_info"]["medal_color_start"], medalList[i]["medal_info"]["medal_color_end"], medalList[i]["medal_info"]["medal_color_border"]))
                    }
                    wareMedal(MEDAL_LIST.getByUid(mid), true);
                }
            });
    }

    function wareMedal(medal, upd){
        if(JCT !== "-1" && medalSwitch && medal.MID !== "-1"){
            var madelForm = new FormData();
            madelForm.append("medal_id", medal.MID);
            madelForm.append("csrf", JCT);
            madelForm.append("csrf_token", JCT);
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear",{
                method:"POST",
                credentials: 'include',
                body:madelForm,
            })
            .then(res => {
                console.log("ware medal successful, MID="+medal.MID);
                if(upd) c(medal);
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
                if(s===undefined || s !== medal.mName)
                    setTimeout(()=>{c(medal)}, 1000);
            },20);
        }
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
        wareMedal(MEDAL_LIST.getByUid(mid),false);
    });

    /**
     * Recording section
     * */
    const recordBtn = document.createElement("div");
    const recordDuration = document.createElement("div");
    let startRecording = false, stopRecoding = false, recordingDuration = 0,
        controlBar = document.getElementById("web-player-controller-wrap-el");
    recordBtn.classList.add("rua-record");
    recordDuration.classList.add("rua-recording-time");

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
                        chrome.runtime.sendMessage({msg: "requestEncode", blob: blobURL, filename: room_title, startTime: (recordTime - recordingDuration), duration: recordingDuration});
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

}();
