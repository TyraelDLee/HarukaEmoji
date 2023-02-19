/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
!function (){
    const currentVersion = chrome.runtime.getManifest().version;
    const versionSection = document.getElementById("version");
    const updateSection = document.getElementById("update");
    const setting  = document.getElementsByClassName("setting")[0];
    const liveNotification = document.getElementById("notification");
    const medal = document.getElementById("medal");
    const checkIn = document.getElementById("check-in");
    const imageNotice = document.getElementById("img-notice");
    const bCoin = document.getElementById("b-coin");
    const qualitySetting = document.getElementById("qn");
    const setting7 = document.getElementById("btn7");
    const dynamicPush = document.getElementById("dynamicPush");
    const hiddenEntry = document.getElementById("HiddenEntry");
    const loginInfo = document.getElementById("login");
    const daka = document.getElementById("daka-switch");
    const record = document.getElementById("record");
    const prerecord = document.getElementById("prerecord");
    const enhancedHidden = document.getElementById('enhanced-hidden');
    const unread = document.getElementById('unreadSwitch');
    const dynamic = document.getElementById('dynamicSwitch');
    const logo = document.getElementById('logo');
    const darkMode = document.getElementById('darkMode');
    const darkModeSystem = document.getElementById('darkModeSystem');
    const commentEmoji = document.getElementById("commentEmoji");
    const reloadScript = document.getElementById("reload");
    const videoPush = document.getElementById('videoPush');
    const pgcPush = document.getElementById('pgcPush');
    const articlePush = document.getElementById('articlePush');
    const heartBeat = document.getElementById('hb');
    const cover = document.getElementById('album-cover');

    const qn_table = ["原画", "蓝光","超清","高清","流畅"];
    const qnItem = setting7.getElementsByClassName("qn-i");

    var qnvalue = 0;
    var qn;
    var UUID = -2;
    var availableLink = "https://gitee.com/tyrael-lee/HarukaEmoji/releases";
    var os = "";
    function en(e){e.preventDefault()}
    (function ver(){
        versionSection.innerHTML = "ver. <i>"+currentVersion+"</i>";
    })();
    function updateUID(){
        chrome.runtime.sendMessage({ msg: "get_UUID" },function(uid){
            UUID = uid.res;
            let logText = "";
            if(UUID === -1){
                logText = "未登录";
                loginInfo.style.color = "#f44336";
            }else if(UUID !== -2){
                logText = "已登录";
                loginInfo.style.color = "#6dc781";
            }
            logText+="<span class=\"tooltiptext tooltiptext-middle\">b站登录状态。插件要在b站登录后才能启用全部功能。</span>";
            loginInfo.innerHTML = logText;
        });
    }

    setInterval(updateUID,1000);

    document.getElementById("bug-reporter").addEventListener("click", function (){
        chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji/issues"});
    })

    document.getElementById("logo").addEventListener("click", function (){
        chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/rua%E8%B1%B9%E5%99%A8/igapngheaefbfhikpbngjgakfnedkchb"});
    });

    document.getElementById("version").addEventListener("click", function (){
        chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji"});
    });

    document.getElementById("source").addEventListener("click", function (){
        chrome.tabs.create({url: "https://github.com/TyraelDLee/HarukaEmoji"});
    });

    document.getElementById("readme").addEventListener("click", function (){
        chrome.tabs.create({url: "./readme.html"});
    });

    document.getElementsByClassName("record-manual")[0].addEventListener("click", ()=>{chrome.tabs.create({url: "./readme.html#record"});});
    document.getElementsByClassName("record-manual")[1].addEventListener("click", ()=>{chrome.tabs.create({url: "./readme.html#record"});});

    updateSection.addEventListener("click", ()=>{
        chrome.tabs.create({url:availableLink});
    });

    liveNotification.addEventListener("change", function (){
        let checked = this.checked;
        if(os === 'win')
            buttonDisabled(this.checked, imageNotice);
        chrome.storage.sync.set({"notification": checked}, function(){
            console.log("notification on:"+checked);
        });
    });

    medal.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"medal": checked}, function(){});
    });

    checkIn.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"checkIn": checked}, function(){});
    });

    imageNotice.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.local.set({"imageNotice": checked}, function (){});
    });

    bCoin.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"bcoin": checked}, function (){});
    });
    
    qualitySetting.addEventListener("change", function (){
        qn = this.checked;
        scrollDisabled(this.checked, setting7);
        chrome.storage.sync.set({"qn": qn}, function (){});
    });

    setting7.addEventListener("wheel", function (e){
        if(qn){
            e.deltaY>=0?qnvalue+=1:qnvalue-=1;
            if (qnvalue<=0)qnvalue=0;
            if(qnvalue>=4)qnvalue=4;
            scrollAnim(qnvalue);
            chrome.runtime.sendMessage({ msg: "QNV?"+qn_table[qnvalue] },function (){});
        }
    });

    setting7.addEventListener("mouseenter", function (){
        setting.addEventListener("wheel", en);
    });
    setting7.addEventListener("mouseleave", function (){
        setting.removeEventListener("wheel", en);
    });

    for (let i = 0; i < qnItem.length; i++) {
        qnItem[i].addEventListener("click",function (){
            if(qn){
                qnvalue = i;
                scrollAnim(qnvalue);
                chrome.runtime.sendMessage({ msg: "QNV?"+qn_table[qnvalue] },function (){});
            }
        });
    }

    dynamicPush.addEventListener("change", function (){
        let checked = this.checked;
        buttonDisabled(checked, videoPush);
        buttonDisabled(checked, pgcPush);
        buttonDisabled(checked, articlePush);
        if (checked){
            if (!articlePush.checked && !pgcPush.checked && !videoPush.checked){
                videoPush.checked = true;
                pgcPush.checked = true;
                articlePush.checked = true;
                chrome.storage.sync.set({"videoPush":true}, function (){});
                chrome.storage.sync.set({"pgcPush":true}, function (){});
                chrome.storage.sync.set({"articlePush":true}, function (){});
            }
        }
        chrome.storage.sync.set({"dynamicPush": checked}, function (){});
    });

    videoPush.addEventListener('change', function (){
        let value = this.checked;
        turnOffDynamic();
        chrome.storage.sync.set({"videoPush":value}, function (){});
    });

    pgcPush.addEventListener('change', function (){
        let value = this.checked;
        turnOffDynamic();
        chrome.storage.sync.set({"pgcPush":value}, function (){});
    });

    articlePush.addEventListener('change', function (){
        let value = this.checked;
        turnOffDynamic();
        chrome.storage.sync.set({"articlePush":value}, function (){});
    });

    function turnOffDynamic(){
        if (!articlePush.checked && !pgcPush.checked && !videoPush.checked) {
            dynamicPush.checked = false;
            buttonDisabled(false, videoPush);
            buttonDisabled(false, pgcPush);
            buttonDisabled(false, articlePush);
            chrome.storage.sync.set({"dynamicPush": false}, function (){});
        }
    }

    unread.addEventListener('change', function(){
        let checked = this.checked;
        chrome.storage.sync.set({"unreadSwitch":checked}, function (){});
    });

    dynamic.addEventListener('change', function(){
        let checked = this.checked;
        chrome.storage.sync.set({"dynamicSwitch":checked}, function (){});
    });

    commentEmoji.addEventListener('change', function(){
        let checked = this.checked;
        chrome.storage.sync.set({"commentEmoji":checked}, function (){});
    })

    hiddenEntry.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"hiddenEntry": checked}, function (){});
    });

    daka.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"daka": checked}, function (){});
    });

    heartBeat.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"heartBeatSwitch": checked}, function (){});
    });

    cover.addEventListener("change", function (){
        let checked = this.checked;
        chrome.storage.sync.set({"squareCover": checked}, function (){});
    });

    enhancedHidden.addEventListener("change", function (){
        let checked = this.checked;
        if(checked){
            hiddenEntry.setAttribute("disabled","");
            hiddenEntry.parentElement.getElementsByTagName("label")[0].classList.add("btn-disabled");
        }else{
            hiddenEntry.removeAttribute('disabled');
            hiddenEntry.parentElement.getElementsByTagName("label")[0].classList.remove("btn-disabled");
        }
        hiddenEntry.checked = this.checked;
        chrome.storage.sync.set({"enhancedHiddenEntry": checked, "hiddenEntry": checked}, function (){});
    });

    record.addEventListener("change", function (){
        let checked = this.checked;
        if(checked){
            prerecord.removeAttribute("disabled");
        }else{
            prerecord.setAttribute("disabled","");
        }
        chrome.storage.sync.set({"record": checked}, function (){});
    });

    prerecord.addEventListener("change", function (){
        let value = this.value;
        chrome.storage.sync.set({"prerecord":value}, function (){});
    });

    darkMode.addEventListener("change", function (){
        let checked = this.checked;
        if (checked){
            darkModeSystem.checked = false;
            chrome.storage.sync.set({"darkModeSystem": false}, function (){});
        }
        chrome.storage.sync.set({"darkMode": checked}, function (){});
    });

    darkModeSystem.addEventListener("change", function (){
        let checked = this.checked;
        if (this.checked){
            darkMode.checked = false;
            chrome.storage.sync.set({"darkMode": false}, function (){});
        }
        chrome.storage.sync.set({"darkModeSystem": checked}, function (){});
    });

    reloadScript.addEventListener("click", function (){
        chrome.runtime.sendMessage({msg:"requestReload"}, function (result){
            console.log('服务重启成功')
            // os = result.os;
            // if (result.os !== 'win'){
            //     buttonDisabled(false, imageNotice);
            // }
        });
    });


    function buttonDisabled(checked, obj){
        if(checked) {
            obj.removeAttribute("disabled");
            obj.parentElement.getElementsByTagName("label")[0].classList.remove("btn-disabled");
        } else{
            obj.setAttribute("disabled", "true");
            obj.parentElement.getElementsByTagName("label")[0].classList.add("btn-disabled");
        }
    }

    function scrollDisabled(checked, obj){
        checked?obj.classList.remove("btn-disabled") :obj.classList.add("btn-disabled");
    }

    function scrollAnim(newPos){
        newPos*=-18;
        let currentPos = parseInt(document.getElementById("qn-items").style.marginTop.replace("px",""));
        let op = currentPos>newPos;
        if(currentPos - newPos !== 0)
            scroll();
        function scroll(){
            op?currentPos-=1:currentPos+=1;
            for (let i = 0; i < 5; i++)
                document.getElementsByClassName("qn-i")[i].style.transform = "rotateX("+(18*i+currentPos)*2.5+"deg)";
            document.getElementById("qn-items").style.marginTop = currentPos+"px";
            if(currentPos!==newPos){
                setTimeout(()=>{scroll();}, 10);
            }
        }
    }

    window.onload = function (){
        getLatestVer();
        updateUID();
        chrome.runtime.sendMessage({msg:"requestOSInfo"}, function (result){
            os = result.os;
            if (result.os !== 'win'){
                buttonDisabled(false, imageNotice);
            }
        });

        chrome.storage.sync.get(["notification", "medal", "checkIn", "bcoin", "dynamicPush", "unreadSwitch", "hiddenEntry", "daka", "qn", "qnvalue", "enhancedHiddenEntry", "record", "prerecord", "dynamicSwitch", "darkMode", "darkModeSystem", "commentEmoji", "videoPush", "pgcPush", "articlePush", "heartBeatSwitch", "squareCover"], function(result){
            if (os === 'win')
                buttonDisabled(result.notification, imageNotice);
            liveNotification.checked = result.notification;
            medal.checked = result.medal;
            checkIn.checked = result.checkIn;

            bCoin.checked = result.bcoin;
            dynamicPush.checked = result.dynamicPush;
            videoPush.checked = result.videoPush;
            pgcPush.checked = result.pgcPush;
            articlePush.checked = result.articlePush;

            buttonDisabled(dynamicPush.checked, videoPush);
            buttonDisabled(dynamicPush.checked, pgcPush);
            buttonDisabled(dynamicPush.checked, articlePush);

            unread.checked = result.unreadSwitch;
            dynamic.checked = result.dynamicSwitch;
            hiddenEntry.checked = result.hiddenEntry;
            daka.checked = result.daka;
            heartBeat.checked = result.heartBeatSwitch;
            commentEmoji.checked = result.commentEmoji;
            cover.checked = result.squareCover;

            qualitySetting.checked = result.qn;
            qn = result.qn;
            scrollDisabled(result.qn, setting7);

            qnvalue = qn_table.indexOf(result.qnvalue);
            scrollAnim(qnvalue);

            darkMode.checked = result.darkMode;
            darkModeSystem.checked = result.darkModeSystem;

            if (result.enhancedHiddenEntry){
                hiddenEntry.setAttribute("disable","");
                hiddenEntry.checked = result.enhancedHiddenEntry;
                hiddenEntry.parentElement.getElementsByTagName("label")[0].classList.add("btn-disabled");
            }else{
                hiddenEntry.removeAttribute('disable');
                hiddenEntry.parentElement.getElementsByTagName("label")[0].classList.remove("btn-disabled");
            }
            enhancedHidden.checked = result.enhancedHiddenEntry;

            record.checked = result.record;
            if (!result.record) prerecord.setAttribute("disabled","");

            setDefault(prerecord.childNodes, result.prerecord);
        });

        chrome.storage.local.get(["imageNotice"], (result)=>{
            imageNotice.checked = result.imageNotice;
        });
    }

    function getLatestVer(){
        chrome.runtime.sendMessage({msg: "popupfired"});
        chrome.runtime.sendMessage({ msg: "updateStatus" }, function (updateStatus){
            if(updateStatus.res){
                updateSection.style.display = "block";
                updateSection.innerText="有可用更新";
                availableLink = updateStatus.address;
            }else{
                updateSection.style.display = "none";
                updateSection.innerText="";
            }
        });
    }

    function setDefault(object, value){
        for(let child of object){
            if(child.nodeName === "OPTION"){
                if(child.getAttribute("value") !== value+"" && child.getAttribute("selected")==="selected")
                    child.removeAttribute("selected");
                if(child.getAttribute("value") === value+"")
                    child.setAttribute("selected", "selected");
            }
        }
    }

    logo.addEventListener("mouseenter", ()=>{
        svga(logo,Math.floor(Math.random()*2+1));
    });
    logo.addEventListener("mouseout", ()=>{
        svga(logo,0);
    });
}();