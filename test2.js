const puppeteer = require("puppeteer")


async function access(){
    const browser = await puppeteer.launch({headless:false, args: ['--window-size=1200,800']})
    const page = await browser.newPage()
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
    await page.goto("https://music.youtube.com/moods_and_genres")
    await page.waitForTimeout(3000)
    const moods = await page.evaluate(function(){
        const moodbuttons = document.querySelector('#contents #items').querySelectorAll('button')
        const moods = []
        for(let i = 0; i<moodbuttons.length; i++){
            moods.push({name:moodbuttons[i].lastElementChild.innerHTML, buttonindex:i})
        }
        console.log(moods)
        return moods
    })

    console.log(moods)
    const button= await (await page.$('#contents #items')).$$('button')
    await button[0].click()
    await page.waitForTimeout(1000)
    const playlist = await page.evaluate(function(){
      const elements = document.querySelector('#contents').children[1].querySelector('#items').children
      const playlist = []
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
        playlist.push(listitem)
      }
      return playlist
    })
    console.log(playlist)
}

access()