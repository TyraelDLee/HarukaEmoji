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
const emoji = ["白神遥_5835", "白神遥_kusa", "白神遥_阿巴阿巴",
    "白神遥_豹怒", "白神遥_豹笑", "白神遥_吃瓜",
    "白神遥_吃惊", "白神遥_吃桃子", "白神遥_呆呆",
    "白神遥_点赞", "白神遥_好耶", "白神遥_滑稽",
    "白神遥_加油", "白神遥_骄傲", "白神遥_哭哭",
    "白神遥_柠檬", "白神遥_让我康康", "白神遥_跳脸",
    "白神遥_晚安", "白神遥_问号",
    "傻豹", "吃桃", "rua豹", "问号豹",
    "打滚", "跳脸豹", "打call", "打豹",
    "猜拳", "困", "摇摆", "耶",
    "豹睡", "我不玩了", "阿巴", "玩手机",
    "豹豹！", "豹条"];




const link = chrome.extension.getURL("../images/haruka/abaaba.svg");
var imgs = [];
for (let i = 0; i < emoji.length; i++) {
    if (emoji[i] === "豹条")
        imgs.push(new ImageButton(chrome.runtime.getURL(SRC + emoji[i] + ".webp"), 2));
    else
        imgs.push(new ImageButton(chrome.runtime.getURL(SRC + emoji[i] + ".webp"), 1));
}