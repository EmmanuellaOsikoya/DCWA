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
    res.send(`
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    a {
                        color: blue;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <h1>G00420464</h1>
                <a href='/students'>Students</a><br>
                <a href='/grades'>Grades</a><br>
                <a href='/lecturers'>Lecturers</a>
            </body>
        </html>
    `);
});


// GET request to display the Students Page
app.get('/students', (req, res) => {
    pool.query('SELECT * FROM student ORDER BY sid ASC') //gets all of the students data from the order of the ID (e.g. G001 G002 etc.)
        .then((data) => { 
            //creates rows containing the students id, name, age, and a button that allows the user to update the students details if they wish
            let studentRows = data.map(student => ` 
                <tr>
                    <td>${student.sid}</td>
                    <td>${student.name}</td>
                    <td>${student.age}</td>
                    <td><a href="/students/edit/${student.sid}">Update</a></td>
                </tr>
            `).join('');

            res.send(`
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                        }
                        th, td {
                            border: 1px solid black;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        a {
                            color: blue;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <h1>Students</h1>
                    <a href="/students/add">Add Student</a> | <a href="/">Home</a>
                    <table>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Action</th>
                        </tr>
                        ${studentRows}
                    </table>
                </body>
                </html>
            `);
        }) //If there is an error while querying the database the catch block will log the error to the console for the user to see
        .catch((err) => {
            console.log(err);
            res.status(500).send('Error retrieving students.');
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

// GET request to display the Update Student page
app.get('/students/edit/:sid', (req, res) => {
    const studentID = req.params.sid;

    // Fetches the student details from the database
    pool.query('SELECT * FROM student WHERE sid = ?', [studentID])
        .then((data) => {
            if (data.length > 0) {
                const student = data[0];
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
                        <h1>Update Student</h1>
                        <a href="/students">Back to Students</a>
                        <form action="/students/edit/${student.sid}" method="POST">
                            <label for="id">Student ID:</label><br>
                            <input type="text" id="sid" name="sid" value="${student.sid}" readonly><br>
                            
                            <label for="name">Name (Min 2 characters):</label><br>
                            <input type="text" id="name" name="name" value="${student.name}" required minlength="2"><br>
                            
                            <label for="age">Age (18 or older):</label><br>
                            <input type="number" id="age" name="age" value="${student.age}" required min="18"><br>
                            
                            <button type="submit">Update</button>
                        </form>
                    </body>
                    </html>
                `);
            } else {
                res.status(404).send('Student not found.');
            }
        }) //error message that is displayed to the console when there is an issue retrieving student details
        .catch((err) => {
            console.log(err);
            res.status(500).send('Error retrieving student details.');
        });
});

// POST request to handle the form submission for updating the students from the list
app.post('/students/edit/:sid', (req, res) => {
    const studentID = req.params.sid;
    const { name, age } = req.body;

    // Validate inputs from the Update student form
    if (!name || name.length < 2) {
        return res.redirect(`/students/edit/${studentID}?error=Name must be at least 2 characters long.`);
    }
    if (!age || age < 18) {
        return res.redirect(`/students/edit/${studentID}?error=Age must be 18 or older.`);
    }

    // Updates the student in the database
    pool.query('UPDATE student SET name = ?, age = ? WHERE sid = ?', [name, age, studentID])
        .then(() => {
            res.redirect('/students'); // Redirects back to the students list after successful update
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send('Error updating student in the database.');
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
    }) //error message that will be displayed to the user in the console
    .catch((error) => {
        console.log(error);
        res.status(500).send("Error retrieving grades: " + error.message);
    });
});

// Unfortunately the lecturers aspect of the project is not working apologies for this
// Using a MongoDB database for the lecturers section of the app
// const MongoClient = require('mongodb').MongoClient
// MongoClient.connect('mongodb://127.0.0.1:27017')
// .then((client) => {
// db = client.db('proj2024MongoDB')
// coll = db.collection('lecturers')
// })
// .catch((error) => {
// console.log(error.message)
// })

app.get('/lecturers', (req, res) => {
    res.send("Test 2 ");
})

