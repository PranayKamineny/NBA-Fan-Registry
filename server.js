const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended:false}));
process.stdin.setEncoding("utf8");
require("dotenv").config({ path: path.resolve(__dirname, './.env') });


const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');

const portNumber = 5005; // change in NBAFans.ejs & roster.ejs
console.log(`Server running at http://localhost:${portNumber}`);

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/register", (request, response) => {
    response.render("NBAFans");
});

app.get("/view", (request, response) => {
    response.render("roster");
});

app.post("/register", async (request, response) => {
    let fanName = request.body.name;
    let fanEmail = request.body.email;
    let fanTeam = request.body.team;
    let newFan = {
        name: fanName,
        email: fanEmail,
        team: fanTeam 
    };
    const uri = `mongodb+srv://${userName}:${password}@cluster0.lvqte77.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newFan);
    } catch (e) {
        console.error(e);
        response.render("index");
    } finally {
        await client.close();
    }
    response.render("confirmation", newFan);
});

app.post("/view", async (request, response) => {
    let fanEmail = request.body.email;
    const uri = `mongodb+srv://${userName}:${password}@cluster0.lvqte77.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    let fanTeam = null;
    try {
        await client.connect();
        let filter = {email: fanEmail};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);
        if (result) {
            //Get stats
            fanTeam = result["team"];
        } else {
            response.render("rosterdisplay", {roster: "Email is not registered!"});
        }
    } catch (e) {
        console.error(e);
        response.render("index");
    } finally {
        await client.close();
    }
    let teams = {
        "Phoenix Suns":3416,
        "Memphis Grizzlies":3415,
        "Golden State Warriors":3428,
        "Miami Heat":3435,
        "Dallas Mavericks":3411,
        "Boston Celtics":3422,
        "Milwaukee Bucks":3410,
        "Philadelphia 76ers":3420,
        "Utah Jazz":3434,
        "Denver Nuggets":3417,
        "Toronto Raptors":3433,
        "Chicago Bulls":3409,
        "Minnesota Timberwolves":3426,
        "Brooklyn Nets":3436,
        "Cleveland Cavaliers":3432,
        "Atlanta Hawks":3423,
        "Charlotte Hornets":3430,
        "Los Angeles Clippers":3425,
        "New York Knicks":3421,
        "New Orleans Pelicans":5539,
        "Washington Wizards":3431,
        "San Antonio Spurs":3429,
        "Los Angeles Lakers":3427,
        "Sacramento Kings":3413,
        "Portland Trail Blazers":3414,
        "Indiana Pacers":3419,
        "Oklahoma City Thunder":3418,
        "Detroit Pistons":3424,
        "Orlando Magic":3437,
        "Houston Rockets":3412
    };
    if(fanTeam){
        let teamID = teams[fanTeam];
        const playersurl = `https://basketapi1.p.rapidapi.com/api/basketball/team/${teamID}/players`;
        const detailsurl =  `https://basketapi1.p.rapidapi.com/api/basketball/team/${teamID}`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': 'b3750eec30msh7446a48060ecc4cp14bfe3jsn68d786159989',
                'X-RapidAPI-Host': 'basketapi1.p.rapidapi.com'
            }
        };
        try {
            console.write(5);
            let teamInfo ="";
            teamInfo += `You are registered as a fan of the ${fanTeam}!<br>` 
            const teamdata = await fetch(detailsurl, options);
            const teamdataJSON = await teamdata.json();
            let manager = teamdataJSON["team"]["manager"]["name"];
            teamInfo += `The coach of the ${fanTeam} is <strong>${manager}</strong>.<br><br>`;
            teamInfo += "Here is the team roster:<br>";
            teamInfo += "<table border='1'><th>Player</th><th>Position</th><th>Number</th><th>Height(cm)</th>";
            const playerdata = await fetch(playersurl, options);
            const playerdataJSON = await playerdata.json();
            for(let player of playerdataJSON["players"]){
                let playerName = player["player"]["name"].trim();
                if(playerName == "LeBron James"){
                    playerName += "&#128081;";
                }
                let position = player["player"]["position"];
                let jerseyNumber = player["player"]["jerseyNumber"];
                let height = player["player"]["height"];
                teamInfo += `<tr><td>${playerName}</td><td>${position}</td><td>${jerseyNumber}</td><td>${height}</td></tr>`;
            }
            teamInfo += "</table>";
            response.render("rosterdisplay", {roster: teamInfo});
        } catch (error) {
            console.error(error);
            response.render("index");
        }
    }
});
app.listen(portNumber);
