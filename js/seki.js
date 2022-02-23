/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
// add new emoji text here.
// Keep all assets in webp.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/seki/";
const emoji = ["寄", "猪跑", "山猪跑", "七跑", "彩猪", "七玉", "开枪", "开炮"];

const link = chrome.runtime.getURL("../images/seki/七跑.webp");
var imgs = [];for (let i = 0; i < emoji.length; i++)imgs.push(new ImageButton(chrome.runtime.getURL(SRC+emoji[i]+".webp"), 1));