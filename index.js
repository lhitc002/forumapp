/**
 * Goldsmiths Forum Application, based from template by Llewelyn Fernandes (Project Lecturer)
 * This project was built from the previous berties books assignment template.
 * Template is located at https://github.com/lfern002/gs-dwa-berties-books-initial-code
 */

/**
 * Variable declaration section
 */
const appData = {
    appName: "Goldsmiths Forum"
}; // Defining the shop data object

const port = 8000; // Define the port of the application

/**
 * Module import section
 */
const expressLayouts = require('express-ejs-layouts'); // importing the module to allow for page layouts, to share HTML across multiple pages
const express = require('express'); // importing the express module
const session = require('express-session'); // importing the express session module for login
const ejs = require('ejs'); // importing the ejs module
const bodyParser = require ('body-parser'); // importing the body parser module
const mysql = require('mysql'); // importing the mysql database server module

/**
 * Configure my Goldsmiths Forum web application with EJS templating engine and layout support.
 * - This application uses the same functions that I created from the 'Thirsty Student' application, with difference that
 *   .html files are used in place of .html files.
 * 
 * @param {*} app - The Express.js application instance.
 */
function configureApp(app, express) {

    // Allowing the application access to directories. '/public' for CSS, '/views' for EJS.
    app.use(express.static(__dirname + '/public')); // Setting up /public directory
    app.set('views', __dirname + '/views'); // Setting up /views directory

    // Passing the express-ejs-layouts module into the express application instance so it can actually be used
    app.use(expressLayouts);

    app.use(session({
      secret: 'transrights',
      resave: false,
      saveUninitialized: true
    }));
    
    // Tell Express that we want to use EJS as the templating engine
    app.set('view engine', 'ejs');

    // Tells Express how we should process html files
    // We want to use EJS's rendering engine
    app.engine('html', ejs.renderFile);

    // Tells Express to use body parser, which will properly populate req.body when we make post/get requests
    app.use(bodyParser.urlencoded({ extended: true }));
}

/**
 * Map routes for my Goldsmiths Forum web application.
 * This function previously existed to map routes.
 * It is now only used to pass in express-ejs-layouts object data and- 
 * -call map routing from another file.
 * 
 * @param {*} app - The Express.js application instance to which routes will be mapped.
 */
function mapRoutes(app) {

    // this object defines the express server layout file which will render on every mapped page
    var layoutData = { layout: 'shared/layout.ejs' };

    // this object combines the variables of the layoutData object with any others I want, then can be passed into the page mappings to be used
    // The elipses are required. These operators are called object spread. they copy the individual properties of objects into this single one instead of copying the objects as a whole
    var combinedData = { ...layoutData, ...appData };

    // Requires the main.js and authRoutes.js file inside the routes folder passing in the Express app and data as arguments.  
    // All the route mappings will go in these files, instead of here.
    require("./routes/authRoutes")(app, combinedData);
    require("./routes/main")(app, combinedData);
}

/**
 * Configure the Database for my Goldsmiths Forum web application.
 * This function creates and opens a connection to my MySQL database.
 * The database contains a table with books, their IDs and their prices.
 */
function configureDatabase() {

    // Define the database connection
    const db = mysql.createConnection ({
        host: '192.168.1.149',
        user: 'appuser',
        password: 'app2027',
        database: 'myForum'
    });

    // Connect to the database
    db.connect((err) => {
        if (err) {
            throw err;
        }
        console.log('Connected to database');
    });

    global.db = db;
}

/**
 * Main function for my Goldsmiths Forum web application.
 * This function calls all the other functions in the proper order, then initializes-
 * -my web application, so it can be accessed on the web.
 */
function main() {
    const app = express(); // Create the express application object

    configureDatabase();
    configureApp(app, express); // custom function that I put the lines configuring layouts and view engine in, to save space
    mapRoutes(app); // custom function that I put the route mappings in, to save space

    // Start the web app listening on specified port
    app.listen(port, () => console.log(`${appData.appName} app listening on port ${port}!`));
}

// Calls the main function, consequently starting the web application
main();