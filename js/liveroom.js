!function () {

    let addRoom = null, exit = null, setting = null, controlPanel = document.getElementsByClassName('control-bar')[0],
        mouseEvent = null, isFullScreen = false;
    let videoStream = new Map();
    let UID, JCT, volumeLock = false, currentMedal = -1;
    updateJCT();
    setInterval(updateJCT, 3000);

    !function bindElements() {
        addRoom = document.getElementsByClassName('add-room')[0].getElementsByTagName('svg')[0];
        setting = document.getElementsByClassName('setting')[0].getElementsByTagName('svg')[0];
        exit = document.getElementsByClassName('fullscreen')[0].getElementsByTagName('svg')[0];

        document.body.addEventListener('mousemove', (event) => {
            clearTimeout(mouseEvent);
            controlPanel.style.opacity = '1';
            mouseEvent = setTimeout(hideControl, 1000);
        });
        document.body.addEventListener('mouseup', ()=>{
            for (let i = 0; i < document.body.getElementsByClassName('volume-control').length; i++) {
                document.body.getElementsByClassName('volume-control')[i].style.display = 'none';
            }
        })

        addRoom.addEventListener('click', () => {
            document.getElementsByClassName('panel-container')[0].removeEventListener('click', hidePanelContainer);
            document.getElementsByClassName('panel-container')[0].style.zIndex = '10';
            document.getElementsByClassName('panel-container')[0].style.display = 'block';
            document.getElementsByClassName('panel-container')[0].addEventListener('click', hidePanelContainer);
            document.getElementsByClassName('add-room-panel')[0].style.display = 'flex';
            document.getElementsByClassName('add-room-panel')[0].addEventListener('click', (e) => {
                e.stopPropagation();
            });
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
            getFollowingRoom();
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
                    })
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

        let flv = null, abortFlag = new AbortController();
        if (videoStream.size < 16 && !videoStream.has(liveRoomInfo['uid'])) {
            videoStream.set(liveRoomInfo['uid'], liveRoomInfo);

            let video = document.createElement('video');
            let videoColum = document.getElementsByClassName('video-container')[0];
            calculateLayout(videoColum, videoStream.size);
            let videoContainer = document.createElement('div');
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
                        <div class="emoji-sec">
                            <table></table>
                        </div>
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
                currentVolume+=e.deltaY;
                if (currentVolume > 100) currentVolume = 100;
                if (currentVolume < 0) currentVolume = 0;
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
                    flv.unload();
                }
                abortFlag.abort('user cancel');
                console.log('close '+ liveRoomInfo['uid'])
                videoContainer.remove();
                videoStream.delete(liveRoomInfo['uid']);
                calculateLayout(videoColum, videoStream.size);
            };
            videoControlContainer.classList.add('video-player-control');

            videoContainer.append(videoControlContainer);
            videoColum.append(videoContainer);
            setStream(liveRoomInfo['room_id'], video);

            //danmaku
            let userInfo = await getUserPrivilege(liveRoomInfo['room_id']);
            let roomInfo = await getRealRoomID(liveRoomInfo['room_id']);
            let medalInfo = await getMedal(roomInfo['up'], userInfo['uid']);
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
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].addEventListener("keyup", (e)=>{
                if(e.keyCode === 13 && unlock){
                    e.preventDefault();
                    packaging(danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value, 0, roomInfo['roomid']);
                    danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value = "";
                }
                if(enterLock) unlock = true; // unlock enter key when the first key after composition end has been pressed.
                cursorSelection = [danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].selectionStart, danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].selectionEnd];
                danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('span')[0].innerText = `${danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value.length<10?' ':''}${danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value.length}/${userInfo['totalLength']}`;
            });
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].addEventListener("keydown", (e)=>{
                if(e.code === "Enter") e.preventDefault();
            });

            // update the current courser location.
            danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].addEventListener("select", (e)=>{cursorSelection = [e.target.selectionStart, e.target.selectionEnd];});

            danmaku.getElementsByClassName('send-danmaku')[0].onclick = ()=>{
                packaging(danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].value, 0, roomInfo['roomid']);
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
                        let html = '';
                        for (let j = 2; j >= 0; j--) {
                            if(json['data']['data'][j]!==undefined && json['data']['data'][j]!==null){
                                html += `</tr></tbody><thead><tr><th colspan='4' class='rua-table-header'>${json['data']['data'][j]['pkg_name']}</th></tr></thead><tbody><tr>`;
                                for (let i = 0; i < json['data']['data'][j]['emoticons'].length; i++) {
                                    let able = userInfo['emojiRequiredPrivilege'] <= json['data']['data'][j]['emoticons'][i]['identity'] && json['data']['data'][j]['emoticons'][i]['unlock_need_level'] <= medalInfo['emojiRequiredMedalLevel'];
                                    if(i % 8 === 0 && i !== 0)
                                        html += '</tr><tr>';
                                    html += `<td colspan="1" title="${json['data']['data'][j]['emoticons'][i]['emoji']}" id="${json['data']['data'][j]['emoticons'][i]['emoticon_unique']}"><div  class="rua-emoji-icon ${able?'rua-emoji-icon-active':'rua-emoji-icon-inactive'}" style="width:60px; height:60px; background-image:url('${json['data']['data'][j]['emoticons'][i]['url'].replace("http://", "https://")}');"></div><div class="rua-emoji-requirement" style="background-color: ${json['data']['data'][j]['emoticons'][i]['unlock_show_color']};"><div class="rua-emoji-requirement-text">${json['data']['data'][j]['emoticons'][i]['unlock_show_text']}</div></div></td>`;
                                }
                            }
                        }
                        html += '</tr></tbody>';
                        danmaku.getElementsByClassName('emoji-sec')[0].getElementsByTagName('table')[0].innerHTML = html;

                        for (let i = 0; i < danmaku.getElementsByClassName('emoji-sec')[0].getElementsByTagName('table')[0].rows.length; i++) {
                            let cell = danmaku.getElementsByClassName('emoji-sec')[0].getElementsByTagName('table')[0].rows[i].cells;
                            for (let j = 0; j < cell.length; j++) {
                                const cellButton = cell[j].getElementsByTagName('div')[0];
                                cell[j].onclick = function (e){
                                    if(e.button === 0 && cellButton.classList.contains('rua-emoji-icon-active')){
                                        danmaku.getElementsByClassName('input-container')[0].getElementsByTagName('input')[0].focus();
                                        packaging(this.id, "systemEmoji", liveRoomInfo['room_id']);
                                    }
                                }
                            }
                        }
                    }
                })
                .catch(msg =>{});
        }

        function getRealRoomID(roomId){
            return fetch("https://api.live.bilibili.com/room/v1/Room/room_init?id="+roomId,{
                method:'GET',
                credentials:'include',
                body:null
            }).then(result => result.json())
                .then(json =>{
                    if (json['code'] === 0){
                        return {'up': json['data']['uid'], 'roomid': json['data']['room_id']};
                    }
                    else
                        setTimeout(getRealRoomID, 1000);

                }).catch(e=>{setTimeout(getRealRoomID, 1000)});
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
                    }
                }).catch(e=>{setTimeout(getUserPrivilege, 1000)});
        }

        /**
         * Fetch the live source URL.
         * */
        function setStream(roomId, video) {
            /**
             * Bind the media to the video player.
             * */
            function setPlayer(url, video, index) {
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
                    flv.on(flvjs.Events.ERROR, (e) => {
                        console.log('error');
                        console.log(e);
                        index = index + 1;
                        flv.unload();
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
                    }
                }).catch(e => {
                setStream(roomId, video);
                console.log(e);
            });
        }
    }

    function updateJCT() {
        try {
            chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
                JCT = lf.res.split(",")[0];
                UID = lf.res.split(",")[1];
            });
        } catch (e) {
        }
    }

    function getTimeSnap() {
        return Math.round(Date.now() / 1000);
    }

    function packaging(msg, type, room_id) {
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

    function getMedal(upID, uid){
        return fetch("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id="+uid,{
            method:"GET",
            credentials: 'include',
            body:null
        })
            .then(res => res.json())
            .then(json=>{
                if(json['code']===0){
                    for(let medalInfo of json['data']['list']){
                        if(medalInfo['medal_info']['target_id'] === upID){
                            return {'emojiRequiredMedalLevel':medalInfo['medal_info']['level'],'medal_id':medalInfo['medal_info']['medal_id'],'medal_name':medalInfo['medal_info']['medal_name']}
                        }
                    }
                }
            })
            .catch(e=>{});
    }
    function wareMedal(medal, name){
        if(JCT !== "-1" && medal !==-1){
            var madelForm = new FormData();
            madelForm.append("medal_id", medal);
            madelForm.append("csrf", JCT);
            madelForm.append("csrf_token", JCT);
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear",{
                method:"POST",
                credentials: 'include',
                body:madelForm,
            })
                .then(res => {
                    console.log("ware medal successful, MID="+medal);
                });
        }
    }
}();

/*
<svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve">    <path class="st0" d="M25.8,25.8c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0l-2.3-2.3c-0.2,0.1-0.4,0.2-0.6,0.3c-0.5,0.2-1.1,0-1.3-0.5	c-0.2-0.5,0-1.1,0.5-1.3l0,0l-2.6-2.6v3.1c0,0.3-0.2,0.5-0.5,0.5c-0.1,0-0.2,0-0.3-0.1l-4.2-3.4h-1c-1.1,0-2-0.9-2-2v-2	c0-1.1,0.9-2,2-2h0.2l-3.4-3.4c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0L25.8,25.8z"></path>  <path class="st0" d="M21.4,10.8c4,1.9,5.7,6.7,3.8,10.7c-0.1,0.2-0.2,0.4-0.3,0.6l-1.5-1.5c1.4-3,0.2-6.6-2.8-8l0,0	c-0.5-0.2-0.7-0.8-0.5-1.3l0,0C20.4,10.7,21,10.5,21.4,10.8z"></path>  <path class="st0" d="M20,14.5c1.2,0.7,2,2,2,3.5c0,0.3,0,0.7-0.1,1L20,17.1V14.5z"></path>  <path class="st0" d="M17.9,11.7C18,11.8,18,11.9,18,12v3.1l-2.3-2.3l1.5-1.2C17.4,11.5,17.7,11.5,17.9,11.7z"></path></svg>
*/

//TODO: add setting, add heart beat, end video, reconnection