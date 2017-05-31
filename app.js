var express = require('express')
var nunjucks = require('nunjucks')
var request = require('request')
var cheerio = require('cheerio')
var PORT = process.env.PORT || 6767

var app = express()
var env = nunjucks.configure('views', { autoescape: true, express: app })

var EARTHQUAKES_ARRAY_LENGTH = 200

app.get("*", function (req, res) {

    var file = "index.html"
    var toRender = {
        EARTHQUAKES_ARRAY_LENGTH: EARTHQUAKES_ARRAY_LENGTH
    }

    fetchEarthquakes().then(function (earthquakes) {
        render(earthquakesToObjectArray(earthquakes.split("\n")))
    }).catch(function (err) {
        render([])
    })

    function render(arr) {
        toRender["earthquakesArray"] = arr
        res.render(file, toRender)
    }

})

function fetchEarthquakes() {

    var url = "http://koeri.boun.edu.tr/scripts/lst7.asp"

    return new Promise(function (resolve, reject) {

        // sayfaya GET isteği at
        request(url, function (err, res, body) {

            if(err) {
                return reject(err)
            }

            // gelen cevabı cheerio kütüphanesi ile oku
            var $ = cheerio.load(body)

            // deprem listesi sayfadaki <pre> tagı içinde
            var responseStr = $("pre").html()

            // string olarak döndür
            resolve(responseStr)
        })

    })
}

function earthquakesToObjectArray(rows) {

    var arr = []
    var length = EARTHQUAKES_ARRAY_LENGTH + 6

    // veriler <pre> tagları arasındaki 6. satırdan itibaren başlıyor
    for (var i = 6; i < length; i++) {

        var row = rows[i]

        if(!row) {
            continue
        }

        row = row.split(" ")
        row = row.filter(function (item) {
            return item != ""
        })

        var date = row[0]
        var hour = row[1]
        var lat = row[2]
        var lon = row[3]
        var depth = row[4]
        var force = row[6]
        var updatedForce = row[7]
        var town = row[8]
        var city = row[9]

        // updatedForce var ise onu kullan
        if(updatedForce != "-.-") {
            force = updatedForce
        }

        // ilksel
        if(city == '&#xFFFD;lksel') {
            city = ''
        }

        var data = {
            date: date + " - " + hour,
            lat: lat,
            lon: lon,
            depth: depth + " km",
            force: force,
            location: town + " " + city
        }

        arr.push(data)
    }

    return arr
}


app.listen(PORT, function () {
    console.log("running on port:", PORT)
})
