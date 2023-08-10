const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUserQuery = `
    SELECT * from user where username = '${username}';
    `;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    const passLength = password.length;
    if (passLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const registerUserQuery = `
            INSERT INTO user (username, name, password, gender, location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );
            `;
      await db.run(registerUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});




//API 2
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
            response.send("Login success!");
        }        
        else {
            response.status(400);
            response.send("Invalid password");
        }
    }
});

//API 3
app.put("/change-password", async (request, response) => {
    const {username, oldPassword, newPassword} = request.body;
    const getUserQuery = `
    SELECT * from user where username ='${username}';
    `;
    const user = await db.get(getUserQuery);
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if(isPasswordCorrect === true) {
        if(newPassword.length < 5) {
            response.status(400);
            response.send("Password is too short");
        }
        else {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updatePasswordQuery = `
            UPDATE 
                user
            SET
                password = '${hashedPassword}'
            WHERE
                username = '${username}';
            `;
            await db.run(updatePasswordQuery);
            response.send("Password updated");
        }
    }
    else {
        response.status(400);
        response.send("Invalid current password");
    }
});

module.exports = app;