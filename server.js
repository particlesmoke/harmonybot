const puppeteer = require('puppeteer')
const request = require('request-promise')
const fetch = require('node-fetch')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api')
const { title } = require('process')
const token = '1900703486:AAElE2nXiShEtnkkqi-43GJ4fzcPEMw-HS8'
const bot = new TelegramBot(token, {polling: true})
bot.setMyCommands([{command: "search", description:"Search for music"}])
async function sendmusic(name, chatid, messageid) {
  const browser = await puppeteer.launch({ headless: true});
  try{
    console.log("Browser launched")
    const page = await browser.newPage()
    // bot.sendMessage(chatid, "◂◌◌◌◌◌▸")
    // await page.setViewport({
    //   width:1366,
    //   height:800,
    //   deviceScaleFactor: 1
    // })
    // console.log("Page opened")
    // await page.goto('https://youtube.com/results?search_query='+name)
    // console.log("On YouTube")
    // console.log("Searched for "+ name)
    // bot.sendMessage(chatid, "◂●◌◌◌◌▸")
    // await page.waitForTimeout(1000) //add network state
    // const song = await page.evaluate(function(){
    //   const youtubelink = document.querySelector('h3 > #video-title').getAttribute('href')
    //   const title = document.querySelector('h3>#video-title yt-formatted-string').innerHTML.split("(")[0]
    //   return {youtubelink, title}
    // })
    const [song, response] = await Promise.all([
      getsong(name),
      page.goto('https://ytmp3.cc/downloader/')
    ])
    console.log(song)
    console.log("Copied link for "+ song.title)
    bot.sendMessage(chatid, "◂●◌◌▸")
    console.log("On ytmp3")
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
    // fetch(downloadlink).then(res=>{
    //   console.log("Response recieved")
    //   bot.sendMessage(chatid, "◂●●●●●▸")
    //   bot.sendMessage(chatid, "Downloading the music into myself")
    //   return res.buffer()
    // }).then(res=>{
    //   console.log("Sending")
    //   bot.sendMessage(chatid, "Sent it to you!")
    //   bot.sendAudio(chatid, res, {reply_to_message_id: messageid}).then(()=>{
    //     bot.sendMessage(chatid, "Here's "+ song.title)
    //   })
    // })
    await browser.close();
  }
  catch(err){
    console.log("Got an error" + err)
    bot.sendMessage(chatid, "I seem to have failed at that, please try again")
    await browser.close();
  }
}

async function sendsearchresults(name, chatid, messageid){
  const browser = await puppeteer.launch({ headless: false });
  console.log("Browser launched")
  const page = await browser.newPage()
  await page.goto('https://youtube.com')
  await page.type('#search', name)
  const [response1] = await Promise.all([
    page.waitForNavigation(),
    page.click('#search-icon-legacy')
  ])
  await page.waitForTimeout(3000)
  const songs = await page.evaluate(function(){
    const youtubelinkelements = document.querySelectorAll('h3 > #video-title')
    const youtubelinks = []
    const title = []
    for(let i = 0; i < 5; i++){
      youtubelinks.push(youtubelinkelements[i].getAttribute('href'))
      
    }
    // const title = document.querySelector('h3>#video-title yt-formatted-string').innerHTML.split("(")[0]
    return {youtubelinks, title}
  })
  console.log(songs)
  browser.close()
}

bot.on('message', async message=>{
  console.log(message)
  if(message.text.startsWith('/')){ //do this with entities
    if(message.text=="/start"){
      bot.sendMessage(message.from.id, "Just send me the name of a song, and I'll try to get it to you : )")
    }
    else if(message.text.startsWith("/search")){
      console.log(message.text)
      sendsearchresults(message.text.slice(8))
    }
  }
  else{
    bot.sendMessage(message.from.id, "Please wait")
    sendmusic(message.text, message.from.id, message.message_id)
  }
  console.log( `${message.from.first_name} ${message.from.last_name} says ${message.text}`)
})


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
  console.log(song)
  return song
}