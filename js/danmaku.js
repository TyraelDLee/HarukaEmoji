!function () {
    let host = new DanmakuWSS(document.getElementById('danmaku-list')), currentRoomID=-1, firstRoom=true;
    let inputRoomId = document.getElementById('add-room');
    inputRoomId.onclick = async ()=>{
        let roomId = document.getElementById('room-id-value').value;
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
}();