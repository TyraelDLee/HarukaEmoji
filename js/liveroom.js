!function () {

    let addRoom = null, exit = null, setting = null, controlPanel = document.getElementsByClassName('control-bar')[0],
        mouseEvent = null, isFullScreen = false, globalMedalList = null;
    let videoStream = new Map();
    let UID, JCT, BUVID, volumeLock = false, currentMedal = -1, wearMedalSwitch = 1, reconnectionTime = 10, quality = 10000, heartBeatSwitch = true;
    updateJCT();
    setInterval(updateJCT, 3000);
    setTimeout(()=>{getMedal(UID).then(r=>{globalMedalList = r;});}, 100);


    window.addEventListener("focus", function (){
        if (currentMedal>-1 && globalMedalList!==null && typeof globalMedalList !== 'undefined'){
            updateMedal(currentMedal);
        }
    });

    !function bindElements() {
        addRoom = document.getElementsByClassName('add-room')[0].getElementsByTagName('svg')[0];
        setting = document.getElementsByClassName('setting')[0].getElementsByTagName('svg')[0];
        exit = document.getElementsByClassName('fullscreen')[0].getElementsByTagName('svg')[0];

        let settingHeartBeat = document.getElementById('setting-heart-beat'), settingReconnection = document.getElementById('setting-re-try'),
        settingQuality = document.getElementById('setting-quality'), settingMedalOn = document.getElementById('setting-medal-switch-on'),
            settingMedalOff = document.getElementById('setting-medal-switch-off'), settingMedalNone = document.getElementById('setting-medal-switch-none');

        document.body.addEventListener('mousemove', (event) => {
            clearTimeout(mouseEvent);
            controlPanel.style.opacity = '1';
            mouseEvent = setTimeout(hideControl, 1000);
        });
        document.body.addEventListener('mouseup', ()=>{
            for (let i = 0; i < document.body.getElementsByClassName('volume-control').length; i++) {
                document.body.getElementsByClassName('volume-control')[i].style.display = 'none';
            }
        });

        chrome.storage.sync.get(['liveroom-medal-switch', 'liveroom-reconnection-time', 'liveroom-quality', 'liveroom-heart-beat'], (data)=>{
            wearMedalSwitch = data['liveroom-medal-switch'];
            switch (wearMedalSwitch) {
                case -1:
                    settingMedalNone.setAttribute('value', 'on');
                    settingMedalOn.setAttribute('value', 'off');
                    settingMedalOff.setAttribute('value', 'off');
                    break;
                case 0:
                    settingMedalOff.setAttribute('value', 'on');
                    settingMedalNone.setAttribute('value', 'off');
                    settingMedalOn.setAttribute('value', 'off');
                    break;
                case 1:
                    settingMedalOn.setAttribute('value', 'on');
                    settingMedalOff.setAttribute('value', 'off');
                    settingMedalNone.setAttribute('value', 'off');
                    break;
            }
            heartBeatSwitch = data['liveroom-heart-beat'];
            settingHeartBeat.checked = heartBeatSwitch;
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
            chrome.storage.sync.set({'liveroom-medal-switch': wearMedalSwitch}, ()=>{});
        });

        settingHeartBeat.addEventListener('change', ()=>{
            heartBeatSwitch = this.value;
            chrome.storage.sync.set({"liveroom-heart-beat":heartBeatSwitch}, function (){});
        });

        addRoom.addEventListener('click', () => {
            document.getElementsByClassName('panel-container')[0].removeEventListener('click', hidePanelContainer);
            document.getElementsByClassName('panel-container')[0].style.zIndex = '10';
            document.getElementsByClassName('panel-container')[0].style.display = 'block';
            document.getElementsByClassName('panel-container')[0].addEventListener('click', hidePanelContainer);
            document.getElementsByClassName('add-room-panel')[0].style.display = 'flex';
            document.getElementsByClassName('add-room-panel')[0].addEventListener('click', (e) => {
                e.stopPropagation();
            });
            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].onkeyup = (e)=>{
                if (document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.contains('error-input')){
                    document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.remove('error-input');
                    document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '';
                    document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].removeAttribute('style');
                }
                if (e.code === 'Enter'){
                    getRealRoomID(e.target.value).then(r=>{
                        if (r['liveStatus']!==1)
                            throw r;
                        else
                            getRooms([r['up']]);
                    }).catch(e=>{
                        console.log(e);
                        document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('input')[0].classList.add('error-input');
                        document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].setAttribute('style', `transform: translateY(0px);`);
                        if (e['liveStatus'] !== 1){
                            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '主播未开播';
                        }else if (e['msg'] === '直播间不存在'){
                            document.getElementsByClassName('add-room-panel')[0].getElementsByClassName('room-input')[0].getElementsByTagName('span')[0].innerHTML = '直播间不存在';
                        }
                    });
                }

            };
            getFollowingRoom();
        });

        setting.addEventListener('click', ()=>{
            document.getElementsByClassName('panel-container')[0].removeEventListener('click', hidePanelContainer);
            document.getElementsByClassName('panel-container')[0].style.zIndex = '10';
            document.getElementsByClassName('panel-container')[0].style.display = 'block';
            document.getElementsByClassName('panel-container')[0].addEventListener('click', hidePanelContainer);
            document.getElementsByClassName('setting-panel')[0].style.display = 'flex';
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
    }

    function getFollowingRoom() {
        fetch('https://api.bilibili.com/x/v2/reply/at', {
            method: "GET",
            credentials: "include",
            body: null
        }).then(r => r.json())
            .then(json => {
                let followList = [];
                if (json['code'] === 0) {
                    for (let i = 0; i < json['data']['groups'].length; i++) {
                        for (let j = 0; j < json['data']['groups']['' + i]['items'].length; j++) {
                            followList.push(json['data']['groups']['' + i]['items'][j + '']['mid']);
                        }
                    }
                }
                return followList;
            })
            .then(list => {
                getRooms(list);
            });
    }

    function getRooms(list){
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
                    if (list.length===1){
                        let liveroomData = data[list[0]];
                        bindVideoPlayer(liveroomData);
                        hidePanelContainer();
                    } else{
                        for (let i = 0; i < list.length; i++) {
                            if (data[list[i]] !== undefined) {
                                if (data[list[i]]["live_status"] === 1) {
                                    let liveroomData = data[list[i]];
                                    let liver = document.createElement('div');
                                    liver.classList.add('following-liver');
                                    liver.innerHTML = `<div class="user-face"><img src="${liveroomData['face']}"></div><div class="following-room-info"><span class="room-title">${liveroomData['title']}</span><span class="user-name">${liveroomData['uname']}</span></div>`;
                                    followingContainer.append(liver);
                                    liver.addEventListener('click', () => {
                                        bindVideoPlayer(liveroomData);
                                        hidePanelContainer();
                                    })
                                }
                            }
                        }
                    }
                }
            });
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

        function calculateLayout(element, numberOfVideo){
            if (numberOfVideo === 1){
                element.setAttribute('style', `--number-of-row:1; --number-of-column:1;`);
            }else if (numberOfVideo === 2){
                element.setAttribute('style', `--number-of-row:1; --number-of-column:0.5;`);
            }else if(numberOfVideo < 5){
                element.setAttribute('style', `--number-of-row:0.5; --number-of-column:0.5;`);
            }else if(numberOfVideo < 7){
                element.setAttribute('style', `--number-of-row:0.5; --number-of-column:0.33;`);
            }else if(numberOfVideo < 10){
                element.setAttribute('style', `--number-of-row:0.33; --number-of-column:0.33;`);
            }else if(numberOfVideo < 13){
                element.setAttribute('style', `--number-of-row:0.5; --number-of-column:0.25;`);
            }else{
                element.setAttribute('style', `--number-of-row:0.25; --number-of-column:0.25;`);
            }
        }

        let flv = null, abortFlag = new AbortController(), hb;
        if (videoStream.size < 16 && !videoStream.has(liveRoomInfo['uid'])) {
            videoStream.set(liveRoomInfo['uid'], liveRoomInfo);

            let video = document.createElement('video');
            let videoColum = document.getElementsByClassName('video-container')[0];
            calculateLayout(videoColum, videoStream.size);
            let videoContainer = document.createElement('div');

            // reconnection and auto-revoke player after live end.
            let sourceEvent = new MutationObserver( function (e){
                e.forEach(async function(mutation) {
                    if (mutation.type === "attributes") {
                        if (video.getAttribute('src')===null){
                            let roominfo = await getRealRoomID(liveRoomInfo['room_id']);
                            if (roominfo['liveStatus']===1){
                                setStream(liveRoomInfo['room_id'], video);
                                // hb = new HeartBeat(liveRoomInfo['area_v2_parent_id'], liveRoomInfo['area_v2_id'], liveRoomInfo['room_id'], liveRoomInfo['uid']);
                                // hb.E();
                            }else{
                                if (flv!==null)
                                    flv.destroy();
                                abortFlag.abort('user cancel');
                                console.log('close '+ liveRoomInfo['uid']);
                                revokeEventListener();
                                videoContainer.remove();
                                videoStream.delete(liveRoomInfo['uid']);
                                calculateLayout(videoColum, videoStream.size);
                                hb.stop();
                            }
                        }
                    }
                });
            });

            videoContainer.classList.add('video-stream');
            videoContainer.append(video);

            let videoControlBackground = document.createElement('div');
            videoControlBackground.setAttribute('style', `display: block; position: absolute; bottom: 0px; width: 100%; height: 56px; background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)); visibility: hidden;`);
            videoContainer.append(videoControlBackground);

            let videoControlContainer = document.createElement('div');
            videoControlContainer.innerHTML += `
            <div style="position: relative; user-select: none; z-index: 5; display: none">
                <div class="control-area">
                    <div class="left">
                        <div class="volume">
                            <div class="volume-control" style="display: none">
                                <div class="vertical-slider">
                                    <div class="number">100</div>
                                        <div class="slider-rail">
                                            <div class="slider-handle" style="top: 0px;"></div>
                                            <div class="slider-track" style="height: 100%;"></div>
                                        </div>
                                </div>
                            </div>
                            <span class="icon">
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36; display: none;" xml:space="preserve">
                                    <path class="st0" d="M25.8,25.8c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0l-2.3-2.3c-0.2,0.1-0.4,0.2-0.6,0.3c-0.5,0.2-1.1,0-1.3-0.5\tc-0.2-0.5,0-1.1,0.5-1.3l0,0l-2.6-2.6v3.1c0,0.3-0.2,0.5-0.5,0.5c-0.1,0-0.2,0-0.3-0.1l-4.2-3.4h-1c-1.1,0-2-0.9-2-2v-2\tc0-1.1,0.9-2,2-2h0.2l-3.4-3.4c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0L25.8,25.8z"></path>
                                    <path class="st0" d="M21.4,10.8c4,1.9,5.7,6.7,3.8,10.7c-0.1,0.2-0.2,0.4-0.3,0.6l-1.5-1.5c1.4-3,0.2-6.6-2.8-8l0,0\tc-0.5-0.2-0.7-0.8-0.5-1.3l0,0C20.4,10.7,21,10.5,21.4,10.8z"></path>  <path class="st0" d="M20,14.5c1.2,0.7,2,2,2,3.5c0,0.3,0,0.7-0.1,1L20,17.1V14.5z"></path>
                                    <path class="st0" d="M17.9,11.7C18,11.8,18,11.9,18,12v3.1l-2.3-2.3l1.5-1.2C17.4,11.5,17.7,11.5,17.9,11.7z"></path>
                                </svg>
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve">
                                    <path class="st0" d="M20,14.5c1.9,1.1,2.6,3.6,1.5,5.5c-0.3,0.6-0.9,1.1-1.5,1.5V14.5z"></path>
                                    <path class="st0" d="M21.4,10.7c4,1.9,5.7,6.7,3.8,10.7c-0.8,1.7-2,3-3.7,3.8c-0.5,0.2-1.1,0-1.3-0.5l0,0c-0.2-0.5,0-1.1,0.5-1.3\tc2.9-1.5,4.1-4.9,2.7-8c-0.6-1.2-1.6-2.3-2.8-2.8c-0.5-0.2-0.7-0.8-0.5-1.3S20.8,10.5,21.4,10.7C21.3,10.7,21.3,10.7,21.4,10.7\tL21.4,10.7z"></path>
                                    <path class="st0" d="M17.9,11.7c0.1,0.1,0.1,0.1,0.1,0.2l0.1,12c0,0.3-0.2,0.5-0.5,0.5c-0.1,0-0.2,0-0.3-0.1l-4.2-3.4h-1\tc-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h1l4.1-3.3C17.4,11.5,17.7,11.5,17.9,11.7L17.9,11.7z"></path>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div class="danmaku">
                        <div class="input-container">
                            <input placeholder="发个弹幕呗～">
                            <span>0/20</span>
                        </div>
                        <div class="send-danmaku">发送</div>
                        <div class="emoji-bg"></div>
                        <div class="emoji-sec"></div>
                    </div>
                    <div class="right">
                        <div class="close">
                            <div>
                                <span class="icon">
                                    <svg class="rua-cross" viewBox="0 0 100 100" >
                                        <rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(45deg);"/>
                                        <rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(135deg);"/>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            let currentVolume = 100, lastVolume = currentVolume, silence = false, hideControl = null, hideFlag = false;

            function hiddenControl(){
                if (!hideFlag){
                    videoControlBackground.style.visibility = 'hidden';
                    videoControlContainer.firstElementChild.style.display = 'none';
                }
            }

            videoContainer.onmousemove = () =>{
                clearTimeout(hideControl);
                videoControlBackground.style.visibility = 'visible';
                videoControlContainer.firstElementChild.style.display = 'block';
                hideControl = setTimeout(hiddenControl, 1000);
            };

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
                let elementY = getAbsLocation(volumeControl)[1] - 100;
                if (e.y - elementY >=0 && e.y - elementY <= 53){
                    volumeControl.getElementsByClassName('slider-handle')[0].style.top = (e.y - elementY) + 'px';
                    currentVolume = Math.round((1 - (e.y - elementY)/53.0)*100);
                    videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                    volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
                    video.volume = currentVolume /100.0;
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
                    if (e.y - elementY >=0 && e.y - elementY <= 53) {
                        volumeControl.getElementsByClassName('slider-handle')[0].style.transition = 'none';
                        volumeControl.getElementsByClassName('slider-track')[0].style.transition = 'none';
                        volumeControl.getElementsByClassName('slider-handle')[0].style.top = (e.y - elementY) + 'px';
                        currentVolume = Math.round((1 - (e.y - elementY)/53.0)*100);
                        videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                        volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
                        video.volume = currentVolume /100.0;
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
                currentVolume-=(e.deltaY/10.0);
                if (currentVolume > 100) currentVolume = 100;
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
                videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                volumeControl.getElementsByClassName('slider-handle')[0].style.top = (53 - currentVolume / 100.0 * 53) + 'px';
                volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
            };
            //volume icon event
            videoControlContainer.getElementsByClassName('icon')[0].onmouseup = (e)=>{
                e.stopPropagation();
                if (silence){
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'none';
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'block';
                    currentVolume = lastVolume;
                }else{
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[1].style.display = 'none';
                    videoControlContainer.getElementsByClassName('icon')[0].getElementsByTagName('svg')[0].style.display = 'block';
                    lastVolume = currentVolume;
                    currentVolume = 0;
                }
                silence = !silence;
                video.volume = currentVolume / 100.0;
                videoControlContainer.getElementsByClassName('number')[0].innerText = currentVolume;
                volumeControl.getElementsByClassName('slider-handle')[0].style.top = (53 - currentVolume / 100.0 * 53) + 'px';
                volumeControl.getElementsByClassName('slider-track')[0].style.height = currentVolume + '%';
            };
            //close video player
            videoControlContainer.getElementsByClassName('close')[0].onclick = ()=>{
                if (flv!==null){
                    //disconnect from stream, destroy player
                    flv.destroy();
                }
                abortFlag.abort('user cancel');
                console.log('close '+ liveRoomInfo['uid']);
                revokeEventListener();
                videoContainer.remove();
                videoStream.delete(liveRoomInfo['uid']);
                calculateLayout(videoColum, videoStream.size);
                hb.stop();
            };
            videoControlContainer.classList.add('video-player-control');

            videoContainer.append(videoControlContainer);
            videoColum.append(videoContainer);
            updateMedal(liveRoomInfo['uid'], true);
            setStream(liveRoomInfo['room_id'], video);
            hb = new HeartBeat(liveRoomInfo['area_v2_parent_id'], liveRoomInfo['area_v2_id'], liveRoomInfo['room_id'], liveRoomInfo['uid']);
            hb.E();

            function revokeEventListener(){
                videoContainer.onmousemove = null;
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
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onkeyup;
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onkeydown;
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].onselect = null;
                danmaku.getElementsByClassName('send-danmaku')[0].onclick = null;
                sourceEvent.disconnect();
            }

            //danmaku
            let userInfo = await getUserPrivilege(liveRoomInfo['room_id']);
            let medalInfo = await getMedal(userInfo['uid'], liveRoomInfo['uid']);
            let danmaku = videoControlContainer.getElementsByClassName('danmaku')[0];
            let cursorSelection = [0,0], enterLock = true, unlock = true;
            //danmaku input event
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

            //set the emoji.
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+liveRoomInfo['room_id'], {
                method:"GET",
                credentials: 'include',
                body: null
            }).then(result => result.json())
                .then(json =>{
                    if(json['code']===0){
                        let html = `<div style="display: flex; flex-wrap: wrap; margin: 0 7.5%;">`;
                        for (let j = 3; j >= 0; j--) {
                            if(json['data']['data'][j]!==undefined && json['data']['data'][j]!==null){
                                html += `<span class="emoji-header">${json['data']['data'][j]['pkg_name']}</span>`;
                                for (let i = 0; i < json['data']['data'][j]['emoticons'].length; i++) {
                                    //let able = json['data']['data'][j]['emoticons'][i]['perm']===1;//userInfo['emojiRequiredPrivilege'] <= json['data']['data'][j]['emoticons'][i]['identity'] && json['data']['data'][j]['emoticons'][i]['unlock_need_level'] <= medalInfo['emojiRequiredMedalLevel'];
                                    html += `<div class="rua-emoji-icon-container"><div class="rua-emoji-icon ${json['data']['data'][j]['emoticons'][i]['perm']===1?'rua-emoji-icon-active':'rua-emoji-icon-inactive'}" title="${json['data']['data'][j]['emoticons'][i]['emoji']}" content="${json['data']['data'][j]['emoticons'][i]['emoticon_unique']}" style="background-image:url('${json['data']['data'][j]['emoticons'][i]['url'].replace("http://", "https://")}');"></div><div class="rua-emoji-requirement" style="background-color: ${json['data']['data'][j]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][j]['emoticons'][i]['unlock_show_text']}</div></div></div>`;
                                }
                            }
                        }
                        html += '</div>';
                        danmaku.getElementsByClassName('emoji-sec')[0].innerHTML = html;
                        for (let i = 0; i < danmaku.getElementsByClassName('emoji-sec')[0].getElementsByClassName('rua-emoji-icon-container').length; i++) {
                            danmaku.getElementsByClassName('emoji-sec')[0].getElementsByClassName('rua-emoji-icon')[i].onclick = (e)=>{
                                if (e.target.classList.contains('rua-emoji-icon-active')){
                                    danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].focus();
                                    packaging(e.target.getAttribute('content'), "systemEmoji", liveRoomInfo['room_id'], liveRoomInfo['uid']);
                                }
                            }
                        }
                    }
                })
                .catch(msg =>{
                    console.log(msg)
                });

            sourceEvent.observe(video, {attributes:true});
        }

        /**
         * Fetch the live source URL.
         * */
        function setStream(roomId, video) {
            /**
             * Bind the media to the video player.
             * */
            function setPlayer(url, video, index) {
                let frameChasing = null;
                if (flvjs.isSupported()) {
                    flv = flvjs.createPlayer({
                        type: "flv",
                        isLive: true,
                        url: url[index]['url']
                    });
                    flv.attachMediaElement(video);
                    video.addEventListener('sourceended', () => {
                        console.log('source ended');
                    })
                    flv.load();
                    flv.play();
                    frameChasing = setTimeout(()=>{
                        video.currentTime = video.buffered.end(0) - 1;
                    }, 2000);
                    flv.on(flvjs.Events.ERROR, (e) => {
                        console.log('error');
                        console.log(e);
                        index = index + 1;
                        flv.unload();
                        clearTimeout(frameChasing);
                        if (index === url.length)
                            setStream(roomId, video);
                        else setPlayer(url, video, index);
                    });
                }
            }

            fetch(`https://api.live.bilibili.com/room/v1/Room/playUrl?cid=${roomId}&qn=10000`, {
                method: "GET",
                credentials: "include",
                signal:abortFlag.signal,
                body: null
            }).then(r => r.json())
                .then(json => {
                    if (json['code'] === 0) {
                        setPlayer(json['data']['durl'], video, 0);
                    }else throw json['code'];
                })
                .catch(e => {
                    console.log(e);
                    setTimeout(()=>{
                        setStream(roomId, video);
                    }, 1000);
            });
        }
    }

    async function updateMedal(uid, updateList = false){
        if (updateList)
            await getMedal(UID).then(r=>{globalMedalList = r;});
        if (wearMedalSwitch === 1 || (wearMedalSwitch === -1 && globalMedalList[0]['medal_info']['wearing_status'] === 1)){
            currentMedal = uid;
            for (const medal of globalMedalList){
                if (medal['medal_info']['target_id'] === currentMedal){
                    wearMedal(medal['medal_info']['medal_id']);
                    break;
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
                    console.error('Error:', '你的弹幕被系统吞了，重试一下吧。');
                else if (result['message'] === '你所在的地区暂无法发言')
                    console.error('Error:', '你所在的地区暂无法发言');
            })
            .catch(error => {
                console.error('Error:', error);
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
                })
        }

        HeartBeat.prototype.X = async function(){
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
                    }
                })
        }

        HeartBeat.prototype.stop = function(){
            console.log(this.timer);
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
}();

// TODO: add setting (quality, medal, exp, reconnection times), manual frame chasing, manual refresh stream.