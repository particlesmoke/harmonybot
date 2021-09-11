const puppeteer = require('puppeteer')
const TelegramBot = require('node-telegram-bot-api')
const token = '1900703486:AAElE2nXiShEtnkkqi-43GJ4fzcPEMw-HS8'
const bot = new TelegramBot(token, {polling: true})
bot.setMyCommands([{command: "song", description:"Download a song"}, {command: "search", description:"Search for artist/album/song"}, {command: "moods", description:"Explore music according to mood"}])
const request = require('request-promise')
const fs = require('fs')
var activesearchrequests = {}
var activemoodrequests = {}

var browser = ""
async function launchbrowser(){
  browser = await puppeteer.launch({headless:true})
}
launchbrowser()
function log(text){
    console.log(text)
}
async function getsong(input){
    var searchterm = ""
    input=input.split(" ")
    for(let i = 0; i<input.length-1; i++){
        searchterm+= (input[i]+'+')
    }
    searchterm+=input[input.length-1]
    console.log("Getting one result for "+searchterm)
  
    const res = await request('https://youtube.com/results?search_query='+searchterm)
    var song = {}
    var html = String(res)
    // const data = fs.writeFileSync('./response.html', html)
    const indexoflink = html.indexOf("/watch?")
    const indexoftitle = html.indexOf('"title":{"runs":[{"text":')+26
    song.youtubelink = "https://youtube.com" + html.slice(indexoflink, indexoflink+20)
    song.title = html.slice(indexoftitle, indexoftitle+100).split('"}')[0]
    // console.log(song)
    return song
}
async function getsongs(input, num = 10, iteration = 1){
    var searchterm = ""
    console.log(input)
    input=input.split(" ")
    for(let i = 0; i<input.length-1; i++){
        searchterm+= (input[i]+'+')
    }
    searchterm+=input[input.length-1]
    console.log("Getting results for "+searchterm)
    const res = await request('https://youtube.com/results?search_query='+searchterm)
    var songs = []
    var html = String(res)
    var lastindex = 0
    for (let i = 0; i<num*iteration; i++){
      const indexoftitle = html.indexOf('"title":{"runs":[{"text":', lastindex)+26
      lastindex = indexoftitle
      const indexoflink = html.indexOf("/watch?", indexoftitle)
      var youtubelink = "https://youtube.com" + html.slice(indexoflink, indexoflink+20)
      var title = html.slice(indexoftitle, indexoftitle+100).split('"}')[0]
      songs.push({title:title, youtubelink:youtubelink})
    }
    // console.log(songs)
    return songs.slice(-num)
}
async function sendmusicbyname(chatid, name, messageid=undefined) {
  try{
    console.log("Sending music by name - "+name+" to "+chatid)
    const page = await browser.newPage()
    await page.setRequestInterception(true);
    page.on('request', request=>{
      if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } 
      else{
        request.continue();
      }
    })
    bot.sendMessage(chatid, "◂◌◌◌▸")
    const [song, response] = await Promise.all([
      getsong(name),
      page.goto('https://ytmp3.cc/downloader/')
    ])
    console.log(song)
    bot.sendMessage(chatid, "◂●◌◌▸")
    await page.type('#input', `https://youtube.com${song.youtubelink}`)
    await page.click('#submit')
    bot.sendMessage(chatid, "◂●●◌▸")
    await page.waitForTimeout(2000)
    song.downloadlink = await page.evaluate(function(){
      return document.querySelector('#buttons > a').getAttribute('href')
    })
    await page.close()
    console.log(song.downloadlink)
    bot.sendMessage(chatid, "◂●●●▸")
    bot.sendAudio(chatid, song.downloadlink, {reply_to_message_id: messageid}).then(()=>{
      bot.sendMessage(chatid, "Here's "+ song.title)
    })
  }
  catch(err){
    console.log("Got an error" + err)
    bot.sendMessage(chatid, "I seem to have failed at that, please try again")
  }
}
async function sendmusicbyurl(chatid, youtubelink){
  try{
    console.log("Sending music by url to "+chatid)
    const page = await browser.newPage()
    await page.setRequestInterception(true);
    page.on('request', request=>{
      if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } 
      else{
        request.continue();
      }
    })
    await page.goto('https://ytmp3.cc/downloader/')
    await page.type('#input', youtubelink)
    await page.click('#submit')
    await page.waitForTimeout(2000)
    const downloadlink = await page.evaluate(function(){
      return document.querySelector('#buttons > a').getAttribute('href')
    })
    const title = await page.evaluate(function(){
      return document.querySelector('#title').innerHTML
    })
    await page.close()
    console.log(downloadlink)
    bot.sendAudio(chatid, downloadlink).then(()=>{
      bot.sendMessage(chatid, "Here's "+title)
    }).catch((err)=>{
      console.log("Got an error" + err)
      bot.sendMessage(chatid, "I seem to have failed at that, please try again")
    })
  }
  catch(err){
    console.log("Got an error" + err)
    bot.sendMessage(chatid, "I seem to have failed at that, please try again")
  }
}
async function sendsearchresults(chatid, name, messageid=undefined, iteration=1, num = 9){
  if(iteration==1){
      activesearchrequests[chatid].songs = await getsongs(name, 35, iteration)
      bot.sendMessage(chatid, "Searching...")
    }
    var reply = " "
    var buttons = [[]]
    let i = (iteration-1)*num
    for(i; i<iteration*num ; i++){
      // reply+= `|${i+1 + (iteration-1)*num}|` + songs[i].title+"\n"
      buttons[Math.floor(i%num)].push({text:activesearchrequests[chatid].songs[i].title, callback_data:'song'+activesearchrequests[chatid].songs[i].youtubelink})
      // if((i+1)%1 == 0){
        buttons.push([])
      // }
    }
    reply+="\n" + "Click on the song you want to download" 
    if(iteration<3){
      buttons.push([])
      buttons[num].push({text:"More", callback_data:`search${name}/`+String(iteration+1)})
    }else{
      delete activesearchrequests[chatid]
    }
    bot.sendMessage(chatid, reply, {reply_to_message_id: messageid, reply_markup: { inline_keyboard: buttons }})
}
async function sendmoods(chatid, messageid=undefined){
  const page = await browser.newPage()
  activemoodrequests[chatid] = {page:page}
  page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 Edg/92.0.902.67')
  await page.setRequestInterception(true)
  page.on('request', request=>{
      if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } 
      else{
        request.continue();
      }
  })
  await page.goto("https://music.youtube.com/moods_and_genres", )
  await page.screenshot({path:'./here.png'})
  const moods = await page.evaluate(function(){
    const moodbuttons = document.querySelector('#contents #items').querySelectorAll('button')
    const moods = []
    for(let i = 0; i<moodbuttons.length; i++){
        moods.push({name:moodbuttons[i].lastElementChild.innerHTML, buttonindex:i})
    }
    console.log(moods)
    return moods
  })
  var buttons = [[]]
  for(let i =0; i<moods.length; i++){
    buttons[Math.floor(i/3)].push({text:moods[i].name, callback_data:"mood"+i})
    if((i+1)%3 == 0){
      buttons.push([])
    }
  }
  bot.sendMessage(chatid,"Moods:", {reply_markup : {inline_keyboard : buttons}})
}
async function sendplaylists(chatid, moodnumber){
  const page = activemoodrequests[chatid].page
  const moodbuttons= await (await page.$('#contents #items')).$$('button')
  await moodbuttons[moodnumber].click()
  const playlists = await page.evaluate(function(){
    const elements = document.querySelector('#contents').children[1].querySelector('#items').children
    const playlists = []
    for(let i = 0; i<elements.length; i++){
      elements[i].querySelectorAll('yt-formatted-string')[1].children[0].style.border = "solid red"
      const listitem = {}
      listitem['title'] = elements[i].querySelector('yt-formatted-string > a').innerHTML
      var subtitle = ""
      var subtitleelements = elements[i].querySelectorAll('yt-formatted-string')[1].children
      for(let i = 0; i<subtitleelements.length;i++){
        subtitle+=subtitleelements[i].innerHTML
      }
      listitem['subtitle'] = subtitle
      listitem['link'] = elements[i].querySelector('yt-formatted-string > a').href
      playlists.push(listitem)
    }
    return playlists
  })


}
module.exports = {log, sendmusicbyurl, sendmusicbyname, sendsearchresults, sendmoods, sendplaylists, bot, activesearchrequests}
