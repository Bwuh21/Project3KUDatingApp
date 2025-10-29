/*
Name: JayMatch server
Description: A server for handling the JayMatch website and communicate with the database
Programmer: Maren Proplesch, Nick Greico, and assisted by gemini copilot.
Dates: 10/26/2025
Revision: 1
Pre/Post Conditions: The server should be running and able to handle requests from the frontend. It should create a backend database withi basic tables. It should remain online always.
Errors: Web errors for bad connection, port errors for firewall, possible errors involving CORS policies.
*/

use actix_multipart::Multipart;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use futures_util::stream::StreamExt;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::sync::Mutex;

//structure to handle user data sent from frontend with serde capabilities
#[derive(Serialize, Deserialize)]
struct User {
    id: Option<i32>,
    name: String,
    password: String,
}

//structure for creating a new user with optional profile picture path
#[derive(Serialize, Deserialize)]
struct NewUser {
    name: String,
    password: String,
    email: String,
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

//endpoint for creating a new user with full details
async fn create_new_user(
    data: web::Json<NewUser>,
    db: web::Data<Mutex<Connection>>,
) -> impl Responder {
    let conn = db.lock().unwrap();
    match conn.execute(
        "INSERT INTO new_users (name, password, email) VALUES (?1, ?2, ?3)",
        params![data.name, data.password, data.email],
    ) {
        Ok(_) => HttpResponse::Ok().body("New user created"),
        Err(e) => HttpResponse::InternalServerError().body(format!("Error: {}", e)),
    }
}

//endpoint for updating user profile picture
async fn update_profile_picture(
    mut payload: Multipart,
    db: web::Data<Mutex<Connection>>,
) -> impl Responder {
    let mut user_id: Option<i32> = None;
    let mut file_path: Option<String> = None;

    // Create uploads directory if it doesn't exist
    fs::create_dir_all("uploads/profile_pictures").unwrap_or_else(|e| {
        eprintln!("Error creating directory: {}", e);
    });

    while let Some(item) = payload.next().await {
        let mut field = item.unwrap();
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.unwrap().get_name().unwrap_or("");
        if field_name == "user_id" {
            let mut data = Vec::new();
            while let Some(chunk) = field.next().await {
                data.extend_from_slice(&chunk.unwrap());
            }
            user_id = String::from_utf8(data).ok().and_then(|s| s.parse().ok());
        } else if field_name == "image" {
            let filename = content_disposition
                .unwrap()
                .get_filename()
                .unwrap_or("unknown");
            let extension = filename.rsplit('.').next().unwrap_or("jpg");
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis();
            let unique_filename = format!("{}_{:x}.{}", timestamp, timestamp, extension);
            let filepath = format!("uploads/profile_pictures/{}", unique_filename);
            let mut f = fs::File::create(&filepath).unwrap();
            while let Some(chunk) = field.next().await {
                let data = chunk.unwrap();
                f.write_all(&data).unwrap();
            }
            file_path = Some(filepath);
        }
    }

    if let (Some(uid), Some(path)) = (user_id, file_path) {
        let conn = db.lock().unwrap();
        match conn.execute(
            "UPDATE new_users SET profile_picture = ?1 WHERE id = ?2",
            params![path, uid],
        ) {
            Ok(_) => HttpResponse::Ok().body("Profile picture updated"),
            Err(e) => HttpResponse::InternalServerError().body(format!("Error: {}", e)),
        }
    } else {
        HttpResponse::BadRequest().body("Missing user_id or image")
    }
}

//endpoint for storing login attempts in the database
async fn login(data: web::Json<User>, db: web::Data<Mutex<Connection>>) -> impl Responder {
    let conn = db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, password FROM users WHERE name = ?1")
        .unwrap();
    let user_result = stmt.query_row(params![data.name], |row| {
        Ok(User {
            id: row.get(0)?,
            name: row.get(1)?,
            password: row.get(2)?,
        })
    });
    match user_result {
        Ok(user) => {
            if user.password == data.password {
                HttpResponse::Ok().json(serde_json::json!({
                    "success": true,
                    "message": "Login successful",
                    "user_id": user.id
                }))
            } else {
                HttpResponse::Unauthorized().json(serde_json::json!({
                    "success": false,
                    "message": "Invalid password"
                }))
            }
        }
        Err(_) => HttpResponse::Unauthorized().json(serde_json::json!({
            "success": false,
            "message": "User not found"
        })),
    }
}

//retrieves a profile picture for a user
async fn get_profile_picture(
    user_id: web::Path<i32>,
    db: web::Data<Mutex<Connection>>,
) -> impl Responder {
    let conn = db.lock().unwrap();
    let result = conn.query_row(
        "SELECT profile_picture FROM new_users WHERE id = ?1",
        params![user_id.into_inner()],
        |row| row.get::<_, Option<String>>(0),
    );
    match result {
        Ok(Some(path)) => match fs::read(&path) {
            Ok(image_data) => {
                let extension = path.rsplit('.').next().unwrap_or("jpg");
                let content_type = match extension {
                    "png" => "image/png",
                    "jpg" | "jpeg" => "image/jpeg",
                    "gif" => "image/gif",
                    "webp" => "image/webp",
                    _ => "application/octet-stream",
                };
                HttpResponse::Ok()
                    .content_type(content_type)
                    .body(image_data)
            }
            Err(_) => HttpResponse::NotFound().body("Image file not found"),
        },
        Ok(None) => HttpResponse::NotFound().body("No profile picture set"),
        Err(_) => HttpResponse::NotFound().body("User not found"),
    }
}

async fn index() -> impl Responder {
    let html = r#"
    <html>
        <head>
            <title>JayMatch Server</title>
            <style>
                body {
                    background: radial-gradient(circle at top, #2b5876, #4e4376);
                    color: white;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding-top: 100px;
                }
                h1 { font-size: 3em; margin-bottom: 0.3em; }
                p { font-size: 1.2em; opacity: 0.8; }
                a {
                    display: inline-block;
                    margin-top: 1em;
                    padding: 10px 20px;
                    background: white;
                    color: #4e4376;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: bold;
                }
                a:hover { background: #ddd; }
            </style>
        </head>
        <body>
            <h1>🚀 JayMatch Backend</h1>
            <p>Server is running and connected to the database.</p>
            <a href="/health">Check Health</a>
        </body>
    </html>
    "#;
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
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
    //create a new_users table with profile picture support
    conn.execute(
        "CREATE TABLE IF NOT EXISTS new_users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL, email TEXT NOT NULL, profile_picture TEXT)",
        params![],
    ).unwrap();
    //wrap the connection in a Mutex for threading
    let db = web::Data::new(Mutex::new(conn));
    //start the server in its own thread
    HttpServer::new(move || {
        App::new()
            .app_data(db.clone())
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health))
            .route("/users", web::post().to(create_user))
            .route("/users/new", web::post().to(create_new_user))
            .route(
                "/users/profile-picture",
                web::post().to(update_profile_picture),
            )
            .route("/login", web::post().to(login))
            .route(
                "/users/{user_id}/profile-picture",
                web::get().to(get_profile_picture),
            )
    })
    .bind(("127.0.0.1", 8080))? //put it at port 8080
    .run() //run the server
    .await
}
