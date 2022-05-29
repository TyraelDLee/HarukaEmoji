class md5{
    constructor() {
        this.S = [[7,12,17,22],[5,9,14,20],[4,11,16,23],[6,10,15,21]];
        this.T = [
            [-680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329],
            [-165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734],
            [-378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651],
            [-198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551]
        ];
        this.Shift = [
            [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
            [1,6,11,0,5,10,15,4,9,14,3,8,13,2,7,12],
            [5,8,11,14,1,4,7,10,13,0,3,6,9,12,15,2],
            [0,7,14,5,12,3,10,1,8,15,6,13,4,11,2,9]];
    }

    encode(string){
        var i
        var output = []
        output[(string.length >> 2) - 1] = undefined
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0
        }
        var length8 = string.length * 8
        for (i = 0; i < length8; i += 8) {
            output[i >> 5] |= (string.charCodeAt(i / 8) & 0xff) << i % 32
        }
        console.log(output)
        console.log(this.progress(output, output.length * 8));
    }

    safeAdd(x, y) {
        var lsw = (x & 0xffff) + (y & 0xffff)
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
        return (msw << 16) | (lsw & 0xffff)
    }

    progress(arr, len){
        arr[len >> 5] |= 0x80 << len % 32;
        arr[(((len + 64) >>> 9) << 4) + 14] = len;
        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;
        for (let i = 0; i < arr.length; i+=16) {
            let Ta = a, Tb = b, Tc = c, Td = d;
            a = this.FF(a, b, c, d, arr[i + this.Shift[0][0]], this.S[0][0], this.T[0][i]);
            d = this.FF(d, a, b, c, arr[i + this.Shift[0][1]], this.S[0][1], this.T[0][i+1]);
            c = this.FF(c, d, a, b, arr[i + this.Shift[0][2]], this.S[0][2], this.T[0][i+2]);
            b = this.FF(b, c, d, a, arr[i + this.Shift[0][3]], this.S[0][3], this.T[0][i+3]);
            a = this.FF(a, b, c, d, arr[i + this.Shift[0][4]], this.S[0][0], this.T[0][i+4]);
            d = this.FF(d, a, b, c, arr[i + this.Shift[0][5]], this.S[0][1], this.T[0][i+5]);
            c = this.FF(c, d, a, b, arr[i + this.Shift[0][6]], this.S[0][2], this.T[0][i+6]);
            b = this.FF(b, c, d, a, arr[i + this.Shift[0][7]], this.S[0][3], this.T[0][i+7]);
            a = this.FF(a, b, c, d, arr[i + this.Shift[0][8]], this.S[0][0], this.T[0][i+8]);
            d = this.FF(d, a, b, c, arr[i + this.Shift[0][9]], this.S[0][1], this.T[0][i+9]);
            c = this.FF(c, d, a, b, arr[i + this.Shift[0][10]], this.S[0][2], this.T[0][i+10]);
            b = this.FF(b, c, d, a, arr[i + this.Shift[0][11]], this.S[0][3], this.T[0][i+11]);
            a = this.FF(a, b, c, d, arr[i + this.Shift[0][12]], this.S[0][0], this.T[0][i+12]);
            d = this.FF(d, a, b, c, arr[i + this.Shift[0][13]], this.S[0][1], this.T[0][i+13]);
            c = this.FF(c, d, a, b, arr[i + this.Shift[0][14]], this.S[0][2], this.T[0][i+14]);
            b = this.FF(b, c, d, a, arr[i + this.Shift[0][15]], this.S[0][3], this.T[0][i+15]);

            a = this.GG(a, b, c, d, arr[i + this.Shift[1][0]], this.S[1][0], this.T[1][i]);
            d = this.GG(d, a, b, c, arr[i + this.Shift[1][1]], this.S[1][1], this.T[1][i+1]);
            c = this.GG(c, d, a, b, arr[i + this.Shift[1][2]], this.S[1][2], this.T[1][i+2]);
            b = this.GG(b, c, d, a, arr[i + this.Shift[1][3]], this.S[1][3], this.T[1][i+3]);
            a = this.GG(a, b, c, d, arr[i + this.Shift[1][4]], this.S[1][0], this.T[1][i+4]);
            d = this.GG(d, a, b, c, arr[i + this.Shift[1][5]], this.S[1][1], this.T[1][i+5]);
            c = this.GG(c, d, a, b, arr[i + this.Shift[1][6]], this.S[1][2], this.T[1][i+6]);
            b = this.GG(b, c, d, a, arr[i + this.Shift[1][7]], this.S[1][3], this.T[1][i+7]);
            a = this.GG(a, b, c, d, arr[i + this.Shift[1][8]], this.S[1][0], this.T[1][i+8]);
            d = this.GG(d, a, b, c, arr[i + this.Shift[1][9]], this.S[1][1], this.T[1][i+9]);
            c = this.GG(c, d, a, b, arr[i + this.Shift[1][10]], this.S[1][2], this.T[1][i+10]);
            b = this.GG(b, c, d, a, arr[i + this.Shift[1][11]], this.S[1][3], this.T[1][i+11]);
            a = this.GG(a, b, c, d, arr[i + this.Shift[1][12]], this.S[1][0], this.T[1][i+12]);
            d = this.GG(d, a, b, c, arr[i + this.Shift[1][13]], this.S[1][1], this.T[1][i+13]);
            c = this.GG(c, d, a, b, arr[i + this.Shift[1][14]], this.S[1][2], this.T[1][i+14]);
            b = this.GG(b, c, d, a, arr[i + this.Shift[1][15]], this.S[1][3], this.T[1][i+15]);

            a = this.HH(a, b, c, d, arr[i + this.Shift[2][0]], this.S[2][0], this.T[2][i]);
            d = this.HH(d, a, b, c, arr[i + this.Shift[2][1]], this.S[2][1], this.T[2][i+1]);
            c = this.HH(c, d, a, b, arr[i + this.Shift[2][2]], this.S[2][2], this.T[2][i+2]);
            b = this.HH(b, c, d, a, arr[i + this.Shift[2][3]], this.S[2][3], this.T[2][i+3]);
            a = this.HH(a, b, c, d, arr[i + this.Shift[2][4]], this.S[2][0], this.T[2][i+4]);
            d = this.HH(d, a, b, c, arr[i + this.Shift[2][5]], this.S[2][1], this.T[2][i+5]);
            c = this.HH(c, d, a, b, arr[i + this.Shift[2][6]], this.S[2][2], this.T[2][i+6]);
            b = this.HH(b, c, d, a, arr[i + this.Shift[2][7]], this.S[2][3], this.T[2][i+7]);
            a = this.HH(a, b, c, d, arr[i + this.Shift[2][8]], this.S[2][0], this.T[2][i+8]);
            d = this.HH(d, a, b, c, arr[i + this.Shift[2][9]], this.S[2][1], this.T[2][i+9]);
            c = this.HH(c, d, a, b, arr[i + this.Shift[2][10]], this.S[2][2], this.T[2][i+10]);
            b = this.HH(b, c, d, a, arr[i + this.Shift[2][11]], this.S[2][3], this.T[2][i+11]);
            a = this.HH(a, b, c, d, arr[i + this.Shift[2][12]], this.S[2][0], this.T[2][i+12]);
            d = this.HH(d, a, b, c, arr[i + this.Shift[2][13]], this.S[2][1], this.T[2][i+13]);
            c = this.HH(c, d, a, b, arr[i + this.Shift[2][14]], this.S[2][2], this.T[2][i+14]);
            b = this.HH(b, c, d, a, arr[i + this.Shift[2][15]], this.S[2][3], this.T[2][i+15]);

            a = this.II(a, b, c, d, arr[i + this.Shift[3][0]], this.S[3][0], this.T[3][i]);
            d = this.II(d, a, b, c, arr[i + this.Shift[3][1]], this.S[3][1], this.T[3][i+1]);
            c = this.II(c, d, a, b, arr[i + this.Shift[3][2]], this.S[3][2], this.T[3][i+2]);
            b = this.II(b, c, d, a, arr[i + this.Shift[3][3]], this.S[3][3], this.T[3][i+3]);
            a = this.II(a, b, c, d, arr[i + this.Shift[3][4]], this.S[3][0], this.T[3][i+4]);
            d = this.II(d, a, b, c, arr[i + this.Shift[3][5]], this.S[3][1], this.T[3][i+5]);
            c = this.II(c, d, a, b, arr[i + this.Shift[3][6]], this.S[3][2], this.T[3][i+6]);
            b = this.II(b, c, d, a, arr[i + this.Shift[3][7]], this.S[3][3], this.T[3][i+7]);
            a = this.II(a, b, c, d, arr[i + this.Shift[3][8]], this.S[3][0], this.T[3][i+8]);
            d = this.II(d, a, b, c, arr[i + this.Shift[3][9]], this.S[3][1], this.T[3][i+9]);
            c = this.II(c, d, a, b, arr[i + this.Shift[3][10]], this.S[3][2], this.T[3][i+10]);
            b = this.II(b, c, d, a, arr[i + this.Shift[3][11]], this.S[3][3], this.T[3][i+11]);
            a = this.II(a, b, c, d, arr[i + this.Shift[3][12]], this.S[3][0], this.T[3][i+12]);
            d = this.II(d, a, b, c, arr[i + this.Shift[3][13]], this.S[3][1], this.T[3][i+13]);
            c = this.II(c, d, a, b, arr[i + this.Shift[3][14]], this.S[3][2], this.T[3][i+14]);
            b = this.II(b, c, d, a, arr[i + this.Shift[3][15]], this.S[3][3], this.T[3][i+15]);

            a = this.safeAdd(a, Ta);
            b = this.safeAdd(b, Tb);
            c = this.safeAdd(c, Tc);
            d = this.safeAdd(d, Td);
        }

        let res = [a, b, c, d];
        var i
        var output = ''
        var length32 = res.length * 32
        for (i = 0; i < length32; i += 8) {
            output += String.fromCharCode((res[i >> 5] >>> i % 32) & 0xff)
        }

        var hexTab = '0123456789abcdef'
        var y = ''
        var x
        for (i = 0; i < output.length; i += 1) {
            x = output.charCodeAt(i)
            y += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
        }
        return y
    }
    
    FF(a,b,c,d,x,s,t){

    }

    GG(a,b,c,d,x,s,t){

    }

    HH(a,b,c,d,x,s,t){

    }

    II(a,b,c,d,x,s,t){

    }
}

function rsa(passc, pK, salt){

}

!function (){
    new md5().encode("test");
}();


