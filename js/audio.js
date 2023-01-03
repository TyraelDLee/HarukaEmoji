!function (){
    const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
    const wasmPath = chrome.runtime.getURL('../ffmpeg/ffmpeg-core.wasm');

    let auid = window.location["pathname"].replaceAll("/", "").replace("audio","").replaceAll('au',''), UID;
    let exp =new RegExp("^\\d*$");
    if (exp.test(auid))
        updateJCT();
    new MutationObserver(()=>{
        const n_auid = window.location["pathname"].replaceAll("/", "").replace("audio","").replaceAll('au','');
        if(n_auid!==null && n_auid!==auid && exp.test(n_auid)){
            auid = n_auid;
            updateJCT();
        }
    }).observe(document, {subtree: true, childList: true});

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
        button.innerHTML = `<i id="rua-download-icon"><img src="${link}"></i> <span data-v-60025db2 class="song-play" style="margin-left: 20px;">下载</span>`;
        document.getElementsByClassName('share-board')[0].insertBefore(button, document.getElementsByClassName('song-share')[0]);
        button.addEventListener('click', async ()=>{
            if (!button.classList.contains('rua-clicked')){
                button.classList.add('rua-clicked');
                button.getElementsByClassName("song-play")[0].innerText = `取流中...`;
                let metaObject = await getMeta();
                const lyricUrl = metaObject['lyrics'];
                if (lyricUrl !== '')
                    metaObject['lyrics'] = await getLyrics(lyricUrl);
                getDLURL(3)
                    .then(info => {
                        let size=0, get=0;
                        fetch(info['url'],{
                            method:"GET",
                            body:null
                        })
                            .then(response => {
                                button.getElementsByClassName("song-play")[0].innerText = `下载中...`;
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
                                if(metaObject === -1){
                                    const a = document.createElement('a');
                                    a.style.display = 'none';
                                    a.href = obj;
                                    a.download = `${info['title']}${(info['title']+"").includes('.m4a')?'.m4a':'.flac'}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(obj);

                                }else{
                                    embedMetadata(obj, metaObject,metaObject['title'])
                                    // chrome.runtime.sendMessage({msg: "requestEncode", blob: obj, filename: metaObject['title'], startTime: -1, duration: -1, requestType: 'songRecord', metadata: metaObject}, function (status){
                                    //     console.log(status.status);
                                    // });
                                }
                                button.setAttribute('style','');
                                button.getElementsByClassName("song-play")[0].innerText = `下载`;
                                button.classList.remove('rua-clicked');
                            })
                            .catch(e =>{});
                    })
                    .catch(e => {});
            }
        });
    }

    async function embedMetadata(blob, metadata, filename){
        let out, downloadName, dl;
        const {createFFmpeg, fetchFile} = FFmpeg;
        const ffmpeg = createFFmpeg({
            corePath: wasmPath,
            mainName: 'main',
            log: false,
        });
        await ffmpeg.load();
        ffmpeg.FS('writeFile', 'audio.m4s', await fetchFile(blob));
        if (metadata['cover'].length){
            ffmpeg.FS('writeFile', `cover`, await fetchFile(metadata['cover'].replace('http://', 'https://')));
            await ffmpeg.run('-i', 'audio.m4s', '-i', `cover`, '-map' , '0', '-map', '1', '-c', 'copy', '-disposition:v:0', 'attached_pic', '-metadata', `title=${utf8Encode(metadata.title)}`,'-metadata', `artist=${utf8Encode(metadata.artist)}`,'-metadata', `description=${utf8Encode(metadata.description)}`, '-metadata', `lyrics=${utf8Encode(metadata.lyrics)}`, '-metadata', `year=${metadata.year}`, 'final.m4a');
        }else{
            await ffmpeg.run('-i', 'audio.m4s', '-c', 'copy', '-metadata', `title=${utf8Encode(metadata.title)}`,'-metadata', `artist=${utf8Encode(metadata.artist)}`,'-metadata', `description=${utf8Encode(metadata.description)}`, '-metadata', `lyrics=${utf8Encode(metadata.lyrics)}`, '-metadata', `year=${metadata.year}`, 'final.m4a');
        }
        out = ffmpeg.FS('readFile', 'final.m4a');
        downloadName = filename + ".m4a";
        dl = URL.createObjectURL(new Blob([out.buffer], {type: 'audio/mp4'}));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = dl;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(dl);
    }

    function utf8Encode(str){
        let encoder = new TextEncoder('utf8');
        let bytes = encoder.encode(str);
        let result = '';
        for(let i = 0; i < bytes.length; ++i) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }

    function setProgress(obj, progress){
        obj.setAttribute("style", "background: linear-gradient(to right, #23ade5 0%, #23ade5 "+progress+"%, #fb7299 "+progress+"%, #fb7299);");
    }

    function getMeta(){
        return fetch(`https://www.bilibili.com/audio/music-service-c/web/song/info?sid=${auid}`,{
            method:'GET',
            credentials: 'include',
            body:null
        })
            .then(result => result.json())
            .then(json=>{
                if(json['code'] === 0){
                    return {"title":json["data"]["title"], "artist":json['data']['author'], "year":new Date((json["data"]["passtime"]-1+1)*1000).getFullYear(), "cover":json["data"]["cover"], "lyrics": json["data"]["lyric"], "description":json["data"]["intro"]};
                }else
                    return -1
            })
            .catch(e=>{});
    }

    function getLyrics(url){
        return fetch(url.replace("http://","https://"),{
            method:'GET',
            credentials:'omit',
            body:null
        })
            .then(result => result.arrayBuffer())
            .then(body => new TextDecoder().decode(new Uint8Array(body)))
    }
}();