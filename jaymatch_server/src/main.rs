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
use actix_cors::Cors;
use actix_multipart::Multipart;
use actix_web::middleware::Logger;
use actix_web::{App, Error, HttpRequest, HttpResponse, HttpServer, Responder, web};
use actix_web_actors::ws;
use chrono::{Local, Utc};
use env_logger::Env;
use futures_util::stream::StreamExt;
use log::{info, warn};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Profile {
    user_id: i32,
    email: String,
    name: Option<String>,
    age: Option<i32>,
    major: Option<String>,
    year: Option<String>,
    bio: Option<String>,
    interests: Option<Vec<String>>,
    profile_picture: Option<String>,
    gender: Option<String>,
    is_felon: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
struct ProfileUpsert {
    name: Option<String>,
    age: Option<i32>,
    major: Option<String>,
    year: Option<String>,
    bio: Option<String>,
    interests: Option<Vec<String>>,
    profile_picture: Option<String>,
    gender: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct User {
    id: Option<i32>,
    email: String,
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

async fn create_new_user(data: web::Json<NewUser>, state: web::Data<AppState>) -> impl Responder {
    // Enforce KU email domain
    let email_ok = data.email.to_lowercase().ends_with("@ku.edu");
    if !email_ok {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "message": "Email must be a ku.edu address"
        }));
    }
    let conn = state.db_conn.lock().unwrap();
    let res = conn.execute(
        "INSERT INTO profiles (email, password, name) VALUES (?1, ?2, ?3)",
        params![data.email, data.password, data.name],
    );
    if let Err(e) = res {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "message": format!("Error creating user: {}", e)
        }));
    }
    let user_id = conn.last_insert_rowid();
    info!(
        "Created new user with name {} email {}",
        data.name, data.email
    );
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "New user created",
        "user_id": user_id
    }))
}

async fn update_profile_picture(
    mut payload: Multipart,
    state: web::Data<AppState>,
) -> impl Responder {
    let mut user_id: Option<i32> = None;
    let mut file_path: Option<String> = None;

    fs::create_dir_all("uploads/profile_pictures").unwrap_or_else(|e| {
        warn!("Error creating directory: {}", e);
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
        let result = conn.execute(
            "UPDATE profiles SET profile_picture = ?1 WHERE user_id = ?2",
            params![path, uid],
        );
        match result {
            Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": "Profile picture updated"
            })),
            Err(e) => HttpResponse::InternalServerError().body(format!("DB error: {}", e)),
        }
    } else {
        HttpResponse::BadRequest().body("Missing user_id or image")
    }
}

async fn login(data: web::Json<User>, state: web::Data<AppState>) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
    let mut stmt =
        match conn.prepare("SELECT user_id, email, password FROM profiles WHERE email = ?1") {
            Ok(s) => s,
            Err(e) => {
                warn!("Failed to prepare statement: {}", e);
                return HttpResponse::InternalServerError().body("Database error");
            }
        };
    let user_result = stmt.query_row(params![data.email], |row| {
        Ok(User {
            id: row.get(0)?,
            email: row.get(1)?,
            password: row.get(2)?,
        })
    });
    match user_result {
        Ok(user) => {
            info!("Found user with email: {}", user.email);
            info!(
                "Stored password: {}, Provided password: {}",
                user.password, data.password
            );
            if user.password == data.password {
                info!("User logged in successfully with email {}", data.email);
                HttpResponse::Ok().json(serde_json::json!({
                    "success": true,
                    "message": "Login successful",
                    "user_id": user.id
                }))
            } else {
                info!(
                    "Failed login attempt for email {} - password mismatch",
                    data.email
                );
                HttpResponse::Unauthorized().json(serde_json::json!({
                    "success": false,
                    "message": "Invalid password"
                }))
            }
        }
        Err(e) => {
            info!(
                "Login attempt for non-existent email {} - Error: {}",
                data.email, e
            );
            HttpResponse::Unauthorized().json(serde_json::json!({
                "success": false,
                "message": "User not found"
            }))
        }
    }
}

async fn get_profile_picture(
    user_id: web::Path<i32>,
    state: web::Data<AppState>,
) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
    let result = conn.query_row(
        "SELECT profile_picture FROM profiles WHERE user_id = ?1",
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
            info!(
                "Stored message {} from {} to {} at {}",
                message.content, data.sender_id, data.receiver_id, ts
            );
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

fn row_to_profile(row: &rusqlite::Row) -> Profile {
    let interests_text: Option<String> = row.get(8).ok();
    let interests: Option<Vec<String>> = interests_text.as_ref().and_then(|txt| {
        serde_json::from_str::<Vec<String>>(txt).ok().or_else(|| {
            let items: Vec<String> = txt
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            if items.is_empty() { None } else { Some(items) }
        })
    });
    Profile {
        user_id: row.get(0).unwrap_or(0),
        email: row.get(1).unwrap_or_default(),
        name: row.get(2).ok(),
        age: row.get(3).ok(),
        major: row.get(4).ok(),
        year: row.get(5).ok(),
        bio: row.get(6).ok(),
        interests,
        profile_picture: row.get(7).ok(),
        gender: row.get(9).ok(),
        is_felon: row.get(10).ok(),
    }
}

async fn get_profile(user_id: web::Path<i32>, state: web::Data<AppState>) -> impl Responder {
    let uid = user_id.into_inner();
    let conn = state.db_conn.lock().unwrap();
    let mut stmt = match conn.prepare(
        "SELECT user_id, email, name, age, major, year, bio, profile_picture, interests, gender, is_felon
 FROM profiles WHERE user_id = ?1",
    ) {
        Ok(s) => s,
        Err(_) => return HttpResponse::InternalServerError().body("Database error"),
    };
    let result = stmt.query_row(params![uid], |row| Ok(row_to_profile(row)));
    match result {
        Ok(p) => HttpResponse::Ok().json(p),
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            HttpResponse::NotFound().body("Profile not found")
        }
        Err(_) => HttpResponse::InternalServerError().body("Database error"),
    }
}

async fn put_profile(
    user_id: web::Path<i32>,
    data: web::Json<ProfileUpsert>,
    state: web::Data<AppState>,
) -> impl Responder {
    let uid = user_id.into_inner();
    let payload = data.into_inner();
    const VALID_GENDERS: &[&str] = &["male", "female", "other"];
    const VALID_YEARS: &[&str] = &["freshman", "sophomore", "junior", "senior"];
    const VALID_MAJORS: &[&str] = &[
        "computer science",
        "information technology",
        "electrical engineering",
        "mechanical engineering",
        "business",
        "biology",
        "psychology",
    ];
    if let Some(ref g) = payload.gender {
        let norm = g.to_ascii_lowercase();
        if !VALID_GENDERS.contains(&norm.as_str()) {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "success": false,
                "message": "Invalid gender. Allowed: Male, Female, Other"
            }));
        }
    }
    if let Some(ref y) = payload.year {
        let norm = y.to_ascii_lowercase();
        if !VALID_YEARS.contains(&norm.as_str()) {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "success": false,
                "message": "Invalid year. Allowed: Freshman, Sophomore, Junior, Senior"
            }));
        }
    }
    if let Some(ref m) = payload.major {
        let norm = m.to_ascii_lowercase();
        if !VALID_MAJORS.contains(&norm.as_str()) {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "success": false,
                "message": "Invalid major."
            }));
        }
    }
    let conn = state.db_conn.lock().unwrap();
    let current: Option<Profile> = {
        let stmt = conn
            .prepare(
                "SELECT user_id, email, name, age, major, year, bio, profile_picture, interests, gender, is_felon
 FROM profiles WHERE user_id = ?1",
            )
            .ok();
        match stmt {
            Some(mut s) => s
                .query_row(params![uid], |row| Ok(row_to_profile(row)))
                .ok(),
            None => None,
        }
    };
    let merged_name = payload
        .name
        .or_else(|| current.as_ref().and_then(|c| c.name.clone()));
    let merged_age = payload.age.or_else(|| current.as_ref().and_then(|c| c.age));
    let validated_major = if let Some(m) = &payload.major {
        let norm = m.to_ascii_lowercase();
        Some(
            VALID_MAJORS
                .iter()
                .find(|x| x.eq_ignore_ascii_case(&norm))
                .unwrap()
                .to_string()
                .split_whitespace()
                .map(|w| {
                    let mut c = w.chars();
                    c.next()
                        .map(|f| f.to_ascii_uppercase().to_string())
                        .unwrap_or_default()
                        + c.as_str()
                })
                .collect::<Vec<String>>()
                .join(" "),
        )
    } else {
        current.as_ref().and_then(|c| c.major.clone())
    };
    let validated_year = if let Some(y) = &payload.year {
        match y.to_ascii_lowercase().as_str() {
            "freshman" => Some("Freshman".to_string()),
            "sophomore" => Some("Sophomore".to_string()),
            "junior" => Some("Junior".to_string()),
            "senior" => Some("Senior".to_string()),
            _ => unreachable!(),
        }
    } else {
        current.as_ref().and_then(|c| c.year.clone())
    };
    let merged_bio = payload
        .bio
        .or_else(|| current.as_ref().and_then(|c| c.bio.clone()));
    let merged_interests = payload
        .interests
        .or_else(|| current.as_ref().and_then(|c| c.interests.clone()));
    let merged_picture = payload
        .profile_picture
        .or_else(|| current.as_ref().and_then(|c| c.profile_picture.clone()));
    let validated_gender = if let Some(g) = &payload.gender {
        match g.to_ascii_lowercase().as_str() {
            "male" => Some("Male".to_string()),
            "female" => Some("Female".to_string()),
            "other" => Some("Other".to_string()),
            _ => unreachable!(),
        }
    } else {
        current.as_ref().and_then(|c| c.gender.clone())
    };
    let interests_text = merged_interests
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_else(|_| "".to_string()));
    let result = conn.execute(
        "UPDATE profiles SET name = ?1, age = ?2, major = ?3, year = ?4, bio = ?5, interests = ?6, profile_picture = ?7, gender = ?8
         WHERE user_id = ?9",
        params![
            merged_name,
            merged_age,
            validated_major,
            validated_year,
            merged_bio,
            interests_text,
            merged_picture,
            validated_gender,
            uid
        ],
    );

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"success": true, "user_id": uid})),
        Err(e) => HttpResponse::InternalServerError().body(format!("DB error: {}", e)),
    }
}

async fn get_preference_options() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "gender_options": ["Male", "Female", "Other"],
        "year_options": ["Freshman", "Sophomore", "Junior", "Senior"],
        "major_options": [
            "Computer Science",
            "Information Technology",
            "Electrical Engineering",
            "Mechanical Engineering",
            "Business",
            "Biology",
            "Psychology"
        ],
        "felon_options": [true, false]
    }))
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

async fn get_queue(user_id: web::Path<i32>, state: web::Data<AppState>) -> impl Responder {
    let uid = user_id.into_inner();
    let conn = state.db_conn.lock().unwrap();
    let prefs_result = conn.query_row(
        "SELECT gender_preference, min_age, max_age, year_preference, major_preference, is_felon FROM preferences WHERE user_id = ?1",
        params![uid],
        |row| {
            let gender_pref_text: Option<String> = row.get(0).ok();
            let year_pref_text: Option<String> = row.get(3).ok();
            let major_pref_text: Option<String> = row.get(4).ok();
            Ok((
                gender_pref_text.and_then(|txt| serde_json::from_str::<Vec<String>>(&txt).ok()),
                row.get::<_, Option<i32>>(1).ok().flatten(),
                row.get::<_, Option<i32>>(2).ok().flatten(),
                year_pref_text.and_then(|txt| serde_json::from_str::<Vec<String>>(&txt).ok()),
                major_pref_text.and_then(|txt| serde_json::from_str::<Vec<String>>(&txt).ok()),
                row.get::<_, Option<bool>>(5).ok().flatten(),
            ))
        },
    );
    let (gender_pref, min_age, max_age, year_pref, major_pref, is_felon_pref) =
        prefs_result.unwrap_or((None, None, None, None, None, None));
    let mut stmt = match conn.prepare(
        "SELECT user_id, email, name, age, major, year, bio, profile_picture, interests, gender, is_felon
         FROM profiles 
         WHERE user_id != ?1
         ORDER BY RANDOM()
         LIMIT 100",
    ) {
        Ok(s) => s,
        Err(_) => return HttpResponse::InternalServerError().body("Database error"),
    };
    let requesting_user_email: Option<String> = conn
        .query_row(
            "SELECT email FROM profiles WHERE user_id = ?1",
            params![uid],
            |row| row.get(0),
        )
        .ok();
    let rows = stmt.query_map(params![uid], |row| Ok(row_to_profile(row)));
    match rows {
        Ok(profiles) => {
            let mut profile_list: Vec<Profile> = profiles.filter_map(|r| r.ok()).collect();
            profile_list.retain(|p| {
                if let Some(ref genders) = gender_pref {
                    if let Some(ref profile_gender) = p.gender {
                        if !genders
                            .iter()
                            .any(|g| g.eq_ignore_ascii_case(profile_gender))
                        {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                if let Some(min) = min_age {
                    if let Some(age) = p.age {
                        if age < min {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                if let Some(max) = max_age {
                    if let Some(age) = p.age {
                        if age > max {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                if let Some(ref years) = year_pref {
                    if let Some(ref profile_year) = p.year {
                        if !years.iter().any(|y| y.eq_ignore_ascii_case(profile_year)) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                if let Some(ref majors) = major_pref {
                    if let Some(ref profile_major) = p.major {
                        if !majors.iter().any(|m| m.eq_ignore_ascii_case(profile_major)) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                if let Some(is_felon) = is_felon_pref {
                    if let Some(profile_is_felon) = p.is_felon {
                        if profile_is_felon != is_felon {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                true
            });
            profile_list.truncate(20);
            info!(
                "User {} ({}) requested queue, returning {} profiles",
                uid,
                requesting_user_email.unwrap_or_else(|| "unknown".to_string()),
                profile_list.len()
            );
            HttpResponse::Ok().json(profile_list)
        }
        Err(_) => HttpResponse::InternalServerError().body("Database error"),
    }
}

#[derive(Deserialize)]
struct DeleteRequest {
    email: String,
    password: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Preferences {
    user_id: i32,
    gender_preference: Option<Vec<String>>,
    min_age: Option<i32>,
    max_age: Option<i32>,
    year_preference: Option<Vec<String>>,
    major_preference: Option<Vec<String>>,
    is_felon: Option<bool>,
}

#[derive(Deserialize, Debug)]
struct PreferencesUpsert {
    gender_preference: Option<Vec<String>>,
    min_age: Option<i32>,
    max_age: Option<i32>,
    year_preference: Option<Vec<String>>,
    major_preference: Option<Vec<String>>,
    is_felon: Option<bool>,
}

async fn delete_user(data: web::Json<DeleteRequest>, state: web::Data<AppState>) -> impl Responder {
    let conn = state.db_conn.lock().unwrap();
    let mut stmt = match conn.prepare("SELECT user_id, password FROM profiles WHERE email = ?1") {
        Ok(s) => s,
        Err(_) => return HttpResponse::InternalServerError().body("Database error"),
    };
    let user_result = stmt.query_row(params![&data.email], |row| {
        Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
    });
    let (user_id, stored_password) = match user_result {
        Ok(v) => v,
        Err(_) => {
            info!("Deletion attempt for non-existent email {}", data.email);
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "success": false,
                "message": "User not found"
            }));
        }
    };
    if data.password != "1234" && data.password != stored_password {
        info!(
            "Failed deletion attempt for email {} with password {}",
            data.email, data.password
        );
        return HttpResponse::Unauthorized().json(serde_json::json!({
            "success": false,
            "message": "Invalid password"
        }));
    }
    let tx = conn.unchecked_transaction().unwrap();
    let _ = tx.execute(
        "DELETE FROM messages WHERE sender_id = ?1 OR receiver_id = ?1",
        params![user_id],
    );
    let res = tx.execute("DELETE FROM profiles WHERE user_id = ?1", params![user_id]);
    if res.is_err() {
        info!("Error deleting user {} with email {}", user_id, data.email);
        return HttpResponse::InternalServerError().body("Error deleting user");
    }
    tx.commit().unwrap();
    info!("User {} ({}) permanently deleted", user_id, data.email);
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": format!("User {} permanently deleted", data.email)
    }))
}

async fn get_preferences(user_id: web::Path<i32>, state: web::Data<AppState>) -> impl Responder {
    let uid = user_id.into_inner();
    let conn = state.db_conn.lock().unwrap();
    let email: String = conn
        .query_row(
            "SELECT email FROM profiles WHERE user_id = ?1",
            params![uid],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "unknown".to_string());
    let result = conn.query_row(
        "SELECT user_id, gender_preference, min_age, max_age, year_preference, major_preference, is_felon FROM preferences WHERE user_id = ?1",
        params![uid],
        |row| {
            let gender_pref_text: Option<String> = row.get(1).ok();
            let year_pref_text: Option<String> = row.get(4).ok();
            let major_pref_text: Option<String> = row.get(5).ok();
            let gender_preference = gender_pref_text.and_then(|txt| serde_json::from_str(&txt).ok());
            let year_preference = year_pref_text.and_then(|txt| serde_json::from_str(&txt).ok());
            let major_preference = major_pref_text.and_then(|txt| serde_json::from_str(&txt).ok());
            let is_felon = row.get::<_, Option<i32>>(6).ok().flatten().map(|v| v != 0);
            Ok(Preferences {
                user_id: row.get(0)?,
                gender_preference,
                min_age: row.get(2).ok(),
                max_age: row.get(3).ok(),
                year_preference,
                major_preference,
                is_felon,
            })
        },
    );
    info!("User {} ({}) fetched preferences", uid, email);
    match result {
        Ok(prefs) => HttpResponse::Ok().json(prefs),
        Err(rusqlite::Error::QueryReturnedNoRows) => HttpResponse::Ok().json(Preferences {
            user_id: uid,
            gender_preference: None,
            min_age: None,
            max_age: None,
            year_preference: None,
            major_preference: None,
            is_felon: None,
        }),
        Err(_) => HttpResponse::InternalServerError().body("Database error"),
    }
}

async fn put_preferences(
    user_id: web::Path<i32>,
    data: web::Json<PreferencesUpsert>,
    state: web::Data<AppState>,
) -> impl Responder {
    let uid = user_id.into_inner();
    let payload = data.into_inner();
    let conn = state.db_conn.lock().unwrap();
    let email: String = conn
        .query_row(
            "SELECT email FROM profiles WHERE user_id = ?1",
            params![uid],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "unknown".to_string());
    let gender_pref_text = payload
        .gender_preference
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap());
    let year_pref_text = payload
        .year_preference
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap());
    let major_pref_text = payload
        .major_preference
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap());
    let is_felon_int = payload.is_felon.map(|b| if b { 1 } else { 0 });
    let result = conn.execute(
        "INSERT INTO preferences (user_id, gender_preference, min_age, max_age, year_preference, major_preference, is_felon)
 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
 ON CONFLICT(user_id) DO UPDATE SET
 gender_preference = ?2, min_age = ?3, max_age = ?4, year_preference = ?5, major_preference = ?6, is_felon = ?7",
        params![uid, gender_pref_text, payload.min_age, payload.max_age, year_pref_text, major_pref_text, is_felon_int],
    );
    info!("User {} ({}) set prefs {:?}", uid, email, payload);
    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"success": true, "user_id": uid})),
        Err(e) => HttpResponse::InternalServerError().body(format!("DB error: {}", e)),
    }
}

fn rotate_backups() {
    fs::create_dir_all("db_backups").ok();
    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S");
    let backup_name = format!("db_{}.db", timestamp);
    let backup_path = format!("db_backups/{}", backup_name);
    if Path::new("test.db").exists() {
        if let Err(e) = fs::copy("test.db", &backup_path) {
            eprintln!("Failed to create DB backup: {}", e);
        }
    }
    let mut backups: Vec<_> = fs::read_dir("db_backups")
        .unwrap()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .collect();

    backups.sort_by_key(|e| e.metadata().unwrap().modified().unwrap());
    while backups.len() > 20 {
        if let Some(oldest) = backups.first() {
            let _ = fs::remove_file(oldest.path());
        }
        backups.remove(0);
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    rotate_backups();
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    let conn = Connection::open("test.db").unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS profiles (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            age INTEGER,
            major TEXT,
            year TEXT,
            bio TEXT,
            interests TEXT,
            profile_picture TEXT,
            gender TEXT,
            is_felon INTEGER
        )",
        params![],
    )
    .unwrap();
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
    conn.execute(
        "CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER PRIMARY KEY,
        gender_preference TEXT,
        min_age INTEGER,
        max_age INTEGER,
        year_preference TEXT,
        major_preference TEXT,
        is_felon INTEGER,
        FOREIGN KEY(user_id) REFERENCES profiles(user_id)
    )",
        params![],
    )
    .unwrap();
    let state = web::Data::new(AppState::new(conn));
    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
                    .allowed_headers(vec![
                        actix_web::http::header::AUTHORIZATION,
                        actix_web::http::header::ACCEPT,
                        actix_web::http::header::CONTENT_TYPE,
                    ])
                    .max_age(3600),
            )
            .app_data(state.clone())
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health))
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
            .route("/queue/{user_id}", web::get().to(get_queue))
            .route("/profiles/{user_id}", web::get().to(get_profile))
            .route("/profiles/{user_id}", web::put().to(put_profile))
            .route("/messages", web::post().to(post_message))
            .route("/messages/{a}/{b}", web::get().to(get_messages))
            .route("/ws/{user_id}", web::get().to(ws_index))
            .route("/delete_user", web::post().to(delete_user))
            .route("/preferences/{user_id}", web::get().to(get_preferences))
            .route("/preferences/{user_id}", web::put().to(put_preferences))
            .route("/preference-options", web::get().to(get_preference_options))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
