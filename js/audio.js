!function (){
    const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
    let auid = window.location["pathname"].replaceAll("/", "").replace("audio","").replaceAll('au',''), UID;
    let exp =new RegExp("^\\d*$");
    new MutationObserver(()=>{
        const n_auid = window.location["pathname"].replaceAll("/", "").replace("audio","").replaceAll('au','');
        if(n_auid!==null && n_auid!==auid && exp.test(n_auid)){
            auid = n_auid;
            updateJCT();
        }
    }).observe(document, {subtree: true, childList: true});

    updateJCT();
    function updateJCT(){
        try{
            chrome.runtime.sendMessage({msg: "get_LoginInfo"}, function (lf) {
                UID = lf.res.split(",")[1];
                if(exp.test(auid)){
                    getDLURL(3).then(s => {if (s!==null) drawDLIcon();});
                }
            });
        }catch (e) {}
    }

    function getDLURL(qn){
        return fetch(`https://api.bilibili.com/audio/music-service-c/url?songid=${auid}&quality=${qn}&privilege=2&mid=${UID}&platform=web`, {
            method: 'GET',
            credentials: 'include',
            body: null
        })
            .then(r => r.json())
            .then(json => {
                if(json['code'] === 0 && json['data']!=null){
                    return {'url':json['data']['cdns'][0], 'up':'', 'title':json['data']['title'], 'cover':json['data']['cover']};
                }
                return null;
            })
            .catch(e =>{});
    }

    function drawDLIcon(){
        if(document.getElementById('rua-download')!== undefined && document.getElementById('rua-download')!== null)
            document.getElementById('rua-download').parentNode.removeChild(document.getElementById('rua-download'));
        let button = document.createElement("div");
        button.setAttribute('id', 'rua-download');
        button.setAttribute('data-v-60025db2','');
        button.classList.add('song-playbtn');
        button.innerHTML = `<i id="rua-download-icon"><img src="${link}"></i> <span data-v-60025db2 class="song-play" style="margin-left: 0;">下载</span>`;
        document.getElementsByClassName('share-board')[0].insertBefore(button, document.getElementsByClassName('song-share')[0]);
        button.addEventListener('click', async ()=>{
            if (!button.classList.contains('rua-clicked')){
                button.classList.add('rua-clicked');
                button.getElementsByClassName("song-play")[0].innerText = `取流中...`;
                getDLURL(3)
                    .then(info => {
                        let size=0, get=0;
                        fetch(info['url'],{
                            method:"GET",
                            body:null
                        })
                            .then(response => {
                                button.getElementsByClassName("song-play")[0].innerText = `下载中...`;
                                size = response.headers.get("Content-Length");
                                return response.body;
                            })
                            .then(body => {
                                const reader = body.getReader();
                                return new Response(
                                    new ReadableStream({
                                        start(controller){
                                            return push();
                                            function push() {
                                                return reader.read().then(res => {
                                                    const {done, value} = res;
                                                    if (done) {
                                                        controller.close();
                                                    }
                                                    get += value.length || 0;
                                                    setProgress(button, (get/size) * 100);
                                                    controller.enqueue(value);
                                                    return push();
                                                });
                                            }
                                        }
                                    })
                                ).blob();
                            })
                            .then(blob => {
                                let obj = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = obj;
                                a.download = `${info['title']}${(info['title']+"").includes('.m4a')?'.m4a':'.flac'}`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(obj);
                                button.setAttribute('style','');
                                button.getElementsByClassName("song-play")[0].innerText = `下载`;
                                button.classList.remove('rua-clicked');
                            })
                            .catch(e =>{});
                    })
                    .catch(e => {});
            }
        });
    }

    function setProgress(obj, progress){
        obj.setAttribute("style", "background: linear-gradient(to right, #23ade5 0%, #23ade5 "+progress+"%, #fb7299 "+progress+"%, #fb7299);");
    }
}();