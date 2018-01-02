const electron = require('electron')

const {app, BrowserWindow, ipcMain} = electron;

const path = require('path')
const url = require('url')

//require('events').EventEmitter.prototype._maxListeners = 100;
require('events').EventEmitter.defaultMaxListeners = 0

// Mantem a referencia global da janela, senão, a janela vai
// ser fechada automaticamente quando o JavaScript passar o coletor de lixo.
let mainWindow, loginwind, inclusao

function createWindow(icon_dir){
  mainWindow = new BrowserWindow({width: 1200, height: 700, show: false, icon: path.join(__dirname, icon_dir)})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  //mainWindow.webContents.openDevTools()

  // acionado quando a tela é fechada.
  mainWindow.on('closed', function () {
    // mainWindow = null
    app.quit()
  })

  var loginwind = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height:450,
    frame: false,
    show: true,
    icon: path.join(__dirname, icon_dir)
  })
  loginwind.loadURL('file://' + __dirname + '/auxiliar/login.html')

  var inclusao = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height: 280,
    frame: false,
    show: false,
    icon: path.join(__dirname, icon_dir)
  })
  inclusao.loadURL('file://' + __dirname + '/auxiliar/inclusao.html')

  var parcelado = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height: 260,
    frame: false,
    show: false,
    icon: path.join(__dirname, icon_dir)
  })
  parcelado.loadURL('file://' + __dirname + '/auxiliar/parcelado.html')

  var alerta = new BrowserWindow({
    parent: mainWindow,
    width: 400,
    height: 100,
    frame: false,
    show: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, icon_dir)
  })
  alerta.loadURL('file://' + __dirname + '/auxiliar/alerta.html')

  var exclusao = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height: 250,
    frame: false,
    show: false,
    icon: path.join(__dirname, icon_dir)
  })
  exclusao.loadURL('file://' + __dirname + '/auxiliar/excluir_agendamento.html')

  var loading = new BrowserWindow({
    //parent: mainWindow,
    width: 200,
    height: 200,
    modal: true,
    radii: [10,10,10,10],
    transparent: true,
    frame: false,
    show: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, icon_dir)
  })
  loading.loadURL('file://' + __dirname + '/auxiliar/loader/loader.html')

  ipcMain.on('loading-toggle', function () {
      if(loading.isVisible()){
        loading.hide()
      }else{
        loading.show()
      }
  })

  ipcMain.on('login', function (event, arg) {
      loginwind.hide()
      loading.show()
      mainWindow.webContents.send('send-login', arg)
  })

  ipcMain.once('login-ok', function () {
      loading.show()
      mainWindow.show()
  })

  ipcMain.on('login-nok', function () {
      loginwind.show()
  })

  ipcMain.on('fechar-programa', function () {
      app.quit()
  })

  ipcMain.on('incluir', function (event, arg) {
      inclusao.hide()
      mainWindow.webContents.send('incluir-agenda', arg)
  })

  ipcMain.on('parcelado', function (event, arg) {
      parcelado.hide()
      mainWindow.webContents.send('parcela-agenda', arg)
  })

  ipcMain.on('incluir-toggle', function (event, arg) {
      if(inclusao.isVisible()){
        inclusao.hide()
      }else{
        inclusao.webContents.send('incluir-ag', arg)
        inclusao.show()
      }
  })

  ipcMain.on('parcelado-toggle', function (event) {
      if(parcelado.isVisible()){
        parcelado.hide()
      }else{
        parcelado.show()
      }
  })

  ipcMain.on('excluir', function (event, arg) {
      exclusao.hide()
      mainWindow.webContents.send('excluir-agenda', arg)
  })

  ipcMain.on('excluir-toggle', function (event, arg) {
      if(exclusao.isVisible()){
        exclusao.hide()
      }else{
        exclusao.webContents.send('excluir-ag', arg)
        exclusao.show()
      }
  })

  ipcMain.on('alerta', function (event, arg) {
      if(arg == 0){
        alerta.hide()
      }else{
        if(typeof arg.msg !== 'undefined'){
          alerta.webContents.send('mensagem', arg)
          alerta.show()
          setTimeout(function(){
            alerta.hide()
          }, 3000);
        }
      }
  })

}

app.on('ready', function(){
    var local_icon = 'icon/linux/128x128.png';
    createWindow(local_icon);
})

// Sai quando todas as janelas estão fechadas.
app.on('window-all-closed', function () {
  // No OSx é comum a aplicação ficar presa no menu, até que clique em Cmd + Q
  if (process.platform !== 'darwin<-ver') {
    app.quit()
  }
})

app.on('activate', function () {
  // No OS X é comum recriar uma janela no app quando o icone Docks é clicado e não existir outra janela aberta
  if (mainWindow === null) {
    createWindow()
  }
})

// Aqui você pode incluir o resto de suas especificações principais de processo
// Você pode também colocar eles em arquivos separados e requerer eles aqui..
