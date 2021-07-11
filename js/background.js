var roomImage;
var roomStatus;
var roomTitle = "";
var roomUrl;
var previousStatus = 0;
var UID = 477332594;

function getInfo(){
  // Using XMLHttpRequest to deal with cross domain issue. Fuxk chrome and CORS.
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var json = xhr.responseText;
    json = json.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1');
    json = JSON.parse(json);
    let data = json["data"];
    roomImage = data["cover"];
    roomStatus =  data["liveStatus"];
    roomTitle = data["title"];
    roomUrl = data["url"];
  };
  xhr.open("GET", "https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid="+UID);
  xhr.send();
  console.log(roomTitle+"\r\n"+roomUrl+"\r\n"+roomStatus);
  if(roomStatus === 1 && roomStatus !== previousStatus){
    pushNotification();
  }
  previousStatus = roomStatus;
}

function pushNotification(){
  var id =  "rua"+Math.random();
  chrome.notifications.create(id,
      {
        type: "basic",
        iconUrl: "../images/abaaba.png",
        title: roomTitle,
        message: "",
      },
      function (id) {
        chrome.notifications.onClicked.addListener(function() {
          chrome.tabs.create({url: roomUrl});
        });
      }
  );
}

window.setInterval(getInfo,5000);
