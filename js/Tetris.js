(function () {
    //game board, game board size
    let location = [], h, v;
    const speed = 1000, testblock = 1;
    const shapes = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[1, 1, 1], [0, 1, 0]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]]];
    const I = [[1, 1, 1, 1]], O = [[1, 1], [1, 1]], T = [[1, 1, 1], [0, 1, 0]], Z = [[0, 1, 1], [1, 1, 0]],
        L = [[0, 0, 0, 1], [1, 1, 1, 1]];

    /**
     * Draw the game board in DOM and initial the game board.
     *
     * @param {number} vn the number of blocks vertically
     * @param {number} hn the number of blocks horizontally
     * */
    function drawGameBoard(vn, hn) {
        v = vn;
        h = hn;
        const main = document.getElementsByTagName('main')[0];
        main.style.height = (vn * getBlockSize()) + 'px';
        main.style.width = (hn * getBlockSize()) + 'px';
        location = new Array(vn).fill(0).map(() => new Array(hn).fill(0));
        location.push(new Array(hn).fill(2));//the bottom border.
    }

    /**
     * Draw the block both in game board and visually.
     *
     * @param {array} shape The 2D array which defined shape of next block.
     * */
    function draw(shape) {
        const main = document.getElementsByTagName('main')[0];
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                if (shape[i][j] === 1) {
                    let x = i, y = 3 + j;
                    const img = document.createElement('img');
                    img.src = "images/svga/13.svg";
                    img.classList.add('block-img');
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

    /**
     * Move the block vertically and maintain the game board.
     * */
    function updateDown(offset) {
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), bottom, conf = false;
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                let th = img.getAttribute('location').split(',')[1] - 0,
                    tv = img.getAttribute('location').split(',')[0] - 0;
                if (tv < v && location[tv + offset][th] === 2)
                    conf = true;
            }
        });
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                let th = img.getAttribute('location').split(',')[1] - 0,
                    tv = img.getAttribute('location').split(',')[0] - 0;
                if (tv < v - 1 && !conf) {
                    img.setAttribute('location', `${tv + offset},${th}`);
                    img.style.top = `${(tv + offset) * getBlockSize()}px`;
                    location[tv][th] = 0;
                    location[tv + offset][th] = 1;
                    bottom = false;
                } else {
                    location[tv][th] = 2;
                    img.setAttribute('moving', '0');
                    //animation(0, 2);
                    bottom = true;
                }
            }
        });
        return bottom;
    }

    /**
     * Move the block horizontally and maintain the game board.
     * */
    function updateLR(offset) {
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), minH = h + 1, maxH = -1, minV,
            maxV;
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                if (img.getAttribute('location').split(',')[1] - 0 > maxH) {
                    maxH = img.getAttribute('location').split(',')[1] - 0;
                    maxV = img.getAttribute('location').split(',')[0] - 0;
                }
                if (img.getAttribute('location').split(',')[1] - 0 < minH) {
                    minH = img.getAttribute('location').split(',')[1] - 0;
                    minV = img.getAttribute('location').split(',')[0] - 0;
                }
            }
        });
        if (invalid(offset)) offset = 0;
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                let th = img.getAttribute('location').split(',')[1], tv = img.getAttribute('location').split(',')[0];
                img.setAttribute('location', `${tv},${th - 0 + offset}`);
                img.style.left = `${(th - 0 + offset) * getBlockSize()}px`;
                location[tv - 0][th - 0] = 0;
                location[tv - 0][th - 0 + offset] = 1;
            }
        });
    }
    /**
     * Check the block is can be moved horizontally or not, based on
     * game rule.
     *
     * @return {boolean} movable.
     * */
    function invalid(offset) {
        for (let i = 0; i < location.length - 1; i++) {
            if (location[i][0] === 1 && offset === -1) return true;
            if (location[i][location[i].length - 1] === 1 && offset === 1) return true;
            for (let j = 0; j < location[i].length; j++) {
                if (location[i][j] === 1 && location[i][j + offset] === 2)
                    return true;
            }
        }
        return false;
    }

    /**
     * Rotate the block and maintain the game board.
     * */
    function rotate() {
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), matrix = [v + 1, -1, h + 1, -1],
            locations = [];
        imgList.forEach((img) => {
            if (img.getAttribute('moving') === '1') {
                let tv = img.getAttribute('location').split(',')[0] - 0,
                    th = img.getAttribute('location').split(',')[1] - 0;
                locations.push([tv, th]);
                if (matrix[0] > tv) matrix[0] = tv;
                if (matrix[1] < tv) matrix[1] = tv;
                if (matrix[2] > th) matrix[2] = th;
                if (matrix[3] < th) matrix[3] = th;
            }
        });
        let middlePoint = [matrix[0] + Math.floor((matrix[1] - matrix[0]) / 2), matrix[2] + Math.floor((matrix[3] - matrix[2]) / 2)],
            temp = [[0, 0], [0, 0], [0, 0], [0, 0]], i = 0;
        for (let i = 0; i < locations.length; i++) {
            temp[i][0] = middlePoint[0] + middlePoint[1] - locations[i][1];
            temp[i][1] = middlePoint[1] - middlePoint[0] + locations[i][0];
        }
        if (!invalidRotate(temp)) {
            location[locations[0][0]][locations[0][1]] = 0;
            location[locations[1][0]][locations[1][1]] = 0;
            location[locations[2][0]][locations[2][1]] = 0;
            location[locations[3][0]][locations[3][1]] = 0;
            location[temp[0][0]][temp[0][1]] = 1;
            location[temp[1][0]][temp[1][1]] = 1;
            location[temp[2][0]][temp[2][1]] = 1;
            location[temp[3][0]][temp[3][1]] = 1;
            imgList.forEach((img) => {
                if (img.getAttribute('moving') === '1') {
                    img.setAttribute('location', `${temp[i][0]},${temp[i][1]}`);
                    img.style.top = `${temp[i][0] * getBlockSize()}px`;
                    img.style.left = `${temp[i][1] * getBlockSize()}px`;
                    i++;
                }
            });
        }

    }

    /**
     * Check the block is can be rotated or not, based on
     * game rule.
     *
     * @return {boolean} rotatable.
     * */
    function invalidRotate(temp) {
        for (let i = 0; i < temp.length; i++) {
            if (temp[i][0] < 0 || temp[i][0] > v - 1 || temp[i][1] < 0 || temp[i][1] > h - 1) return true;
            if (location[temp[i][0]][temp[i][1]] === 2)
                return true;
        }
        return false;
    }

    function isLose() {
        return location[0].indexOf(2) !== -1;
    }

    /**
     * Clear the line which fulfilled the rule and maintain the game board.
     **/
    function clearLine() {
        let needDrop = false, lastFullLine = 0, firstFullLine = -1, first = true;
        for (let i = 0; i < location.length - 1; i++) {
            if (location[i].indexOf(1) === -1 && location[i].indexOf(0) === -1) {
                if (first) firstFullLine = i;
                first = false;
                lastFullLine = i;
                needDrop = true;
                location[i] = new Array(h).fill(0);
                let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img');
                imgList.forEach((img) => {
                    if (img.getAttribute('location').split(',')[0] - 0 === lastFullLine && img.getAttribute('moving') === '0') {
                        document.getElementsByTagName('main')[0].removeChild(img);
                    }
                });
            }
        }
        if (needDrop) {
            for (let i = 0; i < lastFullLine; i++) {
                for (let j = 0; j < location[i].length; j++) {
                    if (location[i][j] === 2) {
                        location[i][j] = 1;
                        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img');
                        imgList.forEach((img) => {
                            if (img.getAttribute('moving') === '0' && img.getAttribute('location') === `${i},${j}`) {
                                img.setAttribute('moving', '1');
                            }
                        });
                    }
                }
            }
            updateDown(lastFullLine - firstFullLine + 1);
        }
        else draw(shapes[Math.floor(Math.random() * (shapes.length - 1))]);
    }

    /**
     * Get the block size based on the size of window.
     * */
    function getBlockSize() {
        return window.innerWidth / h < window.innerHeight / v ? window.innerWidth / h : window.innerHeight / v;
    }

    /**
     * Add the animation effect for svg.
     *
     * @param {number} moving the value of 'moving' attribute, define which image should animate.
     * @param {number} dir define which type animation it should play.
     * */
    function animation(moving, dir) {
        let imgList = document.getElementsByTagName('main')[0].querySelectorAll('img'), minV = v + 1, maxV = -1;
        imgList.forEach((img) => {
            if (img.getAttribute('moving') - 0 === moving) {
                svga(img, dir);
                setTimeout(() => {
                    svga(img, 0)
                }, 600);
            }
        });
    }

    /**
     * Start point
     * */
    drawGameBoard(20, 10);
    draw(shapes[Math.floor(Math.random() * (shapes.length - 1))]);

    /**
     * Event listeners
     * */
    window.addEventListener('resize', () => {
        let objList = document.getElementsByTagName('main')[0].querySelectorAll('.block-img');
        objList.forEach((obj) => {
            obj.style.height = getBlockSize() + 'px';
            obj.style.width = getBlockSize() + 'px';
        });
    });

    window.addEventListener('keydown', e => {
        switch (e.code) {
            case 'ArrowUp':
                rotate();
                break;
            case 'ArrowLeft':
                //animation(1, 1);
                updateLR(-1);
                break;
            case 'ArrowRight':
                //animation(1, 1);
                updateLR(1);
                break;
            case 'ArrowDown':
                //animation(1, 1);
                if (updateDown(1) && !isLose()) {
                    clearLine();
                }
                break;
            case 'KeyW':
                rotate();
                break;
            case 'KeyA':
                updateLR(-1);
                break;
            case 'KeyD':
                updateLR(1);
                break;
            case 'KeyS':
                if (updateDown(1) && !isLose()) {
                    clearLine();
                }
                break;
        }
    });

    /**
     * Repaint game board.
     * Set the speed by modify the value of speed at top of file.
     * */
    setInterval(() => {
        if (updateDown(1) && !isLose()) clearLine();
    }, speed);
})();
//todo: HI mark.