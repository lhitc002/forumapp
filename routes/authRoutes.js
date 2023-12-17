/**
 * Map routes for my Goldsmiths Forum web application.
 * in the second parameter of res render, an object, i am passing custom variables in like the layout.html file and the custom date function result
 *
 * @param {*} app - The Express.js application instance to which routes will be mapped.
 * @param {*} appData - An object storing the express ejs layout location and extra data like my shop name.
 */
module.exports = function (app, appData) {
  const crypto = require("crypto");
  const { v4: uuidv4 } = require("uuid");

  function hashPassword(str) {
    const hash = crypto.createHash('sha512');
    hash.update(str);
    return hash.digest('hex');
  }
  

  function updateUser(
    req,
    res,
    userName,
    passwordString,
    firstName,
    lastName,
    email,
    callback
  ) {
    // Update password hash and other details
    if (passwordString != null) {
      hashPassword(passwordString)
        .then((passwordHash) => {
          let updateQuery =
            "UPDATE users SET UserName=?, passwordHash=?, `First Name`=?, `Last Name`=?, Email=? WHERE Id=uuidToBin(?)";
          db.query(
            updateQuery,
            [
              userName,
              passwordHash,
              firstName,
              lastName,
              email,
              req.session.userId,
            ],
            (err, results) => {
              if (err) {
                console.error(err);
                callback(false);
                return;
              }
              console.log("Password and details updated:", results);
              callback(true);
            }
          );
        })
        .catch((hashErr) => {
          console.error(hashErr);
          callback(false);
        });
    } else {
      // Update other details without changing password hash
      let updateQuery =
        "UPDATE users SET UserName=?, `First Name`=?, `Last Name`=?, Email=? WHERE Id=uuidToBin(?)";
      db.query(
        updateQuery,
        [userName, firstName, lastName, email, req.session.userId],
        (err, results) => {
          if (err) {
            console.error(err);
            callback(false);
            return;
          }
          console.log("Details updated:", results);
          callback(true);
        }
      );
    }
  }

  function registerUser(
    userNameString,
    passwordString,
    firstNameString,
    lastNameString,
    emailString
  ) {
    let newIdQuery = `SELECT UUID_TO_BIN('${uuidv4()}') AS newId`;

    db.query(newIdQuery, (err, result) => {
      if (err) {
        console.error(err);
        // Handle the error or redirect
        return;
      }

      let newId = result[0].newId;

      hashPassword(passwordString)
        .then((passwordHash) => {
          let userInsertQuery =
            "INSERT INTO users (id, UserName, passwordHash, `First Name`, `Last Name`, Email) VALUES (?, ?, ?, ?, ?, ?)";
          db.query(
            userInsertQuery,
            [
              newId,
              userNameString,
              passwordHash,
              firstNameString,
              lastNameString,
              emailString,
            ],
            (err, results) => {
              if (err) {
                console.error(err);
                // Handle the error
              } else {
                console.log("Data inserted:", results);
                // Handle successful insertion
              }
            }
          );
        })
        .catch((hashErr) => {
          console.error(hashErr);
          // Handle hash error
        });
    });
  }

  function startLoginSession(userNameString, passwordString, callback) {
    let userNameQuery = `SELECT UuidFromBin(Id) AS Id, passwordHash FROM users WHERE userName = ?`;

    db.query(userNameQuery, [userNameString], (err, results) => {
      if (err) {
        console.error(err);
        return callback(`Error: ${err.message}`, null);
      }

      if (results.length !== 1) {
        return callback("Username does not exist", null);
      }

      const user = results[0];

      let passwordHash = hashPassword(passwordString);
      if (passwordHash === user.passwordHash) {
        callback("", user.Id); // No error, user exists and password is correct, returning user ID
      } else {
        callback("Password is incorrect", null);
      }
    });
  }

  // mapping the register page route to the register.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/register", function (req, res) {
    let newData = Object.assign({}, appData, {
      user: req.session.user,
      userId: req.session.userId,
    });
    res.render("register.ejs", newData);
  });

  // this page is accessed via a POST request from the /register page. It displays the query sent via the get request in JSON.
  app.post("/registered", function (req, res) {
    try {
      registerUser(
        req.body.userName,
        req.body.passwordString,
        req.body.firstName,
        req.body.lastName,
        req.body.email
      );

      let newData = Object.assign({}, appData, {
        userName: req.body.userName,
        user: req.session.user,
        userId: req.session.userId,
      });

      // save data in database here (not currently actually saving to an external database, maybe in future)
      res.render("registeredMsg.ejs", newData);
    } catch (err) {
      console.log(err);
    }
  });

  // mapping the login page route to the login.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/login", function (req, res) {
    let newData = Object.assign({}, appData, {
      user: req.session.user,
      userId: req.session.userId,
      errorMsg: "",
    });
    res.render("login.ejs", newData);
  });

  // this page is accessed via a POST request from the /login page. It validates a login request and then starts a user session
  app.post("/loggedin", function (req, res) {
    try {
      startLoginSession(
        req.body.userName,
        req.body.passwordString,
        (errorMsg, userId) => {
          if (errorMsg === "") {
            req.session.user = req.body.userName;
            req.session.userId = userId;
            res.redirect("./"); // Successful login redirects to home page
          } else {
            // Render login page with error message
            let newData = Object.assign({}, appData, {
              userName: req.body.userName,
              errorMsg: errorMsg,
              user: req.session.user,
              userId: req.session.userId,
            });
            res.render("login.ejs", newData);
          }
        }
      );
    } catch (err) {
      console.log(err);
      // Handle other errors, if any
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/logout", (req, res) => {
    // Clear the user session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.send("Error logging out");
      } else {
        res.redirect("./login"); // Redirect to login page after logout
      }
    });
  });

  // mapping the login page route to the login.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/profile", function (req, res) {
    if (req.session.user != null) {
      let query = `SELECT UserName, \`First Name\` AS FirstName, \`Last Name\` AS LastName, Email 
        FROM users 
        WHERE Id = uuidToBin('${req.session.userId}')`;

      db.query(query, (err, results) => {
        if (err) {
          // Handle the error appropriately
          console.error(err);
          res.status(500).send("Error fetching user profile");
          return;
        } else {
          const userData = results[0]; // Assuming the query fetches a single user

          let newData = Object.assign({}, appData, {
            user: req.session.user,
            userId: req.session.userId,
            userName: userData.UserName,
            firstName: userData.FirstName,
            lastName: userData.LastName,
            email: userData.Email,
            errorMsg: "",
          });

          res.render("profile.ejs", newData);
        }
      });
    } else {
      let newData = Object.assign({}, appData, {
        user: req.session.user,
        userId: req.session.userId,
        errorMsg: "",
      });

      res.render("profile.ejs", newData);
    }
  });

  app.post("/editProfile", function (req, res) {
    const {
      userName,
      oldPasswordString,
      newPasswordString,
      firstName,
      lastName,
      email,
    } = req.body;

    if (!req.session.user) {
      res.status(401).send("You must be logged in to access this page!");
      return;
    }

    let userNameQuery = `SELECT passwordHash FROM users WHERE Id = uuidToBin(?)`;
    db.query(userNameQuery, [req.session.userId], (err, results) => {
      if (err) {
        console.error(err);
      }

      const user = results[0];
      // Validate old password
      let passwordHash = hashPassword(oldPasswordString);
      if (passwordHash !== user.passwordHash) {
        let newData = Object.assign({}, appData, {
          userName: req.body.userName,
          errorMsg: "Old password is incorrect",
          user: req.session.user,
          userId: req.session.userId,
          firstName: firstName,
          lastName: lastName,
          email: email,
        });
        res.render("profile.ejs", newData);
        return;
      } else {
        // Password is correct, proceed with updates
        if (!req.body.newPasswordString) {
          // Update other details without changing the password hash
          updateUser(
            req,
            res,
            userName,
            null,
            firstName,
            lastName,
            email,
            (successful) => {
              if (successful) {
                res.redirect("./profile");
              } else {
              }
            }
          );
        } else {
          // Update password hash and other details
          updateUser(
            req,
            res,
            userName,
            newPasswordString,
            firstName,
            lastName,
            email,
            (successful) => {
              if (successful) {
                res.redirect("./profile");
              } else {
              }
            }
          );
        }
      }
    });
  });
};
