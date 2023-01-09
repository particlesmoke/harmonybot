const puppeteer = require('puppeteer')
const request = require('request-promise')
const fetch = require('node-fetch')
const $ = require("./util")
$.log("hello")
const bot = $.bot
var activesongrequests = []

bot.on('callback_query', async query=>{
  // console.log(query)
  console.log("Query recieved: "+ query.data + " from " + query.from.id)
  if(query.data.startsWith('search')){
    await $.sendsearchresults(query.from.id, query.data.split(`search`)[1].split('/')[0],undefined,Number(query.data.split(`/`)[1]))
    bot.answerCallbackQuery(query.id)
  }
  else if(query.data.startsWith('songm')){
    await $.sendmusicbyurl(query.from.id, query.data.slice(5), true)
    bot.answerCallbackQuery(query.id)
  }
  else if(query.data.startsWith('song')){
    await $.sendmusicbyurl(query.from.id, query.data.slice(4))
    bot.answerCallbackQuery(query.id)
  }
  else if(query.data.startsWith('mood')){
    $.sendplaylists(query.from.id, query.data.split('mood')[1])
  }
  else if(query.data.startsWith('play')){
    $.sendplaylist(query.from.id, query.data.split('play')[1])
  }
})

bot.on('message', async message=>{
  // console.log(message)
  const id = message.from.id
  const text = message.text
  console.log( `${message.from.first_name} ${message.from.last_name} ${id} says ${text}`)
  if('entities' in message && message.entities[0].type == 'bot_command'){ //bot commands
    if(text=="/start"){
      bot.sendMessage(id, "Just send me the name of a song, and I'll try to get it to you : )")
    }
    else if(text.startsWith("/search")){
      bot.sendMessage(id, "What do you want to search for? \u{1F601}")
      $.activesearchrequests[id] = {term:""}
      if(activesongrequests.includes(id)){
        activesongrequests.slice(activesongrequests.indexOf(id), 1)
      }
    }
    else if(text.startsWith("/song")){
      bot.sendMessage(id, "Which song are you looking for?")
      activesongrequests.push(id)
      if(id in $.activesearchrequests){
        delete $.activesearchrequests[id]
      }
    }
    else if(text.startsWith("/moods")){
      $.sendmoods(id, undefined)
    }
	else{
		bot.sendMessage(id, 'Please select a command from the menu')
	}
  }
  else{
    if(id in $.activesearchrequests){
      $.activesearchrequests[id].term = text
      $.sendsearchresults(id, text, message.message_id)
    } 
    else if(activesongrequests.includes(id)){
      $.sendmusicbyname(id, text, message.message_id)
      activesongrequests.splice(activesongrequests.indexOf(id),1)
    }
  }
})


