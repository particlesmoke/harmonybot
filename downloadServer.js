const express = require('express')
const app = express()
const server = require('http').createServer(app)
const request = require('request')
const uuid = require('uuid4')

app.get('/', (req, res)=>{
	res.writeHead(200, {
		'content-type' : 'audio/mp3',
		'content-disposition' : 'attachment; filename="filename.mp3"'
	})
	request('https://rr1---sn-qxaelne6.googlevideo.com/videoplayback?expire=1673048754&ei=Ul64Y7LNOIq9rtoP8cCQsAw&ip=223.233.77.241&id=o-ALf8ygAZyjrMpNN0cePO7l5oVSKmyx-Wk-fhEsE9OCf2&itag=140&source=youtube&requiressl=yes&mh=2U&mm=31%2C29&mn=sn-qxaelne6%2Csn-qxaeenlr&ms=au%2Crdu&mv=m&mvi=1&pl=22&initcwndbps=1166250&spc=zIddbGK274n_NszXTJlvbolv64YNb2w&vprv=1&svpuc=1&mime=audio%2Fmp4&gir=yes&clen=487712&dur=30.069&lmt=1661225479976720&mt=1673026683&fvip=5&keepalive=yes&fexp=24007246&c=ANDROID&txp=5432434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AOq0QJ8wRAIgR2LdcrNto6PJOEqaDN-wXpMAgn7O-lBxSYZIndNXhrsCIGElVNVg3qowwSIquYqPI7vvI6bcrmQZ8T4zOTwwxjst&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRAIgLImyBt5dkA72TAcViHyApJyt6YXuuzfhsXQCVjvPIwMCIHKaXC5DY8ouKvBhS_VZCrwlIBg0QL6AOVKjQxLrvVny')
	.pipe(res)
})

function createDownloadLink(resourceLink){
	const link = uuid()
	app.get(`/${link}`, (req, res)=>{
		res.writeHead(200, {
			'content-type' : 'audio/mp3',
			'content-disposition' : 'attachment; filename="filename.mp3"'
		})
		request('https://rr1---sn-qxaelne6.googlevideo.com/videoplayback?expire=1673048754&ei=Ul64Y7LNOIq9rtoP8cCQsAw&ip=223.233.77.241&id=o-ALf8ygAZyjrMpNN0cePO7l5oVSKmyx-Wk-fhEsE9OCf2&itag=140&source=youtube&requiressl=yes&mh=2U&mm=31%2C29&mn=sn-qxaelne6%2Csn-qxaeenlr&ms=au%2Crdu&mv=m&mvi=1&pl=22&initcwndbps=1166250&spc=zIddbGK274n_NszXTJlvbolv64YNb2w&vprv=1&svpuc=1&mime=audio%2Fmp4&gir=yes&clen=487712&dur=30.069&lmt=1661225479976720&mt=1673026683&fvip=5&keepalive=yes&fexp=24007246&c=ANDROID&txp=5432434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AOq0QJ8wRAIgR2LdcrNto6PJOEqaDN-wXpMAgn7O-lBxSYZIndNXhrsCIGElVNVg3qowwSIquYqPI7vvI6bcrmQZ8T4zOTwwxjst&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRAIgLImyBt5dkA72TAcViHyApJyt6YXuuzfhsXQCVjvPIwMCIHKaXC5DY8ouKvBhS_VZCrwlIBg0QL6AOVKjQxLrvVny')
		.pipe(res)
	})
	return link
}

server.listen(process.env.PORT || 80)