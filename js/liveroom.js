!function () {
    mpegts.LoggingControl.applyConfig({enableError: false});
    chrome.tabs.getCurrent().then(tab=>{
        chrome.windows.getCurrent().then(win=>{
            chrome.storage.local.set({'liveroomOn':[win.id, tab.id]}, ()=>{});
        });
    });

    chrome.windows.onFocusChanged.addListener(()=>{
        chrome.tabs.getCurrent().then(tab=>{
            chrome.windows.getCurrent().then(win=>{
                chrome.storage.local.set({'liveroomOn':[win.id, tab.id]}, ()=>{});
            });
        });
    });

    let addRoom = null, exit = null, setting = null, controlPanel = document.getElementsByClassName('control-bar')[0], controlPanelBG = document.getElementsByClassName('control-bar-bg')[0],
        mouseEvent = null, isFullScreen = false, globalMedalList = null;
    let videoStream = new Map();
    let UID, JCT, BUVID, volumeLock = false, currentMedal = -1, wearMedalSwitch = 1, reconnectionTime = 10, quality = 10000, heartBeatSwitch = true, autoChase = 0, autoChaseTimer = null, nameAlwaysOn = false, asmrMode = false, asmrVolume = 10, asmrVolumeRestore = false;
    updateJCT();
    setInterval(updateJCT, 3000);
    setTimeout(()=>{getMedal(UID).then(r=>{globalMedalList = r;});}, 100);

    /**
     * Save and load playlist
     * */
    const saveRoomList = document.getElementById('save-current-room-list'), loadRoomList = document.getElementById('load-saved-room-list');
    chrome.storage.sync.get(['liveRoomList', 'liveroom-asmr-volume'], (v)=>{
        if(v.liveRoomList.length > 0){
            loadRoomList.classList.remove('disabled');
        }else{
            saveRoomList.classList.add('disabled');
        }
    });
    // chrome.storage.onChanged.addListener(function (changes, namespace) {
    //     for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
    //         switch (key){
    //             case 'liveRoomList':
    //                 console.log(newValue)
    //                 break;
    //         }
    //     }
    // });

    saveRoomList.onclick = ()=>{
        if (!saveRoomList.classList.contains('disabled')){
            let savedRoomList = [];
            for (const key of videoStream.keys()) {
                savedRoomList.push(videoStream.get(key)['uid']);
            }
            chrome.storage.sync.set({'liveRoomList':savedRoomList}, ()=>{
                loadRoomList.classList.remove('disabled');
            })
        }
    };
    loadRoomList.onclick = ()=>{
        if (!loadRoomList.classList.contains('disabled')){
            chrome.storage.sync.get(['liveRoomList'], (v)=>{
                getRooms(v.liveRoomList, true);
            });
        }
    };

    window.addEventListener("focus", function (){
        if ((currentMedal>-1 || wearMedalSwitch !== 0) && globalMedalList!==null && typeof globalMedalList !== 'undefined'){
            updateMedal(currentMedal, wearMedalSwitch === 1);
        }
        loadRoomFromOutside();
    });

    loadRoomFromOutside();

    function loadRoomFromOutside(){
        chrome.storage.local.get(['tempRoomNumber'], (roomID)=>{
            if (roomID['tempRoomNumber']!==-1) {
                let roomid = roomID['tempRoomNumber'];
                chrome.storage.local.set({'tempRoomNumber': -1}, () => {});
                getRealRoomID(roomid).then(r=>{
                    if (r['liveStatus']!==1)
                        throw r;
                    else
                        getRooms([r['up']], true);
                }).catch(e=>{
                    console.log(e);
                });
            }
        });
    }

    window.addEventListener('beforeunload', ()=>{
        chrome.storage.local.set({'liveroomOn':[-1,-1]}, ()=>{});
    });

    let masterAudioVolumeFactor = 1.0;

    function masterAudioVolume(){

    }


    !function bindElements() {
        addRoom = document.getElementsByClassName('add-room')[0].getElementsByTagName('svg')[0];
        setting = document.getElementsByClassName('setting')[0].getElementsByTagName('svg')[0];
        exit = document.getElementsByClassName('fullscreen')[0].getElementsByTagName('svg')[0];

        let settingHeartBeat = document.getElementById('setting-heart-beat'), /*settingReconnection = document.getElementById('setting-re-try'), */
        settingQuality = document.getElementById('setting-quality'), settingMedalOn = document.getElementById('setting-medal-switch-on'),
            settingMedalOff = document.getElementById('setting-medal-switch-off'), settingMedalNone = document.getElementById('setting-medal-switch-none'),
        settingAutoChasing = document.getElementById('setting-auto-frame-chasing'), settingNameAlwaysOn = document.getElementById('setting-name-always-on'),
        settingASMRMode = document.getElementById('setting-asmr'), settingASMRVolume = document.getElementById('setting-asmr-volume'),
        settingASMRVolumeRestore = document.getElementById('setting-asmr-restore');

        document.body.addEventListener('mousemove', (event) => {
            clearTimeout(mouseEvent);
            controlPanel.style.opacity = '1';
            controlPanelBG.style.visibility = 'unset';
            if (videoStream.size>0)
                document.querySelectorAll('.video-owner-info-container')[0].classList.add('video-owner-info-always-on-first-child');
            mouseEvent = setTimeout(hideControl, 1000);
        });
        document.body.addEventListener('mouseup', ()=>{
            for (let i = 0; i < document.body.getElementsByClassName('volume-control').length; i++) {
                document.body.getElementsByClassName('volume-control')[i].style.display = 'none';
            }
        });

        chrome.storage.sync.get(['liveroom-medal-switch', 'liveroom-reconnection-time', 'liveroom-quality', 'liveroom-heart-beat', 'liveroom-auto-frame-chasing', 'liveroom-name-always-on', 'liveroom-asmr-volume', 'liveroom-asmr-volume-restore'], function (data){
            wearMedalSwitch = data['liveroom-medal-switch'];
            switch (wearMedalSwitch) {
                case -1:
                    settingMedalNone.setAttribute('checked', 'true');
                    break;
                case 0:
                    settingMedalOff.setAttribute('checked', 'true');
                    break;
                case 1:
                    settingMedalOn.setAttribute('checked', 'true');
                    break;
            }
            heartBeatSwitch = data['liveroom-heart-beat'];
            settingHeartBeat.checked = heartBeatSwitch;
            reconnectionTime = data['liveroom-reconnection-time']
            //settingReconnection.value = reconnectionTime;
            quality = data['liveroom-quality'];
            settingQuality.value = quality;

            autoChase = data['liveroom-auto-frame-chasing'];
            settingAutoChasing.value = autoChase;

            nameAlwaysOn = data['liveroom-name-always-on'];
            settingNameAlwaysOn.checked = nameAlwaysOn;

            if (autoChase-0 !== 0){
                autoChaseTimer = setInterval(autoChasingFunc, (autoChase-0) * 1000 * 60);
            }

            if (data['liveroom-asmr-volume'] !== null && typeof data['liveroom-asmr-volume'] !== 'undefined')
                asmrVolume = data['liveroom-asmr-volume'] - 0;
            settingASMRVolume.value = asmrVolume;
            document.getElementById('setting-name-asmr-volume-label').innerText = asmrVolume;

            asmrVolumeRestore = data['liveroom-asmr-volume-restore']
            settingASMRVolumeRestore.checked = asmrVolumeRestore
        });

        settingMedalOn.addEventListener('change', (e)=>{
            wearMedalSwitch = 1;
            chrome.storage.sync.set({'liveroom-medal-switch': wearMedalSwitch}, ()=>{});
        });
        settingMedalOff.addEventListener('change', (e)=>{
            wearMedalSwitch = 0;
            chrome.storage.sync.set({'liveroom-medal-switch': wearMedalSwitch}, ()=>{});
        });
        settingMedalNone.addEventListener('change', (e)=>{
            wearMedalSwitch = -1;
            updateMedal(0, wearMedalSwitch === -1);
            chrome.storage.sync.set({'liveroom-medal-switch': wearMedalSwitch}, ()=>{});
        });

        settingHeartBeat.addEventListener('change', ()=>{
            heartBeatSwitch = settingHeartBeat.checked;
            chrome.storage.sync.set({"liveroom-heart-beat":heartBeatSwitch}, function (){});
        });

        // settingReconnection.addEventListener('change', ()=>{
        //     reconnectionTime = settingReconnection.value;
        //     chrome.storage.sync.set({"liveroom-reconnection-time":reconnectionTime}, function (){});
        // });

        settingQuality.addEventListener('change', ()=>{
            console.log(settingQuality.value)
            quality = settingQuality.value;
            chrome.storage.sync.set({"liveroom-quality":quality}, function (){});
        });

        settingAutoChasing.addEventListener('change', ()=>{
            autoChase = settingAutoChasing.value;
            chrome.storage.sync.set({'liveroom-auto-frame-chasing':autoChase}, function (){});
            clearInterval(autoChaseTimer);
            autoChaseTimer = null;
            if (autoChase-0 !== 0){
                autoChaseTimer = setInterval(autoChasingFunc, (autoChase-0) * 1000 * 60);
            }
        });

        settingNameAlwaysOn.addEventListener('change', ()=>{
            nameAlwaysOn = settingNameAlwaysOn.checked;
            const containers = document.querySelectorAll('.video-owner-info-container');
            for (const videoOwnerInfoContainer of containers) {
                nameAlwaysOn?videoOwnerInfoContainer.style.display = 'flex':videoOwnerInfoContainer.style.display = 'none';
                nameAlwaysOn?videoOwnerInfoContainer.classList.add('video-owner-info-always-on'):videoOwnerInfoContainer.classList.remove('video-owner-info-always-on');
            }
            chrome.storage.sync.set({"liveroom-name-always-on":nameAlwaysOn}, function (){});
        });

        settingASMRMode.addEventListener('change', ()=>{
            asmrMode = settingASMRMode.checked;

            const volumeContainers = document.querySelectorAll('.volume-control');
            for (const volume of volumeContainers){
                asmrMode?volume.classList.add('asmr'):volume.classList.remove('asmr');
            }

            const asmrButton = document.querySelectorAll('.asmr-button');
            for (const button of asmrButton){
                asmrMode?button.style.display='block':button.style.display='none';
            }

            const volumeHandle = document.querySelectorAll('.slider-handle');
            for (const handle of volumeHandle){
                let vol = handle.getAttribute('vol')-0;
                if (!asmrMode){
                    handle.style.top = ((53 * vol - 5300) / -100.0) + 'px';
                }
            }

            const videoElements = document.querySelectorAll('video');
            for (const video of videoElements){
                if (asmrMode && !video.classList.contains('asmr')){
                    if (video.volume>0)
                        video.volume = asmrVolume / 100.0;
                }
            }

            const volumeController = document.querySelectorAll('.volume-control');
            for (const host of volumeController){
                if (host.classList.contains('asmr')){
                    if (host.getElementsByClassName('slider-handle')[0].getAttribute('vol')>0){
                        host.getElementsByClassName('number')[0].innerText = asmrVolume+"";
                        host.getElementsByClassName('slider-handle')[0].setAttribute('vol', asmrVolume);
                        host.getElementsByClassName('slider-handle')[0].style.top = (100-asmrVolume) + 'px';
                        host.getElementsByClassName('slider-track')[0].style.height = asmrVolume + '%';
                    }
                    if (host.getElementsByClassName('slider-handle')[0].getAttribute('vol')-0===0){
                        host.getElementsByClassName('slider-handle')[0].style.top = 100 + 'px';
                    }
                }
            }
        });

        settingASMRVolume.addEventListener('mousedown', ()=>{
            settingASMRVolume.addEventListener('mousemove', ()=>{
                document.getElementById('setting-name-asmr-volume-label').innerText = settingASMRVolume.value;
                asmrVolume = settingASMRVolume.value;
                const videoElements = document.querySelectorAll('video');
                for (const video of videoElements){
                    if (asmrMode && !video.classList.contains('asmr')){
                        if (video.volume>=0)
                            video.volume = asmrVolume / 100.0;
                    }
                }

                const volumeController = document.querySelectorAll('.volume-control');
                for (const host of volumeController){
                    if (host.classList.contains('asmr') && !host.classList.contains('asmr-picked')){
                        host.getElementsByClassName('number')[0].innerText = asmrVolume+"";
                        host.getElementsByClassName('slider-handle')[0].setAttribute('vol', asmrVolume);
                        host.getElementsByClassName('slider-handle')[0].style.top = (100-asmrVolume) + 'px';
                        host.getElementsByClassName('slider-track')[0].style.height = asmrVolume + '%';
                    }
                }
            })
        });

        settingASMRVolumeRestore.addEventListener('change', ()=>{
            asmrVolumeRestore = settingASMRVolumeRestore.value;
            chrome.storage.sync.set({"liveroom-asmr-volume-restore":asmrVolumeRestore}, function (){});
        });

        settingASMRVolume.addEventListener('change', (e)=>{
            chrome.storage.sync.set({"liveroom-asmr-volume":settingASMRVolume.value}, function (){});
            asmrVolume = settingASMRVolume.value;
            document.getElementById('setting-name-asmr-volume-label').innerText = settingASMRVolume.value;
        });

        function autoChasingFunc() {
            const videos = document.querySelectorAll('video');
            for (const video of videos) {
                try{
                    video.currentTime = video.buffered.end(0) - 1;
                    console.log(`video frame chased.`);
                }catch (e){}//silence handling here which you should not, but doesn't matter here.
            }
        }

        addRoom.addEventListener('click', () => {
            document.getElementsByClassName('panel-container')[0].removeEventListener('click', hidePanelContainer);
            document.getElementsByClassName('panel-container')[0].style.zIndex = '100';
            document.getElementsByClassName('panel-container')[0].style.display = 'block';
            document.getElementsByClassName('panel-container')[0].addEventListener('click', hidePanelContainer);
            document.getElementsByClassName('add-room-panel')[0].style.display = 'flex';
            document.getElementsByClassName('setting-panel')[0].style.display = 'none';
            document.getElementsByClassName('add-room-panel')[0].addEventListener('click', (e) => {
                e.stopPropagation();
            });
            let searchTime = null, pValue = '';
            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].onkeyup = (e)=>{
                // if (document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.contains('error-input')){
                //     document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.remove('error-input');
                //     document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '';
                //     document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].removeAttribute('style');
                // }
                // if (e.code === 'Enter'){
                //     getRealRoomID(e.target.value).then(r=>{
                //         if (r['liveStatus']!==1)
                //             throw r;
                //         else
                //             getRooms([r['up']]);
                //     }).catch(e=>{
                //         console.log(e);
                //         document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.add('error-input');
                //         document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].setAttribute('style', `transform: translateY(0px);`);
                //         if (e['liveStatus'] !== 1){
                //             document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '主播未开播';
                //         }else if (e['msg'] === '直播间不存在'){
                //             document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '直播间不存在';
                //         }
                //     });
                // }
                searchTime = setTimeout(()=>{
                    if (pValue!== e.target.value){
                        console.log(e.target.value);
                        pValue = e.target.value;
                        let followingContainer = document.getElementsByClassName('following-block')[0];
                        followingContainer.innerHTML='';
                        if (e.target.value==='') {
                            document.getElementsByClassName('following-room')[0].getElementsByClassName('following-block-title')[0].innerText = '上工中的主包：';
                            getFollowingRoom();
                        }else{
                            document.getElementsByClassName('following-room')[0].getElementsByClassName('following-block-title')[0].innerText = '搜索结果：';
                            searchKeywords(e.target.value);
                        }
                    }
                }, 1000);
                searchTime = null;

            };
            getFollowingRoom();
        });

        setting.addEventListener('click', ()=>{
            document.getElementsByClassName('panel-container')[0].removeEventListener('click', hidePanelContainer);
            document.getElementsByClassName('panel-container')[0].style.zIndex = '100';
            document.getElementsByClassName('panel-container')[0].style.display = 'block';
            document.getElementsByClassName('panel-container')[0].addEventListener('click', hidePanelContainer);
            document.getElementsByClassName('setting-panel')[0].style.display = 'flex';
            document.getElementsByClassName('add-room-panel')[0].style.display='none';
            document.getElementsByClassName('setting-panel')[0].addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        exit.addEventListener('click', () => {
            if (isFullScreen)
                document.exitFullscreen().then(r => {
                    isFullScreen = false
                }).catch(e => {
                        document.body.requestFullscreen().then();
                        isFullScreen = true;
                    }
                );
            else
                document.body.requestFullscreen().then(r => {
                    isFullScreen = true
                }).catch(e => {
                    document.exitFullscreen().then();
                    isFullScreen = false;
                });
        });
    }();

    function hidePanelContainer() {
        document.getElementsByClassName('panel-container')[0].style.zIndex = '-1';
        document.getElementsByClassName('panel-container')[0].style.display = 'none';
        document.getElementsByClassName('add-room-panel')[0].style.display = 'none';
        document.getElementsByClassName('setting-panel')[0].style.display = 'none';
        document.getElementsByClassName('following-block')[0].innerHTML = '';
        document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].onkeyup = null;
        document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].value = '';
        if (document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.contains('error-input')){
            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.remove('error-input');
            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '';
            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].removeAttribute('style');
        }
    }

    function hideControl() {
        controlPanel.style.opacity = '0';
        controlPanelBG.style.visibility = 'hidden';
        if (videoStream.size>0)
            document.querySelectorAll('.video-owner-info-container')[0].classList.remove('video-owner-info-always-on-first-child');
    }

    async function getFollowingRoom() {
        if (UID-0!==-1){
            let followList = []
            // getFollowingLegacy(1)
            function getFollowingLegacy(pn){
                fetch(`https://api.bilibili.com/x/relation/followings?vmid=${UID}&pn=${pn}&ps=50&order=desc&order_type=attention`, {
                    method:'GET',
                    credentials:'include',
                    body:null
                }).then(r=>r.json())
                    .then(json=>{
                        if (json['code']===0){
                            const list = json['data']['list'];
                            for (const item of list){
                                followList.push(item['mid']);
                            }
                            if (list.length===50)
                                getFollowingLegacy(pn+1)
                            else {
                                getRooms(followList)
                            }
                        }

                    })
            }
            fetch(`https://api.bilibili.com/x/polymer/web-dynamic/v1/mention/search`, {
                method:"GET",
                credentials:"include",
                body:null
            }).then(r=>r.json())
                .then(json=>{
                    if(json['code']-0 === 0){
                        for (const item of json['data']['groups'][0]['items']){
                            followList.push(item['uid']);
                        }
                        if (typeof json['data']['groups'][1] !== 'undefined'){
                            for (const item of json['data']['groups'][1]['items']){
                                followList.push(item['uid']);
                            }
                        }
                        getRooms(followList)
                    }
                }).catch(e=>{

            });
            // fetch(`https://api.vc.bilibili.com/dynamic_mix/v1/dynamic_mix/at_list?uid=${UID}`, {
            //     method: "GET",
            //     credentials: "include",
            //     body: null
            // }).then(r => r.json())
            //     .then(json => {
            //         let followList = [];
            //         if (json['code'] === 0) {
            //             for (let i = 0; i < json['data']['groups'].length; i++) {
            //                 for (let j = 0; j < json['data']['groups']['' + i]['items'].length; j++) {
            //                     followList.push(json['data']['groups']['' + i]['items'][j + '']['uid']);
            //                 }
            //             }
            //             return followList;
            //         }
            //         // else
            //         //     getFollowingRoom();
            //     })
            //     .then(list => {
            //         getRooms(list);
            //     });
        }
    }

    let selectedList = [];
    document.getElementById('start-all').onclick = ()=>{
        getRooms(selectedList, true);
        hidePanelContainer();
    };

    function searchKeywords(keyword){
        fetch(`https://api.live.bilibili.com/av/v1/VideoConnection/onlineSearch?page=1&pagesize=20&search=${keyword}&type=1&platform=h5&build=1`, {
            method: 'GET',
            credentials: 'include',
            body: null
        }).then(res => res.json())
            .then(json=>{
                if (json['code']===0){
                    let data = json['data']['list'];
                    console.log(data);
                    let uidList = [];
                    for (let i = 0; i < data.length; i++) {
                        uidList.push(data[i]['uid']);
                    }
                    console.log(uidList);
                    getRooms(uidList, false)
                }
            }).catch(e=>{

        });
    }

    function getRooms(list, allOnce=false){
        let body = '{"uids": [' + list + ']}';
        fetch("https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?requestFrom=rua5", {
            method: "POST",
            credentials: "omit",
            body: body
        })
            .then(res => res.json())
            .then(json => {
                if (json["code"] === 0) {
                    let data = json["data"];
                    let followingContainer = document.getElementsByClassName('following-block')[0];
                    if (list.length===1 && allOnce){
                        let liveroomData = data[list[0]];
                        bindVideoPlayer(liveroomData);
                        hidePanelContainer();
                    } else{
                        if (allOnce){
                            for (let i = 0; i < list.length; i++){
                                if (data[list[i]]["live_status"] === 1){
                                    let liveroomData = data[list[i]];
                                    bindVideoPlayer(liveroomData);
                                    hidePanelContainer();
                                }
                            }
                        }else{
                            selectedList = [];
                            for (const key of videoStream.keys()) 
                                selectedList.push(key);
                            for (let i = 0; i < list.length; i++) {
                                if (data[list[i]] !== undefined) {
                                    if (data[list[i]]["live_status"] === 1) {
                                        let liveroomData = data[list[i]];
                                        renderLiver(liveroomData, followingContainer)
                                    }
                                }
                            }
                        }

                    }
                }
            });
    }
    function renderLiver(liveroomData, host){
        let liver = document.createElement('div');
        liver.classList.add('following-liver');
        liver.innerHTML = `<div class="user-add-num"><span class=""></span></div><div class="user-face"><img src="${liveroomData['face']}"></div><div class="following-room-info"><span class="room-title">${liveroomData['title']}</span><div style="display: flex"><span class="user-name">${liveroomData['uname']}</span><span> | </span><span>${liveroomData['area_v2_name']}</span></div></div>`;
        host.append(liver);
        if (selectedList.indexOf(liveroomData['uid'])!==-1){
            liver.classList.add('selected');
            liver.classList.add('unchange');
            liver.getElementsByClassName('user-add-num')[0].getElementsByTagName('span')[0].innerText= selectedList.indexOf(liveroomData['uid'])+1+"";
        }
        if (!liver.classList.contains('unchange')){
            liver.addEventListener('click', () => {
                // bindVideoPlayer(liveroomData);
                // hidePanelContainer();
                if (!liver.classList.contains('selected') && (selectedList.length)<16){
                    liver.classList.add('selected');
                    selectedList.push(liveroomData['uid']);
                    liver.getElementsByClassName('user-add-num')[0].getElementsByTagName('span')[0].innerText= selectedList.length+"";
                }else{
                    liver.classList.remove('selected');
                    let i = selectedList.indexOf(liveroomData['uid']);
                    selectedList.splice(i, 1);
                    let sameLevelList = liver.parentElement.getElementsByClassName('following-liver');
                    for (const sameLevelListElement of sameLevelList) {
                        if (sameLevelListElement.classList.contains('selected')) {
                            if (sameLevelListElement.getElementsByClassName('user-add-num')[0].getElementsByTagName('span')[0].innerText-0 > i)
                                sameLevelListElement.getElementsByClassName('user-add-num')[0].getElementsByTagName('span')[0].innerText = sameLevelListElement.getElementsByClassName('user-add-num')[0].getElementsByTagName('span')[0].innerText-1;
                        }
                    }
                }

            });
        }
    }

    function getAbsLocation(e){
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

    async function bindVideoPlayer(liveRoomInfo) {
        console.log(liveRoomInfo)
        if(selectedList.indexOf(liveRoomInfo['uid'])===-1)
            selectedList.push(liveRoomInfo['uid']);
        function calculateLayout(element, numberOfVideo){
            if (numberOfVideo === 1){
                element.setAttribute('style', `--number-of-row:1; --number-of-column:1;`);
            }else if (numberOfVideo === 2){
                element.setAttribute('style', `--number-of-row:1; --number-of-column:0.5;`);
            }else if(numberOfVideo < 5){
                element.setAttribute('style', `--number-of-row:0.5; --number-of-column:0.5;`);
            }else if(numberOfVideo < 7){
                element.setAttribute('style', `--number-of-row:0.5; --number-of-column:0.3333;`);
            }else if(numberOfVideo < 10){
                element.setAttribute('style', `--number-of-row:0.3333; --number-of-column:0.3333;`);
            }else if(numberOfVideo < 13){
                element.setAttribute('style', `--number-of-row:0.3333; --number-of-column:0.25;`);
            }else{
                element.setAttribute('style', `--number-of-row:0.25; --number-of-column:0.25;`);
            }
        }

        let flv = null, hlsStream = false, preview = null, abortFlag = new AbortController(), abortFetchPreview = new AbortController(), previewRetry = null, hb = null, requestPreview = true, videoMeta = {'mimeType':'','width':'0','height':'0','fps':'NaN','videoDataRate':'0', 'audioSampleRate':0,'audioChannelCount':'NaN', 'audioDataRate':'0', 'videoCodec':'NaN', 'metadata':{'encoder':'NaN'}, 'streamURL':'', 'trueID': liveRoomInfo['room_id'], 'shortID': liveRoomInfo['short_id']===0?liveRoomInfo['room_id']:liveRoomInfo['short_id']}, showStatus = false;
        let video = document.createElement('video');
        video.classList.add('video-player');
        if (asmrMode){
            video.volume = asmrVolume / 100.0;
        }
        video.setAttribute('style', 'display: none;');
        let previewVideo = document.createElement('video');
        previewVideo.classList.add('video-player');
        previewVideo.classList.add('video-player-preview');
        if (asmrMode){
            previewVideo.volume = asmrVolume / 100.0;
        }
        if (videoStream.size < 16 && !videoStream.has(liveRoomInfo['uid'])) {
            videoStream.set(liveRoomInfo['uid'], liveRoomInfo);
            saveRoomList.classList.remove('disabled');

            let videoColum = document.getElementsByClassName('video-container')[0];
            calculateLayout(videoColum, videoStream.size);
            let videoContainer = document.createElement('div');

            // reconnection and auto-revoke player after live end.
            let sourceEvent = new MutationObserver( async function (e){
                if (e.length>0){
                    let mutation = e[0];
                    if (mutation.type === "attributes") {
                        if (video.getAttribute('src')===null){
                            let roominfo = await getRealRoomID(liveRoomInfo['room_id']);
                            if (roominfo['liveStatus']===1){
                                setStream(liveRoomInfo['room_id'], video, 1);
                            }else{
                                if (flv!==null) {
                                    hlsStream?flv.detachMedia():flv.destroy();
                                }
                                abortFlag.abort('user cancel');
                                console.log(`Stream ${liveRoomInfo['uid']} closed.`);
                                revokeEventListener();
                                videoContainer.remove();
                                videoStream.delete(liveRoomInfo['uid']);
                                let i = selectedList.indexOf(liveRoomInfo['uid']);
                                selectedList.splice(i, 1);
                                if (videoStream.size===0){
                                    saveRoomList.classList.add('disabled');
                                }
                                calculateLayout(videoColum, videoStream.size);
                                if (hb!==null)
                                    hb.stop();
                            }
                        }
                    }
                }
            });

            videoContainer.classList.add('video-stream');
            videoContainer.append(video);
            videoContainer.append(previewVideo);
            video.onpause = ()=>{
                video.play().catch(e=>{});
            };
            previewVideo.onpause = ()=>{
                previewVideo.play().catch(e=>{});
            };// pause auto play.

            let videoOwnerInfoContainer = document.createElement('div');
            nameAlwaysOn?videoOwnerInfoContainer.style.display = 'flex':videoOwnerInfoContainer.style.display = 'none';
            videoOwnerInfoContainer.classList.add('video-owner-info-container');
            videoOwnerInfoContainer.innerHTML = `
            
                <a class="owner-avatar" href="https://space.bilibili.com/${liveRoomInfo['uid']}" target="_blank"><img src="${liveRoomInfo['face']}"></a>
                <div class="owner-text-info">
                    <div class="owner-room-title"><a href="https://live.bilibili.com/${liveRoomInfo['room_id']}" target="_blank">${liveRoomInfo['title']}</a></div>
                    <div class="owner-misc">
                        <div class="owner-name"><a href="https://space.bilibili.com/${liveRoomInfo['uid']}" target="_blank">${liveRoomInfo['uname']}</a></div>
                        <div style="margin: 0 5px">|</div>
                        <div class="live-zone">${liveRoomInfo['area_v2_name']}</div>
                        <div style="margin: 0 5px">|</div>
                        <div class="live-status-btn" style="cursor: pointer" id="live-status-btn-${liveRoomInfo['room_id']}">显示统计信息</div>
                    </div>
                </div>
            
            `;

            let videoControlBackground = document.createElement('div');
            videoControlBackground.setAttribute('style', `display: block; position: absolute; bottom: 0px; width: 100%; height: 56px; background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)); visibility: hidden;z-index:2`);
            videoContainer.append(videoControlBackground);

            let videoControlContainer = document.createElement('div');
            videoControlContainer.innerHTML += `<div style="position: relative; user-select: none; z-index: 5; display: none"><div class="control-area"><div class="left"><div class="volume"><div class="volume-control ${asmrMode?'asmr':''}" style="display: none"><div class="vertical-slider"><div class="number">${asmrMode?asmrVolume:100}</div><div class="slider-rail"><div class="rail-background"></div><div class="slider-handle" style="top: ${asmrMode?100-asmrVolume:0}px;" vol="${asmrMode?asmrVolume:100}" ovol="100"></div><div class="slider-track" style="height: ${asmrMode?asmrVolume:100}%;"></div></div></div></div><span class="icon"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36; display: none;" xml:space="preserve"><path class="st0" d="M25.8,25.8c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0l-2.3-2.3c-0.2,0.1-0.4,0.2-0.6,0.3c-0.5,0.2-1.1,0-1.3-0.5\tc-0.2-0.5,0-1.1,0.5-1.3l0,0l-2.6-2.6v3.1c0,0.3-0.2,0.5-0.5,0.5c-0.1,0-0.2,0-0.3-0.1l-4.2-3.4h-1c-1.1,0-2-0.9-2-2v-2\tc0-1.1,0.9-2,2-2h0.2l-3.4-3.4c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0L25.8,25.8z"></path><path class="st0" d="M21.4,10.8c4,1.9,5.7,6.7,3.8,10.7c-0.1,0.2-0.2,0.4-0.3,0.6l-1.5-1.5c1.4-3,0.2-6.6-2.8-8l0,0\tc-0.5-0.2-0.7-0.8-0.5-1.3l0,0C20.4,10.7,21,10.5,21.4,10.8z"></path><path class="st0" d="M20,14.5c1.2,0.7,2,2,2,3.5c0,0.3,0,0.7-0.1,1L20,17.1V14.5z"></path><path class="st0" d="M17.9,11.7C18,11.8,18,11.9,18,12v3.1l-2.3-2.3l1.5-1.2C17.4,11.5,17.7,11.5,17.9,11.7z"></path></svg><svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve"><path class="st0" d="M20,14.5c1.9,1.1,2.6,3.6,1.5,5.5c-0.3,0.6-0.9,1.1-1.5,1.5V14.5z"></path><path class="st0" d="M21.4,10.7c4,1.9,5.7,6.7,3.8,10.7c-0.8,1.7-2,3-3.7,3.8c-0.5,0.2-1.1,0-1.3-0.5l0,0c-0.2-0.5,0-1.1,0.5-1.3\tc2.9-1.5,4.1-4.9,2.7-8c-0.6-1.2-1.6-2.3-2.8-2.8c-0.5-0.2-0.7-0.8-0.5-1.3S20.8,10.5,21.4,10.7C21.3,10.7,21.3,10.7,21.4,10.7\tL21.4,10.7z"></path><path class="st0" d="M17.9,11.7c0.1,0.1,0.1,0.1,0.1,0.2l0.1,12c0,0.3-0.2,0.5-0.5,0.5c-0.1,0-0.2,0-0.3-0.1l-4.2-3.4h-1\tc-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h1l4.1-3.3C17.4,11.5,17.7,11.5,17.9,11.7L17.9,11.7z"></path></svg></span></div><div class="refresh-stream"><span class="icon"><svg viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="终稿" stroke="none" stroke-width="1" fill-rule="evenodd" opacity="0.9"><g id="图标切图" transform="translate(-475.000000, -74.000000)" fill-rule="nonzero"><g id="编组-3" transform="translate(421.000000, 56.000000)"><g id="编组-12" transform="translate(54.000000, 18.000000)"><g id="icon_刷新" transform="translate(11.000000, 9.000000)"><path d="M1.1040804,5.51795009 L2.56593636,6.98003284 C2.20442812,7.67167421 2,8.45841034 2,9.29289322 C2,12.054317 4.23857625,14.2928932 7,14.2928932 L7,12.5 C7,12.3673918 7.05267842,12.2402148 7.14644661,12.1464466 C7.34170876,11.9511845 7.65829124,11.9511845 7.85355339,12.1464466 L7.85355339,12.1464466 L10.6464466,14.9393398 C10.8417088,15.134602 10.8417088,15.4511845 10.6464466,15.6464466 L10.6464466,15.6464466 L7.85355339,18.4393398 C7.7597852,18.533108 7.63260824,18.5857864 7.5,18.5857864 C7.22385763,18.5857864 7,18.3619288 7,18.0857864 L7,18.0857864 L7,16.2928932 C3.13400675,16.2928932 0,13.1588865 0,9.29289322 C0,7.90269507 0.405257589,6.6071499 1.1040804,5.51795009 Z M6.85355339,0.146446609 C6.94732158,0.240214799 7,0.367391755 7,0.5 L7,2.29289322 C10.8659932,2.29289322 14,5.42689997 14,9.29289322 C14,10.682663 13.5949921,11.977838 12.8965656,13.0668293 L11.4343158,11.6052711 C11.7956669,10.9137463 12,10.127182 12,9.29289322 C12,6.53146947 9.76142375,4.29289322 7,4.29289322 L7,6.08578644 C7,6.36192881 6.77614237,6.58578644 6.5,6.58578644 C6.36739176,6.58578644 6.2402148,6.53310802 6.14644661,6.43933983 L3.35355339,3.64644661 C3.15829124,3.45118446 3.15829124,3.13460197 3.35355339,2.93933983 L6.14644661,0.146446609 C6.34170876,-0.0488155365 6.65829124,-0.0488155365 6.85355339,0.146446609 Z" id="Combined-Shape"></path></g></g></g></g></g></svg></span></div><div class="frame-chasing"><div><span class="icon"><svg class="squirtle-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path d="M16 5a1 1 0 00-1 1v4.615a1.431 1.431 0 00-.615-.829L7.21 5.23A1.439 1.439 0 005 6.445v9.11a1.44 1.44 0 002.21 1.215l7.175-4.555a1.436 1.436 0 00.616-.828V16a1 1 0 002 0V6C17 5.448 16.552 5 16 5z" style="transform: scale(0.75);transform-origin: center;"></path></svg></span></div></div></div><div class="danmaku"><div class="input-container"><input placeholder="发个弹幕呗～"><span>0/20</span></div><div class="send-danmaku">发送</div><div class="emoji-bg"></div><div class="emoji-sec"></div></div><div class="right"><div class="close"><div><span class="icon"><svg class="rua-cross" viewBox="0 0 100 100"><rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(45deg);"/><rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(135deg);"/></svg></span></div></div><div class="asmr-button" style="display: ${asmrMode?'block':'none'}">奥数</div></div></div></div>`;
            let currentVolume = 100, lastVolume = currentVolume, silence = false, hideControl = null, hideFlag = false, inputLock = false;
            nameAlwaysOn?videoOwnerInfoContainer.classList.add('video-owner-info-always-on'):videoOwnerInfoContainer.classList.remove('video-owner-info-always-on');
            function hiddenControl(){
                if (!hideFlag && !inputLock && !showStatus){
                    videoControlBackground.style.visibility = 'hidden';
                    videoControlContainer.firstElementChild.style.display = 'none';
                    if (!nameAlwaysOn) {
                        videoOwnerInfoContainer.style.display = 'none';
                        videoOwnerInfoContainer.classList.remove('video-owner-info-always-on');
                    }
                    else
                        videoOwnerInfoContainer.classList.add('video-owner-info-always-on');
                }
            }

            videoContainer.onmousemove = () =>{
                clearTimeout(hideControl);
                videoControlBackground.style.visibility = 'visible';
                videoControlContainer.firstElementChild.style.display = 'block';
                videoOwnerInfoContainer.style.display = 'flex';
                if (nameAlwaysOn)
                    videoOwnerInfoContainer.classList.remove('video-owner-info-always-on');
                hideControl = setTimeout(hiddenControl, 1000);
            };


            videoContainer.onclick = ()=>{
                hiddenControl();
            }

            videoControlContainer.onmouseenter = ()=>{
                hideFlag = true;
            }

            videoControlContainer.onmouseleave = ()=>{
                hideFlag = false;
            }

            //show/hide volume solider
            videoControlContainer.getElementsByClassName('volume')[0].onmouseenter = ()=>{
                videoControlContainer.getElementsByClassName('volume-control')[0].style.display = 'block';
            };
            videoControlContainer.getElementsByClassName('volume')[0].onmouseleave = ()=>{
                if (!volumeLock)
                    videoControlContainer.getElementsByClassName('volume-control')[0].style.display = 'none';
            };
            let volumeControl = videoControlContainer.getElementsByClassName('slider-rail')[0];
            //volume slider event
            volumeControl.onmousedown = (e)=>{
                e.stopPropagation();
                volumeLock = true;
                let absOffset = asmrMode?194:100;
                let elementY = getAbsLocation(volumeControl)[1] - absOffset;
                let upperLimit = asmrMode?100:53
                let lowerLimit = 0;
                if (asmrMode && !video.classList.contains('asmr'))
                    lowerLimit = 100 - asmrVolume;
                if (e.y - elementY >= lowerLimit && e.y - elementY <= upperLimit) {
                    volumeControl.getElementsByClassName('slider-handle')[0].style.top = (e.y - elementY) + 'px';
                    currentVolume = asmrMode?100-(e.y - elementY):Math.round((1 - (e.y - elementY)/53.0)*100);
                    volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('vol',currentVolume);
                    if(!asmrMode)
                        volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('ovol',currentVolume);
                    videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                    volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
                    video.volume = currentVolume /100.0 * masterAudioVolumeFactor;
                    previewVideo.volume = currentVolume / 100.0 * masterAudioVolumeFactor;
                    if (currentVolume === 0){
                        silence = !silence;
                        lastVolume = currentVolume;
                        videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'none';
                        videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'block';
                    }else{
                        silence = false;
                        videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'none';
                        videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'block';
                    }
                }

                volumeControl.onmousemove = (e)=>{
                    e.stopPropagation();
                    let upperLimit = asmrMode?100:53
                    let lowerLimit = 0;
                    if (asmrMode && !video.classList.contains('asmr'))
                        lowerLimit = 100 - asmrVolume;
                    if (e.y - elementY >= lowerLimit && e.y - elementY <= upperLimit) {
                        volumeControl.getElementsByClassName('slider-handle')[0].style.transition = 'none';
                        volumeControl.getElementsByClassName('slider-track')[0].style.transition = 'none';
                        volumeControl.getElementsByClassName('slider-handle')[0].style.top = (e.y - elementY) + 'px';
                        currentVolume = asmrMode?100-(e.y - elementY):Math.round((1 - (e.y - elementY)/53.0)*100);
                        volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('vol',currentVolume);
                        if(!asmrMode)
                            volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('ovol',currentVolume);
                        videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                        volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
                        video.volume = currentVolume /100.0;
                        previewVideo.volume = currentVolume / 100.0;
                        if (currentVolume === 0){
                            silence = !silence;
                            lastVolume = currentVolume;
                            videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'none';
                            videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'block';
                        }else{
                            silence = false;
                            videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'none';
                            videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'block';
                        }
                    }
                };
                volumeControl.onmouseup = (e)=>{
                    e.stopPropagation();
                    volumeControl.onmousemove = null;
                    volumeControl.onmouseup = null;
                    volumeControl.getElementsByClassName('slider-handle')[0].style.transition = '';
                    volumeControl.getElementsByClassName('slider-track')[0].style.transition = '';
                    volumeLock = false;
                }
                volumeControl.onmouseleave = (e)=>{
                    e.stopPropagation();
                    volumeControl.onmousemove = null;
                    volumeControl.onmouseup = null;
                    volumeControl.getElementsByClassName('slider-handle')[0].style.transition = '';
                    volumeControl.getElementsByClassName('slider-track')[0].style.transition = '';
                }
            };
            //volume wheel event
            videoControlContainer.getElementsByClassName('volume')[0].onwheel = (e)=>{
                let volumeInterval = asmrMode?(e.deltaY>0?1:-1):e.deltaY;
                currentVolume-=(volumeInterval/10.0);
                if (currentVolume > 100) currentVolume = 100;
                if (asmrMode && !video.classList.contains('asmr'))
                    currentVolume = asmrVolume;
                if (currentVolume < 0) currentVolume = 0;
                if (currentVolume === 0) {
                    silence = true;
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'none';
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'block';
                }else{
                    if (silence){
                        videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'none';
                        videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'block';
                        silence = false;
                    }
                }
                currentVolume = Math.round(currentVolume);
                video.volume = currentVolume / 100.0;
                previewVideo.volume = currentVolume / 100.0;
                videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                volumeControl.getElementsByClassName('slider-handle')[0].style.top = asmrMode?(100-currentVolume):(53 - currentVolume / 100.0 * 53) + 'px';
                volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
            };
            //volume icon event & mute
            videoControlContainer.getElementsByClassName('icon')[0].onmouseup = (e)=>{
                e.stopPropagation();
                if (silence){
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'none';
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'block';
                    if (asmrMode && lastVolume > asmrVolume)
                        currentVolume = asmrVolume;
                    else
                        currentVolume = lastVolume;
                    volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('vol', currentVolume+'');
                }else{
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'none';
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'block';
                    lastVolume = currentVolume;
                    currentVolume = 0;
                    volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('vol', '0')
                }
                silence = !silence;
                video.volume = currentVolume / 100.0;
                previewVideo.volume = currentVolume / 100.0;
                videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                volumeControl.getElementsByClassName('slider-handle')[0].style.top = asmrMode?(100-currentVolume) + 'px':(53 - currentVolume / 100.0 * 53) + 'px';
                volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
            };
            //close video player
            videoControlContainer.getElementsByClassName('close')[0].onclick = ()=>{
                if (flv!==null){
                    //disconnect from stream, destroy player
                    hlsStream?flv.detachMedia():flv.destroy();
                }
                abortFlag.abort('user cancel');
                abortFetchPreview.abort('user cancel');
                console.log('close '+ liveRoomInfo['uid']);
                revokeEventListener();
                videoContainer.remove();
                let i = selectedList.indexOf(liveRoomInfo['uid']);
                selectedList.splice(i, 1);
                videoStream.delete(liveRoomInfo['uid']);
                if (videoStream.size===0){
                    saveRoomList.classList.add('disabled');
                }
                calculateLayout(videoColum, videoStream.size);
                if (hb!==null)
                    hb.stop();
            };

            // refresh event
            videoControlContainer.getElementsByClassName('refresh-stream')[0].onclick = ()=>{
                if (flv!==null){
                    hlsStream?flv.detachMedia():flv.destroy();
                }
            };

            // frame chasing event
            videoControlContainer.getElementsByClassName('frame-chasing')[0].onclick = ()=>{
                try{
                    video.currentTime = video.buffered.end(0) - 1;
                }catch (e){}//silence handling here which you should not, but doesn't matter here.
            };

            // asmr stream marker
            videoControlContainer.getElementsByClassName('asmr-button')[0].onclick = ()=>{
                if (!videoControlContainer.getElementsByClassName('asmr-button')[0].classList.contains('checked')){
                    videoControlContainer.getElementsByClassName('asmr-button')[0].classList.add('checked');
                    videoControlContainer.getElementsByClassName('volume-control')[0].classList.add('asmr-picked');
                    video.classList.add('asmr');
                }else{
                    videoControlContainer.getElementsByClassName('asmr-button')[0].classList.remove('checked');
                    video.classList.remove('asmr');
                    video.volume = asmrVolume / 100.0;
                    volumeControl.getElementsByClassName('slider-handle')[0].setAttribute('vol',asmrVolume);
                    videoControlContainer.getElementsByClassName('number')[0].innerText = asmrVolume;
                    volumeControl.getElementsByClassName('slider-handle')[0].style.top = (100-asmrVolume) + 'px';
                    volumeControl.getElementsByClassName('slider-track')[0].style.height = asmrVolume + '%';
                    videoControlContainer.getElementsByClassName('volume-control')[0].classList.remove('asmr-picked');
                }
            }

            videoControlContainer.classList.add('video-player-control');

            const videoStatusInfoContainer = document.createElement('div');
            videoStatusInfoContainer.style.display = 'none';
            videoStatusInfoContainer.classList.add('video-status-info-container');
            videoStatusInfoContainer.id = `video-status-info-container-${liveRoomInfo['room_id']}`;
            videoContainer.append(videoStatusInfoContainer);
            videoContainer.append(videoOwnerInfoContainer);
            videoContainer.append(videoControlContainer);
            videoColum.append(videoContainer);
            updateMedal(liveRoomInfo['uid'], true);
            console.log(quality)
            if (quality!=0){
                setTimeout(()=>{
                    setStream(liveRoomInfo['room_id'], video);
                }, 2000);
            }
            setPreview(liveRoomInfo['short_id']===0?liveRoomInfo['room_id']:liveRoomInfo['short_id'], previewVideo, 0);
            if (heartBeatSwitch) {
                hb = new HeartBeat(liveRoomInfo['area_v2_parent_id'], liveRoomInfo['area_v2_id'], liveRoomInfo['room_id'], liveRoomInfo['uid']);
                hb.E();
            }


            let liveStatusBtn = document.getElementById(`live-status-btn-${liveRoomInfo['room_id']}`);
            liveStatusBtn.onclick = (e)=>{
                showStatus = !showStatus;
                if(showStatus){
                    liveStatusBtn.innerText = '隐藏统计信息';
                    videoStatusInfoContainer.removeAttribute('style');
                    updateMetaInfo(videoStatusInfoContainer);
                }else{
                    videoStatusInfoContainer.style.display = 'none';
                    liveStatusBtn.innerText = '显示统计信息';
                }
            };

            function revokeEventListener(){
                video.onpause = null;
                previewVideo.onpause = null;
                videoContainer.onmousemove = null;
                videoContainer.onclick = null;
                videoControlContainer.onmouseenter = null;
                videoControlContainer.onmouseleave = null;
                videoControlContainer.getElementsByClassName('volume')[0].onmouseenter = null;
                videoControlContainer.getElementsByClassName('volume')[0].onmouseleave = null;
                volumeControl.onmousedown = null;
                volumeControl.onmouseleave = null;
                volumeControl.onmousemove = null;
                volumeControl.onmouseup = null;
                videoControlContainer.getElementsByClassName('volume')[0].onwheel = null;
                videoControlContainer.getElementsByClassName('icon')[0].onmouseup = null;
                videoControlContainer.getElementsByClassName('close')[0].onclick = null;
                videoControlContainer.getElementsByClassName('asmr-button')[0].onclick = null;
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onkeyup;
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onkeydown;
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onselect = null;
                danmaku.getElementsByClassName('send-danmaku')[0].onclick = null;
                videoControlContainer.getElementsByClassName('frame-chasing')[0].onclick = null;
                videoControlContainer.getElementsByClassName('refresh-stream')[0].onclick = null;
                sourceEvent.disconnect();
                liveStatusBtn.onclick = null;
            }

            //danmaku
            let userInfo = await getUserPrivilege(liveRoomInfo['room_id']);
            let medalInfo = await getMedal(userInfo['uid'], liveRoomInfo['uid']);
            let danmaku = videoControlContainer.getElementsByClassName('danmaku')[0];
            let cursorSelection = [0,0], enterLock = true, unlock = true;
            //danmaku input event
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onfocus = ()=>{
                inputLock = true;
            }
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onblur = ()=>{
                inputLock = false;
            }
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].addEventListener('compositionstart', (e)=>{
                enterLock = false;
                unlock = false;
            });
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].addEventListener('compositionend', (e)=>{
                enterLock = true;
            });
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onkeyup = (e)=>{
                if(e.keyCode === 13 && unlock){
                    e.preventDefault();
                    packaging(danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value, 0, liveRoomInfo['room_id'], liveRoomInfo['uid']);
                    danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value = "";
                    //danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].blur();
                }
                if(enterLock) unlock = true; // unlock enter key when the first key after composition end has been pressed.
                cursorSelection = [danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].selectionStart, danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].selectionEnd];
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('span')[0].innerText = `${danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value.length<10?' ':''}${danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value.length}/${userInfo['totalLength']}`;
            };
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onkeydown = (e)=>{
                if(e.code === "Enter") e.preventDefault();
            };

            // update the current courser location.
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onselect = (e)=>{cursorSelection = [e.target.selectionStart, e.target.selectionEnd];};

            danmaku.getElementsByClassName('send-danmaku')[0].onclick = ()=>{
                packaging(danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value, 0, liveRoomInfo['room_id'], liveRoomInfo['uid']);
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value = "";
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('span')[0].innerText = `0/${userInfo['totalLength']}`;
            };
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('span')[0].innerText = `0/${userInfo['totalLength']}`;
            let lastUsed = 0;
            //set the emoji.
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+liveRoomInfo['room_id'], {
                method:"GET",
                credentials: 'include',
                body: null
            }).then(result => result.json())
                .then(json =>{
                    if(json['code']===0){
                        // let html = `<div style="display: flex; flex-wrap: wrap; margin: 0 7.5%;">`;
                        let html = danmaku.getElementsByClassName('emoji-sec')[0]
                        html.classList.add('emoji-tray')
                        if (json['code'] === 0){
                            // html = '';
                            const emojiHeader = document.createElement('div');
                            const emojiHeaderContent = document.createElement('div');
                            emojiHeaderContent.classList.add('rua-emoji-header');
                            emojiHeader.appendChild(emojiHeaderContent);
                            html.appendChild(emojiHeader);
                            emojiHeaderContent.addEventListener('wheel', (e)=>{
                                emojiHeaderContent.scrollLeft += e.deltaY;
                                emojiHeaderContent.scrollLeft += e.deltaX;
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
                                    emojiContainer.classList.add('rua-emoji-container-show');
                                    if (i===0)
                                        emojiContainer.classList.add('rua-emoji-container-show-xs');
                                }
                                headerItem.innerHTML += `<img src="${data[i]['current_cover']}"></div>`
                                headerItem.onclick = ()=>{
                                    for (let j = 0; j < emojiHeaderContent.childNodes.length; j++) {
                                        emojiHeaderContent.childNodes.item(j).classList.remove('active');
                                        html.getElementsByClassName('rua-emoji-container')[j].classList.remove('rua-emoji-container-show');
                                        if (j===0)
                                            html.getElementsByClassName('rua-emoji-container')[j].classList.remove('rua-emoji-container-show-xs');
                                        if (emojiHeaderContent.childNodes.item(j) === headerItem) {
                                            html.getElementsByClassName('rua-emoji-container')[j].classList.add('rua-emoji-container-show');
                                            if (j===0)
                                                html.getElementsByClassName('rua-emoji-container')[j].classList.add('rua-emoji-container-show-xs');
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
                                    // data[i]['emoticons'][j]['perm']===1?emoji.classList.add('rua-emoji-icon-active'):emoji.classList.add('rua-emoji-icon-inactive-new');
                                    emoji.title = data[i]['emoticons'][j]['emoji'];
                                    if (i === 0) emoji.classList.add('rua-emoji-item-xs');
                                    emoji.innerHTML += `<div class="rua-emoji-requirement" style="background-color: ${data[i]['emoticons'][j]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${data[i]['emoticons'][j]['unlock_show_text']}</div></div><img class="${data[i]['emoticons'][j]['perm']===1?'rua-emoji-icon-active':'rua-emoji-icon-inactive-new'}" src="${data[i]['emoticons'][j]['url']}">`;
                                    emoji.onclick = ()=>{
                                        let inputArea = danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0];
                                        if (!emoji.classList.contains('rua-emoji-icon-inactive-new') && i!==0)
                                            packaging(data[i]['emoticons'][j]['emoticon_unique'], "systemEmoji", liveRoomInfo['room_id'], liveRoomInfo['uid']);
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
                                html.appendChild(emojiContainer);
                            }
                        }
                    }
                })
                .catch(msg =>{
                    console.log(msg)
                });

            sourceEvent.observe(video, {attributes:true});
        }

        function updateMetaInfo(container){
            let nonMeta = videoMeta['metadata'] === null;

            container.innerHTML=`
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">Mime 类型:</div>
                        <div class="video-status-info-data">${videoMeta['mimeType']}</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">视频信息:</div>
                        <div class="video-status-info-data">${videoMeta['width']}x${videoMeta['height']}, ${nonMeta?'null':videoMeta['metadata']['framerate']}FPS, ${nonMeta?'null':videoMeta['metadata']['videodatarate']}Kbps</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">音频信息:</div>
                        <div class="video-status-info-data">${(videoMeta['audioSampleRate']-0)/1000.0}KHz, ${videoMeta['audioChannelCount']===2?'Stereo':videoMeta['audioChannelCount']}, ${videoMeta['audioDataRate']}Kbps</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">编码器:</div>
                        <div class="video-status-info-data">${nonMeta?'undefined':videoMeta['metadata']['encoder']}</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">视频编码:</div>
                        <div class="video-status-info-data">${videoMeta['videoCodec']}</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">视频流源:</div>
                        <div class="video-status-info-data">${videoMeta['streamURL']}</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">房间号:</div>
                        <div class="video-status-info-data">${videoMeta['trueID']}</div>
                    </div>
                    <div class="video-status-info-row">
                        <div class="video-status-info-title">短房间号:</div>
                        <div class="video-status-info-data">${videoMeta['shortID']}</div>
                    </div>`;
        }

        /**
         * Set the preview
         * */
        function setPreview(roomId, video, hostIndex){
            fetch(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${roomId}&no_playurl=0&mask=1&qn=0&platform=web&protocol=0,1&format=0,1,2&codec=0,1&dolby=5&panorama=1`, {
                method:"GET",
                credentials: "include",
                signal: abortFetchPreview.signal,
                body: null
            }).then(r=>r.json())
                .then(json=>{
                    if (json['code'] === 0){
                        console.log(requestPreview)
                        let previewURL = null;
                        if (typeof json['data']['playurl_info']['playurl']['stream']['0']['format']['0']['codec']['1'] === 'undefined')
                            previewURL = json['data']['playurl_info']['playurl']['stream']['0']['format']['0']['codec']['0'];
                        else previewURL = json['data']['playurl_info']['playurl']['stream']['0']['format']['0']['codec']['1'];
                        hlsStream = json['data']['playurl_info']['playurl']['stream']['0']['protocol_name'] === 'http_hls';
                        if(hlsStream){
                            if(Hls.isSupported()){
                                preview = new Hls();
                                preview.loadSource(previewURL['url_info'][hostIndex]['host']+previewURL['base_url']+previewURL['url_info'][hostIndex]['extra']);
                                preview.attachMedia(video);
                                preview.on(Hls.Events.MANIFEST_PARSED,function() {
                                    video.play();
                                });
                            }else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                                video.src = previewURL['url_info'][hostIndex]['host']+previewURL['base_url']+previewURL['url_info'][hostIndex]['extra'];
                            }
                        }else{
                            preview = mpegts.createPlayer({
                                type: "flv",
                                isLive: true,
                                url: previewURL['url_info'][hostIndex]['host']+previewURL['base_url']+previewURL['url_info'][hostIndex]['extra'],
                            });
                            preview.attachMediaElement(video);
                            preview.load();
                            try {
                                preview.play().catch(e=>{});
                            }catch (e){}
                            preview.on(mpegts.Events.ERROR, (e) => {
                                if (requestPreview){
                                    preview.unload();
                                    previewRetry = setTimeout(()=>{
                                        let host = hostIndex===0?1:0;
                                        setPreview(roomId, video, host);
                                    }, 1000);
                                }
                            });
                            preview.on(mpegts.Events.MEDIA_INFO, (metadata)=>{
                                videoMeta = metadata;
                                videoMeta['streamURL'] = previewURL['url_info'][hostIndex]['host'];
                                videoMeta['trueID'] = liveRoomInfo['room_id']
                                videoMeta['shortID'] = liveRoomInfo['short_id']===0?liveRoomInfo['room_id']:liveRoomInfo['short_id'];
                                updateMetaInfo(document.getElementById(`video-status-info-container-${roomId}`));
                            });
                        }
                    }
                })
        }

        /**
         * Fetch the live source URL.
         * */
        function setStream(roomId, video, preferIndex = 0) {
            /**
             * Bind the media to the video player.
             * */
            function setPlayer(url, video, index) {
                console.log(url)
                let frameChasing = null, streamSrc = url['url_info'][index]['host']+url['base_url']+url['url_info'][index]['extra'];
                if (hlsStream){
                    if(Hls.isSupported()){
                        flv = new Hls();
                        flv.loadSource(streamSrc);
                        flv.attachMedia(video);
                        flv.on(Hls.Events.MANIFEST_PARSED,function() {
                            video.play();
                            video.playbackRate = 1.0;
                        });
                        preview.detachMedia();
                        previewVideo.remove();
                        video.removeAttribute('style');
                    }else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = streamSrc;
                    }
                }else{
                    flv = mpegts.createPlayer({
                        type: "flv",
                        isLive: true,
                        url: streamSrc
                    });
                    flv.attachMediaElement(video);
                    flv.load();
                    flv.play().catch(e=>{});
                    frameChasing = setTimeout(()=>{
                        try{video.currentTime = video.buffered.end(0) - 1;}catch (e) {}
                    }, 2000);
                    flv.on(mpegts.Events.ERROR, (e) => {
                        console.log(e);
                        index = index + 1;
                        flv.unload();
                        clearTimeout(frameChasing);
                        if (index === url['url_info'].length) {
                            setTimeout(()=>{
                                setStream(roomId, video);
                            }, 1000);
                        }
                        else setPlayer(url, video, index);
                    });
                    flv.on(mpegts.Events.MEDIA_INFO, (metadata)=>{
                        console.log(metadata)
                        videoMeta = metadata;
                        videoMeta['streamURL'] = url['url_info'][index]['host'];
                        videoMeta['trueID'] = liveRoomInfo['room_id']
                        videoMeta['shortID'] = liveRoomInfo['short_id']===0?liveRoomInfo['room_id']:liveRoomInfo['short_id'];
                        updateMetaInfo(document.getElementById(`video-status-info-container-${roomId}`));
                        abortFetchPreview.abort('no needed');
                        requestPreview = false;
                        if (previewRetry !== null) {
                            clearTimeout(previewRetry);
                            previewRetry = null;
                        }
                        preview.destroy();
                        previewVideo.remove();
                        video.removeAttribute('style');
                    });
                }
            }
            fetch(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${roomId}&protocol=0&format=0,1,2&codec=0,1&platform=web&ptype=8&dolby=5&panorama=1&qn=${quality}`, {
                method: "GET",
                credentials: "include",
                signal:abortFlag.signal,
                body: null
            }).then(r => r.json())
                .then(json => {
                    if (json['code'] === 0) {
                        if(json['data']['playurl_info'] === null || json['data']['playurl_info']['playurl'] === null){
                            hlsStream?flv.detachMedia():flv.destroy();
                        }
                        else{
                            let flvFormat = json['data']['playurl_info']['playurl']['stream'][0]['format'][0]['codec'][0],
                                hevc = json['data']['playurl_info']['playurl']['stream'][0]['format'][0]['codec'][1];
                            //cross swap
                            if (hevc === null || typeof  hevc ==='undefined') hevc = flvFormat;
                            if (flvFormat === null || typeof  flvFormat ==='undefined') flvFormat = hevc;
                            if ((hevc === null || typeof  hevc ==='undefined') && (flvFormat === null || typeof  flvFormat ==='undefined')) setStream(roomId, video);
                            else setPlayer(flvFormat, video, preferIndex);
                        }

                    }else throw json['code'];
                })
                .catch(e => {
                    console.log(e);
                    if (!abortFlag.signal.aborted) {
                        setTimeout(() => {
                            setStream(roomId, video);
                        }, 1000);
                    }
            });
        }
    }

    async function updateMedal(uid, updateList = false){
        if (updateList)
            await getMedal(UID).then(r=>{globalMedalList = r;});
        if (wearMedalSwitch === 1 || (wearMedalSwitch === -1 && globalMedalList[0]['medal_info']['wearing_status'] === 1)){
            if (wearMedalSwitch === -1){
                wearMedal(globalMedalList[0]['medal_info']['medal_id']);
            }else{
                currentMedal = uid;
                for (const medal of globalMedalList){
                    if (medal['medal_info']['target_id'] === currentMedal){
                        wearMedal(medal['medal_info']['medal_id']);
                        break;
                    }
                }
            }
        }
    }

    function getRealRoomID(roomId){
        return fetch("https://api.live.bilibili.com/room/v1/Room/room_init?id="+roomId,{
            method:'GET',
            credentials:'include',
            body:null
        }).then(result => result.json())
            .then(json =>{
                if (json['code'] === 0){
                    return {'up': json['data']['uid'], 'roomid': json['data']['room_id'], 'liveStatus': json['data']['live_status']};
                }
                else{
                    throw json;
                }

            });
    }

    function getUserPrivilege(room_id){
        return fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?from=0&room_id="+room_id,{
            method:'GET',
            credentials:'include',
            body:null
        }).then(result => result.json())
            .then(json =>{
                if (json['code'] === 0) {
                    let emojiRequiredPrivilege = (json['data']['privilege']['privilege_type']-1+1)===0?4:json['data']['privilege']['privilege_type'];
                    let uid = json['data']['info']['uid'];
                    let totalLength = json['data']['property']['danmu']['length'];
                    return {'totalLength': totalLength, 'uid': uid, 'emojiRequiredPrivilege' : emojiRequiredPrivilege};
                }else{
                    return {'totalLength': 0, 'uid':-1, 'emojiRequiredPrivilege': -1};
                }
            }).catch(e=>{return {'totalLength': 0, 'uid':-1, 'emojiRequiredPrivilege': -1}});
    }

    function updateJCT() {
        try {
            chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
                JCT = lf.res.split(",")[0];
                UID = lf.res.split(",")[1];
            });
            chrome.runtime.sendMessage({msg:'get_LIVE_BUVID'}, function (buvid){
                BUVID = buvid['res']['value'];
            });
        } catch (e) {
            console.log(e)
        }
    }

    function getTimeSnap() {
        return Math.round(Date.now() / 1000);
    }

    async function packaging(msg, type, room_id, up_id) {
        if (currentMedal!==up_id && wearMedalSwitch === 1){
            currentMedal = up_id;
            for (const medal of globalMedalList){
                if (medal['medal_info']['target_id'] === currentMedal){
                    await wearMedal(medal['medal_info']['medal_id']);
                    break;
                }
            }
        }
        let DanMuForm = new FormData();
        DanMuForm.append("bubble", "0");
        DanMuForm.append("msg", msg);
        DanMuForm.append("color", "16777215");
        DanMuForm.append("mode", "1");
        if (type !== undefined && type === "systemEmoji") DanMuForm.append("dm_type", "1");
        DanMuForm.append("fontsize", "25");
        DanMuForm.append("rnd", getTimeSnap() + "");
        DanMuForm.append("roomid", room_id); // short id is not allowed.
        DanMuForm.append("csrf", JCT);
        DanMuForm.append("csrf_token", JCT);
        if (msg.length !== 0)
            send(DanMuForm);
    }

    function send(form) {
        fetch("https://api.live.bilibili.com/msg/send?requestFrom=rua5", {
            method: "POST",
            credentials: 'include',
            body: form
        })
            .then(result => result.json())
            .then(result => {
                console.log("sent");
                if (result['message'].length !== 0)
                    console.log('Error:', '你的弹幕被系统吞了，重试一下吧。');
                else if (result['message'] === '你所在的地区暂无法发言')
                    console.log('Error:', '你所在的地区暂无法发言');
            })
            .catch(error => {
                console.log('Error:', error);
            });
    }

    function getMedal(uid, upID){
        return fetch("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+uid,{
            method:"GET",
            credentials: 'include',
            body:null
        })
            .then(res => res.json())
            .then(json=>{
                if(json['code']===0){
                    if (typeof upID!=='undefined') {
                        for (let medalInfo of json['data']['list']) {
                            if (medalInfo['medal_info']['target_id'] === upID) {
                                return {
                                    'emojiRequiredMedalLevel': medalInfo['medal_info']['level'],
                                    'medal_id': medalInfo['medal_info']['medal_id'],
                                    'medal_name': medalInfo['medal_info']['medal_name']
                                };
                            }
                        }
                        return {'emojiRequiredMedalLevel': 0, 'medal_id': -1, 'medal_name': ''};
                    }else
                        return json['data']['list'];
                }else{
                    return {'emojiRequiredMedalLevel':0,'medal_id':-1,'medal_name':''};
                }
            })
            .catch(e=>{
                return {'emojiRequiredMedalLevel':0,'medal_id':-1,'medal_name':''};
            });
    }
    function wearMedal(medal){
        if(JCT !== "-1" && medal !==-1 && wearMedalSwitch !== 0){
            var madelForm = new FormData();
            madelForm.append("medal_id", medal);
            madelForm.append("csrf", JCT);
            madelForm.append("csrf_token", JCT);
            madelForm.append("visit_id", '');
            fetch(wearMedalSwitch===-1?'https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/take_off':`https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear`,{
                method:"POST",
                credentials: 'include',
                body:madelForm,
            })
                .then(res => {
                    console.log("ware medal successful, MID="+medal);
                });
        }
    }

    function HeartBeat(parentId, areaId, roomID, upID){
        const UserAgent = window.navigator.userAgent
        this.packageNumber = 0;
        this.packagePayload = {
            id:[parentId, areaId, this.packageNumber, roomID],
            device:[BUVID, getUUID()],
            ruid: upID,
            ts: Date.now(),
            is_patch: 0,
            heart_beat: [],
            ua: UserAgent
        };
        this.replayPayload={};
        this.timer = null;

        HeartBeat.prototype.E = async function(){
            if (heartBeatSwitch){
                await fetch('https://live-trace.bilibili.com/xlive/data-interface/v1/x25Kn/E', {
                    method:"POST",
                    credentials:"include",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded"
                    },
                    body:`${objToStr(this.packagePayload)}&csrf_token=${JCT}&csrf=${JCT}&visit_id:`
                }).then(r=>r.json())
                    .then(json=>{
                        if (json['code'] === 0){
                            this.packageNumber++;
                            this.timer = setInterval(()=>{this.X()}, (json['data']['heartbeat_interval']-0)*1000);
                            this.replayPayload = {
                                id: [parentId, areaId, this.packageNumber, roomID],
                                device: this.packagePayload["device"],
                                ruid: this.packagePayload['ruid'],
                                ets: json['data']['timestamp'],
                                benchmark: json['data']['secret_key'],
                                time: json['data']['heartbeat_interval'],
                                ts: Date.now(),
                                ua: UserAgent
                            };
                            this.replayPayload = Object.assign({s:encrypt(this.replayPayload, json['data']['secret_rule'])}, this.replayPayload);
                        }
                    })
                    .catch(e=>{
                        this.stop();
                        this.E();
                    });
            }
        }

        HeartBeat.prototype.X = async function(){
            if (heartBeatSwitch){
                await fetch('https://live-trace.bilibili.com/xlive/data-interface/v1/x25Kn/X', {
                    method:"POST",
                    credentials:"include",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded"
                    },
                    body:`${objToStr(this.replayPayload)}&csrf_token=${JCT}&csrf=${JCT}&visit_id:`
                }).then(r=>r.json())
                    .then(json=>{
                        if (json['code'] === 0){
                            this.packageNumber++;
                            this.replayPayload['id'] = [this.replayPayload['id'][0], this.replayPayload['id'][1], this.packageNumber, this.replayPayload['id'][3]];
                            this.replayPayload['benchmark'] = json['data']['secret_key'];
                            this.replayPayload['time'] = json['data']['heartbeat_interval'];
                            this.replayPayload['ets'] = json['data']['timestamp'];
                            this.replayPayload['s'] = encrypt(this.replayPayload, json['data']['secret_rule']);
                        }else{
                            this.stop();
                            this.E();
                        }
                    });
            }
        }

        HeartBeat.prototype.stop = function(){
            if (this.timer!==null){
                clearInterval(this.timer);
                this.timer = null;
            }
        }

        function getUUID(){
            let UUID = '';
            for (let i = 0; i < 36; i++) {
                const bit =  Math.floor(16 * Math.random());
                if (i===8 || i===13 || i===18 || i===23)
                    UUID+='-';
                else if (i===14)
                    UUID+='4';
                else if (i===19)
                    UUID+=(3&bit|8).toString(16);
                else UUID+=bit.toString(16);
            }
            return UUID;
        }

        function objToStr(object) {
            let out = "";
            for (const i in object) out += `${i}=${encodeURIComponent(i==='id'||i==='device'?JSON.stringify(object[i]):object[i])}&`;
            return out.slice(0, -1);
        }

        function encrypt(object, rule){
            let message = JSON.stringify({
                platform: 'web',
                parent_id: object['id'][0],
                area_id: object['id'][1],
                seq_id: object['id'][2],
                room_id: object['id'][3],
                buvid: object['device'][0],
                uuid: object['device'][1],
                ets: object['ets'],
                time: object['time'],
                ts: object['ts']
            });
            for(let i of rule){
                switch (i){
                    case 0:
                        message = CryptoJS.HmacMD5(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                        break;
                    case 1:
                        message = CryptoJS.HmacSHA1(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                        break;
                    case 2:
                        message = CryptoJS.HmacSHA256(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                        break;
                    case 3:
                        message = CryptoJS.HmacSHA224(message,object['benchmark']).toString(CryptoJS.enc.Hex);
                        break;
                    case 4:
                        message = CryptoJS.HmacSHA512(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                        break;
                    case 5:
                        message = CryptoJS.HmacSHA384(message, object['benchmark']).toString(CryptoJS.enc.Hex);
                        break;
                }
            }
            return message;
        }
    }

    function danmaku(){

    }

    function closeStream(){

    }
}();

// Recent watched: https://api.live.bilibili.com/xlive/web-ucenter/v1/history/get_for_wechat
// Search keyword: https://api.live.bilibili.com/av/v1/VideoConnection/onlineSearch?page=1&pagesize=20&search=${KEYWORD}&type=1&platform=h5&build=1