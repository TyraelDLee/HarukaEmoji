!function () {
    let host = new DanmakuWSS(document.getElementById('danmaku-list')), currentRoomID=-1, firstRoom=true;
    const inputRoomId = document.getElementById('add-room');
    inputRoomId.onclick = async ()=>{
        await connectToRoom();
    };

    const inputRoomIdEnter = document.getElementById('room-id-value');
    inputRoomIdEnter.onkeyup = async (keycode)=>{
        if (keycode.key==='Enter')
            await connectToRoom();
    };

    async function connectToRoom(){
        const roomId = document.getElementById('room-id-value').value;
        if (currentRoomID!==roomId-0) {
            host.__sent_system_package(`正在获取${roomId}的房间信息`);
            currentRoomID = roomId;
            let data = await getRealRoomID(roomId - 0);
            console.log("Grab room info:");
            console.log(data)
            grabDanmaku(data);
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
                    let roomInfo = {};
                    roomInfo['room_id'] = json['data']['room_id'];
                    roomInfo['uid'] = json['data']['uid'];
                    realRoomID = json['data']['room_id'];
                    constructSystemEmoji(4, document.getElementById('danmaku-emoji-panel'), document.getElementById('danmaku-value'), realRoomID);
                    return getRoomKey(roomInfo);
                }
                else{
                    throw json;
                }
            });
    }

    function getRoomKey(room_id) {
        return fetch(`http://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${room_id['room_id']}`, {
            method: 'GET',
            credentials: 'include',
            body: null
        }).then(r => r.json())
            .then(json => {
                if (json['code'] === 0) {
                    let out = json['data'];
                    out['room_id'] = room_id['room_id'];
                    out['uid'] = room_id['uid'];
                    return out;
                }
                else
                    return {}
            })
            .catch(e => {
                return {}
            });
    }

    function grabDanmaku(hostData) {
        chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'DedeUserID'}, (c1)=>{
            chrome.cookies.get({url: 'https://www.bilibili.com/', name: 'buvid3'}, (c2)=>{
                if (firstRoom) {
                    firstRoom=false;
                    host.connect({
                        'uid': c1.value - 0,
                        'room_id': hostData['room_id'],
                        'token': hostData['token'],
                        'biggest_list': 100,
                        'buvid': c2.value
                    });
                }else{
                    host.setNewRoom({
                        'uid': c1.value - 0,
                        'room_id': hostData['room_id'],
                        'token': hostData['token'],
                        'biggest_list': 100,
                        'buvid': c2.value
                    });
                }
                host.setOwnerUID(hostData['uid']);
            });
        });
    }

    /*
    Danmaku sending section
     */
    const danmakuInput = document.getElementById('danmaku-value'),
        danmakuLength = document.getElementById('danmaku-length');
    let JCT=-1, realRoomID=-1, emojiRequiredPrivilege=-1, uid=-1, totalLength=20, lastUsed=0;
    !function updateJCT(){
        try{
            chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
                JCT = lf.res.split(",")[0];
            });
        }catch (e) {}
        getUserInfo(337374);
    }();
    function getUserInfo(roomId){
        return fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?from=0&room_id="+roomId,{
            method:'GET',
            credentials:'include',
            body:null
        }).then(result => result.json())
            .then(json =>{
                if (json['code'] === 0) {
                    emojiRequiredPrivilege = (json['data']['privilege']['privilege_type']-1+1)===0?4:json['data']['privilege']['privilege_type'];
                    uid = json['data']['info']['uid'];
                    totalLength = json['data']['property']['danmu']['length'];
                    danmakuLength.innerText = ` 0/${totalLength}`;
                }
                return 0;
            }).catch(e=>{});
    }

    danmakuInput.addEventListener('keyup', (e)=>{
        if (e.key==='Enter' && danmakuInput.value.length>0) {
            sendDanmaku(danmakuInput.value);
            danmakuInput.value='';
        }
        danmakuLength.innerText = `${danmakuInput.value.length>9?danmakuInput.value.length:' '+danmakuInput.value.length}/${totalLength}`;
    });

    function getTimeSnap(){return Math.round(Date.now()/1000);}
    
    function sendDanmaku(msg, type=0){
        // let msg = document.getElementById('danmaku-value').valueOf();
        let form = new FormData();
        form.append("bubble", "0");
        form.append("msg", msg);
        form.append("color", "16777215");
        form.append("mode", "1");
        if(type!==0) form.append("dm_type","1");
        form.append("fontsize", "25");
        form.append("rnd", getTimeSnap()+"");
        form.append("roomid", realRoomID); // short id is not allowed.
        form.append("csrf", JCT);
        form.append("csrf_token", JCT);
        fetch("https://api.live.bilibili.com/msg/send?requestFrom=rua5", {
            method:"POST",
            credentials: 'include',
            body: form
        })
            .then(result=> result.json())
            .then(result =>{})
            .catch(error=>{});
    }

    function constructSystemEmoji(num_per_line, HTMLObj, inputArea, realId){
        getUserInfo(realId).then(r=>{
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id="+realRoomID, {
                method:'GET',
                credentials:'include',
                body: null
            }).then(result => result.json())
                .then(json=>{
                    if (json['code'] === 0){
                        HTMLObj.innerHTML = '';
                        const emojiHeader = document.createElement('div');
                        const emojiHeaderContent = document.createElement('div');
                        emojiHeaderContent.classList.add('rua-emoji-header');
                        emojiHeader.appendChild(emojiHeaderContent);
                        HTMLObj.appendChild(emojiHeader);
                        emojiHeaderContent.addEventListener('wheel', (e)=>{
                            emojiHeaderContent.scrollLeft += e.deltaY;
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
                                emojiContainer.style.display = 'flex';
                            }
                            headerItem.innerHTML += `<img src="${data[i]['current_cover']}"></div>`
                            headerItem.onclick = ()=>{
                                for (let j = 0; j < emojiHeaderContent.childNodes.length; j++) {
                                    emojiHeaderContent.childNodes.item(j).classList.remove('active');
                                    HTMLObj.getElementsByClassName('rua-emoji-container')[j].style.display = 'none';
                                    if (emojiHeaderContent.childNodes.item(j) === headerItem) {
                                        HTMLObj.getElementsByClassName('rua-emoji-container')[j].style.display = 'flex';
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
                                    if (!emoji.classList.contains('rua-emoji-icon-inactive-new') && i!==0)
                                        sendDanmaku(data[i]['emoticons'][j]['emoticon_unique'], 1);
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
                            HTMLObj.appendChild(emojiContainer);
                        }
                    }
                });
        });
    }

    // document.body.onscroll = (event)=>{
    //     console.log(event)
    // };
}();