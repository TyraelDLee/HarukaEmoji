!async function (){
    const exp =new RegExp("^\\d*$");

    if (exp.test(window.location["pathname"].replaceAll("/", ""))){
        const queryID = await getMID(), guildInfo = await queryGuild(queryID['uid']);
        if (queryID['uid']!==0 && guildInfo !== ''){
            if (queryID['type'] === 'space'){
                const appObs = new MutationObserver(function (m){
                    m.forEach(function(mutation) {
                        if (mutation.type === "childList") {
                            if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].id==="app"){
                                const guildBadge = document.getElementById('app').getElementsByClassName('h')[0].getElementsByClassName('h-inner')[0].getElementsByClassName('h-info')[0].getElementsByClassName('h-basic')[0];
                                const badgeHost = document.createElement('div');
                                badgeHost.classList.add('h-basic-spacing');
                                badgeHost.classList.add('guild-badge');
                                let guildText = `<h4 title="所属公会: ${guildInfo}" class="h-sign">所属公会: ${guildInfo}</h4>`;
                                badgeHost.innerHTML += guildText;
                                guildBadge.append(badgeHost);
                                appObs.disconnect();
                            }
                        }
                    });
                });
                appObs.observe(document.body, {
                    attributes:true,
                    childList:true
                });

            }else if(queryID['type'] === 'live'){
                const guildBadge = document.getElementsByClassName('upper-row')[0].getElementsByClassName('right-ctnr')[0];
                const badgeHost = document.createElement('div');
                badgeHost.classList.add('icon-ctnr');
                badgeHost.setAttribute('style', 'line-height: 16px');
                let guildText = `<span class="v-middle live-skin-normal-a-text watched-icon">所属公会: </span><span title="${guildInfo}" class="action-text live-skin-normal-a-text v-middle watched-text">${guildInfo}</span>`;
                badgeHost.innerHTML += guildText;
                guildBadge.prepend(badgeHost);
            }
        }

    }

    async function getMID(){
        if (window.location['hostname'] === 'space.bilibili.com')
            return {uid: window.location["pathname"].replaceAll("/", ""), type: 'space'};
        else{
            return await fetch(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${window.location["pathname"].replaceAll("/", "")}&no_playurl=0&mask=1&qn=0&platform=web&protocol=0,1&format=0,1,2&codec=0,1&dolby=5&panorama=1`,{
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
}();