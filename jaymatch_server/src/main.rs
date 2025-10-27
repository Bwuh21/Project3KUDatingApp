/*
Name: JayMatch server
Description: A server for handling the JayMatch website and communicate with the database
Programmer: Maren Proplesch, Nick Greico, and assisted by gemini copilot.
Dates: 10/26/2025
Revision: 1
Pre/Post Conditions: The server should be running and able to handle requests from the frontend. It should create a backend database withi basic tables. It should remain online always.
Errors: Web errors for bad connection, port errors for firewall, possible errors involving CORS policies. 
*/

use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

//structure to handle user data sent from frontend with serde capabilities
#[derive(Serialize, Deserialize)]
struct User {
    id: Option<i32>,
    name: String,
    password: String,
}

//end point to easily check whether the server is online or not
async fn health() -> impl Responder {
    HttpResponse::Ok().body("Backend active")
}

//end point for creating a user and storing it in the database
async fn create_user(data: web::Json<User>, db: web::Data<Mutex<Connection>>) -> impl Responder {
    let conn = db.lock().unwrap();
    conn.execute(
        "INSERT INTO users (name, password) VALUES (?1, ?2)",
        params![data.name, data.password],
    )
    .unwrap();
    HttpResponse::Ok().body("User created")
}

//endpoint that iterates the database and returns the users as a json array
async fn list_users(db: web::Data<Mutex<Connection>>) -> impl Responder {
    let conn = db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, password FROM users")
        .unwrap();
    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                password: row.get(2)?,
            })
        })
        .unwrap()
        .map(|r| r.unwrap())
        .collect::<Vec<User>>();
    HttpResponse::Ok().json(users)
}

//endpoint for storing login attempts in the database
async fn login(data: web::Json<User>, db: web::Data<Mutex<Connection>>) -> impl Responder {
    let conn = db.lock().unwrap();
    conn.execute(
        "INSERT INTO logins (name, password) VALUES (?1, ?2)",
        params![data.name, data.password],
    )
    .unwrap();
    HttpResponse::Ok().body("Login stored")
}

//define a main function to start the server
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    //open a connection with the the test database
    let conn = Connection::open("test.db").unwrap();
    //create a users table if it does not already exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL)",
        params![],
    ).unwrap();
    //create a logins table if it does not already exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS logins (id INTEGER PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL)",
        params![],
    ).unwrap();

    //wrap the connection in a Mutex for threading
    let db = web::Data::new(Mutex::new(conn));

    //start the server in its own thread
    HttpServer::new(move || {
        App::new()
            .app_data(db.clone())
            .route("/health", web::get().to(health))
            .route("/users", web::get().to(list_users))
            .route("/users", web::post().to(create_user))
            .route("/login", web::post().to(login))
    })
    .bind(("127.0.0.1", 8080))? //put it at port 8080
    .run() //run the server
    .await
}
