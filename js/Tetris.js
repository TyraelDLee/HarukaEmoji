(function () {
    let location = [], h, v;

    /**
     * Draw the game board in dom.
     *
     * @param {number} vn the number of blocks vertically
     * @param {number} hn the number of blocks horizontally
     * */
    function drawGameBoard(vn, hn) {
        v = vn;
        h = hn;
        const main = document.getElementsByTagName('main')[0];
        main.style.height = (20 * getBlockSize()) + 'px';
        main.style.width = (10 * getBlockSize()) + 'px';
        location = new Array(hn).fill(0).map(() => new Array(vn).fill(0));
        location.push(new Array(vn).fill(2));//the bottom border.
        // for (let i = 0; i < vn; i++) {
        //     const row = document.createElement('div');
        //     row.setAttribute('id', `col-${i}`);
        //     row.classList.add('game-board-row');
        //     let l = [];
        //     for (let j = 0; j < hn; j++) {
        //         const col = document.createElement('div');
        //         col.setAttribute('id', `row-${j}-${i}`);
        //         col.classList.add('game-board-col');
        //         col.style.height = getBlockSize() + 'px';
        //         col.style.width = getBlockSize() + 'px';
        //         row.appendChild(col);
        //         l.push(0);
        //     }
        //     main.appendChild(row);
        //     location.push(l);
        // }
    }

    drawGameBoard(10, 20);
    const I = [[1,1,1,1]], O = [[1,1],[1,1]], T = [[1,1,1],[0,1,0]], Z = [[0,1,1],[1,1,0]], L = [[0,0,0,1],[1,1,1,1]];
    const shapes = [[[1,1,1,1]], [[1,1],[1,1]], [[1,1,1],[0,1,0]], [[0,1,1],[1,1,0]], [[0,0,0,1],[1,1,1,1]]];
    draw(shapes[Math.floor(Math.random() * (shapes.length-1))]);
    //
    // function drawI() {
    //     const main = document.getElementsByTagName('main')[0];
    //     for (let i = 0; i < 4; i++) {
    //         const img = document.createElement('img');
    //         img.src = "../images/svga/13.svg";
    //         img.setAttribute('frame', '13');
    //         img.setAttribute('moving', '1');
    //         img.setAttribute('location', `0,${i+3}`);
    //         img.setAttribute('style', `height: ${getBlockSize()}px; width: ${getBlockSize()}px; top: ${0}px; left: ${(3+i) * getBlockSize()}px`);
    //         main.appendChild(img);
    //         location[0][i+3] = 1;
    //     }
    // }

    /**
     * @param {array} shape The 2D array which defined shape of next block.
     * */
    function draw(shape) {
        const main = document.getElementsByTagName('main')[0];
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                if(shape[i][j]===1){
                    let x = i, y=3+j;
                    const img = document.createElement('img');
                    img.src = "../images/svga/13.svg";
                    img.setAttribute('frame', '13');
                    img.setAttribute('moving', '1');
                    img.setAttribute('location', `${x},${y}`);
                    img.setAttribute('style', `height: ${getBlockSize()}px; width: ${getBlockSize()}px; top: ${x * getBlockSize()}px; left: ${(y) * getBlockSize()}px`);
                    main.appendChild(img);
                    location[x][y] = 1;
                }
            }
        }
    }

    function updateDown() {
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), bottom, conf = false;
        imgList.forEach((img)=>{
            if (img.getAttribute('moving') === '1') {
                let th = img.getAttribute('location').split(',')[0]-1+1, tv = img.getAttribute('location').split(',')[1]-1+1;
                if (th<h && location[th+1][tv]===2)
                    conf = true;
            }
        });
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                let th = img.getAttribute('location').split(',')[0], tv = img.getAttribute('location').split(',')[1];
                if (th-1+1 < h-1 && !conf){
                    img.setAttribute('location', `${th - 1 + 2},${tv}`);
                    img.style.top = `${(th - 1 + 2) * getBlockSize()}px`;
                    location[th-1+1][tv-1+1] = 0;
                    location[th-1+2][tv-1+1] = 1;
                    bottom = false;
                }else{
                    location[th-1+1][tv-1+1] = 2;
                    img.setAttribute('moving', '0');
                    animation(0,2);
                    bottom = true;
                }
            }
        });
        return bottom;
    }

    function updateLR(offset) {
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), minV = v+1, maxV = -1;
        imgList.forEach((img)=>{
            if (img.getAttribute('moving') === '1'){
                if (img.getAttribute('location').split(',')[1]-1+1>maxV)
                    maxV = img.getAttribute('location').split(',')[1]-1+1;
                if (img.getAttribute('location').split(',')[1]-1+1<minV)
                    minV = img.getAttribute('location').split(',')[1]-1+1;
            }
        });
        console.log(minV+" "+maxV)
        if (minV===0 && offset===0) offset = 1;
        if (maxV===v-1 && offset===2) offset = 1;
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                let th = img.getAttribute('location').split(',')[0], tv = img.getAttribute('location').split(',')[1];
                //if (offset!==1)document.getElementById(`row-${th}-${offset===0?maxV:minV}`).innerHTML = '';
                img.setAttribute('location', `${th},${tv - 1 + offset}`);
                img.style.left = `${(tv - 1 + offset) * getBlockSize()}px`;
                location[th-1+1][tv-1+1] = 0;
                location[th-1+1][tv-1+offset] = 1;
                //document.getElementById(`row-${th}-${tv - 1 + offset}`).appendChild(img);
            }
        });
    }

    setInterval(() => {
        if(updateDown())
            draw(I);
    }, 1000);

    window.addEventListener('resize', () => {
        let objList = document.getElementsByTagName('main')[0].querySelectorAll('.game-board-col');
        objList.forEach((obj) => {
            obj.style.height = getBlockSize() + 'px';
            obj.style.width = getBlockSize() + 'px';
        });
    });

    window.addEventListener('keydown', e => {
        switch (e.code) {
            case 'ArrowUp':
                break;
            case 'ArrowLeft':
                animation(1,1);
                updateLR(0);
                break;
            case 'ArrowRight':
                animation(1,1);
                updateLR(2);
                break;
            case 'ArrowDown':
                animation(1,1);
                if(updateDown())
                    draw(I);
                break;
        }
    });

    function getBlockSize() {
        return window.innerWidth / v < window.innerHeight / h ? window.innerWidth / v : window.innerHeight / h;
    }

    /**
     * @param {number} moving the value of 'moving' attribute, define which image should animate.
     * @param {number} dir define which type animation it should play.
     * */
    function animation(moving, dir){
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), minV = v+1, maxV = -1;
        imgList.forEach((img)=>{
            if (img.getAttribute('moving')-1+1 === moving){
                svga(img, dir);
                setTimeout(()=>{svga(img, 0)}, 600);
            }
        });
    }
})();
//todo: rotate.
//todo: win.
//todo: lose.
//todo: HI mark.