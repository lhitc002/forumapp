/**
 * Map routes for my Goldsmiths Forum web application.
 * in the second parameter of res render, an object, i am passing custom variables in like the layout.html file and the custom date function result
 *
 * @param {*} app - The Express.js application instance to which routes will be mapped.
 * @param {*} shopData - An object storing the express ejs layout location and extra data like my shop name.
 */
module.exports = function (app, shopData) {
  let allowedItemTypes = ["topics", "posts", "users"];
  // Check if user is logged in

  function getColumnsAndQuery(itemType) {
    let columnsToSelect;
    let sqlquery = `SELECT * FROM ${itemType.toLowerCase()}`;

    switch (itemType.toLowerCase()) {
      case "users":
        columnsToSelect = "UserName, `First Name`, `Last Name`, Email";
        break;
      case "topics":
        columnsToSelect = "Name, Description";
        break;
      case "posts":
        columnsToSelect = `posts.Title, posts.Body, topics.Name AS \`Linked Topic\`, users.\`First Name\` AS \`Linked User\``;
        sqlquery += ` LEFT JOIN topics ON posts.topic_id = topics.id`;
        sqlquery += ` LEFT JOIN users ON posts.user_id = users.id`;
        break;
      default:
        break;
    }

    sqlquery = sqlquery.replace("*", columnsToSelect);

    return sqlquery;
  }

  app.get("/", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId,
    });
    console.log(req.session.userId);
    res.render("index.ejs", newData);
  });

  app.get("/about", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId,
    });
    res.render("about.ejs", newData);
  });

  app.get("/search", function (req, res) {
    let newData = Object.assign({}, shopData, {
      user: req.session.user,
      userId: req.session.userId,
    });
    res.render("search.ejs", newData);
  });

  app.get("/search-result", function (req, res) {
    let itemType = req.query.itemType ? req.query.itemType.toLowerCase() : null;
    let sqlquery = getColumnsAndQuery(itemType);

    let searchColumns = []; // Array to store columns to be searched

    // Determine searchColumns based on itemType
    switch (itemType) {
      case "users":
        searchColumns = ["UserName", "`First Name`", "`Last Name`", "Email"];
        break;
      case "topics":
        searchColumns = ["Name", "Description"];
        break;
      case "posts":
        searchColumns = [
          "posts.Title",
          "posts.Body",
          "topics.Name",
          "users.`First Name`",
        ];
        break;
      default:
        break;
    }

    let searchQuery = "";
    let searchKeyword =
      req.query.keywordExact !== ""
        ? req.query.keywordExact
        : req.query.keywordPartial;

    if (req.query.keywordExact !== "") {
      searchQuery = searchColumns
        .map((column) => `${column} = '${searchKeyword}'`)
        .join(" OR ");
    } else if (req.query.keywordPartial !== "") {
      searchQuery = searchColumns
        .map((column) => `${column} LIKE '%${searchKeyword}%'`)
        .join(" OR ");
    }

    if (searchQuery !== "") {
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

  app.get("/list", function (req, res) {
    let itemType = req.query.itemType;

    if (
      itemType != null &&
      typeof itemType === "string" &&
      allowedItemTypes.includes(itemType.toLowerCase())
    ) {
      let sqlquery = getColumnsAndQuery(itemType);

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

  app.get("/addpost", function (req, res) {
    let userId = req.session.userId; // Assuming userId holds the current user's ID

    if (userId != null) {
      // Query modified to fetch topics associated with the current user
      let query = `
        SELECT UuidFromBin(t.Id) AS Id, t.Name 
        FROM topics t
        JOIN user_topics ut ON t.id = ut.topic_id
        WHERE ut.user_id = uuidToBin('${userId}')
        `;

      db.query(query, (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error fetching topics");
          return;
        }

        let newData = Object.assign({}, shopData, {
          user: req.session.user,
          userId: req.session.userId,
          topics: results, // Pass the filtered topics data to the view
        });

        res.render("addpost.ejs", newData);
      });
    } else {
      let newData = Object.assign({}, shopData, {
        user: req.session.user,
        userId: req.session.userId,
      });

      res.render("addpost.ejs", newData);
    }
  });

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
