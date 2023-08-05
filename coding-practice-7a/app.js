const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 =require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3000, () => {
            console.log("DataBase Connected");
        });
    }
    catch (e) {
        console.log(`DB Error: ${e.message}`);
    }
};

initializeDbServer();

//API 1(Get the list of Players)
app.get("/players/", async (request, response) => {
    const getPlayers = `
    SELECT *
    FROM player_details;
    `;
    const playersArray = await db.all(getPlayers);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            playerId: dbObject.player_id,
            playerName: dbObject.player_name,
        }
    }
    response.send(playersArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer)));
});

//API 2(Get Specific Player)
app.get("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `;
    const player = await db.get(getPlayerQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            playerId: dbObject.player_id,
            playerName: dbObject.player_name,
        }
    }
    response.send(convertDbObjectToResponseObject(player));
});

//API 3(Update Player Details)
app.put("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const {
        playerName,
    } = playerDetails;
    const updatePlayerDetailsQuery = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `;
    await db.run(updatePlayerDetailsQuery);
    response.send("Player Details Updated");
});

//API 4(Get Match Details Of Specific Team)
app.get("/matches/:matchId/", async (request, response) => {
    const { matchId } = request.params;
    const getMatchDetailsQuery = `
    SELECT *
    FROM match_details
    where match_id = ${matchId};
    `;
    const match = await db.get(getMatchDetailsQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            matchId: dbObject.match_id,
            match: dbObject.match,
            year: dbObject.match
        }
    }
    response.send(convertDbObjectToResponseObject(match));
});

//API 5(Get Matches for Player)
app.get("/players/:playerId/matches", async (request, response) => {
    const { playerId } = request.params;
    const getMatchesOfPlayerQuery = `
    SELECT match_details.match_id, match_details.match, match_details.year
    FROM player_match_score inner join match_details on player_match_score.match_id = match_details.match_id
    Where player_id = ${playerId};
    `;
    const matches = await db.all(getMatchesOfPlayerQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            matchId: dbObject.match_id,
            match: dbObject.match,
            year: dbObject.match
        }
    }
    response.send(matches.map((eachMatch) => convertDbObjectToResponseObject(eachMatch)));
});

//API 6(Get List of Players for Specific Match)
app.get("/matches/:matchId/players", async (request, response) => {
    
});