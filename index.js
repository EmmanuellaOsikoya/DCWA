//sets up express for DCWA project
var express = require('express');
var app = express();

//informs the user that the app is listening on port 3004
app.listen(3005, () => {
    console.log("Server is listening on port 3004");
    })

//GET requests that links to the students page, the grades page, and the lecturers page
app.get('/', (req, res) => {
    res.send("<h1>G00420464</h1><a href='/students'>Students</a><br><a href='/grades'>Grades</a><br><a href='/lecturers'>Lecturers</a>");
})

app.get('/students', (req, res) => {
    res.send("Please select one of the following; ");
})

app.get('/grades', (req, res) => {
    res.send("Test 1 ");
})

app.get('/lecturers', (req, res) => {
    res.send("Test 2 ");
})

