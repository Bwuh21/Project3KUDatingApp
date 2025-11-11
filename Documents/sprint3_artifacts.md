Sprint 3 Requirements Artifact – JayMatch KU Dating App

Team Name: JayMatch
Course: EECS 581 – Software Engineering II (Fall 2025)
Team 1 – JayMatch Ibrahim | Maren | Zack | Abdullah | Nick | Saurav
Professor: Hossein Saiedian
Sprint Goal: Add intelligence, safety, and polish to JayMatch by implementing matchmaking logic, chatbot assistance, premium plans, moderation tools, accessibility improvements, and a guided onboarding experience.

R24 – Matchmaking Algorithm

Description:
Develop and integrate a matchmaking algorithm that recommends compatible users based on shared interests, academic majors, and interaction patterns.
Artifacts / Notes:

Backend logic to query user profile attributes and prior likes.

Algorithm weights shared tags/interests and prioritizes recently active users.

Testing via mock user data sets to ensure balanced recommendations.

R25 – Chatbot Integration (OpenAI API)

Description:
Integrate a simple chatbot assistant to help users navigate the app or break the ice in conversations.
Artifacts / Notes:

Endpoint connection to OpenAI API with rate limiting and basic prompt control.

Frontend chatbot button within Messages tab.

Testing includes response latency and sanitization of API outputs.

R26 – Premium Membership Plan

Description:
Implement a premium subscription option with expanded features (e.g., see who liked you, unlimited likes).
Artifacts / Notes:

Payment integration mock via Stripe sandbox API.

New database fields: is_premium, subscription_expiration.

UI indicator and premium badge on profile header.

R27 – Block / Report Feature

Description:
Enable users to block or report inappropriate profiles to improve safety and moderation.
Artifacts / Notes:

Backend tables: blocked_users, reports.

Endpoint: POST /reports with report_type and optional message.

Frontend button within chat and profile views; confirmation dialogs.

R28 – Responsive UI and Accessibility Improvements

Description:
Enhance the overall user interface to meet mobile responsiveness and ADA accessibility guidelines.
Artifacts / Notes:

Added ARIA labels and keyboard navigation support.

CSS media queries for mobile/tablet viewports (375 px and 768 px).

Conducted contrast ratio and screen reader tests on key pages.

R29 – Onboarding and Tooltip Flow

Description:
Create a guided onboarding experience to help new users understand key features.
Artifacts / Notes:

Step-by-step tutorial using Angular intro library.

Tooltip overlays for “Like”, “Match”, and “Chat” features.

Testing with new accounts to ensure tooltips appear only once.

Deliverables

Updated Requirements Stack (Project 3_Requirements.xlsx) reflecting Sprint 3 requirements.

Sprint3_Requirements_Artifact.md (this document).

Functional matchmaking and chatbot features implemented in backend and frontend.

Test evidence folder with screenshots and Postman requests.