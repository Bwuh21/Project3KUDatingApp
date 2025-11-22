Team 1 – JayMatch
Ibrahim | Maren | Zack | Abdullah | Nick | Saurav
EECS 581 – Software Engineering II (Fall 2025)
Professor: Hossein Saiedian

Purpose:
The goal of Sprint 4 is to finalize JayMatch by completing key functional fixes, enforcing correct chat access rules, stabilizing the matchmaking system, and addressing remaining bugs discovered during full-system QA. These tasks ensure the application is stable, correct, and ready for final demonstration.

R28 - Correctly implement chat feature to only chat with people you've matched with
Description: Restrict chat functionality so that users can only send messages to another user if a valid mutual match exists. This ensures privacy, improves user safety, and aligns with dating-app standards.

Artifacts / Notes:
Backend: Added match-verification check before processing POST /messages.
SQL query validates two-way match in the matches table.
WebSocket broadcasts now confirm match authorization before sending events.

R29 - Properly fix the matching algorithm to integrate with both front end and back end.
Description: Repair and enhance the matchmaking algorithm so suggestions are accurate, filtered correctly, and fully integrated between backend recommendation logic and the frontend interface.

Artifacts / Notes:
Backend: Updated recommendation SQL with shared-interest weighting, recency, and profile completeness.
Removed duplicate suggestions + excluded blocked or previously liked users.
Logging added to tune ranking and verify consistent outputs.

R30 - Resolve all remaining functional bugs discovered during final QA testing, ensuring core features (login, profile, chat, matching) work consistently end-to-end.

Description: Address all remaining defects identified during full-system QA, ensuring stable behavior across login, profiles, matching, chat, WebSockets, and navigation.

Artifacts / Notes:

Fixed bug with profile not saving properly.
Removed backend button from the JayMatch website.
Fixed state refresh problems in match list after liking a user.
Additional minor UI + responsiveness corrections.
Properly implemented messaging feature to only show people you've matched with.

Deliverables:
Updated Project3_Requirements.xlsx (Sprint 4 complete)
Sprint4_Requirements_Artifact.md (this file)
Evidence folder with: Postman collection, Screenshots
Final GitHub project build (code freeze)