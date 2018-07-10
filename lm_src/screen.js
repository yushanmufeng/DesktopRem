log('[main page] start screenshot task...');
const desktopCapturer = require('electron').desktopCapturer
// type: screen,window
desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
  if (error) {
    log('error');
    throw error;
  }
  for (let i = 0; i < sources.length; ++i) {
    // log('source name:'+sources[i].name);
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sources[i].id,
          minWidth: 1920,
          maxWidth: 1920,
          minHeight: 1080,
          maxHeight: 1080
        }
      }
    })
    .then((stream) => handleStream(stream))
    .catch((e) => handleError(e));
  }
});

var tv = document.getElementById('tvideo');
function handleStream (stream) {
  tv.srcObject = stream;
  tv.onloadedmetadata = (e) => tv.play();
}
function handleError (e) {
  log(e.stack)
}

window.canvasDom = document.getElementById('myCanvas');
window.oldBase64Str = '';
var screenWindow = function(){
  canvasDom.getContext('2d').drawImage(tv, mouseX-150<0?0:mouseX-150, mouseY-20<0?0:mouseY-20, 150, 30, 0, 0, 150, 30);
  // window.canvasDom.getContext('2d').drawImage(window.tv, 0,0,1920,1080);
  var base64 = window.canvasDom.toDataURL('images/png');
  base64 = base64.substring(22, base64.length);
  if(window.oldBase64Str != base64){
    window.oldBase64Str = base64
    ipc.sendSync('sendMsg', {op:'orcScreen', imgBase64Str: base64});
  }
  
}
setInterval(screenWindow, 1600);
