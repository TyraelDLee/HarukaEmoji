<p align="center">
    <img src="https://github.com/TyraelDLee/HarukaEmoji/blob/main/images/abaaba.png"/>
</p>

# HarukaEmoji
rua豹使人快乐，rua了又rua！<br>

rua豹器5.11来啦 <br>
兼容绝大多数chromium内核浏览器，例如：Opera浏览器，360浏览器，新MS Edge，yandex....。<br>
现已支持火狐浏览器，见：<a href="https://addons.mozilla.org/zh-CN/firefox/addon/rua%E8%B1%B9%E5%99%A8/">火狐扩展商店</a>

## 已有的功能
- 视频投稿推送通知。
- 直播间开播推送通知。
- 直播牌子自动切换。
- 自动签到。
- 弹幕姬表情选取发送框（目前仅支持八儿力老师的直播间）。
- 默认直播画质。
- 大会员B币兑换。
- 隐身进入直播间。
- 自动打卡有牌子的直播间。
- 右键关联菜单搜索。识别到AV/BV号时会自动跳转到视频页面，其余的会跳转到b站搜索结果。
- 自动打卡有牌子的直播间。
- 主站视频下载，支持单音轨下载<br>
  注：音轨音质保存是会选择视频提供的最佳音频。<br>
- 快速录制直播片段 (beta) <br> 支持录制重放，默认保留开始录制前5分钟片段，可在设置中设置重放时长
- 增加了新版UI主页分区隐藏的功能。
- 添加了音乐播放器页面的下载功能。

## Manifest V3
自5.10版开始rua豹器已转为Manifest V3扩展应用。

### 关于MV3
MV3带来了一系列的性能以及安全性提升，具体可以参阅[Google官方文档](https://developer.chrome.com/docs/extensions/mv3/intro/)(如果你感兴趣的话)。<br>
其中最重要的一点：MV2将于2023年1月停止支持，届时现有的MV2也将无法运行。当然也可以不更新浏览器来继续使用MV2扩展应用。<br>

### 为什么要现在转移为MV3应用
MV3作为自有扩展应用以来最大一次更新，对服务端的更改是巨大的。service worker直接取代了现有的background脚本，也就导致需要完全重写扩展应用服务端。<br>
rua豹器的MV3转移计划可以追随到数个版本前。作为个人开发者我没有足够的精力同时维护两个不同版本 TvT... 而且MV2将于明年初被完全废止。<br>
5.10将会提供mv2 mv3两个版本，也会是最后一个mv2版本。今后的新版本将全面转为mv3。

### 对用户有什么影响
由于service worker取代了现有的background脚本，而且不像background脚本可常驻后台运行service worker有自己的生存周期。原先的定时器需要改为alarms API，由于alarms API的限制两次运行之间的间隔最小为1分钟。所以原先10s左右就可以收到开播、动态的通知现在需要1分钟左右。相较于原来的10秒，这是一个不小的间隔。<br>
但是最小间隔只适用于发行版，也就是在商店或者crx直接安装的。<br>
所以只需以下步骤即可将通知间隔改为原先的10秒钟：
1. 将在Gitee、GitHub发行页下载的crx文件后缀改为zip后解压
2. 打开位于扩展程序页面右边的<b>开发者模式</b>
3. 选择位于扩展程序页面左边的<b>加载已解压的扩展程序</b>，加载刚刚从zip文件解压的源码

## 安装
### crx文件安装
- 打开浏览器插件页；
- 开启开发者模式；
- 把crx文件拖入页面；
- 关闭开发者模式。

### 应用商店安装
- chrome 网上应用店搜索rua豹器
- 或者用下方链接直达
- 安装即可。

## 怎么用
在b站登录自己的账号后，插件所有功能就会自动运行。

### 自定义设置
单击地址栏右侧插件图标即可打开设置。
目前可以设置的有：
- 开关通知
- 通知模式（大图/普通）
- 开关自动签到
- 开关自动切换粉丝勋章
- 默认直播画质
- 大会员B币兑换

### 移动端
下载支持插件的浏览器（如kiwi）并在浏览器安装即可。（暂不支持iOS）

## 下载：
[chrome插件商店](https://chrome.google.com/webstore/detail/rua%E8%B1%B9%E5%99%A8/igapngheaefbfhikpbngjgakfnedkchb)
<br>
[火狐扩展商店](https://addons.mozilla.org/zh-CN/firefox/addon/rua%E8%B1%B9%E5%99%A8/)
<br>
右边"发布"页（由于mv3只有本地加载的扩展后台刷新可以小于一分钟。所以mv3版今后只提供zip压缩包，不再提供crx与xpi文件）。
<br>
要从本地加载扩展：请在"扩展程序"页打开"开发者模式"后点击"加载已解压的扩展程序"。
- 如果你的**chromium内核**版本**大于等于97**请考虑使用mv3版。
- 如果你的**chromium内核**版本**小于97**请下载mv2版。
- 如果你的浏览器是**火狐**请下载火狐的xpi安装文件或者从火狐商店安装。

## 版本记录
### ver 5.11
- 现在可以为up单独设置通知偏好了（包括开播、投稿、动态）。
- 视频页加入了Hi-Res音频缓存的功能。
- 一些其他改进。

### ver 5.10
- 悬浮球现在支持番剧页面了，可以下载番剧了。
- 现在可以缓存8k的视频了。
- 加入了消息推送的功能 (包括@、赞、回复、私信、系统通知)。
- 加入了新动态推送的功能。
- 更改了开播查询API，现在推送延迟更小了。
- 添加了对超大文件的下载支持.
- 更改了下载方式（但是现在在文件完成下载前请不要关掉页面，不用担心文件是以流的方式直接写入硬盘的不会占用内存），修复了文件名突然变成一串数字的问题。
- 现已转为MV3应用。
- 现在更新已经不会再将设置初始化。
- 一些其他改进。

### ver 5.9
- 现在音频缓存会自动根据视频、音频信息填入元数据（作者，标题，年份，歌词等）。
- 添加了直播间当弹幕发送被吞时的提示。
- 现在养牌子打卡每日刷新由0点改为了8点。
- 修复了音频页面下载按钮显示不正确的问题。
- 修复了强力隐身模式下主站显示未登陆的问题。
- 一些其他改进。

### ver 5.8
- 添加了增强隐身的功能。
- 添加了音乐播放器页面的音乐下载，下载质量为当前音乐提供的最佳音质，格式为flac或m4a。(虽然不知道有什么用)
- 添加了表情权限显示。
- 减少了ass文件弹幕字体的描边宽度，现在看上去更自然了。
- 修复了弹幕框字数上限显示不正确的问题。
- 修复了某些情况下主页分区隐藏不生效的问题。
- 修复了插件导致的主页"动态"图标显示不正常的问题。
- 一些其他改进。

### ver 5.7
- 增加了对"房间专属表情"的支持。
- 增加了新版UI主页分区隐藏的功能。
- 一些其他改进。

### ver 5.6
- 现在可以缓存HDR视频了。
- 一些其他改进。

### ver 5.5
- 现在缓存音频会自动保存为m4a文件，不需要再手动修改文件名了。
- 添加了杜比全景声音频下载的功能。（由于封装问题杜比全景声音频会保存为mp4格式）

### ver 5.4
- 添加了视频弹幕下载的功能。
- 禁用了macOS下的推送"显示封面"开关，因为macOS不支持此类推送。
- 修复了macOS中文输入法回车键在直播间悬浮输入框中意外触发弹幕发送的问题。
- 一些其他改进。

### ver 5.3
- 提高了录制直播片段的导出效率。
- 添加了通用表情及UP大表情的悬浮窗以及全屏下的支持。(支持所有直播间)
- 修复了一些问题。

### ver 5.2
- 添加了快速录制直播片段。
- 修复了一些问题。

### ver 5.1
- 添加了音频的wav转码功能。
- 添加了弹幕内容查询功能。  
- 修复了一些问题。

### ver 5.0
- 添加了视频页面的视频/音轨下载功能。
- 添加了视频页面的弹幕查询功能。
- 优化了直播间深色模式的支持。
- 更新了勋章查询的API，修复了勋章佩戴失效的问题。
- 修复了一些问题。

### ver 4.14.3
- 将Haruna对高分辨率屏幕做了支持。
- 添加了检测更新版本功能。
- 修复了一些问题。

### ver 4.14
- 添加了隐身进入直播间的功能。
- 添加了右键关联菜单搜索。
- 添加了自动打卡有牌子的直播间。

### ver 4.13
- 修复了一系列问题。
- 移除了直播间无侧边栏网页全屏的选项。(因为我是猪陛...)

### ver 4.12
- 添加了视频更新的推送通知。
- 添加了直播间无侧边栏网页全屏的选项。  
- 修复了关闭浏览器再启动后无法立即签到的问题。
- 更改了天选之人抽奖的逻辑。现在点击参与后天选窗口会自动关闭，开奖时若没有中奖则不再会弹窗。注：此功能不会影响正常参与天选。
- 修复了一些微小的问题。

### ver 4.11
- 添加了默认画质的设置。
- 添加了大会员B币兑换。  
- 修复了一些微小的问题。

### ver 4.10
- 添加了直播间悬窗的初始位置。
- 修复了在某些直播间换牌子失效的问题。
- 修复了某些情况下自动签到失效的问题。
- 添加了对深色模式的支持

### ver 4.9
- 添加了使用说明页面。
- 修复了点击通知时可能会打开多个窗口的问题。
- 改进了通过通知打开直播间时的窗口逻辑。
- 添加了对火狐的支持。
- 修复了初次进入直播间时牌子显示不正确的问题。

### ver 4.8
- 添加了图片模式通知。
- 修复了一些问题。
- 添加了对移动端的支持。（需要移动端浏览器支持插件）

### ver 4.7
- 改进了翻牌子的功能，现在支持多个直播间无缝切换，不再需要刷新了。
- 添加了设置页面。
- 修复了移动悬窗时文本会被选中的问题。

### ver 4.6
- 添加了自动签到功能。
- 改进了直播间信息API调用，开播推送延迟大幅减少。


## 开源组件许可
### FFmpeg.wasm
- Offical site: [ffmpegwasm.netlify.app](https://ffmpegwasm.netlify.app/)
- Copyright (c) FFmpeg.wasm developers and contributors
- License: [github.com/ffmpegwasm/ffmpeg.wasm-core/blob/n4.3.1-wasm/LICENSE.md](https://github.com/ffmpegwasm/ffmpeg.wasm-core/blob/n4.3.1-wasm/LICENSE.md)

### Protocol Buffers
- Offical site: [developers.google.com/protocol-buffers](https://developers.google.com/protocol-buffers/)
- Copyright (c) 2008 Google Inc.
- License: [github.com/protocolbuffers/protobuf/blob/master/LICENSE](https://github.com/protocolbuffers/protobuf/blob/master/LICENSE)

### CRC crack
- CRC.js [github.com/bilibili-helper/bilibili-helper-o/blob/master/src/js/libs/crc32.js](https://github.com/bilibili-helper/bilibili-helper-o/blob/master/src/js/libs/crc32.js)
- Copyright (c) 2020 Zac Yu, ruo
- License: [github.com/bilibili-helper/bilibili-helper-o/blob/master/LICENSE](https://github.com/bilibili-helper/bilibili-helper-o/blob/master/LICENSE)
