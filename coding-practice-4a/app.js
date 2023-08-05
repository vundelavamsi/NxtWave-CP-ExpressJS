const express = require("express");
const path = require ("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join( __dirname , "cricketTeam.db");

let db = null;

const initializeDbServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () => {
            console.log("Data Base Connected");
        });
    }
    catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
}

initializeDbServer();

// API 1(Get Players)
app.get("/players/", async (request, response) => {
    const getPlayersQuery = `
    SELECT *
    FROM cricket_team;
    `;  
    const playersArray = await db.all(getPlayersQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            playerId: dbObject.player_id,
            playerName: dbObject.player_name,
            jerseyNumber: dbObject.jersey_number,
            role: dbObject.role,
        };
    };
    response.send(playersArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer)));
});

// API 2(Insert Player into DataBase)
app.post("/players", async (request, response) => {
    const playerDetails = request.body;
    console.log(playerDetails);
    const {
        playerName,
        jerseyNumber,
        role
    } = playerDetails;
    console.log(playerName);
    console.log(jerseyNumber);
    console.log(role);
    const addPlayerDetails = `
    INSERT INTO cricket_team (player_name,jersey_number,role)
    VALUES (
        '${playerName}',
        ${jerseyNumber},
        '${role}'
    );
    `;
    const dbResponse = await db.run(addPlayerDetails);
    console.log(dbResponse);
    response.send("Player Added to Team");
});

//API 3(Get Player)
app.get("/players/:playerId", async (request,response) => {
    const { playerId } = request.params;
    const getPlayerQuery = `
    SELECT *
    FROM cricket_team
    WHERE player_id = ${playerId};
    `;
    const player = await db.get(getPlayerQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            playerId: dbObject.player_id,
            playerName: dbObject.player_name,
            jerseyNumber: dbObject.jersey_number,
            role: dbObject.role,
        };
    };
    response.send(convertDbObjectToResponseObject(player));
});

//API 4(Update Player Details)
app.put("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const {
        playerName,
        jerseyNumber,
        role,
    } = playerDetails;
    const updatePlayerQuery = `
    UPDATE cricket_team
    SET 
    player_name = '${playerName}',
    jersey_number = ${jerseyNumber},
    role = '${role}'
    WHERE player_id = ${playerId};
    `;
    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
});

//API 5(Delete Player)
app.delete("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const deletePlayerQuery = ` 
    DELETE FROM cricket_team
    WHERE player_id = ${playerId};
    `;
    await db.run(deletePlayerQuery);
    response.send("Player Removed");
});

module.exports = app;