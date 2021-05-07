const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const fileUpload = require("express-fileupload");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const alert = require("alert");
const multer = require("multer");
var nodemailer = require('nodemailer');
const { response } = require("express");
var email, email_id;
let otp = Math.floor(Math.random() * 100000);
app.use(fileUpload());
var passwordValidator = require('password-validator');
var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Khushi1234@",
    database: "keepnotes"
});

conn.connect(function (err) {
    if (err) throw err;
    console.log("Connected");
})
const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");

app.set("view engine", "ejs");
app.use(express.static(static_path));

app.use(express.static("upload"));
app.set("views", template_path);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/", function (request, response) {
    response.render("register");
})
app.post("/register", async function (request, response, next) {
    try {
        
        const username = request.body.username;
        const password = request.body.password;
        var schema = new passwordValidator();
        schema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(1)                                // Must have at least 1 digit
        .has().not().spaces()                           // Should not have spaces
        .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values
        
        if(schema.validate(password)){
        const newusername = username.split("@")[0];
        var newuser = newusername;
        const select = "select * from users where email = '" + username + "';";
        conn.query(select, function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                response.render("register");
                alert("User already registerd");
            }
            else {

                if (newusername.indexOf(".") != -1) {
                    newuser = newusername.replace(".", "_");
                }
                const insert = "insert into users (email,password) values('" + username + "','" + password + "');";
                const create = "create table " + newuser + " (title varchar(800) , message varchar(800),dateofnote varchar(20),timeofnote time,id int auto_increment primary key);";

                conn.query(insert, function (err, result, fields) {
                    if (err) throw err;
                    response.render("register");
                })
                conn.query(create, function (err, result, fields) {
                    if (err) throw err;

                })
            }
        })


    }
    else{
        response.render("register");
            alert(`            At least 8 characters
            A mixture of both uppercase and lowercase letters.
            A mixture of letters and numbers.
            Inclusion of at least one special character, e.g., ! @ # ? ] 
            Note: do not use < or > in your password, as both can cause                   problems in Web browsers.`);
    }
}
    catch (error) {
        console.log(error);
    }
})
app.get("/login", function (request, response) {
    response.render("login");
})
app.post("/login", async function (request, response, next) {
    const username = request.body.username;
    email_id = username;
    const newusername = username.split("@")[0];
    var newuser = newusername;
    console.log(username);
    const password = request.body.password;
    if (newusername.indexOf(".") != -1) {
        newuser = newusername.replace(".", "_");

    }
    email = newuser;
    const table_of_users = "select * from users where email = '" + username + "' and password = '" + password + "';";
    conn.query(table_of_users, function (error, result, fields) {
        if (error) throw error;
        let select = "select * from " + email + ";";

        if (result.length > 0) {
            conn.query(select, function (err, result, field) {
                if (err) throw err;
                if (result.length > 0) {
                    response.render("home", { records: result });
                }
                else {
                    response.render("home", { records: null });
                }
            })


        }
        else {
            response.render("login");
            alert("User name or password is not crct");
        }

    })



})
app.get("/home", function (request, response) {
    let select = "select * from " + email + ";";
    conn.query(select, function (err, result, field) {
        if (err) throw err;
        if (result.length > 0) {
            response.render("home", { records: result });
        }
        else {
            response.render("home", { records: null });
        }
    })

})
app.get("/insert", function (request, response) {
    response.render("insert");
})
app.post("/insert", async function (request, response) {
    try {
        const title = request.body.title;
        const subject = request.body.subject;
        let date_ob = new Date();

        // current date
        // adjust 0 before single digit date
        let date = ("0" + date_ob.getDate()).slice(-2);

        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

        // current year
        let year = date_ob.getFullYear();

        // current hours
        let hours = date_ob.getHours();

        // current minutes
        let minutes = date_ob.getMinutes();

        // current seconds
        let seconds = date_ob.getSeconds();

        let currentDate = year + "-" + month + "-" + date;
        let currentTime = hours + ":" + minutes + ":" + seconds;
       
        const insert = "insert into " + email + " (title,message,dateofnote,timeofnote) values('" + title + "','" + subject + "','" + currentDate + "','" + currentTime + "');"
        conn.query(insert, function (err, result, fields) {
            if (err) throw err;
            let select = "select * from " + email + ";";
            conn.query(select, function (err, result, field) {
                if (err) throw err;
                if (result.length > 0) {
                    response.render("home", { records: result });
                }
                else {
                    response.render("home", { records: null });
                }
            })



        })
    }
    catch (err) {
        console.log(err);
    }
})

app.get("/viewnotes", function (request, response, next) {
    var id = request.query.id;
    console.log(id);
    var select = "select * from  " + email + " where id = " + id + ";";
    console.log(select);
    conn.query(select, function (err, result, field) {
        if (err) throw err;
        response.render("viewnotes", { records: result });
    })

})
app.post("/viewnotes", function (request, response, next) {
    try {
        var title = request.body.title;
        var message = request.body.subject;
        var id = request.body.id;
        let update = "update " + email + " set title = '" + title + "', message = '" + message + "' where id = " + id + ";";
        conn.query(update, function (err, result, fields) {
            if (err) throw err;

            let q = "select * from " + email + " where id = " + id + ";";
            conn.query(q, function (err, result, fields) {
                if (err) throw err;
                response.render("viewnotes", { records: result });
                alert("Updated Sucessfully!");
            })
        })


    }

    catch (err) {
        console.log(err);
    }

})

app.get("/delete", function (request, response) {
    let id = request.query.id;
    let delete_note = "delete from " + email + " where id = " + id + ";";
    conn.query(delete_note, function (err, result, fields) {
        if (err) throw err;
       response.redirect("/home");

    })
})
app.get("/profile", function (request, response, next) {

    let select = "select * from users where email =  '" + email_id + "';";
    conn.query(select, function (err, result, fields) {
        if (err) throw err;
        console.log(result[0].image_name);
        response.render("profile", { records: result });
    })
})

app.post("/profile", function (request, response, next) {
    try {
        const password = request.body.password;
        const new_password = request.body.new_password;
        const confirm_password = request.body.confirm_password;
        let img = request.files.uploaded_image;

        let uploadimage = __dirname + "/upload/" + img.name;
        let select = "select password  from users  where email = '" + email_id + "';";
        conn.query(select, function (err, result, fields) {
            if (password == "" && new_password == "" && confirm_password === "") {
                img.mv(uploadimage, function (err) {
                    if (err) throw err;
                    let update = "update users set image_name = '" + img.name + "' where email = '" + email_id + "';";
                    conn.query(update, function (err, result, fields) {
                        if (err) throw err;
                        let select = "select * from users where email =  '" + email_id + "';";
                        conn.query(select, function (err, result, fields) {
                            if (err) throw err;

                            response.render("profile", { records: result });
                            alert("Profile Updated");
                        })


                    })

                })
            }

            else if (password === result[0].password) {
                if (new_password === confirm_password) {
                    img.mv(uploadimage, function (err) {
                        if (err) throw err;
                        let update = "update users set password = '" + new_password + "',image_name = '" + img.name + "' where email = '" + email_id + "';";
                        conn.query(update, function (err, result, fields) {
                            if (err) throw err;
                            let select = "select * from users where email =  '" + email_id + "';";
                            conn.query(select, function (err, result, fields) {
                                if (err) throw err;

                                response.render("profile", { records: result });
                                alert("Profile Updated");
                            })


                        })

                    })

                }
                else {
                    alert("Confirm Password does not match!");
                    let select = "select * from users where email =  '" + email_id + "';";
                    conn.query(select, function (err, result, fields) {
                        if (err) throw err;

                        response.render("profile", { records: result });
                    })

                }
            }
            else {
                alert("Wong Password entered!");
                let select = "select * from users where email =  '" + email_id + "';";
                conn.query(select, function (err, result, fields) {
                    if (err) throw err;

                    response.render("profile", { records: result });
                })


            }
        })
    }
    catch (err) {
        console.log(err);
    }
})


app.get("/logout", function (request, response) {
    response.render("register");
})
app.get("/forgotpassword", function (request, response) {
    response.render("forgotpassword");
})
app.post("/forgotpassword", function (request, response) {
    let username = request.body.username;
    email_id = username;
    let select = "select  * from users where email = '" + username + "';";
    conn.query(select, function (err, result, field) {
        if (result.length > 0) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: '2019khushboo.bajaj@ves.ac.in',
                    pass: 'Khushi1234@'
                }
            });

            var mailOptions = {
                from: '2019khushboo.bajaj@ves.ac.in',
                to: result[0].email,
                subject: 'OTP',
                text: otp.toString()
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            response.render("otp");
            alert("Otp send successfully!");

        }
        else {
            alert("Email does not exist!");
        }


    })

})

app.get("/otp", function (request, render) {
    response.render("otp");
})
app.post("/otp", function (request, response) {
    console.log(typeof (otp));

    const Otp = request.body.otp;
    console.log(typeof (Otp));
    if (Otp == otp) {
        response.render("reset");
    }
    else {
        alert("OTP is incorrect!");
    }
})
app.get("/reset", function (request, response) {
    response.render("reset");
})
app.post("/reset", function (request, response, next) {
    const new_password = request.body.new_password;
    const confirm_password = request.body.confirm_password;
    if (new_password === confirm_password) {
        let update = "update users set password = '" + new_password + "' where email = '" + email_id + "';";
        conn.query(update, function (err, result, fields) {
            if (err) throw err;

            const newusername = email_id.split("@")[0];
            var newuser = newusername;


            if (newusername.indexOf(".") != -1) {
                newuser = newusername.replace(".", "_");

            }
            let select = "select * from " + newuser + ";";
            conn.query(select, function (err, result, field) {
                if (err) throw err;

                if (result.length > 0) {
                    response.render("home", { records: result });
                }
                else {
                    response.render("home", { records: null });
                }
            })

        })
    }
    else{
        alert("Password does not match")
    }

})
app.listen(port);