const request = require('request-promise')
const fs = require('fs')
var s = "Counting stars"
var searchterm = ""
s=s.split(" ")
for(let i = 0; i<s.length-1; i++){
    searchterm+= (s[i]+'+')
}
searchterm+=s[s.length-1]
console.log(searchterm)
request('https://youtube.com/results?search_query='+searchterm).then(res=>{
    var html = String(res)
    // const data = fs.writeFileSync('./response.html', html)
    const indexoflink = html.indexOf("/watch?")
    const indexoftitle = html.indexOf('"title":{"runs":[{"text":')+26
    const song = {}
    song.youtubelink = "https://youtube.com" + html.slice(indexoflink, indexoflink+20)
    song.title = html.slice(indexoftitle, indexoftitle+100).split('"}')[0]

    console.log(
        song
    )
})