/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const qn_table = {"原画":10000, "蓝光":400,"超清":250,"高清":150,"流畅":80};
    var qn;
    var qnv = "原画";
    var medalSwitch;
    var hiddenEntry = false;
    var JCT = "-1";
    var MEDAL_LIST = new MedalList();
    var mp = 1;
    var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
    var exp =new RegExp("^[0-9]*$");
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
        if(typeof chrome.app.isInstalled!=="undefined") {
            chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
                JCT = lf.res.split(",")[0];
            });
        }
    })();

    setTimeout(function (){
        if(exp.test(room_id) && room_id.length>0) getMedal();
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

    function getMedal(){
        $.ajax({
            url: "https://api.live.bilibili.com/fans_medal/v5/live_fans_medal/iApiMedal?page="+mp,
            type: "GET",
            dataType: "json",
            json: "callback",
            xhrFields: {
                withCredentials: true
            },
            success: function (json) {
                let data = json["data"];
                if(data.length !== 0){
                    let medal_list = data["fansMedalList"];
                    for (let i = 0; i < medal_list.length; i++)
                        MEDAL_LIST.push(new Medal(medal_list[i]["medal_id"]+"", medal_list[i]["roomid"]+"", medal_list[i]["target_id"]+"", medal_list[i]["medalName"], medal_list[i]["medal_level"], medal_list[i]["medal_color_start"], medal_list[i]["medal_color_end"], medal_list[i]["medal_color_border"]));
                    if(data["pageinfo"]["totalpages"] === mp){
                        console.log("load list complete");
                        if(MEDAL_LIST.get(room_id).MID !== "-1"){
                            wareMedal(MEDAL_LIST.get(room_id), true);
                        }
                    }else{
                        mp++;
                        getMedal();
                    }
                }
            }
        });
    }

    function wareMedal(medal, upd){
        if(JCT !== "-1" && medalSwitch && medal.MID !== "-1"){
            var madelForm = new FormData();
            madelForm.append("medal_id", medal.MID);
            madelForm.append("csrf", JCT);
            madelForm.append("csrf_token", JCT);
            $.ajax({
                url: "https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear",
                type: "POST",
                data: madelForm,
                dataType: "JSON",
                processData: false,
                contentType: false,
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function (){
                    console.log("ware medal successful, MID="+medal.MID);
                    if(upd) c(medal);
                }
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
        wareMedal(MEDAL_LIST.get(room_id),false);
    });
}();
