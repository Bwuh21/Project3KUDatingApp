Sprint 2 Artifact — JayMatch

EECS 581 – Software Engineering II (Fall 2025)
Team 1 – JayMatch
Ibrahim | Maren | Zack | Abdullah | Nick | Saurav

Purpose

The focus for Sprint 2 was getting the full backend ↔ database connection working and enabling profile creation, editing, and retrieval.
This artifact outlines what we set out to complete, what’s functional now, and how to verify those pieces.

Requirements Covered
ID	Description	Sprint	Status
R5	Implement backend endpoints that read/write the database	2	Done
R8	Verify endpoints through testing (Postman/curl)	2	Done
R12	Expand SQLite schema for profiles and messages	1 → 2	Done
Key Features Implemented

Backend (Rust + Actix):

Health check – GET /health returns “Backend active”.

User authentication – POST /users, POST /users/new (validates @ku.edu), POST /login.

Profile CRUD – GET/PUT /profiles/{user_id} for creating or updating profiles.

Profile pictures – upload and retrieve images (POST/GET users/profile-picture).

Messaging – POST /messages and GET /messages/{a}/{b} with WebSocket support.

WebSocket route – GET /ws/{user_id} for real-time chat delivery.

Database (SQLite):
Automatically builds tables on startup: users, new_users, profiles, messages, and logins.

Expected Outcomes

Profile information saves correctly to SQLite and can be updated.

Images upload to uploads/profile_pictures/ and display properly.

Messages send and appear in both users’ threads, with real-time updates via WebSocket.

CORS is enabled for http://localhost:4200 so Angular can talk to the backend without issues.

API Overview
GET   /health
POST  /users
POST  /users/new
POST  /login

GET   /profiles/{user_id}
PUT   /profiles/{user_id}

POST  /users/profile-picture
GET   /users/{user_id}/profile-picture

POST  /messages
GET   /messages/{a}/{b}?limit=100
GET   /ws/{user_id}

Typical Flows

Profile Update

Angular → PUT /profiles/{id}
Backend → Upserts data into SQLite
Response → 200 { success:true }
Angular → Refreshes profile display


Messaging

Angular → POST /messages
Backend → Saves to DB → broadcasts via WebSocket
Both clients → Receive "type: message" payload

Testing & Verification
Test	Description	Expected Result
T1	PUT /profiles/1 with { "name":"Alex" }	Returns 200; GET shows updated record
T2	GET /profiles/9999	404 Not Found
T3	Upload profile picture	200 OK then retrievable bytes
T4	POST /users/new (non-@ku.edu
)	400 Bad Request
T5	POST /messages	200 OK and visible in GET query
T6	WebSocket chat	Live message appears for both users

Sample commands

curl -i http://localhost:8080/health

curl -X POST http://localhost:8080/users/new \
  -H "Content-Type: application/json" \
  -d '{"name":"alex","password":"pw","email":"alex@ku.edu"}'

curl -X PUT http://localhost:8080/profiles/1 \
  -H "Content-Type: application/json" \
  -d '{"major":"EECS","bio":"Interested in Rust"}'

curl "http://localhost:8080/messages/1/2?limit=10"

Evidence to Include

Screenshot of sqlite3 test.db .schema output.

Postman or Insomnia test results.

Saved curl outputs (.txt) in /Documents/Evidence/.

Screenshot of profile image upload and GET response.

(Optional) two-tab WebSocket chat demo screenshot.

File Header Example
/*
File: main.rs
Description: JayMatch backend (Actix) with SQLite, Profiles, and Messaging
Authors: Team 1 – JayMatch
Created: 10/26/2025  |  Updated: 11/09/2025
Notes: Initial DB setup and endpoint integration
*/

