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
    const room_title = document.title.replace(" - 哔哩哔哩直播，二次元弹幕直播平台","").replaceAll(" ","");
    chrome.storage.sync.get(["qn"], function(result){qn = result.qn});
    chrome.storage.sync.get(["qnvalue"], function(result){qnv = result.qnvalue});
    chrome.storage.sync.get(["medal"], (result)=>{medalSwitch = result.medal});
    chrome.storage.sync.get(["hiddenEntry"], (result)=>{hiddenEntry = result.hiddenEntry});
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if(key === "medal") medalSwitch = newValue;
        }
    });

    (function getUserInfo(){
        chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
            JCT = lf.res.split(",")[0];
            uid = lf.res.split(",")[2];
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
        console.log(medal);
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
                console.log(medal);
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
    let startRecording = false, stopRecoding = false, recordingDuration = 0, prerecordingDuration = 300, recorder;
    const recordBtn = document.createElement("div");
    const controlBar = document.getElementById("web-player-controller-wrap-el");
    recordBtn.classList.add("rua-record");
    const recordDuration = document.createElement("div");
    recordDuration.classList.add("rua-recording-time");

    const controlBarObserver = new MutationObserver(function (m){
        m.forEach(function(mutation) {
            if (mutation.type === "childList") {
                console.log(mutation.addedNodes.length===0);
                if(mutation.addedNodes.length===0){
                    recordBtn.removeEventListener("click", recordingListener);
                }
                if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].nodeName==="DIV"){
                    drawRecording();
                    recordBtn.addEventListener("click", recordingListener);
                }

            }
        });
    });
    try{
        controlBarObserver.observe(controlBar,{
            childList: true
        });
    }catch (e){}


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
        if(!startRecording){
            stopRecoding = true;
            recorder.stop();
        }
    }

    const videoReconnect = new MutationObserver(function (m){
        m.forEach(function(mutation) {
            if (mutation.type === "childList") {
                if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].nodeName==="VIDEO")
                    recording();
            }
        });
    });
    try{
        videoReconnect.observe(document.getElementById("live-player"),{
            childList: true
        });
    }catch (e) {}

    function recording(){
        try{
            const stream = document.getElementById("live-player").getElementsByTagName("video")[0].captureStream();
            //not support 60fps yet.
            let streamChunks = [], recordTime = 0, videotype="";
            recordingDuration = 0;
            console.log(stream);
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) =>{
                console.log(e.data.arrayBuffer());
                if(e.data.size > 0){
                    if(streamChunks.length >= prerecordingDuration && !startRecording){
                        streamChunks.splice(1,1);
                    }
                    if (streamChunks.length===0){
                        videotype = e.data.type;
                    }
                    streamChunks.push(e.data);
                    if(startRecording) {
                        recordingDuration = streamChunks.length;
                        recordDuration.innerHTML = "<span class='text'>录制时长 "+secondToMinutes(recordingDuration)+"</span>";
                    }
                    recordTime++;
                }
                console.log(streamChunks.length);
            }
            recorder.onstart = ()=>{
                console.log("start recording")
            }
            recorder.onstop = ()=>{
                if(stopRecoding){
                    stopRecoding = false;
                    chrome.runtime.sendMessage({msg: "requestEncode", blob: window.URL.createObjectURL(new Blob(streamChunks, {'type': videotype})), filename: room_title, startTime: (recordTime - recordingDuration), duration: recordingDuration});
                }
                recording();
            }
            recorder.start(1000);
        }catch (e) {}
    }

    function secondToMinutes(sec){
        return Math.floor(sec / 60.0) +" : "+(sec % 60<10?"0":"")+sec%60;
    }

}();
