!function (){
    // get key:  https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${longRoomID}&type=0
    fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${longRoomID}&type=0`, {
        method:'GET',
        credentials:"include",
        body:null
    }).then(r=>r.json())
        .then(json=>{
            if (json['code'] === 0){
                let wss = new WebSocket(json['data']['host_list'][0]['host']); // danmaku wss server;
                const key = json['data']['token']; // wss server key
                const refresh = json['data']['max_delay']
            }
        }).catch(e=>{

    });

}();