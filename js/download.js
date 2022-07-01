!function () {
    let taskSize = 0;
    let downloadElement = `<div class="rua-download-block" id="task${taskSize}">
        <div class="rua-download-add">
            <svg class="icon rua-cross" viewBox="0 0 100 100" style="height: 65px;">
                <circle cx="50" cy="50" r="50"/>
                <rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(0deg);"/>
                <rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(90deg);"/>
            </svg>
        </div>
        <div class="rua-download-block-video-info">
            <div class="video-title"></div>
            <div class="video-info"><span></span><span> </span></div>
        </div>
        <div class="rua-download-block-qn-block">
        </div>
    </div>`;

    let date = new Date().toString();
    console.log(date)
    fetch('https://xy218x85x123x7xy.mcdn.bilivideo.cn:4483/upgcxcode/28/23/741262328/741262328_nb3-1-116.flv?e=ig8euxZM2rNcNbKgnWdVhwdl7wNHhwdVhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&nbs=1&deadline=1656353060&gen=playurlv2&os=mcdn&oi=992313766&trid=00001a16444e678347b7bd61985dc5200682u&mid=3831650&platform=pc&upsig=b9a48658146d932aa9c2e6acdbd95aed&uparams=e,uipk,nbs,deadline,gen,os,oi,trid,mid,platform&mcdnid=11000036&bvc=vod&nettype=0&orderid=0,3&agrr=1&bw=430107&logo=A0000400', {
        method:'GET',
        credentials:'include',
        headers:{
            'refer':'https://www.bilibili.com/video/BV1XL4y1K7jc?vd_source=c6bc798ac6e5962373e8c442dbc0e5f7'
        },
        body:null
    })
}();