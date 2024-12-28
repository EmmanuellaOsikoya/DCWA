//sets up express for DCWA project
var express = require('express');
var app = express();

//can now use the index of promise-mysql
var pmysql = require('promise-mysql')


//informs the user that the app is listening on port 3004
app.listen(3005, () => {
    console.log("Server is listening on port 3004");
    })

//can now extract information from the proj2024mysql database
pmysql.createPool({
    connectionLimit : 3,
    host : 'localhost',
    user : 'root',
    password : 'root',
    database : 'proj2024mysql'
})
    .then((p) => {
        pool = p
    })
    .catch((e) => {
        console.log("pool error:" + e)
   })

//GET requests that links to the students page, the grades page, and the lecturers page
app.get('/', (req, res) => {
    res.send("<h1>G00420464</h1><a href='/students'>Students</a><br><a href='/grades'>Grades</a><br><a href='/lecturers'>Lecturers</a>");
})

app.get('/students', (req, res) => {
    pool.query('SELECT * FROM student')
        .then((data) => {
            // Starts the HTML structure so it can be a little bit more visually appealing to the user
            let response = `
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        h1 {
                            color: #333;
                        }
                        a {
                            text-decoration: none;
                            color: #0066cc;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th, td {
                            padding: 10px;
                            text-align: left;
                            border: 1px solid black;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h1>Students</h1>
                    <a href="/">Home</a>
                    <table>
                        <thead>
                            <tr>`;

            // Added a table headers dynamically based on the column names
            if (data.length > 0) {
                Object.keys(data[0]).forEach((column) => {
                    response += `<th>${column}</th>`;
                });

                response += `</tr></thead><tbody>`;

                // Add table rows for each student
                data.forEach((student) => {
                    response += `<tr>`;
                    Object.values(student).forEach((value) => {
                        response += `<td>${value}</td>`;
                    });
                    response += `</tr>`;
                });

                response += `</tbody></table>`;
            } else {
                response += `<p>No students found.</p>`;
            }

            // Closing the HTML structure
            response += `
                </body>
                </html>`;

            // Send the HTML response
            res.send(response);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send("Error retrieving students: " + error.message);
        });
});


app.get('/grades', (req, res) => {
    res.send("Test 1 ");
})

app.get('/lecturers', (req, res) => {
    res.send("Test 2 ");
})

