// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron')
const desktopCapturer = require('electron').desktopCapturer
const electron = require('electron')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var lmpWindows = [];
// 记录鼠标操作，用于移动
let isMouseDown = false;
let x_offset = 0, y_offset = 0;

// 初始化主窗体
function createWindow () {
  console.log('[main process] create main window');
  mainWindow = new BrowserWindow(
    {
      width: 1,
      height: 1,
      x: 500,
      y: 200,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      resizable: false,
      useContentSize: true,
      // focusable: false,
      skipTaskbar: true
    });

  mainWindow.loadFile('index.html')

  mainWindow.setPosition(500, 200); 
  mainWindow.on('closed', function () {
    mainWindow = null
  });
}

// 初始化lmp窗口
var createLmpWindow = function(){
  console.log('[main process] create lm panel');
  var lmpWindow = new BrowserWindow(
  {
    width: 300, 
    height: 200,
    x: 500,
    y: 300,
    frame: false, 
    alwaysOnTop: true, 
    transparent: true,
    useContentSize: true,
    parent: mainWindow
  });
  lmpWindow.loadFile('lmPanel.html');
}

// 锁定宠物
var isMainWindowLock = false;
var lockCount = 0;
var toggleLock = function(){
  if(mainWindow){
    console.log('[main process] change lock state');
    isMainWindowLock = !isMainWindowLock;
    mainWindow.setIgnoreMouseEvents(isMainWindowLock);
    mainWindow.webContents.send('sendMsg', {op:'lock', lockState:isMainWindowLock});
    lockCount = 0;
  }
}
// 主界面缩放、移动
var mainWindow_w = 0, mainWindow_h = 0, mainWindow_x = 0, mainWindow_y = 0;
var resizeMainWindow = function(w, h){
  mainWindow_w = w;
  mainWindow_h = h;
  mainWindow.setSize(mainWindow_w , mainWindow_h );
}
var moveMainWindow = function(x, y){
  if(!isMainWindowLock){
    mainWindow_x = x;
    mainWindow_y = y;
    mainWindow.setPosition(x, y);
  }
}

// 结束应用
var closeApp = function(){
  app.quit();
}

// 创建应用
app.on('ready', () => {
  createWindow();
  // createLmpWindow();
  // ----------------------- 全局快捷键监听 -----------------------
  console.log('[main process] start listening global keyboard event...');
  globalShortcut.register('Alt+L', () => {
    toggleLock();
  });
  // ----------------------- 与页面通信 -----------------------------
  console.log('[main process] start listening handle msg...');
  
  ipcMain.on('sendMsg', (event, arg) => {
    posAry = mainWindow.getPosition();
    var curMousePos = electron.screen.getCursorScreenPoint();
    switch(arg.op){
      // -------------- 鼠标 --------------
      case 'mouseDown':
        x_offset = posAry[0] - curMousePos.x;
        y_offset = posAry[1] - curMousePos.y;
        isMouseDown = true;
      break;
      case 'mouseUp':
        isMouseDown = false;
        x_offset = y_offset = 0;
      break;
      // -------------- 移动 --------------------
      case 'move': 
        var point = electron.screen.getCursorScreenPoint();
        moveMainWindow(posAry[0]+arg.x, posAry[1]+arg.y);
      break;
      // -------------- 缩放 --------------------
      case 'resize':
        resizeMainWindow(parseInt(40+arg.w), parseInt(40+arg.h));
        if(arg.enlarge){
          moveMainWindow(posAry[0]-3, posAry[1]-5);
        }else{
          moveMainWindow(posAry[0]+3, posAry[1]+5);
        }
      break;
      // --------------- 锁定 ---------------------
      case 'lock':
        toggleLock();
      break;
      // --------------- 关闭app ---------------------
      case 'closeApp':
        closeApp();
      break;
      // --------------- 截图数据 ---------------------
      case 'orcScreen':
        ocr(arg.imgBase64Str);
      break;
      // --------------- 获取北京时间 ------------------
      case 'chinaTime': 
        event.returnValue = chinaTime().getTime();
      return;
      // --------------- 打印日志 ------------------
      case 'log':
        console.log(arg.log);
      break;
    }
    event.returnValue = '';
  });
  // 开启鼠标监听
  console.log('[main process] start listening mouse event...');
  setInterval(printPoint, 100);
})


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

// ------------------------ 鼠标事件 ------------------------------
var pointX = 0, pointY = 0;
var printPoint = function(){
  if(mainWindow == null){
    return;
  }
  var point = electron.screen.getCursorScreenPoint();
  pointX = point.x;
  pointY = point.y;
  mainWindow.webContents.send('sendMsg', {op:'mousePosition', x: pointX, y:pointY});
  if(isMouseDown){
    moveMainWindow(point.x + x_offset, point.y + y_offset);
  }
  // 如果主界面已锁定，鼠标经过时增加窗口透明度
  lockCount ++;
  var lockCountMax = 20;
  if(lockCount > lockCountMax){
    lockCount = lockCountMax;
  }
  
  if(isMainWindowLock){
    if(pointX > mainWindow_x && pointX < mainWindow_x+mainWindow_w && pointY > mainWindow_y && pointY < mainWindow_y+mainWindow_h && lockCount == lockCountMax){
      mainWindow.webContents.send('sendMsg', {op:'opacityIncr'});
    }else{
      mainWindow.webContents.send('sendMsg', {op:'opacityDecr'});
    }
  }else{
    mainWindow.webContents.send('sendMsg', {op:'opacityDecr'});
  }
  
}
// ------------------------ 分析已捕捉的屏幕 baidu ocr ------------------------------
var AipOcr = require('./src/index').ocr;
var APP_ID = "11476140";
var API_KEY = "Wlrv1LbQfwGd3ePiDvMryvvO";
var SECRET_KEY = "P3Idw75HwBvTGZXFjhF2Qt2R9hQrqL6RLGq";

var client = new AipOcr(APP_ID, API_KEY, SECRET_KEY);

var ocr = function(imgBase64Str){
  if(imgBase64Str && imgBase64Str != ''){
    client.generalBasic( imgBase64Str, {language_type:'CHN_ENG'} ).then(function (result) {
        var resultObj = JSON.stringify(result);
        for(var i = 0; i < resultObj.words_result_num; i++){
          // TODO
        }
    });
  }
}
