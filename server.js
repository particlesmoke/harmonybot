const puppeteer = require('puppeteer')
const request = require('request-promise')
const fetch = require('node-fetch')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api')
const { title } = require('process')
const token = '1900703486:AAElE2nXiShEtnkkqi-43GJ4fzcPEMw-HS8'
const bot = new TelegramBot(token, {polling: true})
bot.setMyCommands([{command: "search", description:"Search for music"}])

async function sendmusicbyname(name, chatid, messageid) {
  const browser = await puppeteer.launch({ headless: true});
  try{
    console.log("Browser launched")
    const page = await browser.newPage()
    bot.sendMessage(chatid, "◂◌◌◌▸")
    const [song, response] = await Promise.all([
      getsong(name),
      page.goto('https://ytmp3.cc/downloader/')
    ])
    console.log("Copied link for "+ song.title)
    console.log("On ytmp3")
    console.log(song)
    bot.sendMessage(chatid, "◂●◌◌▸")
    await page.type('#input', `https://youtube.com${song.youtubelink}`)
    await page.click('#submit')
    console.log("Submitted youtube link")
    bot.sendMessage(chatid, "◂●●◌▸")
    await page.waitForTimeout(2000)
    song.downloadlink = await page.evaluate(function(){
      return document.querySelector('#buttons > a').getAttribute('href')
    })
    console.log("Got the download link")
    console.log(song.downloadlink)
    bot.sendMessage(chatid, "◂●●●▸")
    bot.sendAudio(chatid, song.downloadlink, {reply_to_message_id: messageid}).then(()=>{
      bot.sendMessage(chatid, "Here's "+ song.title)
    })
    await browser.close();
  }
  catch(err){
    console.log("Got an error" + err)
    bot.sendMessage(chatid, "I seem to have failed at that, please try again")
    await browser.close();  
  }
}


async function sendmusicbyurl(youtubelink, chatid){
  const browser = await puppeteer.launch({ headless: false});
  try{
    console.log("Browser launched")
    const page = await browser.newPage()
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
    console.log(downloadlink)
    bot.sendAudio(chatid, downloadlink).then(()=>{
      bot.sendMessage(chatid, "Here's "+title)
    })
    await browser.close()
  }
  catch(err){
    console.log("Got an error" + err)
    bot.sendMessage(chatid, "I seem to have failed at that, please try again")
    await browser.close();  
  }
}
async function sendsearchresults(name, chatid, messageid, iteration, num = 9){
  var songs = await getsongs(name, num, iteration)
  var reply = ""
  var buttons = [[]]
  let i = 0
  for(i = 0; i<songs.length; i++){
    reply+= `|${i+1 + (iteration-1)*num}|` + songs[i].title+"\n"
    buttons[Math.floor(i/5)].push({text:String(i+1 + (iteration-1)*num), callback_data:songs[i].youtubelink})
    if((i+1)%5 == 0){
      buttons.push([])
    }
  }
  buttons[Math.floor(i/5)].push({text:"More", callback_data:`/${name}/`+String(iteration+1)})
  bot.sendMessage(chatid, reply, {reply_to_message_id: messageid, reply_markup: { inline_keyboard: buttons }})
}

bot.on('callback_query', async query=>{
  // console.log(query)
  console.log(query.data)
  if(query.data[0] == '/'){
    await sendsearchresults(query.data.split(`/`)[1],query.from.id,undefined,Number(query.data.split(`/`)[2]))
    bot.answerCallbackQuery(query.id)
  }else{
    await sendmusicbyurl(query.data, query.from.id)
    bot.answerCallbackQuery(query.id)
  }
})

bot.on('message', async message=>{
  console.log(message)
  if(message.text.startsWith('/')){ //do this with entities
    if(message.text=="/start"){
      bot.sendMessage(message.from.id, "Just send me the name of a song, and I'll try to get it to you : )")
    }
    else if(message.text.startsWith("/search")){
      console.log(message.text)
      sendsearchresults(message.text.slice(8), message.from.id, message.message_id, 1)
    }
  }
  else{
    bot.sendMessage(message.from.id, "Please wait")
    sendmusicbyname(message.text, message.from.id, message.message_id)
  }
  console.log( `${message.from.first_name} ${message.from.last_name} says ${message.text}`)
})


async function getsongs(input, num = 10, iteration = 1){
  var searchterm = ""
  input=input.split(" ")
  for(let i = 0; i<input.length-1; i++){
      searchterm+= (input[i]+'+')
  }
  searchterm+=input[input.length-1]
  console.log("Getting results for")
  console.log(searchterm)
  console.log(num*iteration)
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
  console.log(songs)
  return songs.slice(-num)
}

async function getsong(input){
  var searchterm = ""
  input=input.split(" ")
  for(let i = 0; i<input.length-1; i++){
      searchterm+= (input[i]+'+')
  }
  searchterm+=input[input.length-1]
  console.log(searchterm)

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