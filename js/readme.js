!function (){
    const iconHost = document.getElementById('rua-icon-host'), icon = document.getElementById('rua-icon'), iconNav = document.getElementById('rua-nav');
    let color = window.matchMedia('(prefers-color-scheme: dark)').matches?'0,0,0':'255,255,255';

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        color = event.matches?'0,0,0':'255,255,255';
        let alpha = iconHost.style.backgroundColor.replace("rgba(0, 0, 0, ","").replace("rgba(255, 255, 255, ","").replace(")","");
        iconHost.style.backgroundColor = `rgba(${color},${alpha})`;
        event.matches?iconHost.style.borderBottom = 'none':iconHost.style.borderBottom = '1px solid #aaa';
    });
    icon.style.transform = `translate(${(iconHost.clientWidth-350)/2}px, 0px)`;
    document.getElementsByTagName('body')[0].onscroll = function (e){
        let scrollRatio = 1.5, leftPosition = ((iconHost.clientWidth-350)/2)-scrollRatio*(document.documentElement.scrollTop/250 * (iconHost.clientWidth-350)/2)*0.9;
        (document.documentElement.scrollTop>170)?iconNav.style.display = 'flex' : iconNav.style.display = 'none';
        (document.documentElement.scrollTop>180)?iconNav.style.opacity = '1' : iconNav.style.opacity = '0';
        if (document.documentElement.scrollTop*scrollRatio>=250) {
            icon.setAttribute('style', `transform: translate(60px, 0px); height: 100px; width:100px;`);
            iconHost.style.height = `90px`;
            iconHost.style.backgroundColor = `rgba(${color},0.72)`;
            (color==='0,0,0')?iconHost.style.borderBottom = 'none':iconHost.style.borderBottom = '1px solid #aaa';
        }else {
            icon.setAttribute('style', `transform: translate(${leftPosition}px, 0px); height: ${(350-document.documentElement.scrollTop*scrollRatio)}px; width: ${(350-document.documentElement.scrollTop*scrollRatio)}px;`);
            iconHost.style.height = `${(350-document.documentElement.scrollTop * scrollRatio)-10}px`;
            //iconHost.style.backgroundColor = `rgba(${color},${(document.documentElement.scrollTop*scrollRatio/250) * 0.72})`;
            iconHost.style.backgroundColor = `rgba(${color},0)`;
            iconHost.style.borderBottom = 'none';
        }
    }

    for (let i = 0; i < iconNav.getElementsByTagName('a').length; i++) {
        iconNav.getElementsByTagName('a')[i].addEventListener('click', (e)=>{
            goto(e.target.getAttribute('goto'), 600);
        });
    }

    let click = 0;
    icon.addEventListener("click", ()=>{
        if (document.documentElement.scrollTop>0)
            goto(0,600);
        else{
            click++;
            if (click===5){
                click=0;
                const jump = document.createElement('a');
                jump.href = 'Tetris.html';
                jump.style.display = 'none';
                document.body.appendChild(jump);
                jump.click();
                document.body.removeChild(jump);
            }
        }
    });

    icon.addEventListener('touchend',()=>{
        if (document.documentElement.scrollTop>0)
            goto(0,600);
        else{
            click++;
            if (click===5){
                click=0;
                const jump = document.createElement('a');
                jump.href = 'Tetris.html';
                jump.style.display = 'none';
                document.body.appendChild(jump);
                jump.click();
                document.body.removeChild(jump);
            }
        }
    });

    function goto(id, duration) {
        const start = document.documentElement.scrollTop, end = typeof id==="number"?id:getAbsHeight(id);
        anime(0);
        function anime(step){
            document.documentElement.scrollTop=start+bezier(.17, .89, .45, 1,step/100) * (end-start);
            step++;
            if (step<100)
            setTimeout(()=>{
                anime(step)
            }, duration/100);
            if (step===100){
                document.documentElement.scrollTop=end;
            }
        }
    }

    function getAbsHeight(id){
        let e = document.getElementById(id);
        let abs = e.offsetTop;
        let cur = e.offsetParent;
        while (cur!==null){
            abs += (cur.offsetTop+cur.clientTop);
            cur = cur.offsetParent;
        }
        abs += (e.clientHeight)-150;
        return abs;
    }

    function bezier(a,b,c,d,T){
        let x = 3 * a * T * Math.pow((1 - T),2) + 3 * c * Math.pow(T,2)* (1 - T) + Math.pow(T, 3);
        let y = 3 * b * T * Math.pow((1 - T),2) + 3 * d * Math.pow(T,2)* (1 - T) + Math.pow(T, 3);
        return y;
    }

    icon.addEventListener("mouseenter", ()=>{
        svga(icon.getElementsByTagName('img')[0],Math.floor(Math.random()*2+1));
    });
    icon.addEventListener("mouseout", ()=>{
        svga(icon.getElementsByTagName('img')[0],0);
    });
}();