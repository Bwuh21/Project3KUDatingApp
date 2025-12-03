/*
Name: chat_service.ts
Description: Javascript for authenticating against the server
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: interacts with the chat window and the backend. Allows users to send messages and retrieve messages from server tables
Errors: None
*/

// Import Angular injectable decorator for dependency injection
import { Injectable } from '@angular/core';
// Import HTTP client for making API requests
import { HttpClient } from '@angular/common/http';
// Import RxJS observables and operators for reactive programming
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';

// Define structure for holding a chat message
export interface ChatMessage {
  id?: number;          // Optional message ID
  sender_id: number;    // ID of the user who sent the message
  receiver_id: number;  // ID of the user who receives the message
  content: string;      // Text content of the message
  timestamp: number;    // Unix timestamp when message was sent
}

// Define websocket envelope structure for message wrapping
interface WsEnvelope {
  type: 'message' | 'system' | 'pong';  // Type of websocket message
  payload: any;                          // Payload data
}

// Define chat service component with websocket metadata
// Handles real-time messaging via WebSocket and HTTP
@Injectable({ providedIn: 'root' })
export class ChatService {
  // Base URL for HTTP API requests
  private readonly httpBase = 'https://api.jaymatch.cc';
  // WebSocket connection instance
  private websocket: WebSocket | null = null;
  // Observable for connection status (true if connected)
  private isConnected$ = new BehaviorSubject<boolean>(false);
  // Subject for incoming chat messages
  private incoming$ = new Subject<ChatMessage>();
  // Subject for system messages
  private system$ = new Subject<string>();
  // Current user ID
  private meId: number | null = null;

  // Constructor - injects HttpClient for making HTTP requests
  constructor(private http: HttpClient) { }

  // Function for connecting to the websocket
  // Should keep the websocket alive and handle graceful disconnects
  connect(userId: number): void {
    // If already connected with same user ID, don't reconnect
    if (this.websocket && this.isConnected$.value && this.meId === userId) {
      return;
    }
    // Disconnect any existing connection
    this.disconnect();
    // Set current user ID
    this.meId = userId;
    // Create WebSocket URL for user
    const wsUrl = `wss://api.jaymatch.cc/ws/${userId}`;
    // Create new WebSocket connection
    const ws = new WebSocket(wsUrl);
    this.websocket = ws;

    // Handle WebSocket connection opened
    ws.onopen = () => {
      // Update connection status
      this.isConnected$.next(true);
      // Keepalive ping - send ping every 25 seconds (starting after 10 seconds)
      timer(10000, 25000).subscribe(() => {
        this.sendWs({ type: 'ping', payload: {} });
      });
    };
    // Handle incoming WebSocket messages
    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        // Parse JSON message
        const data: WsEnvelope = JSON.parse(event.data);
        // Handle message type
        if (data.type === 'message') {
          // Extract chat message from payload
          const m = data.payload as ChatMessage;
          // Emit incoming message
          this.incoming$.next(m);
        } else if (data.type === 'system') {
          // Emit system message
          this.system$.next(String(data.payload));
        }
      } catch {
        // Ignore raw text or unexpected payload
      }
    };
    // Handle WebSocket connection closed
    ws.onclose = () => {
      // Update connection status
      this.isConnected$.next(false);
      // Clear websocket reference
      this.websocket = null;
    };
    // Handle WebSocket errors
    ws.onerror = () => {
      // Update connection status
      this.isConnected$.next(false);
    };
  }

  // Function for disconnecting from the chat webservice
  disconnect(): void {
    if (this.websocket) {
      try {
        // Close websocket connection
        this.websocket.close();
      } catch { }
      // Clear websocket reference
      this.websocket = null;
    }
    // Update connection status
    this.isConnected$.next(false);
  }

  // Check if websocket is connected
  // Returns Observable that emits connection status
  isConnected(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  // Retrieve incoming messages
  // Returns Observable that emits chat messages as they arrive
  incomingMessages(): Observable<ChatMessage> {
    return this.incoming$.asObservable();
  }

  // Get system messages
  // Returns Observable that emits system messages
  systemMessages(): Observable<string> {
    return this.system$.asObservable();
  }

  // Get message history from server
  // GET request to /messages/{a}/{b} endpoint
  // Returns sorted array of messages between two users
  fetchHistory(a: number, b: number, limit = 100): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.httpBase}/messages/${a}/${b}?limit=${limit}`).pipe(
      // Sort messages by timestamp (oldest first)
      map(list =>
        list
          .slice()  // Create copy of array
          .sort((x, y) => x.timestamp - y.timestamp)
      )
    );
  }

  // Send a text message to server
  // POST request to /messages endpoint
  // Stores message in database and delivers via WebSocket
  sendText(senderId: number, receiverId: number, content: string): Observable<{ success: boolean; timestamp: number }> {
    return this.http.post<{ success: boolean; timestamp: number }>(`${this.httpBase}/messages`, {
      sender_id: senderId,
      receiver_id: receiverId,
      content
    });
  }

  // Stream messages for a specific peer
  // Filters incoming messages to only those involving the specified peer
  streamForPeer(peerId: number): Observable<ChatMessage> {
    return this.incoming$.pipe(
      // Filter messages where peer is sender or receiver
      filter(m => this.meId != null && (m.sender_id === peerId || m.receiver_id === peerId))
    );
  }

  // Forward message to websocket
  // Private helper method to send data through WebSocket
  private sendWs(payload: any) {
    // Only send if websocket exists and is open
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      // Stringify and send payload
      this.websocket.send(JSON.stringify(payload));
    }
  }
}


