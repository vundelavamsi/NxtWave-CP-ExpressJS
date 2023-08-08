const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3000, ()=> {
            console.log("DataBase Connected");
        });
    }
    catch (e) {
        console.log(`DB Error: ${e,message}`);
        process.exit(1);
    }
};

initializeDbServer();

//API 1
app.get("/todos/", async (request, response) => {
    const {search_q = "", priority, status} = request.query;
    let getTodosQuery = "";
    const hasPriorityAndStatusProperties = (requestQuery) => {
        return (
        requestQuery.priority !== undefined && requestQuery.status !== undefined
        );
    };

    const hasPriorityProperty = (requestQuery) => {
        return requestQuery.priority !== undefined;
    };

    const hasStatusProperty = (requestQuery) => {
        return requestQuery.status !== undefined;
    };
    
    switch(true) {
        case hasPriorityAndStatusProperties(request.query):
            getTodosQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo like '%${search_q}%'
                    AND priority = '${priority}'
                    AND status = '${status}';
                `;
            break;
        case hasStatusProperty(request.query):
            getTodosQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo like '%${search_q}%'
                    AND status = '${status}';
                `;
            break;
        case hasPriorityProperty(request.query):
            getTodosQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo like '%${search_q}%'
                    AND priority = '${priority}';
                `;
            break;
        default:
            getTodosQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo like '%${search_q}%';
                `;
            break;
    }
    
    const todosArray = await db.all(getTodosQuery);
    response.send(todosArray);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};
    `;
    const todo = await db.get(getTodoQuery);
    response.send(todo);
});

//API 3
app.post("/todos/", async(request, response) => {
    const {
        id,
        todo,
        priority,
        status,
    } = request.body;
    const postTodoQuery = `
    INSERT INTO todo(id, todo, priority, status)
    values(
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );
    `;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    let updateColumn = "Hi";
    const requestBody = request.body;
    switch (true) {
        case requestBody.status !== undefined:
            updateColumn = "Status";
            break;
        case requestBody.priority !== undefined:
            updateColumn = "Priority";
            break;
        case requestBody.todo !== undefined:
            updateColumn = "Todo";
            break;
    }
    const previousTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};
    `;
    const previousTodo = await db.get(previousTodoQuery);
    const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
    } = request.body;
    const updateTodoQuery = `
    UPDATE 
        todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE
        id = ${todoId};
    `;
    await db.run(updateTodoQuery);    
    response.send(`${updateColumn} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const deleteTodoQuery = `
    DELETE from todo
    WHERE id = ${todoId};
    `;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;