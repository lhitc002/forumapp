# Create the bookshop database
CREATE Database myBookshop;

# Select the bookshop database
USE myBookshop;

# create table
CREATE TABLE books (
    id INT NOT NULL AUTO_INCREMENT,
    name LONGTEXT,
    price DOUBLE,
    PRIMARY KEY (id)
);

# Insert data into the bookshop database
INSERT INTO books (name, price)
VALUES ('database book', 40.25),
       ('Node.js book', 25.00),
       ('Express book', 31.99),
       ('Python Basics', 15.50),
       ('HTML and CSS Essentials', 18.75),
       ('JavaScript Advanced', 17.99),
       ('Machine Learning Primer', 19.95),
       ('Data Structures in C++', 14.25)
       ('Introduction to Java', 9.25),
       ('CSS Mastery', 8.50),
       ('JavaScript for Beginners', 7.99),
       ('SQL Crash Course', 6.75),
       ('Web Design 101', 5.50)
       ('Python Programming for Kids', 4.75),
       ('HTML5 Basics', 3.99),
       ('CSS Cookbook', 4.50),
       ('JQuery Essentials', 4.25),
       ('SQL Fundamentals', 2.99);

# Add user (localhost host only so external sources cannot access it)
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';

# Grant privileges for the myBookshop database to 'appuser' user
GRANT ALL PRIVILEGES ON myBookshop.* TO 'appuser'@'localhost';