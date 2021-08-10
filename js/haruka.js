/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const ROOM_ID = 21652717;
const MADEL_ID = 229943;
// add new emoji text here.
// Keep all assets in gif.
// must be a 2D array, each sub-element has 4 elements maximum.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/haruka/";
const emoji = [["傻豹", "吃桃", "rua豹","问号豹"],
    ["打滚","跳脸豹","打call","打豹"],
    ["猜拳","困","摇摆","耶"],
    ["豹睡","我不玩了", "阿巴", "玩手机"],
    ["豹豹！", "豹条"]];

const link = chrome.extension.getURL("../images/haruka/abaaba.svg");
var imgs = [];
for (let i = 0; i < emoji.length; i++) {
    for (let j = 0; j < emoji[i].length; j++) {
        if(emoji[i][j] === "豹条")
            imgs.push(new ImageButton(chrome.extension.getURL(SRC+emoji[i][j]+".gif"), 2));
        else
            imgs.push(new ImageButton(chrome.extension.getURL(SRC+emoji[i][j]+".gif"), 1));
    }
}