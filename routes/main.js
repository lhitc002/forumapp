/**
 * Map routes for my Goldmiths Forum web application.
 * in the second parameter of res render, an object, i am passing custom variables in like the layout.html file and the custom date function result
 *
 * @param {*} app - The Express.js application instance to which routes will be mapped.
 * @param {*} shopData - An object storing the express ejs layout location and extra data like my shop name.
 */
module.exports = function (app, shopData) {
  let allowedItemTypes = ["topics", "posts", "users"];
  // Check if user is logged in

  let crypto = require("crypto");
  function hashPassword(str) {
    return crypto.subtle
      .digest("SHA-512", new TextEncoder("utf-8").encode(str))
      .then((buf) => {
        return Array.prototype.map
          .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
          .join("");
      });
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

  const { v4: uuidv4 } = require("uuid");
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

      hashPassword(passwordString)
        .then((passwordHash) => {
          if (passwordHash === user.passwordHash) {
            callback("", user.Id); // No error, user exists and password is correct, returning user ID
          } else {
            callback("Password is incorrect", null);
          }
        })
        .catch((hashErr) => {
          console.error(hashErr);
          return callback(`Error: ${hashErr.message}`, null);
        });
    });
  }

  // mapping the homepage route to the index.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId,
    });
    console.log(req.session.userId);
    res.render("index.ejs", newData);
  });

  // mapping the about page route to the about.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/about", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId,
    });
    res.render("about.ejs", newData);
  });

  // mapping the search page route to the search.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/search", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId
    });
    res.render("search.ejs", newData);
  });

  // this page is accessed via a GET request from the /search page. It accesses the database connected to this web application and displays results from a query.
  // I disabled the layout for this page so I can place it within another page.
  app.get("/search-result", function (req, res) {
    let itemType = req.query.itemType ? req.query.itemType.toLowerCase() : null;
    let sqlquery = `SELECT * FROM ${itemType} `;
    let columnsToSelect;
    let searchColumns = []; // Array to store columns to be searched
  
    switch (itemType) {
      case "users":
        columnsToSelect = "UserName, `First Name`, `Last Name`, Email";
        searchColumns = ["UserName", "`First Name`", "`Last Name`", "Email"];
        break;
      case "topics":
        columnsToSelect = "Name, Description";
        searchColumns = ["Name", "Description"];
        break;
      case "posts":
        columnsToSelect = `posts.Title, posts.Body, topics.Name AS \`Linked Topic\`, users.\`First Name\` AS \`Linked User\``;
        searchColumns = ["posts.Title", "posts.Body", "topics.Name", "users.`First Name`"]
        sqlquery += ` LEFT JOIN topics ON posts.topic_id = topics.id`;
        sqlquery += ` LEFT JOIN users ON posts.user_id = users.id`;
        break;
      default:
        break;
    }
  
    sqlquery = sqlquery.replace("*", columnsToSelect);
  
    let searchQuery = '';
    let searchKeyword = req.query.keywordExact !== "" ? req.query.keywordExact : req.query.keywordPartial;
  
    if (req.query.keywordExact !== "") {
      searchQuery = searchColumns.map(column => `${column} = '${searchKeyword}'`).join(" OR ");
    } else if (req.query.keywordPartial !== "") {
      searchQuery = searchColumns.map(column => `${column} LIKE '%${searchKeyword}%'`).join(" OR ");
    }
  
    if (searchQuery !== '') {
      sqlquery += ` WHERE (${searchQuery})`;
    }
  
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }
  
      let newData = Object.assign({}, shopData, { availableItems: result });
      newData.layout = false;
  
      res.render("_search-results.ejs", newData);
    });
  });  

  // mapping the list page route to the list.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  // It accesses the database connected to this web application and displays results from a query.
  app.get("/list", function (req, res) {
    let itemType = req.query.itemType;

    if (
      itemType != null &&
      typeof itemType === "string" &&
      allowedItemTypes.includes(itemType.toLowerCase())
    ) {
      let columnsToSelect;

      // Define columns based on itemType
      let sqlquery = `SELECT * FROM ${itemType.toLowerCase()}`; // Basic query structure

      switch (itemType.toLowerCase()) {
        case "users":
          columnsToSelect = "UserName, `First Name`, `Last Name`, Email"; // Add specific columns for itemType1
          break;
        case "topics":
          columnsToSelect = "Name, Description"; // Add specific columns for itemType2
          break;
        case "posts":
          columnsToSelect = `posts.Title, posts.Body, topics.Name AS 
                            \`Linked Topic\`, users.\`First Name\` AS \`Linked User\``; // Add specific columns for itemType2 and select the name of the topic
          sqlquery += ` LEFT JOIN topics ON posts.topic_id = topics.id`;
          sqlquery += ` LEFT JOIN users ON posts.user_id = users.id`;
          break;
        default:
          break;
      }

      // Add the selected columns to the query
      sqlquery = sqlquery.replace("*", columnsToSelect);

      // execute sql query
      db.query(sqlquery, (err, result) => {
        let newData;
        if (err) {
          newData = Object.assign({}, shopData, {
            querySuccess: false,
            listHeading: `'${itemType}' is valid, but doesn't exist in the database for some reason!`,
            user: req.session.user,
            userId: req.session.userId,
          });
        } else {
          newData = Object.assign({}, shopData, {
            querySuccess: true,
            columns: result,
            listHeading: `Listing ${itemType}`,
            user: req.session.user,
            userId: req.session.userId,
          });
        }

        //console.log(newData);
        res.render("list.ejs", newData);
      });
    } else {
      let newData = Object.assign({}, shopData, {
        querySuccess: false,
        listHeading: `'${itemType}' is not a database table`,
        user: req.session.user,
        userId: req.session.userId,
      });

      res.render("list.ejs", newData);
    }
  });

  // mapping the register page route to the register.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/register", function (req, res) {
    let newData = Object.assign({}, shopData, {
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

      let newData = Object.assign({}, shopData, {
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

          let newData = Object.assign({}, shopData, {
            user: req.session.user,
            userId: req.session.userId,
            userName: userData.UserName,
            firstName: userData.FirstName,
            lastName: userData.LastName,
            email: userData.Email,
            errorMsg: ""
          });

          res.render("profile.ejs", newData);
        }
      });
    } else {
      let newData = Object.assign({}, shopData, {
        user: req.session.user,
        userId: req.session.userId,
        errorMsg: ""
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
      hashPassword(oldPasswordString)
        .then((passwordHash) => {
          if (passwordHash !== user.passwordHash) {
            let newData = Object.assign({}, shopData, {
                userName: req.body.userName,
                errorMsg: "Old password is incorrect",
                user: req.session.user,
                userId: req.session.userId,
                firstName: firstName, lastName: lastName, email: email
            });
            res.render("profile.ejs", newData);
            return;
          } else {
            // Password is correct, proceed with updates
            if (!req.body.newPasswordString) {
                // Update other details without changing the password hash
                updateUser(
                    req, res, userName, null, firstName, lastName, email,
                    (successful) => {
                      if (successful) {
                        res.redirect("/profile");
                      } else {

                      }
                    }
                );
            } else {
                // Update password hash and other details
                updateUser(
                    req, res, userName, newPasswordString, firstName, lastName, email,
                    (successful) => {
                      if (successful) {
                        res.redirect("/profile");
                      } else {

                      }
                    }
                );
            }
            
          }
        })
        .catch((hashErr) => {
          console.error(hashErr);
          res.status(500).send(`Error: ${hashErr.message}`);
        });
    });
  });

  // mapping the login page route to the login.ejs view and setting the layout from express-ejs-layouts to shared/layout.ejs
  app.get("/login", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId,
      errorMsg: ""
    });
    res.render("login.ejs", newData);
  });

  // this page is accessed via a POST request from the /register page. It displays the query sent via the get request in JSON.
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
            let newData = Object.assign({}, shopData, {
                userName: req.body.userName,
                errorMsg: errorMsg,
                user: req.session.user,
                userId: req.session.userId
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
        res.redirect("/login"); // Redirect to login page after logout
      }
    });
  });

  // mapping the addpost page route to the addpost.ejs view and setting the layout from express-ejs-layouts to shared/addpost.ejs
  app.get("/addpost", function (req, res) {
    let query = `SELECT UuidFromBin(Id) AS Id, Name FROM topics`;

    db.query(query, (err, results) => {
      if (err) {
        // Handle the error appropriately
        console.error(err);
        res.status(500).send("Error fetching topics");
        return;
      }

      let newData = Object.assign({}, shopData, {
        user: req.session.user,
        userId: req.session.userId,
        topics: results, // Pass the topics data to the view
      });

      res.render("addpost.ejs", newData);
    });
  });

  /**
   * NOTE:
   * In order to make navigation of the site easier, I have
   * Changed this code from just using res.send. instead, I have
   * placed the 'This book is added to database' in its own view. 'postadded.ejs'.
   *
   * This is so that I can pass in the layout of the site and you can
   * click the navigation bar to return to the page, instead of manual navigation.
   */
  app.post("/postadded", function (req, res) {
    // saving data in database
    // execute sql query
    let newRecord = [
      uuidv4(),
      req.body.topic,
      req.session.userId,
      req.body.title,
      req.body.body,
    ];
    db.query(
      `insert into posts (id, topic_id, user_id, title, body) VALUES (uuidToBin(?), uuidToBin(?), uuidToBin(?), ?, ?)`,
      newRecord,
      (err, result) => {
        if (err) {
          return console.error(err.message); // return error message in node console log
        } else {
          db.query(
            `SELECT Name AS Name FROM topics WHERE Id = uuidToBin(?)`,
            [req.body.topic],
            (err, result) => {
              if (err) {
                return console.error(err.message); // return error message in node console log
              } else {
                let newData = Object.assign({}, shopData, {
                  user: req.session.user,
                  userId: req.session.userId,
                  topic: result[0].Name,
                  postTitle: req.body.title,
                  postBody: req.body.body,
                });
                res.render("postadded.ejs", newData);
              }
            }
          );
        }
      }
    );
  });
};
