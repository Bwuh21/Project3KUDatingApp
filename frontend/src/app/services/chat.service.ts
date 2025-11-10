import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface ChatMessage {
  id?: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp: number;
}

interface WsEnvelope {
  type: 'message' | 'system' | 'pong';
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly httpBase = 'https://api.jaymatch.cc';
  private websocket: WebSocket | null = null;
  private isConnected$ = new BehaviorSubject<boolean>(false);
  private incoming$ = new Subject<ChatMessage>();
  private system$ = new Subject<string>();
  private meId: number | null = null;

  constructor(private http: HttpClient) { }

  connect(userId: number): void {
    if (this.websocket && this.isConnected$.value && this.meId === userId) {
      return;
    }
    this.disconnect();
    this.meId = userId;
    const wsUrl = `wss://api.jaymatch.cc/ws/${userId}`;
    const ws = new WebSocket(wsUrl);
    this.websocket = ws;

    ws.onopen = () => {
      this.isConnected$.next(true);
      // keepalive ping
      timer(10000, 25000).subscribe(() => {
        this.sendWs({ type: 'ping', payload: {} });
      });
    };
    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const data: WsEnvelope = JSON.parse(event.data);
        if (data.type === 'message') {
          const m = data.payload as ChatMessage;
          this.incoming$.next(m);
        } else if (data.type === 'system') {
          this.system$.next(String(data.payload));
        }
      } catch {
        // raw text or unexpected payload; ignore
      }
    };
    ws.onclose = () => {
      this.isConnected$.next(false);
      this.websocket = null;
    };
    ws.onerror = () => {
      this.isConnected$.next(false);
    };
  }

  disconnect(): void {
    if (this.websocket) {
      try {
        this.websocket.close();
      } catch { }
      this.websocket = null;
    }
    this.isConnected$.next(false);
  }

  isConnected(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  incomingMessages(): Observable<ChatMessage> {
    return this.incoming$.asObservable();
  }

  systemMessages(): Observable<string> {
    return this.system$.asObservable();
  }

  fetchHistory(a: number, b: number, limit = 100): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.httpBase}/messages/${a}/${b}?limit=${limit}`).pipe(
      map(list =>
        list
          .slice()
          .sort((x, y) => x.timestamp - y.timestamp)
      )
    );
  }

  sendText(senderId: number, receiverId: number, content: string): Observable<{ success: boolean; timestamp: number }> {
    return this.http.post<{ success: boolean; timestamp: number }>(`${this.httpBase}/messages`, {
      sender_id: senderId,
      receiver_id: receiverId,
      content
    });
  }

  streamForPeer(peerId: number): Observable<ChatMessage> {
    return this.incoming$.pipe(
      filter(m => this.meId != null && (m.sender_id === peerId || m.receiver_id === peerId))
    );
  }

  private sendWs(payload: any) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(payload));
    }
  }
}


