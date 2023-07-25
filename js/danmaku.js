!async function (){
    let data = await getRoomKey(21756924);

    console.log(data);
    grabDanmaku(data)
    function getRoomKey(room_id){
        return fetch(`http://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${room_id}`, {
            method:'GET',
            credentials: 'include',
            body: null
        }).then(r => r.json())
            .then(json=>{
                if (json['code']===0)
                    return json['data']
                else
                    return {}
            })
            .catch(e=>{
                return {}
            });
    }

    function grabDanmaku(hostData){
        const danmaku = new window.WebSocket(`wss://${hostData['host_list'][0]['host']}?sub`);
        danmaku.binaryType = 'arraybuffer';
        danmaku.onopen = function (){
            let firstRequest = packageData(0, [3831650, 21756924, hostData['token']]);
            danmaku.send(firstRequest);
        };
        danmaku.onmessage = function (message){
            console.log(message.data);
        }
        danmaku.onerror = function (){

        }
        danmaku.onclose = function (){

        }
    }

    function packageData(type, data){
        switch (type){
            case 0:
                let dataBody = `{"uid":${data[0]},"roomid":${data[1]},"protover":3,"platform":"web","type":2,"key": ${data[2]}}`
                dataBody = string2Ab(dataBody);
                console.log(dataBody)
                return dataBody;
            case 1:
                return {}
            default:
                return {"uid":data[0], "roomid":data[1], "protover":3, "platform":"web", "type":2, "key": data[2]}
        }
    }

    function string2Ab(input){
        let buffer = new ArrayBuffer(input.length * 2);
        let bufferView = new Uint8Array(buffer);
        for (let i = 0; i < input.length; i++) {
            bufferView[i] = input.charCodeAt(i)
        }
        return buffer;
    }

}();