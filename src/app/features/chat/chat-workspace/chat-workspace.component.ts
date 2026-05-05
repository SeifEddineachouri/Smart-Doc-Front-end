import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AiAnswerCard, AskQuestionRequest, ChatHistoryItem, ChatSession, UploadedDocument } from '../../../core/models';
import { AiService } from '../../../core/api/ai.service';
import { AuthService } from '../../../core/api/auth.service';
import { DocumentService } from '../../../core/api/document.service';
import { SessionService } from '../../../core/api/session.service';
import { AuthStore } from '../../../core/state/auth.store';

@Component({
  selector: 'app-chat-workspace',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './chat-workspace.component.html',
  styleUrl: './chat-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWorkspaceComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);
  private readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);
  private readonly documentService = inject(DocumentService);
  private readonly sessionService = inject(SessionService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = new FormBuilder();
  private readonly historySize = 20;
  protected readonly activeSessionId = signal<string | null>(null);

  protected readonly isAuthenticated = this.authStore.isAuthenticated;
  protected readonly isSigningOut = signal(false);
  protected readonly isDragOver = signal(false);
  protected readonly isAsking = signal(false);
  protected readonly pendingUploadsCount = signal(0);
  protected readonly uploadedDocuments = signal<UploadedDocument[]>([]);
  protected readonly sessionDocumentIds = signal<number[]>([]);
  protected readonly sessions = signal<ChatSession[]>([]);
  protected readonly isSessionsLoading = signal(false);
  protected readonly sessionsError = signal<string | null>(null);
  protected readonly selectedDocuments = computed(() => {
    const ids = new Set(this.sessionDocumentIds());
    return this.uploadedDocuments().filter((doc) => ids.has(doc.id));
  });
  protected readonly isUploadInProgress = computed(() => this.pendingUploadsCount() > 0);
  protected readonly aiAnswers = signal<AiAnswerCard[]>([]);
  protected readonly askError = signal<string | null>(null);
  protected readonly isHistoryLoading = signal(false);
  protected readonly isHistoryLoadingMore = signal(false);
  protected readonly historyError = signal<string | null>(null);
  protected readonly historyItems = signal<ChatHistoryItem[]>([]);
  protected readonly historyPage = signal(0);
  protected readonly historyTotalPages = signal(0);
  protected readonly hasMoreHistory = computed(() => this.historyPage() + 1 < this.historyTotalPages());

  protected readonly questionForm = this.fb.nonNullable.group({
    question: ['', [Validators.required, Validators.minLength(8)]]
  });

  public ngOnInit(): void {
    this.loadSessions();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    this.addFiles(event.dataTransfer?.files ?? null);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files);
    input.value = '';
  }

  protected removeDocument(id: number): void {
    this.uploadedDocuments.update((documents) => documents.filter((doc) => doc.id !== id));
    this.sessionDocumentIds.update((ids) => ids.filter((docId) => docId !== id));
  }

  protected askAi(): void {
    this.questionForm.markAllAsTouched();
    this.askError.set(null);

    const sessionId = this.requireActiveSessionId();
    if (!sessionId) {
      return;
    }

    if (this.isUploadInProgress()) {
      this.askError.set(this.translate.instant('chat.form.waitUpload'));
      return;
    }

    if (this.questionForm.invalid || this.selectedDocuments().length === 0) {
      return;
    }

    this.isAsking.set(true);

    const request = this.buildAskRequest();

    this.aiService.askQuestion(request, sessionId).subscribe({
      next: (response) => {
        this.aiAnswers.set(response.answers ?? []);
        this.touchActiveSession(request.question);
        this.loadHistory(0, false, sessionId);
        this.isAsking.set(false);
      },
      error: (error: unknown) => {
        this.askError.set(this.extractApiErrorMessage(error));
        this.isAsking.set(false);
      }
    });
  }

  protected loadMoreHistory(): void {
    if (!this.hasMoreHistory() || this.isHistoryLoadingMore()) {
      return;
    }
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      return;
    }

    this.loadHistory(this.historyPage() + 1, true, sessionId);
  }

  protected formatHistoryDate(createdAt: string): string {
    const timestamp = Date.parse(createdAt);

    if (Number.isNaN(timestamp)) {
      return createdAt;
    }

    return formatDate(timestamp, 'medium', this.locale);
  }

  protected signOut(): void {
    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);

    this.authService.signout().subscribe({
      next: () => this.finalizeSignOut(),
      error: () => this.finalizeSignOut()
    });
  }

  protected startNewSession(): void {
    this.createSession();
  }

  protected selectSession(session: ChatSession): void {
    if (this.activeSessionId() === session.id) {
      return;
    }

    this.activeSessionId.set(session.id);
    this.resetSessionState();
    this.loadDocuments(session.id);
    this.loadHistory(0, false, session.id);
  }

  protected archiveSession(session: ChatSession, event?: Event): void {
    event?.stopPropagation();
    this.sessionsError.set(null);

    this.sessionService.archive(session.id).subscribe({
      next: () => {
        this.sessions.update((items) => items.filter((item) => item.id !== session.id));

        if (this.activeSessionId() === session.id) {
          const remaining = this.sessions();
          if (remaining.length > 0) {
            this.selectSession(remaining[0]);
          } else {
            this.createSession();
          }
        }
      },
      error: (error: unknown) => {
        this.sessionsError.set(this.extractApiErrorMessage(error));
      }
    });
  }

  private addFiles(files: FileList | null): void {
    if (!files || files.length === 0) {
      return;
    }

    const sessionId = this.requireActiveSessionId();
    if (!sessionId) {
      return;
    }

    this.askError.set(null);
    this.pendingUploadsCount.update((count) => count + files.length);

    Array.from(files).forEach((file) => {
      this.documentService
        .upload(file, sessionId)
        .pipe(
          finalize(() => {
            if (sessionId !== this.activeSessionId()) {
              return;
            }

            this.pendingUploadsCount.update((count) => Math.max(0, count - 1));
          })
        )
        .subscribe({
          next: (uploaded) => this.handleUploadSuccess(uploaded, sessionId),
          error: (error: unknown) => this.handleUploadError(error, sessionId)
        });
    });
  }

  private loadSessions(): void {
    this.sessionsError.set(null);
    this.isSessionsLoading.set(true);

    this.sessionService.list().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.isSessionsLoading.set(false);

        const activeId = this.activeSessionId();
        if (activeId && sessions.some((session) => session.id === activeId)) {
          return;
        }

        if (sessions.length > 0) {
          this.selectSession(sessions[0]);
        } else {
          this.createSession();
        }
      },
      error: (error: unknown) => {
        this.sessionsError.set(this.extractApiErrorMessage(error));
        this.isSessionsLoading.set(false);
      }
    });
  }

  private createSession(): void {
    this.sessionsError.set(null);

    this.sessionService.create().subscribe({
      next: (session) => {
        this.sessions.update((items) => [session, ...items]);
        this.selectSession(session);
      },
      error: (error: unknown) => {
        this.sessionsError.set(this.extractApiErrorMessage(error));
      }
    });
  }

  private loadDocuments(sessionId: string): void {
    this.documentService.list(sessionId).subscribe({
      next: (documents) => {
        if (this.activeSessionId() !== sessionId) {
          return;
        }

        this.uploadedDocuments.set(documents);
        this.sessionDocumentIds.set(documents.map((doc) => doc.id));
      },
      error: (error: unknown) => {
        if (this.activeSessionId() !== sessionId) {
          return;
        }

        this.askError.set(this.extractApiErrorMessage(error));
      }
    });
  }

  private resetSessionState(): void {
    this.pendingUploadsCount.set(0);
    this.uploadedDocuments.set([]);
    this.sessionDocumentIds.set([]);
    this.aiAnswers.set([]);
    this.askError.set(null);
    this.isDragOver.set(false);
    this.isHistoryLoading.set(false);
    this.isHistoryLoadingMore.set(false);
    this.historyError.set(null);
    this.historyItems.set([]);
    this.historyPage.set(0);
    this.historyTotalPages.set(0);
    this.questionForm.reset({ question: '' });
  }

  private requireActiveSessionId(): string | null {
    const sessionId = this.activeSessionId();

    if (!sessionId) {
      this.askError.set(this.translate.instant('chat.sessions.noActive'));
      return null;
    }

    return sessionId;
  }

  private touchActiveSession(question: string): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      return;
    }

    this.sessions.update((items) => {
      const updatedAt = new Date().toISOString();
      const updated = items.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              lastQuestion: question,
              updatedAt
            }
          : session
      );

      return [...updated].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });
  }

  private handleUploadSuccess(uploaded: UploadedDocument, sessionId: string): void {
    if (sessionId !== this.activeSessionId()) {
      return;
    }

    this.uploadedDocuments.update((documents) => {
      if (documents.some((doc) => doc.id === uploaded.id)) {
        return documents;
      }

      return [uploaded, ...documents];
    });

    this.sessionDocumentIds.update((ids) => {
      if (ids.includes(uploaded.id)) {
        return ids;
      }

      return [uploaded.id, ...ids];
    });
  }

  private handleUploadError(error: unknown, sessionId: string): void {
    if (sessionId !== this.activeSessionId()) {
      return;
    }

    this.askError.set(this.extractApiErrorMessage(error));
  }

  private buildAskRequest(): AskQuestionRequest {
    return {
      question: this.questionForm.getRawValue().question,
      documents: this.selectedDocuments()
    };
  }

  private extractApiErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const backendMessage = (error as { error?: { message?: unknown } }).error?.message;

      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }

      const message = (error as { message?: unknown }).message;

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return this.translate.instant('chat.form.askError');
  }

  private loadHistory(page: number, append: boolean, sessionId: string): void {
    this.historyError.set(null);

    if (append) {
      this.isHistoryLoadingMore.set(true);
    } else {
      this.isHistoryLoading.set(true);
    }

    this.aiService.getHistory(page, this.historySize, sessionId).subscribe({
      next: (response) => {
        if (this.activeSessionId() !== sessionId) {
          return;
        }

        this.historyPage.set(response.page);
        this.historyTotalPages.set(response.totalPages);

        if (append) {
          this.historyItems.update((items) => [...items, ...response.items]);
        } else {
          this.historyItems.set(response.items);
        }

        this.isHistoryLoading.set(false);
        this.isHistoryLoadingMore.set(false);
      },
      error: () => {
        if (this.activeSessionId() !== sessionId) {
          return;
        }

        this.historyError.set(this.translate.instant('chat.history.loadError'));
        this.isHistoryLoading.set(false);
        this.isHistoryLoadingMore.set(false);
      }
    });
  }

  private finalizeSignOut(): void {
    this.authStore.clearSession();
    this.isSigningOut.set(false);
    this.router.navigate(['/sign-in']);
  }
}
