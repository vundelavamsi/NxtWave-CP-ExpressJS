const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () => {
            console.log("Server Started");
        });
    }
    catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
}

initializeDbServer();

//API 1(Get States)
app.get("/states/", async (request, response) => {
    const getStatesQuery = `
    SELECT *
    FROM state;
    `;
    console.log(getStatesQuery);
    const statesArray = await db.all(getStatesQuery);
    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population,
        };
    };
    response.send(statesArray.map((eachState) => convertDBObjectToResponseObject(eachState)));
});


//API 2(Get State)
app.get("/states/:stateId/", async (request, response) => {
    const { stateId } = request.params;
    const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${ stateId };
    `;
    const state = await db.get(getStateQuery);
    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population,
        };
    };
    response.send(convertDBObjectToResponseObject(state));
});

//API 3(Post District into DB)
app.post("/districts/", async (request,response) => {
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

//API 4(Get District)
app.get("/districts/:districtId/", async (request, response) => {
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

//API 5(Delete District)
app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
    db.run(deleteDistrictQuery);
    response.send("District Removed");
});

//API 6(Update District)
app.put("/districts/:districtId/", async (request, response) => {
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

//API 7(Getting All States)
app.get("/states/:stateId/stats/", async (request, response) => {
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

//API 8(Get District Name)
app.get("/districts/:districtId/details/", async (request, response) => {
    const { districtId } = request.params;
    const getDistrictDetailsQuery = `
    SELECT state_name
    FROM state inner join district on state.state_id=district.state_id; 
    `;
    const districtDetails = await db.get(getDistrictDetailsQuery);
    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateName: dbObject.state_name
        };
    };
    response.send(convertDBObjectToResponseObject(districtDetails));
});

module.exports = app;