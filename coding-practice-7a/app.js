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
            year: dbObject.year
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
            year: dbObject.year
        }
    }
    response.send(matches.map((eachMatch) => convertDbObjectToResponseObject(eachMatch)));
});

//API 6(Get List of Players for Specific Match)
app.get("/matches/:matchId/players", async (request, response) => {
    const { matchId } = request.params;
    const getPlayersMatchQuery = `
    SELECT 
        player_details.player_id, 
        player_details.player_name
    FROM 
        player_details inner join player_match_score on player_details.player_id = player_match_score.player_id
    WHERE 
        player_match_score.match_id = ${matchId};
    `;
    const players = await db.all(getPlayersMatchQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            playerId: dbObject.player_id,
            playerName: dbObject.player_name,
        }
    };
    response.send(players.map((eachPlayer => convertDbObjectToResponseObject(eachPlayer))));
});

//API 7(Get Player Stats)
app.get("/players/:playerId/playerScores", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerStates = `
    SELECT 
        player_details.player_id as playerId, 
        player_details.player_name as playerName, 
        sum(player_match_score.score) as totalScore, 
        sum(player_match_score.fours) as totalFours, 
        sum(player_match_score.sixes) as totalSixes 
    FROM 
        player_details inner join player_match_score on player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId}
    GROUP BY 
        player_details.player_id;
    `;
    const playerStats = await db.get(getPlayerStates);
    response.send(playerStats);
});

module.exports = app;