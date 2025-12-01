/*
Name: chat-window.component.ts
Description: HTML and Javascript for creating and interacting with a chat window
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 2 (fix frontend bugs)
Pre/Post Conditions: Website should display proper chat window. Chat should correctly interact with backend
Errors: None
*/

import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ChatMessage, ChatService } from '../../services/chat.service';
import { ProfileService, ProfileDto } from '../../services/profile.service';
import { MatchService, MatchDto } from '../../services/match.service';

//define component for the chat window
//define all inline html for displaying it
//html assited by gemini AI
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
            <div class="avatar">
              <img *ngIf="c.photoUrl; else emojiTpl" [src]="c.photoUrl" [alt]="c.name + ' photo'">
              <ng-template #emojiTpl>{{ c.emoji }}</ng-template>
            </div>
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
            <div class="actions">
              <button class="view-profile-btn" (click)="openPeerProfile()" [disabled]="!peerId">View Profile</button>
            </div>
          </div>

          <div class="chat-body" #scrollContainer>
            <div *ngIf="!peerId" class="empty-state">
              <ng-container *ngIf="contacts.length; else noMatchesTpl">
                <div class="card">
                  <h4>Select someone from the left to start</h4>
                  <p>Choose a contact to load your past messages.</p>
                </div>
              </ng-container>
              <ng-template #noMatchesTpl>
                <div class="card" style="color:#111827;">
                  <h4 style="color:#111827;">Match with someone to start a chat!</h4>
                  <p style="color:#111827;">Use the Discover tab to like other KU students. Once you both like each other, your match will appear here.</p>
                </div>
              </ng-template>
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
              name="draft">
            <button type="submit" class="send-btn" [disabled]="!canSend()">Send</button>
          </form>

          <div class="profile-panel-backdrop" *ngIf="showProfilePanel" (click)="closePeerProfile()"></div>
          <div class="profile-panel" *ngIf="showProfilePanel">
            <div class="panel-header">
              <div class="panel-title">Profile</div>
              <button class="panel-close" (click)="closePeerProfile()">✕</button>
            </div>
            <div class="panel-body" *ngIf="peerProfileLoading">Loading…</div>
            <div class="panel-body" *ngIf="!peerProfileLoading && peerProfile">
              <div class="profile-header">
                <div class="profile-photo" *ngIf="peerProfilePhotoUrl">
                  <img [src]="peerProfilePhotoUrl" alt="Profile photo">
                </div>
                <div class="profile-name">
                  <h4>{{ peerProfile?.name || ('User ' + peerProfile?.user_id) }}</h4>
                  <div class="profile-subtle" *ngIf="peerProfile?.year || peerProfile?.major">
                    <span *ngIf="peerProfile?.year">{{ peerProfile?.year }}</span>
                    <span *ngIf="peerProfile?.year && peerProfile?.major"> • </span>
                    <span *ngIf="peerProfile?.major">{{ peerProfile?.major }}</span>
                  </div>
                </div>
              </div>

              <div class="details-grid">
                <div class="detail" *ngIf="peerProfile?.age != null">
                  <div class="label">Age</div>
                  <div class="value">{{ peerProfile?.age }}</div>
                </div>
                <div class="detail" *ngIf="peerProfile?.year">
                  <div class="label">Year</div>
                  <div class="value">{{ peerProfile?.year }}</div>
                </div>
                <div class="detail" *ngIf="peerProfile?.major">
                  <div class="label">Major</div>
                  <div class="value">{{ peerProfile?.major }}</div>
                </div>
                <div class="detail" *ngIf="peerProfile?.gender">
                  <div class="label">Gender</div>
                  <div class="value">{{ peerProfile?.gender }}</div>
                </div>
              </div>

              <div class="bio" *ngIf="peerProfile?.bio">
                {{ peerProfile?.bio }}
              </div>

              <div class="interests" *ngIf="peerProfile?.interests?.length">
                <span class="chip" *ngFor="let tag of peerProfile?.interests">{{ tag }}</span>
              </div>
            </div>
            <div class="panel-body error" *ngIf="!peerProfileLoading && peerProfileError">{{ peerProfileError }}</div>
          </div>
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
    /* Allow inner grid children to shrink so the message pane can scroll */
    .conversation { min-height: 0; }
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
    .contact.active { background: var(--blue-50); }
    .avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; background: #f3f4f6; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
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
      /* Critical for nested grid scroll */
      min-height: 0;
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
      margin: 0; color: var(--primary);
    }
    .actions { display: flex; align-items: center; gap: 8px; }
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
    .view-profile-btn {
      padding: 8px 12px;
      border: 2px solid #000000;
      background: transparent;
      color: #000000;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }
    .view-profile-btn:hover { background: #000000; color: #ffffff; }
    .view-profile-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .chat-body {
      overflow-y: auto;
      padding: 16px;
      background: #f8fafc;
      /* Ensure the scrolling area can actually shrink inside grid */
      min-height: 0;
    }
    .chat-shell { position: relative; }
    .profile-panel-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.2);
    }
    .profile-panel {
      position: absolute;
      top: 56px;
      right: 12px;
      width: 320px;
      max-height: calc(100% - 72px);
      overflow: auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      z-index: 1;
    }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-bottom: 1px solid #eef2f7; background: #f9fafb; border-top-left-radius: 12px; border-top-right-radius: 12px;
    }
    .panel-title { font-weight: 700; color: #6d28d9; }
    .panel-close { background: transparent; border: none; cursor: pointer; font-size: 16px; color: #6b7280; }
    .panel-body { padding: 12px; }
    .panel-body.error { color: #b91c1c; }
    .profile-header { display: grid; grid-template-columns: 96px 1fr; gap: 12px; align-items: center; margin-bottom: 12px; }
    .profile-photo { width: 96px; height: 96px; overflow: hidden; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; }
    .profile-photo img { width: 100%; height: 100%; object-fit: cover; }
    .profile-name h4 { margin: 0 0 4px 0; color: #111827; }
    .profile-subtle { color: #6b7280; font-size: 0.9rem; }

    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .detail { background: #f9fafb; border: 1px solid #eef2f7; border-radius: 10px; padding: 8px 10px; }
    .detail .label { font-size: 0.75rem; color: #6b7280; margin-bottom: 2px; }
    .detail .value { font-weight: 600; color: #111827; }

    .bio { background: #fff; border: 1px solid #eef2f7; border-radius: 10px; padding: 10px; color: #374151; margin-bottom: 12px; white-space: pre-wrap; }

    .interests { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { background: var(--blue-50); color: var(--primary); border: 1px solid var(--blue-200); padding: 4px 8px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
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
      background: var(--blue-50);
      border-color: var(--blue-200);
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
      background: linear-gradient(135deg, var(--primary), #1E66D0); color: white; font-weight: 600;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})

//define methods for initiating and deleting the chat window component
//store relevant data like is connected, ids, and messages
export class ChatWindowComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  meId: number = 0;
  peerId: number | null = null;
  connected = false;
  messages: ChatMessage[] = [];
  draft = '';

  // Profile panel state
  showProfilePanel = false;
  peerProfile: ProfileDto | null = null;
  peerProfilePhotoUrl: string | null = null;
  peerProfileLoading = false;
  peerProfileError = '';

  private subs: Subscription[] = [];

  contacts: Array<{ id: number; name: string; emoji: string; photoUrl?: string | null }> = [];
  lastMessage: { [id: number]: { content: string; timestamp: number } } = {};
  loadingContacts = false;
  contactsError = '';

  constructor(
    private chat: ChatService,
    private router: Router,
    private profiles: ProfileService,
    private matches: MatchService
  ) { }

  ngOnInit(): void {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      this.router.navigate(['/login']);
      return;
    }
    this.meId = parseInt(storedUserId, 10);
    this.loadContactsFromMatches();

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
  }

  //load contacts only from matched users
  private loadContactsFromMatches(): void {
    this.loadingContacts = true;
    this.contactsError = '';
    this.contacts = [];
    this.matches.listMatches(this.meId).subscribe({
      next: (list: MatchDto[]) => {
        const ids = Array.from(new Set(list.map(m => m.matched_user_id)));
        if (!ids.length) {
          this.loadingContacts = false;
          return;
        }
        forkJoin(ids.map(id => this.profiles.getProfile(id))).subscribe({
          next: profiles => {
            this.contacts = profiles.map(p => {
              const photoUrl = p.profile_picture ? this.profiles.profilePictureUrl(p.user_id) : null;
              return {
                id: p.user_id,
                name: p.name || 'User ' + p.user_id,
                emoji: this.getEmojiForUser(p),
                photoUrl
              };
            });

            const storedPeer = localStorage.getItem('initial_chat_peer_id');
            let targetId: number | null = null;
            if (storedPeer) {
              const n = Number(storedPeer);
              targetId = Number.isFinite(n) ? n : null;
            }

            if (targetId && this.contacts.some(c => c.id === targetId)) {
              this.selectPeer(targetId);
            } else if (this.contacts.length) {
              this.selectPeer(this.contacts[0].id);
            }
            localStorage.removeItem('initial_chat_peer_id');

            this.loadingContacts = false;
          },
          error: () => {
            this.contactsError = 'Failed to load matched profiles.';
            this.loadingContacts = false;
          }
        });
      },
      error: () => {
        this.contactsError = 'Failed to load matches.';
        this.loadingContacts = false;
      }
    });
  }

  private getEmojiForUser(profile: ProfileDto): string {
    const emojis = ['👤', '😊', '🎓', '💼', '🎨', '🔬', '⚡', '🌟', '🎯', '🚀'];
    const hash = profile.user_id % emojis.length;
    return emojis[hash];
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

    // If we were asked to auto-open the profile panel for this peer (from Matches tab)
    const shouldOpenProfile = localStorage.getItem('initial_chat_open_profile') === '1';
    if (shouldOpenProfile) {
      localStorage.removeItem('initial_chat_open_profile');
      this.openPeerProfile();
      return;
    }

    if (this.showProfilePanel) {
      this.openPeerProfile(); // refresh panel to new peer if open
    }
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

  openPeerProfile(): void {
    if (!this.peerId) { return; }
    this.showProfilePanel = true;
    this.peerProfileLoading = true;
    this.peerProfileError = '';
    this.peerProfile = null;
    this.peerProfilePhotoUrl = null;
    this.profiles.getProfile(this.peerId).subscribe({
      next: (p) => {
        this.peerProfile = p;
        if (p && p.profile_picture) {
          this.peerProfilePhotoUrl = this.profiles.profilePictureUrl(p.user_id);
        } else {
          this.peerProfilePhotoUrl = null;
        }
        this.peerProfileLoading = false;
      },
      error: () => {
        this.peerProfileLoading = false;
        this.peerProfileError = 'Failed to load profile.';
      }
    });
  }

  closePeerProfile(): void {
    this.showProfilePanel = false;
  }

  canSend(): boolean {
    return !!this.peerId && !!this.draft.trim();
  }

  send(): void {
    if (!this.canSend() || this.peerId == null) return;
    const content = this.draft.trim();
    const sender = this.meId;
    const receiver = this.peerId;
    this.chat.sendText(sender, receiver, content).subscribe({
      next: () => {
        // Message will appear once via websocket echo in incomingMessages()
        this.draft = '';
      },
      error: () => {
        alert('Failed to send message. Please try again.');
      }
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