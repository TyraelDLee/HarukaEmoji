!async function (){
    const exp =new RegExp("^\\d*$");
    if (exp.test(window.location['pathname'].split("/")[1])){
        const queryID = await getMID(), guildInfo = await queryGuild(queryID['uid']);
        if (queryID['uid']!==0 && guildInfo !== ''){
            if (queryID['type'] === 'space'){
                injectionGuild(guildInfo);
            }else if(queryID['type'] === 'live'){
                const guildBadge = document.getElementsByClassName('upper-row')[0].getElementsByClassName('right-ctnr')[0];
                const badgeHost = document.createElement('div');
                badgeHost.setAttribute('class', 'icon-ctnr live-skin-normal-a-text not-hover');
                badgeHost.setAttribute('style', 'line-height: 16px; pointer-events: none;');
                let guildText = `<span class="action-text v-middle watched-icon">所属公会: </span><span title="数据没有时效性，仅供参考" class="action-text v-middle watched-text">${guildInfo}</span>`;
                badgeHost.innerHTML += guildText;
                guildBadge.prepend(badgeHost);
            }
        }

    }

    async function getMID(){
        if (window.location['hostname'] === 'space.bilibili.com')
            return {uid: window.location['pathname'].split("/")[1], type: 'space'};
        else{
            return await fetch(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${window.location['pathname'].split("/")[1]}&no_playurl=0&mask=1&qn=0&platform=web&protocol=0,1&format=0,1,2&codec=0,1&dolby=5&panorama=1`,{
                method:"GET",
                credentials:"include",
                body:null
            })
                .then(r=>r.json())
                .then(json=>{
                    if (json['code'] === 0){
                        return {uid: json['data']['uid'], type: 'live'};
                    }else{
                        return {uid:0, type: ''};
                    }
                })
                .catch(e=>{return {uid:0, type: ''};})
        }
    }

    async function queryGuild(uid){
        const guildList = await fetch(chrome.runtime.getURL("../guild/guildList.json"))
                .then(r=>{return r.json()})
            , v = await fetch(chrome.runtime.getURL("../guild/finalresult.json"))
                .then(r=>{return r.json()});
        let guildID = 0;
        for (let obj of v['fulldatalist']){
            for (let vInfo of obj['vlist']){
                if (uid-0 === vInfo['uid']) {
                    guildID = obj['gid']
                    break;
                }
            }
        }
        for (let o of guildList['guildinfolist']){
            if (o['gid'] === guildID){
                return o['name'];
            }
        }
    }

    function injectionGuild(guildName){
        try{
            const guildHost = document.getElementById('app').getElementsByClassName('h')[0].getElementsByClassName('h-user')[0].getElementsByClassName('h-basic')[0].getElementsByTagName('div')[0], badgeHost = document.createElement('span');
            badgeHost.setAttribute('title', `数据没有时效性，仅供参考`);
            badgeHost.classList.add('guild-badge');
            badgeHost.innerText = `所属公会: ${guildName}`;
            guildHost.append(badgeHost);
        }catch (e) {
            setTimeout(()=>{injectionGuild(guildName)}, 200);
        }
    }
}();