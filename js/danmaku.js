function DanmakuWSS(frontEndHost, config=null, ver = 1) {
    this.ownerUID = -1;
    this.firstPackageReveiced = false;
    this.retry = 3;
    this.retried = 0;
    this.ver = ver;
    this.timer = null;
    this.wss = null;
    this.frontEndHost = frontEndHost;
    this.onUserBehave = false;
    this.roomID = -1;
    this.biggest_list = 100;
    this.AUTH_PAYLOAD = null;
    if (config !== null){
        this.roomID = config['room_id'];
        this.biggest_list = config['biggest_list']===null?100:config['biggest_list'];
        this.AUTH_PAYLOAD = {
            'uid': config['uid'],
            'roomid': this.roomID,
            'protover': 3,
            'buvid': config['buvid'],
            'platform': 'web',
            'clientver': '1.8.5',
            'type': 2,
            'key': config['token']
        };
    }
    const WSS_HOST = `wss://broadcastlv.chat.bilibili.com:2245/sub`;
    const HEARTBEAT_PAYLOAD = '[object Object]'
    const EMOJI_KEY = {
        "emoji": [
            {"text":  "[dog]",
                "asset": "4428c84e694fbf4e0ef6c06e958d9352c3582740"
            },{"text":  "[花]",
                "asset": "7dd2ef03e13998575e4d8a803c6e12909f94e72b"
            },{"text":  "[妙]",
                "asset": "08f735d950a0fba267dda140673c9ab2edf6410d"
            },{"text":  "[哇]",
                "asset": "650c3e22c06edcbca9756365754d38952fc019c3"
            },{"text":  "[爱]",
                "asset": "1daaa5d284dafaa16c51409447da851ff1ec557f"
            },{"text":  "[手机]",
                "asset": "b159f90431148a973824f596288e7ad6a8db014b"
            },{"text":  "[撇嘴]",
                "asset": "4255ce6ed5d15b60311728a803d03dd9a24366b2"
            },{"text":  "[委屈]",
                "asset": "69312e99a00d1db2de34ef2db9220c5686643a3f"
            },{"text":  "[抓狂]",
                "asset": "a7feb260bb5b15f97d7119b444fc698e82516b9f"
            },{"text":  "[比心]",
                "asset": "4e029593562283f00d39b99e0557878c4199c71d"
            },{"text":  "[赞]",
                "asset": "2dd666d3651bafe8683acf770b7f4163a5f49809"
            },{"text":  "[滑稽]",
                "asset": "8624fd172037573c8600b2597e3731ef0e5ea983"
            },{"text":  "[吃瓜]",
                "asset": "ffb53c252b085d042173379ac724694ce3196194"
            },{"text":  "[笑哭]",
                "asset": "c5436c6806c32b28d471bb23d42f0f8f164a187a"
            },{"text":  "[捂脸]",
                "asset": "e6073c6849f735ae6cb7af3a20ff7dcec962b4c5"
            },{"text":  "[喝彩]",
                "asset": "b51824125d09923a4ca064f0c0b49fc97d3fab79"
            },{"text":  "[偷笑]",
                "asset": "e2ba16f947a23179cdc00420b71cc1d627d8ae25"
            },{"text":  "[大笑]",
                "asset": "e2589d086df0db8a7b5ca2b1273c02d31d4433d4"
            },{"text":  "[惊喜]",
                "asset": "9c75761c5b6e1ff59b29577deb8e6ad996b86bd7"
            },{"text":  "[傲娇]",
                "asset": "b5b44f099059a1bafb2c2722cfe9a6f62c1dc531"
            },{"text":  "[疼]",
                "asset": "492b10d03545b7863919033db7d1ae3ef342df2f"
            },{"text":  "[吓]",
                "asset": "c6bed64ffb78c97c93a83fbd22f6fdf951400f31"
            },{"text":  "[阴险]",
                "asset": "a4df45c035b0ca0c58f162b5fb5058cf273d0d09"
            },{"text":  "[惊讶]",
                "asset": "bc26f29f62340091737c82109b8b91f32e6675ad"
            },{"text":  "[生病]",
                "asset": "84c92239591e5ece0f986c75a39050a5c61c803c"
            },{"text":  "[嘘]",
                "asset": "b6226219384befa5da1d437cb2ff4ba06c303844"
            },{"text":  "[奸笑]",
                "asset": "5935e6a4103d024955f749d428311f39e120a58a"
            },{"text":  "[囧]",
                "asset": "204413d3cf330e122230dcc99d29056f2a60e6f2"
            },{"text":  "[捂脸2]",
                "asset": "a2ad0cc7e390a303f6d243821479452d31902a5f"
            },{"text":  "[出窍]",
                "asset": "bb8e95fa54512ffea07023ea4f2abee4a163e7a0"
            },{"text":  "[吐了啊]",
                "asset": "2b6b4cc33be42c3257dc1f6ef3a39d666b6b4b1a"
            },{"text":  "[鼻子]",
                "asset": "f4ed20a70d0cb85a22c0c59c628aedfe30566b37"
            },{"text":  "[调皮]",
                "asset": "84fe12ecde5d3875e1090d83ac9027cb7d7fba9f"
            },{"text":  "[酸]",
                "asset": "98fd92c6115b0d305f544b209c78ec322e4bb4ff"
            },{"text":  "[冷]",
                "asset": "b804118a1bdb8f3bec67d9b108d5ade6e3aa93a9"
            },{"text":  "[OK]",
                "asset": "86268b09e35fbe4215815a28ef3cf25ec71c124f"
            },{"text":  "[微笑]",
                "asset": "f605dd8229fa0115e57d2f16cb019da28545452b"
            },{"text":  "[藏狐]",
                "asset": "05ef7849e7313e9c32887df922613a7c1ad27f12"
            },{"text":  "[龇牙]",
                "asset": "8b99266ea7b9e86cf9d25c3d1151d80c5ba5c9a1"
            },{"text":  "[防护]",
                "asset": "17435e60dcc28ce306762103a2a646046ff10b0a"
            },{"text":  "[笑]",
                "asset": "a91a27f83c38b5576f4cd08d4e11a2880de78918"
            },{"text":  "[一般]",
                "asset": "8d436de0c3701d87e4ca9c1be01c01b199ac198e"
            },{"text":  "[嫌弃]",
                "asset": "c409425ba1ad2c6534f0df7de350ba83a9c949e5"
            },{"text":  "[无语]",
                "asset": "4781a77be9c8f0d4658274eb4e3012c47a159f23"
            },{"text":  "[哈欠]",
                "asset": "6e496946725cd66e7ff1b53021bf1cc0fc240288"
            },{"text":  "[可怜]",
                "asset": "8e88e6a137463703e96d4f27629f878efa323456"
            },{"text":  "[歪嘴笑]",
                "asset": "bea1f0497888f3e9056d3ce14ba452885a485c02"
            },{"text":  "[亲亲]",
                "asset": "10662d9c0d6ddb3203ecf50e77788b959d4d1928"
            },{"text":  "[问号]",
                "asset": "a0c456b6d9e3187399327828a9783901323bfdb5"
            },{"text":  "[波吉]",
                "asset": "57dee478868ed9f1ce3cf25a36bc50bde489c404"
            },{"text":  "[OH]",
                "asset": "0d5123cddf389302df6f605087189fd10919dc3c"
            },{"text":  "[再见]",
                "asset": "f408e2af700adcc2baeca15510ef620bed8d4c43"
            },{"text":  "[白眼]",
                "asset": "7fa907ae85fa6327a0466e123aee1ac32d7c85f7"
            },{"text":  "[鼓掌]",
                "asset": "d581d0bc30c8f9712b46ec02303579840c72c42d"
            },{"text":  "[大哭]",
                "asset": "816402551e6ce30d08b37a917f76dea8851fe529"
            },{"text":  "[呆]",
                "asset": "179c7e2d232cd74f30b672e12fc728f8f62be9ec"
            },{"text":  "[流汗]",
                "asset": "b00e2e02904096377061ec5f93bf0dd3321f1964"
            },{"text":  "[生气]",
                "asset": "2c69dad2e5c0f72f01b92746bc9d148aee1993b2"
            },{"text":  "[加油]",
                "asset": "fbc3c8bc4152a65bbf4a9fd5a5d27710fbff2119"
            },{"text":  "[害羞]",
                "asset": "d8ce9b05c0e40cec61a15ba1979c8517edd270bf"
            },{"text":  "[虎年]",
                "asset": "a51af0d7d9e60ce24f139c468a3853f9ba9bb184"
            },{"text":  "[doge2]",
                "asset": "f547cc853cf43e70f1e39095d9b3b5ac1bf70a8d"
            },{"text":  "[金钱豹]",
                "asset": "b6e8131897a9a718ee280f2510bfa92f1d84429b"
            },{"text":  "[瓜子]",
                "asset": "fd35718ac5a278fd05fe5287ebd41de40a59259d"
            },{"text":  "[墨镜]",
                "asset": "5e01c237642c8b662a69e21b8e0fbe6e7dbc2aa1"
            },{"text":  "[难过]",
                "asset": "5776481e380648c0fb3d4ad6173475f69f1ce149"
            },{"text":  "[抱抱]",
                "asset": "abddb0b621b389fc8c2322b1cfcf122d8936ba91"
            },{"text":  "[跪了]",
                "asset": "4f2155b108047d60c1fa9dccdc4d7abba18379a0"
            },{"text":  "[摊手]",
                "asset": "1e0a2baf088a34d56e2cc226b2de36a5f8d6c926"
            },{"text":  "[热]",
                "asset": "6df760280b17a6cbac8c1874d357298f982ba4cf"
            },{"text":  "[三星堆]",
                "asset": "0a1ab3f0f2f2e29de35c702ac1ecfec7f90e325d"
            },{"text":  "[鼠]",
                "asset": "98f842994035505c728e32e32045d649e371ecd6"
            },{"text":  "[汤圆]",
                "asset": "23ae12d3a71b9d7a22c8773343969fcbb94b20d0"
            },{"text":  "[泼水]",
                "asset": "29533893115c4609a4af336f49060ea13173ca78"
            },{"text":  "[鬼魂]",
                "asset": "5d86d55ba9a2f99856b523d8311cf75cfdcccdbc"
            },{"text":  "[不行]",
                "asset": "607f74ccf5eec7d2b17d91b9bb36be61a5dd196b"
            },{"text":  "[响指]",
                "asset": "3b2fedf09b0ac79679b5a47f5eb3e8a38e702387"
            },{"text":  "[牛]",
                "asset": "5e61223561203c50340b4c9b41ba7e4b05e48ae2"
            },{"text":  "[保佑]",
                "asset": "241b13adb4933e38b7ea6f5204e0648725e76fbf"
            },{"text":  "[抱拳]",
                "asset": "3f170894dd08827ee293afcb5a3d2b60aecdb5b1"
            },{"text":  "[给力]",
                "asset": "d1ba5f4c54332a21ed2ca0dcecaedd2add587839"
            },{"text":  "[耶]",
                "asset": "eb2d84ba623e2335a48f73fb5bef87bcf53c1239"
            }
        ]
    }
    const EMOJI_DIR = '../images/huangdou/'
    const LOTT = '喜欢主播加关注，点点红包抽礼物'

    DanmakuWSS.prototype.unPackage = function (dmPackage) {
        let subPackages = new TextDecoder().decode(dmPackage).split(/}.{16}{/);
        for (let i = 0; i < subPackages.length; i++) {
            let stringSubPackage = subPackages[i]
            if (i===0){
                stringSubPackage = stringSubPackage.substring(16);
                if (subPackages.length>1)
                    stringSubPackage = stringSubPackage + '}';
            }else{
                stringSubPackage = '{' +stringSubPackage + '}';
                if (i===subPackages.length-1)
                    stringSubPackage = stringSubPackage.substring(0, stringSubPackage.length-1);
            }
            let danmaku = JSON.parse(stringSubPackage)
            switch (danmaku['cmd']){
                case 'DANMU_MSG':
                    let danmakuPayload = {
                        'type': 'DANMU_MSG',
                        'danmaku_content': danmaku['info'][1],
                        'user': danmaku['info'][2][2]===1?4:(danmaku['info'][2][7]===''?0:(danmaku['info'][2][7]==='#00D1F1'?1:(danmaku['info'][2][7]==='#E17AFF'?2:3))),
                        'userName': danmaku['info'][2][1],
                        'userID': danmaku['info'][2][0],
                        'madel': danmaku['info'][3],
                        'content_emoji': danmaku['info'][0][13]
                    }
                    this.renderFrontEnd(danmakuPayload)
                    break;
                case 'SEND_GIFT':
                    break;
                default:
                    break;
            }
            if (danmaku['cmd'] === 'DANMU_MSG'){
                console.log(danmaku);

            }else{
                console.log(danmaku)
            }
        }
    }

    DanmakuWSS.prototype.nonPackage = function (dmPackage) {
        const dataView = new DataView(dmPackage);
        const packageLen = dataView.getUint32(0);
        const headerLen = dataView.getUint16(4);
        const ver = dataView.getUint16(6);
        const ope = dataView.getUint32(8);
        const sequenceId = dataView.getUint32(12);

        let body = dmPackage.slice(headerLen, packageLen);
        let danmakuPayload
        if (ope === 5) {
            if (ver === 0) {
                const danmaku = JSON.parse(this.unicodeDecoding(new Uint8Array(body)));
                if (danmaku['cmd'] === 'DANMU_MSG'){
                    console.log(danmaku);
                    danmakuPayload = {
                        'type': 'DANMU_MSG',
                        'danmaku_content': danmaku['info'][1],
                        'user': danmaku['info'][2][2]===1?4:(danmaku['info'][2][7]===''?0:(danmaku['info'][2][7]==='#00D1F1'?1:(danmaku['info'][2][7]==='#E17AFF'?2:3))),
                        'userName': danmaku['info'][2][1],
                        'userID': danmaku['info'][2][0],
                        'madel': danmaku['info'][3],
                        'content_emoji': danmaku['info'][0][13]
                    }
                    /*
                    * user{
                    * 0: uid
                    * 1: uname
                    * 2: admin
                    * 7: fleet - "#00D1F1" Tier 1, - "#E17AFF" Tier 2 - "FF7C28" Tier 3
                    * }*/
                    this.renderFrontEnd(danmakuPayload)
                }else{
                    console.log(danmaku)
                }
            } else {
                try{
                    this.unPackage(decompress(new Uint8Array(body)).buffer);
                }catch (e) {
                    console.log("Failed to uncompress incoming payload: "+e);
                }
            }
        }
    }

    DanmakuWSS.prototype.packageDm = function (dmPackage, op) {
        let packageU8Arr = this.unicodeEncoding(dmPackage);
        let buffer = new ArrayBuffer(packageU8Arr.byteLength + 16);
        let dataView = new DataView(buffer);
        dataView.setUint32(0, packageU8Arr.byteLength + 16);
        dataView.setUint16(4, 16);
        dataView.setUint16(6, this.ver);
        dataView.setUint32(8, op);
        dataView.setUint32(12, 1);
        for (let i = 0; i < packageU8Arr.byteLength; i++) {
            dataView.setUint8(16 + i, packageU8Arr[i]);
        }
        return buffer;
    }

    DanmakuWSS.prototype.unicodeEncoding = function (payload) {
        let arr = [];
        for (let i = 0; i < payload.length; i++) {
            arr.push(payload[i].charCodeAt(0));
        }
        return new Uint8Array(arr);
    }

    DanmakuWSS.prototype.unicodeDecoding = function (payload) {
        return new TextDecoder().decode(payload);
    }

    DanmakuWSS.prototype.connect = function (config=null) {
        try{
            this.wss = new WebSocket(WSS_HOST);
        }catch (e) {
            console.log("Failed to establish the wss connection: \r\n" + e);
        }
        if (config!== null){
            this.roomID = config['room_id'];
            this.AUTH_PAYLOAD = {
                'uid': config['uid'],
                'roomid': config['room_id'],
                'protover': 3,
                'buvid': config['buvid'],
                'platform': 'web',
                'clientver': '1.8.5',
                'type': 2,
                'key': config['token']
            };
        }
        if (this.AUTH_PAYLOAD === null){
            this.__sent_system_package('房间信息配置不正确！');
        }else{
            if (this.wss !== null){
                const hbPackage = this.packageDm(HEARTBEAT_PAYLOAD, 2);
                const authPackage = this.packageDm(JSON.stringify(this.AUTH_PAYLOAD), 7);
                this.wss.onopen = ()=>{
                    this.onUserBehave=false;
                    this.wss.send(authPackage);
                    this.wss.send(hbPackage);
                    this.__sent_system_package('正在连接至'+this.roomID)
                    this.timer = setInterval(()=>{
                        this.wss.send(hbPackage)
                    }, 30000);
                }

                this.wss.onmessage = (payload)=>{
                    if (!this.firstPackageReveiced){
                        this.__sent_system_package('已连接至'+this.roomID)
                        this.firstPackageReveiced = true;
                    }
                    let reader = new FileReader();
                    reader.readAsArrayBuffer(payload.data);
                    reader.onload = ()=>{
                        this.nonPackage(reader.result);
                    }
                }

                this.wss.onclose = ()=>{
                    if (!this.onUserBehave)
                        this.__handel_reconnection(0);
                }

                this.wss.onerror = ()=>{
                    if (!this.onUserBehave)
                        this.__handel_reconnection(1);
                }
            }
        }
    }

    DanmakuWSS.prototype.disconnect = function () {
        this.onUserBehave = true;
        try{
            this.__sent_system_package(`与${this.roomID}的连接已断开`)
            this.wss.close();
            clearInterval(this.timer);
            this.timer = null;
            this.firstPackageReveiced=false;
            this.retried = 0;
        }catch (e) {
            console.log(`Failed to close the wss connection.`);
        }
    }

    DanmakuWSS.prototype.__sent_system_package = function (msg){
        const start = {
            'type': 'SYSTEM_MSG',
            'danmaku_content': msg,
            'user': 'System'
        }
        this.renderFrontEnd(start);
    }

    DanmakuWSS.prototype.__handel_reconnection = function (i){
        clearInterval(this.timer);
        this.timer = null;
        this.firstPackageReveiced=false;
        this.__sent_system_package(`与${this.roomID}的连接${i===0?'被关闭':'出现错误'}`);
        if (this.retried<this.retry){
            this.__sent_system_package('正在尝试重新连接至'+this.roomID);
            this.retried++;
            this.connect();
        }else{
            this.disconnect();
        }
    }

    DanmakuWSS.prototype.renderFrontEnd = function (payload){
        switch (payload['type']) {
            case 'DANMU_MSG':
                if (payload['danmaku_content']!==LOTT){
                    let danmakuEnoji = payload['danmaku_content'];
                    if (payload['content_emoji']!==null&& typeof payload['content_emoji'] !== 'string'){
                        danmakuEnoji = `<img src="${payload['content_emoji']['url']}" title="${payload['danmaku_content']}" alt="" class="emoji">`
                    }
                    for (let i = 0; i < EMOJI_KEY['emoji'].length; i++) {
                        danmakuEnoji = danmakuEnoji.replaceAll(EMOJI_KEY['emoji'][i]['text'], `<img src="${EMOJI_DIR+EMOJI_KEY['emoji'][i]['asset']}.png" alt="" class="intext-emoji">`)
                    }
                    const dmMSG = document.createElement('div');
                    dmMSG.classList.add('rua-dm-item');
                    this.frontEndHost.appendChild(dmMSG);
                    dmMSG.innerHTML = `<div class="rua-dm-name-tag">
                <div class="rua-dm-name-tag-avatar" style="display: none"><img src="${''}"></div>
                <div class="rua-dm-name-tag-username">${payload['userName']}</div>
                <div class="rua-dm-name-tag-madel" style="${payload['madel'].length===0?'none':'block'}">
                    <span class="rua-dm-name-tag-madel-name">${payload['madel'].length>0?payload['madel'][1]:''}</span>
                    <span class="rua-dm-name-tag-madel-level">${payload['madel'].length>0?payload['madel'][0]:''}</span>
                </div>
                </div>
                <div class="rua-dm-content">
                    <div class="rua-dm-danmaku-content normal-dm privilege-${payload['user']} ${payload['userID']-0 === this.ownerUID?"privilege-owner":''}">${danmakuEnoji!==''?danmakuEnoji:payload['danmaku_content']}</div>
                </div>
                `;
                }

                break;
            case 'SYSTEM_MSG':
                const sysMSG = document.createElement('div');
                sysMSG.classList.add('rua-dm-item');
                this.frontEndHost.appendChild(sysMSG);
                sysMSG.innerHTML = `<div class="rua-dm-name-tag">
                <div class="rua-dm-name-tag-avatar" style="display: none"><img src="${''}"></div>
                <div class="rua-dm-name-tag-username system-dm">${payload['user']}</div></div>
                <div class="rua-dm-content">
                <div class="rua-dm-danmaku-content system-dm">${payload['danmaku_content']}</div></div>`;
                break;
            case 'GIFT_MSG':
                break;
            case 'FLEET_MSG':
                break;
            case 'SC_MSG':
                break;
            default:
                break;
        }
        window.scrollTo(0, document.body.scrollHeight);
    }

    DanmakuWSS.prototype.setRetryTime = function (retryTime){
        this.retry = retryTime;
    }

    DanmakuWSS.prototype.setNewRoom = function (linkData){
        this.disconnect();
        setTimeout(()=>{
            this.roomID = linkData['room_id'];
            this.biggest_list = linkData['biggest_list']===null?100:linkData['biggest_list'];
            this.connect(linkData);
        }, 2000);
    }

    DanmakuWSS.prototype.setOwnerUID = function (uid){
        this.ownerUID = uid;
    }
}

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