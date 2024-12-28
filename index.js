//sets up express for DCWA project
var express = require('express');
var app = express();

//can now use the index of promise-mysql
var pmysql = require('promise-mysql')

//can now use body parser middleware
var bodyParser = require('body-parser');

//body parser middleware added so that we can use forms to update and/or add students
app.use(bodyParser.urlencoded({ extended: true }));


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
            //response is responsible for the CSS and HTML that created the table
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
                    <a href='/students/add'>Add Student</a>
                    <br>
                    <a href="/">Home</a>
                    <table>
                        <thead>
                            <tr>`;

            // Added table headers dynamically based on the column names
            if (data.length > 0) {
                Object.keys(data[0]).forEach((column) => {
                    response += `<th>${column}</th>`;
                });

                response += `</tr></thead><tbody>`;

                // Adds table rows for each student
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

//this is responsible for allowing the user to add students to the database
app.get('/students/add', (req, res) => {
    let errorMessage = req.query.error || '';
    let studentData = {
        sid: req.query.sid || '',
        name: req.query.name || '',
        age: req.query.age || ''
    };

    //The form that the user fills out to add a new Student
    res.send(`
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
                .error {
                    color: red;
                }
                form {
                    margin-top: 20px;
                }
                input {
                    margin-bottom: 10px;
                    padding: 5px;
                    width: 300px;
                }
                button {
                    padding: 5px 15px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>Add Student</h1>
            <a href="/students">Back to Students</a>
    
            ${errorMessage ? `<p class="error">${errorMessage}</p>` : ''}
            
            <form action="/students/add" method="POST">
                <label for="id">Student ID (4 characters):</label><br>
                <input type="text" id="sid" name="sid" value="${studentData.sid}" required maxlength="4"><br>
                
                <label for="name">Name (Min 2 characters):</label><br>
                <input type="text" id="name" name="name" value="${studentData.name}" required minlength="2"><br>
                
                <label for="age">Age (18 or older):</label><br>
                <input type="number" id="age" name="age" value="${studentData.age}" required min="18"><br>
                
                <button type="submit">Add Student</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/students/add', (req, res) => {
    const { sid, name, age } = req.body; //extracts the sid, name, and age from the form submission

    //If statements that check to see if the user has met all of the conditions required for a new Student to be added
    if (!sid || sid.length !== 4) {
        return res.redirect('/students/add?error=Student ID must be 4 characters.');
    }

    if (!name || name.length < 2) {
        return res.redirect('/students/add?error=Name must be at least 2 characters long.');
    }

    if (!age || age < 18) {
        return res.redirect('/students/add?error=Age must be 18 or older.');
    }

    //Checks if there is already a student with the same sid that the user has input for the new student
    //Error message will be displayed to the user letting them know that a student with the sid they inputted already exists
    pool.query('SELECT * FROM student WHERE sid = ?', [sid])
        .then((existingStudent) => {
            if (existingStudent.length > 0) {
                return res.redirect('/students/add?error=Student with ID ' + sid + ' already exists.');
            }

            //If all of the conditions are met e.g. sid name age etc. the new student is added to the database and the user is also redirected to the /students page where they can now view the list of students
            pool.query('INSERT INTO student (sid, name, age) VALUES (?, ?, ?)', [sid, name, age])
                .then(() => {
                    res.redirect('/students');
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send('Error saving student to the database.');
                });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send('Error checking existing student.');
        });
});

//LEFT JOIN was used to show the students regardless of whether they have a grade or a module associated with them
app.get('/grades', (req, res) => {
    pool.query(`
        SELECT 
            s.name AS student_name, 
            m.name AS module_name, 
            g.grade
        FROM 
            student s
        LEFT JOIN  
            grade g ON s.sid = g.sid
        LEFT JOIN 
            module m ON g.mid = m.mid
        ORDER BY 
            s.name ASC, g.grade ASC
    `)
    .then((data) => { //creates the table that shows the students name, the modules that they are studying and their grade
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
            .student-header {
                background-color: #f9f9f9;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <h1>Grades</h1>
        <a href="/">Home</a>
        <br><br>
        <table>
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Module Name</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>`;

            if (data.length > 0) {
                let currentStudent = '';
                data.forEach((row) => {
                    // Checks if the student's name has changed, and create a new row for it
                    if (row.student_name !== currentStudent) {
                        currentStudent = row.student_name;
                        response += `
                            <tr class="student-header">
                                <td colspan="3">${currentStudent}</td>
                            </tr>`;
                    }
            
                    // Now adds the student's grades as rows 
                    response += `
                        <tr>
                            <td></td> <!-- Empty cell for student name -->
                            <td>${row.module_name}</td>
                            <td>${row.grade}</td>
                        </tr>`;
                });
            
                response += `</tbody></table>`;
            } else {
                response += `<p>No grades found.</p>`;
            }
            
            response += `
                </body>
                </html>
            `;

        res.send(response);
    })
    .catch((error) => {
        console.log(error);
        res.status(500).send("Error retrieving grades: " + error.message);
    });
});

app.get('/lecturers', (req, res) => {
    res.send("Test 2 ");
})

