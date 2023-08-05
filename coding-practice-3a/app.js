const express = require("express")
const app = express()

var addDays = require('date-fns/addDays')

app.get("/",(request,response) => {
    let date = new Date();
    let after = addDays(
        new Date(date.getFullYear(),date.getMonth(),date.getDate()), 
        100
    );
    response.send(`${after.getDate()}/${after.getMonth()+1}/${after.getFullYear()}`);
})

module.exports = app;
app.listen(3000);