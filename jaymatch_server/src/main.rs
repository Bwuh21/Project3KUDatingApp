// main.rs
/*
Name: JayMatch server
Description: A server for handling the JayMatch website and communicate with the database
Programmer: Maren Proplesch, Nick Greico, and assisted by gemini copilot.
Dates: 10/26/2025
Revision: 2 (adds messaging DB, HTTP endpoints, and WebSocket realtime delivery)
Pre/Post Conditions: The server should be running and able to handle requests from the frontend. It should create a backend database with basic tables. It should remain online always.
Errors: Web errors for bad connection, port errors for firewall, possible errors involving CORS policies.
*/

use actix::prelude::*;
use actix_multipart::Multipart;
use actix_web::{App, Error, HttpRequest, HttpResponse, HttpServer, Responder, web};
use actix_web_actors::ws;
use chrono::Utc;
use futures_util::stream::StreamExt;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::sync::Mutex;

#[derive(Serialize, Deserialize)]
struct User {
    id: Option<i32>,
    name: String,
    password: String,
}

#[derive(Serialize, Deserialize)]
struct NewUser {
    name: String,
    password: String,
    email: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Message {
    id: Option<i64>,
    sender_id: i32,
    receiver_id: i32,
    content: String,
    timestamp: i64,
}

#[derive(Deserialize)]
struct MessagePost {
    sender_id: i32,
    receiver_id: i32,
    content: String,
}

#[derive(Message)]
#[rtype(result = "()")]
struct WsMessage(pub String);

struct AppState {
    db_conn: Mutex<Connection>,
    clients: Mutex<HashMap<i32, Recipient<WsMessage>>>,
}

impl AppState {
    fn new(conn: Connection) -> Self {
        Self {
            db_conn: Mutex::new(conn),
            clients: Mutex::new(HashMap::new()),
        }
    }
}

async fn health() -> impl Responder {
    HttpResponse::Ok().body("Backend active")
}

async fn create_user(data: web::Json<User>, state: web::Data<AppState>) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
    conn.execute(
        "INSERT INTO users (name, password) VALUES (?1, ?2)",
        params![data.name, data.password],
    )
    .unwrap();
    HttpResponse::Ok().body("User created")
}

async fn create_new_user(data: web::Json<NewUser>, state: web::Data<AppState>) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
    match conn.execute(
        "INSERT INTO new_users (name, password, email) VALUES (?1, ?2, ?3)",
        params![data.name, data.password, data.email],
    ) {
        Ok(_) => HttpResponse::Ok().body("New user created"),
        Err(e) => HttpResponse::InternalServerError().body(format!("Error: {}", e)),
    }
}

async fn update_profile_picture(
    mut payload: Multipart,
    state: web::Data<AppState>,
) -> impl Responder {
    let mut user_id: Option<i32> = None;
    let mut file_path: Option<String> = None;

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
        let conn = state.db_conn.lock().unwrap();
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

async fn login(data: web::Json<User>, state: web::Data<AppState>) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
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

async fn get_profile_picture(
    user_id: web::Path<i32>,
    state: web::Data<AppState>,
) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
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

async fn post_message(data: web::Json<MessagePost>, state: web::Data<AppState>) -> impl Responder {
    let ts = Utc::now().timestamp_millis();
    let conn = state.db_conn.lock().unwrap();

    match conn.execute(
        "INSERT INTO messages (sender_id, receiver_id, content, timestamp) VALUES (?1, ?2, ?3, ?4)",
        params![data.sender_id, data.receiver_id, data.content, ts],
    ) {
        Ok(_) => {
            let message = Message {
                id: None,
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                content: data.content.clone(),
                timestamp: ts,
            };
            let serialized = serde_json::json!({
                "type": "message",
                "payload": message
            })
            .to_string();
            let clients = state.clients.lock().unwrap();
            if let Some(recipient) = clients.get(&data.receiver_id) {
                let _ = recipient.do_send(WsMessage(serialized.clone()));
            }
            if let Some(sender_recipient) = clients.get(&data.sender_id) {
                let _ = sender_recipient.do_send(WsMessage(serialized));
            }
            HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": "Message stored and delivered if recipient online",
                "timestamp": ts
            }))
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("DB Insert error: {}", e)),
    }
}

async fn get_messages(
    path: web::Path<(i32, i32)>,
    query: web::Query<HashMap<String, String>>,
    state: web::Data<AppState>,
) -> impl Responder {
    let (a, b) = path.into_inner();
    let limit: i64 = query
        .get("limit")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(100);

    let conn = state.db_conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, sender_id, receiver_id, content, timestamp FROM messages
             WHERE (sender_id = ?1 AND receiver_id = ?2) OR (sender_id = ?2 AND receiver_id = ?1)
             ORDER BY timestamp DESC
             LIMIT ?3",
        )
        .unwrap();

    let rows = stmt
        .query_map(params![a, b, limit], |row| {
            Ok(Message {
                id: row.get(0)?,
                sender_id: row.get(1)?,
                receiver_id: row.get(2)?,
                content: row.get(3)?,
                timestamp: row.get(4)?,
            })
        })
        .unwrap();

    let mut msgs: Vec<Message> = rows.map(|r| r.unwrap()).collect();
    msgs.reverse();

    HttpResponse::Ok().json(msgs)
}

struct MyWs {
    user_id: i32,
    state: web::Data<AppState>,
}

impl Actor for MyWs {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        let addr = ctx.address();
        let recipient = addr.recipient::<WsMessage>();
        let mut clients = self.state.clients.lock().unwrap();
        clients.insert(self.user_id, recipient);
        let welcome = serde_json::json!({
            "type": "system",
            "payload": format!("Connected as user {}", self.user_id)
        })
        .to_string();
        ctx.text(welcome);
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        let mut clients = self.state.clients.lock().unwrap();
        clients.remove(&self.user_id);
    }
}

impl Handler<WsMessage> for MyWs {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for MyWs {
    fn handle(
        &mut self,
        item: Result<ws::Message, ws::ProtocolError>,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        match item {
            Ok(ws::Message::Text(text)) => {
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                    if v.get("type") == Some(&serde_json::Value::String("ping".to_string())) {
                        let pong = serde_json::json!({"type":"pong"});
                        ctx.text(pong.to_string());
                        return;
                    }
                }
                ctx.text(text);
            }
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Pong(_)) => {}
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => {}
        }
    }
}

async fn ws_index(
    req: HttpRequest,
    stream: web::Payload,
    path: web::Path<i32>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let user_id = path.into_inner();
    let ws = MyWs {
        user_id,
        state: state.clone(),
    };
    ws::start(ws, &req, stream)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let conn = Connection::open("test.db").unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL)",
        params![],
    ).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS logins (id INTEGER PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL)",
        params![],
    ).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS new_users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL, email TEXT NOT NULL, profile_picture TEXT)",
        params![],
    ).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )",
        params![],
    )
    .unwrap();
    let state = web::Data::new(AppState::new(conn));
    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
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
            // messaging routes
            .route("/messages", web::post().to(post_message))
            .route("/messages/{a}/{b}", web::get().to(get_messages))
            // websocket
            .route("/ws/{user_id}", web::get().to(ws_index))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
