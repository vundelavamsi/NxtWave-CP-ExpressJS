const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBServer = async () => {
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
initializeDBServer();

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if(authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if(jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token");
    }
    else {
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
            if(error) {
                response.status(401);
                response.send("Invalid JWT Token");
            }
            else {
                next();
            }
        });
    }
}

//API 1
app.post("/login", async (request, response) => {
    const {username, password} = request.body;
    const getUserQuery = `SELECT * FROM user where username = '${username}'`;
    const user = await db.get(getUserQuery);
    if(user === undefined) {
        response.status(400);
        response.send("Invalid user");
    }
    else {
        const pass = await bcrypt.compare(password, user.password);
        if(pass === true) {
            const payload = {
                username: username
            };
            const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
            response.send({jwtToken});
        }        
        else {
            response.status(400);
            response.send("Invalid password");
        }
    }
});

//API 2
app.get("/states", authenticateToken, async (request, response) => {
    const getStatesQuery = `
    SELECT *
    FROM state;
    `;
    const getStates = await db.all(getStatesQuery);
    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population
        };
    }
    response.send(getStates.map((eachState => convertDBObjectToResponseObject(eachState))));
});

//API 3
app.get("/states/:stateId", authenticateToken, async (request, response) => {
    const { stateId } = request.params;
    const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};
    `;
    const state = await db.get(getStateQuery);
    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population
        };
    }
    response.send(convertDBObjectToResponseObject(state));
});

//API 4
app.post("/districts/",authenticateToken, async (request,response) => {
    const districtDetails = request.body;
    console.log(districtDetails);
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    } = districtDetails
    const postDistrict = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
    const dbResponse = await db.run(postDistrict);
    response.send("District Successfully Added");
});

//API 5
app.get("/districts/:districtId/", authenticateToken, async (request, response) => {
    const {districtId } = request.params;
    const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
    `;
    const district = await db.get(getDistrictQuery);
    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            districtId: dbObject.district_id,
            districtName: dbObject.district_name,
            stateId: dbObject.state_id,
            cases: dbObject.cases,
            cured: dbObject.cured,
            active: dbObject.active,
            deaths: dbObject.deaths,
        }
    }
    response.send(convertDBObjectToResponseObject(district));
});

//API 6
app.delete("/districts/:districtId/", authenticateToken, async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
    db.run(deleteDistrictQuery);
    response.send("District Removed");
});

//API 7
app.put("/districts/:districtId/", authenticateToken, async (request, response) => {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths    
    } = districtDetails;
    const deleteDistrictQuery = `
    UPDATE 
        district
    set
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
    db.run(deleteDistrictQuery);
    response.send("District Details Updated");
});

//API 8
app.get("/states/:stateId/stats/", authenticateToken, async (request, response) => {
    const { stateId } = request.params;
    const getStatsQuery = `
        SELECT 
            sum(cases), 
            sum(cured), 
            sum(active), 
            sum(deaths)
        from 
            district
        where 
            state_id = ${stateId};
    `;
    const stats = await db.get(getStatsQuery);
    console.log(stats);
    response.send({
        totalCases: stats["sum(cases)"],
        totalCured: stats["sum(cured)"],
        totalActive: stats["sum(active)"],
        totalDeaths: stats["sum(deaths)"]
    });
});


module.exports = app;