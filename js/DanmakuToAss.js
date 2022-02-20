class AssConvert{
    constructor(resX, resY) {
        this.dmexistsTime = 15000 * (resX / 1920);
        this.title = '';
        this.filename = '';
        this.resX = resX;
        this.resY = resY;
        this.danmaku = undefined;
        this.payload = '';
        this.dmNormalChannel = [];
        this.dmTopChannel = [];
        this.dmDownChannel = [];
        this.dmRevChannel = [];
        this.initChannel();
        this.weight = 0;
    }

    initChannel(){
        for (let i = 0; i < ((this.resY-50) / 25); i++) {
            this.dmNormalChannel.push(-1);
            this.dmTopChannel.push(-1);
            this.dmDownChannel.push(-1);
            this.dmRevChannel.push(-1);
        }
    }

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

    genDanmaku(){
        for (let i = 0; i < this.danmaku.size; i++) {
            if (this.danmaku.get(i).weight > this.weight){
                let Ypos = 25;
                for (let j = 0; j < this.dmNormalChannel.length; j++) {
                    if (this.danmaku.get(i).ts > this.dmNormalChannel[j]){
                        this.dmNormalChannel[j] = this.calculateDMOutTime(this.danmaku.get(i).content, this.danmaku.get(i).ts);
                        Ypos *= (j+1);
                        break;
                    }
                }
                let danmakuDir = '';
                switch (this.danmaku.get(i).mode) {
                    case 4:
                        this.dmexistsTime = 4000;

                        danmakuDir = `\\pos(${this.calculateStringMiddle()},${Ypos})`;
                        break;
                    case 5:
                        this.dmexistsTime = 4000;

                        danmakuDir = `\\pos(${this.calculateStringMiddle()},${this.resY - Ypos})`;
                        break;
                    case 6:
                        this.dmexistsTime = 15000 * (this.resX / 1920);

                        danmakuDir = `\\move(${0 - this.calculateStringLength(this.danmaku.get(i).content)},${Ypos},${this.resX + this.calculateStringLength(this.danmaku.get(i).content)},${Ypos})`;
                        break;
                    default:
                        this.dmexistsTime = 15000 * (this.resX / 1920);

                        danmakuDir = `\\move(${this.resX + this.calculateStringLength(this.danmaku.get(i).content)},${Ypos},${0 - this.calculateStringLength(this.danmaku.get(i).content)},${Ypos})`;
                        break
                }
                this.payload += `Dialogue: 0,${this.convertMSToS(this.danmaku.get(i).ts)},${this.convertMSToS(this.danmaku.get(i).ts+this.dmexistsTime)},${this.danmaku.get(i).fontsize===18?'DMs':(this.danmaku.get(i).fontsize===25?'DMm':(this.danmaku.get(i).fontsize===32?'DMl':'DMm'))},,20,20,2,,{${danmakuDir}${this.danmaku.get(i).color-1+1===16777215?'':'\\c&H'+this.colorDecToHex(this.danmaku.get(i).color-1+1)}}${this.danmaku.get(i).content}
`;
            }
        }
    }

    calculateStringLength(text, fontsize){
        return AssConvert.stringLength(text) * (fontsize===25?6.25:(fontsize===18?4.5:fontsize===32?8:6.25));
    }

    calculateStringMiddle(){
        return this.resX / 2;
    }

    calculateDMOutTime(text,baseTime){
        return (this.calculateStringLength(text) + 50) * this.dmexistsTime / this.resY + baseTime;
    }

    colorDecToHex(color){
        return ('000000'+color.toString(16).toUpperCase()).slice(-6);
    }

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

    downloadASS(){
        //console.log(this.title+this.payload);
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

    setWeight(weight){
        this.danmaku = undefined;
        this.weight = weight;
    }

    feedDanmaku(danmaku){
        this.danmaku = danmaku;
        this.genDanmaku();
    }

    setTitle(title){
        this.title = title;
        this.filename = title + '.ass';
        this.genAssTitle();
    }

    static stringLength(string){
        let length = 0;
        Array.from(string).map(function(char){
            char.charCodeAt(0)>255?length += 2:length++;
        });
        return length;
    }
}
