/**
 * Convert danmaku to ass file
 * for offline play.
 *
 * Currently support danmaku style:
 * - colour,
 * - fontsize (18, 25, 32),
 * - fixed top position,
 * - fixed bottom position
 * - right to left,
 * - left to right.
 *
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
class AssConvert{
    constructor(resX, resY) {
        this.dmexistsTime = 15000 * (resX / 1920);
        this.title = '';
        this.filename = '';
        this.resX = resX;
        this.resY = resY;
        this.danmaku = undefined;
        this.payload = '';
        this.dmNormalChannel = this.initChannel();
        this.dmTopChannel = this.initChannel();
        this.dmDownChannel = this.initChannel();
        this.dmRevChannel = this.initChannel();
        this.weight = 0;
    }

    initChannel(){
        let arr = []
        for (let i = 0; i < ((this.resY-50) / 25); i++) {
            arr.push(-1);
        }
        return arr;
    }

    /**
     * Generate ass file header.
     * */
    genAssTitle(){
        this.title =`[Script Info]
Title: ${this.title}
ScriptType: v4.00+
Collisions: Normal
PlayResX: ${this.resX}
PlayResY: ${this.resY}
Timer: 10.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: DMs,Microsoft YaHei UI,18,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,1,2,0,2,20,20,2,0
Style: DMm,Microsoft YaHei UI,25,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,1,2,0,2,20,20,2,0
Style: DMl,Microsoft YaHei UI,32,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,1,2,0,2,20,20,2,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    }

    /**
     * Generate danmaku in ass file.
     * O(n * m) for non-overlapped layout.
     * */
    genDanmaku(){
        for (let i = 0; i < this.danmaku.size; i++) {//n
            if (this.danmaku.get(i).weight > this.weight){
                let danmakuDir = '', y;
                switch (this.danmaku.get(i).mode) {
                    case 4:
                        this.dmexistsTime = 4000;
                        y = this.resY - this.calculateYpos(this.danmaku.get(i), this.dmTopChannel,this.danmaku.get(i).mode);
                        danmakuDir = `\\pos(${this.calculateStringMiddle()},${y})`;
                        break;
                    case 5:
                        this.dmexistsTime = 4000;
                        y = this.calculateYpos(this.danmaku.get(i), this.dmDownChannel,this.danmaku.get(i).mode);
                        danmakuDir = `\\pos(${this.calculateStringMiddle()},${y})`;
                        break;
                    case 6:
                        this.dmexistsTime = 15000 * (this.resX / 1920);
                        y = this.calculateYpos(this.danmaku.get(i), this.dmRevChannel,this.danmaku.get(i).mode);
                        danmakuDir = `\\move(${0 - this.calculateStringLength(this.danmaku.get(i).content)},${y},${this.resX + this.calculateStringLength(this.danmaku.get(i).content)},${y})`;
                        break;
                    default:
                        this.dmexistsTime = 15000 * (this.resX / 1920);
                        y = this.calculateYpos(this.danmaku.get(i), this.dmNormalChannel,this.danmaku.get(i).mode);
                        danmakuDir = `\\move(${this.resX + this.calculateStringLength(this.danmaku.get(i).content)},${y},${0 - this.calculateStringLength(this.danmaku.get(i).content)},${y})`;
                        break;
                }
                this.payload += `Dialogue: 0,${this.convertMSToS(this.danmaku.get(i).ts)},${this.convertMSToS(this.danmaku.get(i).ts+this.dmexistsTime)},${this.danmaku.get(i).fontsize===18?'DMs':(this.danmaku.get(i).fontsize===25?'DMm':(this.danmaku.get(i).fontsize===32?'DMl':'DMm'))},,20,20,2,,{${danmakuDir}${this.danmaku.get(i).color-1+1===16777215?'':'\\c&H'+this.colorDecToHex(this.danmaku.get(i).color-1+1)}}${this.danmaku.get(i).content}
`;
            }
        }
    }

    /**
     * Calculate vertical position
     * for each danmaku.
     * */
    calculateYpos(damnaku, arr, mode){
        let Ypos = 25;
        for (let j = 0; j < arr.length; j++) {//m
            if (damnaku.ts > arr[j]){
                arr[j] = this.calculateDMOutTime(damnaku.content, damnaku.ts, mode);
                Ypos *= (j+1);
                return Ypos;
            }
        }
        switch (mode){
            case 4:
                this.dmTopChannel = this.initChannel();
                break;
            case 5:
                this.dmDownChannel = this.initChannel();
                break;
            case 6:
                this.dmRevChannel = this.initChannel();
                break;
            default:
                this.dmNormalChannel = this.initChannel();
                break;
        }
        return 25;
    };

    calculateStringLength(text, fontsize){
        return AssConvert.stringLength(text) * (fontsize===25?6.25:(fontsize===18?4.5:fontsize===32?8:6.25));
    }

    calculateStringMiddle(){
        return this.resX / 2;
    }

    /**
     * Calculate fully displayed time for
     * each danmaku. (= the time when channel
     * is available for next danmaku)
     * */
    calculateDMOutTime(text,baseTime, mode){
        return mode === 4 || mode === 5?baseTime + 4100:Math.ceil((this.calculateStringLength(text) + 50) * this.dmexistsTime / this.resY + baseTime);
    }

    /**
     * Convert color code from
     * decimal to hexadecimal
     * Fixed 6-bit length. but why reverse?
     * */
    colorDecToHex(color){
        let hex = ('000000'+color.toString(16).toUpperCase()).slice(-6);
        hex = hex.slice(4,6)+hex.slice(2,4)+hex.slice(0,2);
        return hex;
    }

    /**
     * Convert milliseconds timestamp to
     * h:mm:ss.ms format.
     * */
    convertMSToS(time){
        let mils = time % 1000;
        mils = ('00'+mils).slice(-2);
        time = time / 1000;
        let secs = Math.floor(time % 60);
        let mint = Math.floor((time / 60) % 60);
        let hour = Math.floor((time / 3600) % 60);
        hour = ((hour < 10 && hour >0)?"0"+hour:hour)+":";
        mint = (mint < 10)?"0"+mint:mint;
        secs = (secs < 10)?"0"+secs:secs;
        return hour+mint+":"+secs+"."+mils;
    }

    /**
     * Grab result, save it as ass file
     * and download it.
     * */
    downloadASS(){
        const dl = URL.createObjectURL(new Blob([this.title+this.payload]));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = dl;
        a.download = this.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(dl);
    }

    /**
     * Feed grabbed danmaku to this object.
     * */
    feedDanmaku(danmaku){
        this.danmaku = danmaku;
        this.payload = '';
        this.genDanmaku();
    }

    /**
     * Set weight for danmaku.
     * all danmaku weight which below this weight
     * will not be processed when this weight set.
     * */
    setWeight(weight){
        this.weight = weight;
    }

    setTitle(title){
        this.title = title;
        this.filename = title + '.ass';
        this.genAssTitle();
    }

    /**
     * Get string length for used in pixel.
     * For fontsize 25, use this result * 6.25.
     * */
    static stringLength(string){
        let length = 0;
        Array.from(string).map(function(char){
            char.charCodeAt(0)>255?length += 2:length++;
        });
        return length;
    }
}
