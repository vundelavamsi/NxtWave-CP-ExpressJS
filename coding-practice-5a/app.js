const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express()
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDb = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000);
    }
    catch (e) {
        console.log(`DB Error ${e.message}`);
        process.exit(1);
    }
}

initializeDb();

//API 1(Get Movies List)
app.get("/movies/", async (request,response) => {
    const getMoviesQuery = `
    SELECT movie_name
    FROM movie
    order by movie_id;
    `;
    const moviesArray = await db.all(getMoviesQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            movieName: dbObject.movie_name
        };
    };
    response.send(moviesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie)));
});

//API 2(Post Movie)
app.post("/movies", async (request, response) => {
    const playerDetails = request.body;
    console.log(playerDetails);
    const {
        directorId,
        movieName,
        leadActor        
    } = playerDetails;
    const addPlayerDetails = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );
    `;
    const dbResponse = await db.run(addPlayerDetails);
    response.send("Movie Successfully Added");
});

//API 3(Get Single Movie)
app.get("/movies/:movieId/", async (request,response) => {
    const { movieId } = request.params;   
    const getPlayerQuery = `
    select * from movie where movie_id = ${movieId};
    `;
    const movie = await db.get(getPlayerQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            movieId: dbObject.movie_id, 
            directorId: dbObject.director_id,
            movieName: dbObject.movie_name,
            leadActor: dbObject.lead_actor,
        };
    };
    response.send(convertDbObjectToResponseObject(movie));
});

//API 4(Update Movie)
app.put("/movies/:movieId/", async (request, response) => {
    const playerDetails = request.body;
    const { movieId } = request.params;
    const {
        directorId,
        movieName,
        leadActor        
    } = playerDetails;
    const updatePlayerDetails = `
        update 
            movie 
        set 
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        where 
            movie_id = ${movieId};
    `;
    await db.run(updatePlayerDetails);
    response.send("Movie Details Updated");
});

//API 5(Delete Movie)
app.delete("/movies/:movieId/", async (request, response) => {
    const { movieId } = request.params;
    const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};
    `;
    await db.run(deleteMovieQuery);
    response.send("Movie Removed");
});

//API 6(Get Directors)
app.get("/directors/", async (request,response) => {
    const getDirectorsQuery = `
    SELECT *
    FROM director
    order by director_id;
    `;
    const directorsArray = await db.all(getDirectorsQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            directorId: dbObject.director_id,
            directorName: dbObject.director_name,
        };
    };
    response.send(directorsArray.map((eachDirector) => convertDbObjectToResponseObject(eachDirector)));
});

//API 7(Get Movie names of the specific Director)
app.get("/directors/:directorId/movies/", async (request, response) => {
    const { directorId } = request.params;
    const getMovieNamesOfDirectorQuery = `
    SELECT movie_name
    from movie
    where director_id = ${directorId};
    `;
    const movieArray =  await db.all(getMovieNamesOfDirectorQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
        return {
            movieName: dbObject.movie_name,
        };
    };
    response.send(movieArray.map((eachMovie => convertDbObjectToResponseObject(eachMovie))));
});

module.exports = app;