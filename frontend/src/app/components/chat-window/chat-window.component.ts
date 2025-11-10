import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatMessage, ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-window',
  template: `
    <div class="chat-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="left">
            <span class="emoji">💬</span>
            <span class="label">Messages</span>
          </div>
        </div>

        <div class="contact-list">
          <button
            class="contact"
            *ngFor="let c of contacts"
            [class.active]="peerId === c.id"
            (click)="selectPeer(c.id)"
          >
            <div class="avatar">{{ c.emoji }}</div>
            <div class="meta">
              <div class="name">{{ c.name }}</div>
              <div class="preview">{{ lastMessage[c.id]?.content || 'Start a conversation' }}</div>
            </div>
            <div class="time" *ngIf="lastMessage[c.id]">{{ shortTime(lastMessage[c.id].timestamp) }}</div>
          </button>
        </div>
      </aside>

      <section class="conversation">
        <div class="chat-shell">
          <div class="chat-header">
            <div class="title">
              <span class="emoji">{{ activeContact?.emoji || '💬' }}</span>
              <h3>{{ activeContact?.name || 'Chat' }}</h3>
            </div>
            <span class="status" [class.online]="connected" [class.offline]="!connected">
              {{ connected ? 'Online' : 'Offline' }}
            </span>
          </div>

          <div class="chat-body" #scrollContainer>
            <div *ngIf="!peerId" class="empty-state">
              <div class="card">
                <h4>Select someone from the left to start</h4>
                <p>Choose a contact to load your past messages.</p>
              </div>
            </div>

            <div *ngIf="peerId" class="messages">
              <div 
                class="message" 
                *ngFor="let m of messages"
                [class.me]="m.sender_id === meId"
                [class.them]="m.sender_id !== meId">
                <div class="bubble">
                  <div class="content">{{ m.content }}</div>
                  <div class="meta">
                    <span>{{ formatTime(m.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form class="chat-input" (ngSubmit)="send()" *ngIf="peerId">
            <input 
              type="text" 
              placeholder="Type a message…" 
              [(ngModel)]="draft" 
              name="draft"
              (keydown.enter)="send()">
            <button type="submit" class="send-btn" [disabled]="!canSend()">Send</button>
          </form>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .chat-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 16px;
      height: 70vh;
      max-width: 1100px;
      margin: 0 auto;
    }
    .sidebar {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #eef2f7;
      background: #f9fafb;
    }
    .sidebar-header .left { display: flex; align-items: center; gap: 8px; }
    .sidebar-header .label { font-weight: 600; color: #374151; }
    .contact-list {
      overflow-y: auto;
    }
    .contact {
      width: 100%;
      display: grid;
      grid-template-columns: 36px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      text-align: left;
    }
    .contact:hover { background: #f9fafb; }
    .contact.active { background: #eef2ff; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #f3f4f6; }
    .meta .name { font-weight: 600; color: #111827; }
    .meta .preview { font-size: 0.85rem; color: #6b7280; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .time { font-size: 0.75rem; color: #6b7280; }

    .chat-shell {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: 100%;
    }
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #eef2f7;
      background: #f9fafb;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    }
    .title {
      display: flex; align-items: center; gap: 8px;
    }
    .title h3 {
      margin: 0; color: #6d28d9;
    }
    .ids {
      display: flex; align-items: center; gap: 12px;
    }
    .ids label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.9rem; color: #374151;
    }
    .ids input {
      width: 80px;
      padding: 6px 8px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
    }
    .status {
      font-size: 0.8rem;
      padding: 4px 8px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #6b7280;
    }
    .status.online { background: #dcfce7; color: #166534; }
    .status.offline { background: #fee2e2; color: #991b1b; }
    .chat-body {
      overflow-y: auto;
      padding: 16px;
      background: #f8fafc;
    }
    .empty-state .card {
      max-width: 520px; margin: 48px auto;
      background: white; border-radius: 12px; padding: 24px;
      border: 1px solid #e5e7eb; text-align: center;
    }
    .messages {
      display: flex; flex-direction: column; gap: 10px;
    }
    .message {
      display: flex; max-width: 80%;
    }
    .message.me { align-self: flex-end; justify-content: flex-end; }
    .message.them { align-self: flex-start; justify-content: flex-start; }
    .bubble {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 8px 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .message.me .bubble {
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    .content { color: #111827; white-space: pre-wrap; }
    .meta {
      font-size: 0.75rem; color: #6b7280; margin-top: 4px; text-align: right;
    }
    .chat-input {
      display: grid; grid-template-columns: 1fr auto; gap: 8px;
      padding: 12px; border-top: 1px solid #eef2f7;
    }
    .chat-input input[type="text"] {
      padding: 12px 14px; border: 2px solid #e5e7eb; border-radius: 10px;
      font-size: 1rem;
    }
    .send-btn {
      padding: 0 18px; border: none; border-radius: 10px; cursor: pointer;
      background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; font-weight: 600;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  meId: number = 0;
  peerId: number | null = null;
  connected = false;
  messages: ChatMessage[] = [];
  draft = '';

  private subs: Subscription[] = [];

  contacts = [
    { id: 2, name: 'Emma', emoji: '👩‍💻' },
    { id: 3, name: 'Alex', emoji: '🏀' },
    { id: 4, name: 'Sarah', emoji: '🧘' },
    { id: 5, name: 'Jake', emoji: '🛠️' },
    { id: 6, name: 'Maya', emoji: '📝' }
  ];
  lastMessage: { [id: number]: { content: string; timestamp: number } } = {};

  constructor(private chat: ChatService, private router: Router) { }

  ngOnInit(): void {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      this.router.navigate(['/login']);
      return;
    }
    this.meId = parseInt(storedUserId, 10);

    this.chat.connect(this.meId);
    this.subs.push(
      this.chat.isConnected().subscribe(v => this.connected = v),
      this.chat.incomingMessages().subscribe(m => {
        const otherId = m.sender_id === this.meId ? m.receiver_id : m.sender_id;
        if (this.contacts.some(c => c.id === otherId)) {
          this.lastMessage[otherId] = { content: m.content, timestamp: m.timestamp };
        }
        if (this.peerId && (m.sender_id === this.peerId || m.receiver_id === this.peerId)) {
          this.messages.push(m);
          this.scrollToBottomSoon();
        }
      })
    );
    if (this.contacts.length) {
      this.selectPeer(this.contacts[0].id);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onMeChange(): void {
    this.chat.connect(this.meId);
    this.messages = [];
    if (this.peerId) {
      this.loadHistory();
    }
  }

  get activeContact() {
    return this.contacts.find(c => c.id === this.peerId) || null;
  }

  selectPeer(id: number): void {
    if (this.peerId === id) return;
    this.peerId = id;
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.peerId) {
      this.messages = [];
      return;
    }
    this.chat.fetchHistory(this.meId, this.peerId, 100).subscribe(list => {
      this.messages = list;
      if (list.length) {
        const last = list[list.length - 1];
        this.lastMessage[this.peerId!] = { content: last.content, timestamp: last.timestamp };
      }
      this.scrollToBottomSoon();
    });
  }

  canSend(): boolean {
    return !!this.peerId && !!this.draft.trim();
  }

  send(): void {
    if (!this.canSend() || this.peerId == null) return;
    const content = this.draft.trim();
    const sender = this.meId;
    const receiver = this.peerId;
    this.chat.sendText(sender, receiver, content).subscribe(res => {
      const ts = res?.timestamp ?? Date.now();
      this.messages.push({
        sender_id: sender,
        receiver_id: receiver,
        content,
        timestamp: ts
      });
      this.lastMessage[receiver] = { content, timestamp: ts };
      this.draft = '';
      this.scrollToBottomSoon();
    });
  }

  formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  shortTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottomSoon(): void {
    setTimeout(() => {
      if (!this.scrollContainer) return;
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 0);
  }
}