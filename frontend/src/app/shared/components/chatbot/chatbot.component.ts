import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../../core/services/chatbot.service';

// FIX #3: Se eliminó ChangeDetectorRef y CommonModule.
// El componente original usaba:
//   - *ngIf / *ngFor  → directivas legacy que requieren CommonModule
//   - ChangeDetectorRef.detectChanges() → para forzar re-render tras
//     actualizar arrays mutables
//
// Con signals + @if/@for (Angular 17+):
//   - El template reacciona automáticamente a los cambios de signals
//   - No se necesita detectChanges() ni CDR
//   - CommonModule ya no es necesario (el nuevo control flow es built-in)
//   - El código es consistente con el resto de la app

interface Message {
  text: string;
  type: 'user' | 'bot';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen    = signal(false);
  isLoading = signal(false);
  messages  = signal<Message[]>([
    { text: '¡Hola! Soy tu asistente de Prode 2026. ¿En qué puedo ayudarte hoy?', type: 'bot' }
  ]);

  userMessage = '';

  constructor(private chatbotService: ChatbotService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop =
          this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 0);
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
  }

  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.isLoading()) return;

    // Agrega el mensaje del usuario y limpia el input
    this.messages.update(msgs => [...msgs, { text, type: 'user' }]);
    this.userMessage = '';
    this.isLoading.set(true);

    this.chatbotService.ask(text).subscribe({
      next: (res) => {
        this.messages.update(msgs => [...msgs, { text: res.response, type: 'bot' }]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.messages.update(msgs => [
          ...msgs,
          { text: 'Lo siento, no puedo responder en este momento.', type: 'bot' }
        ]);
        this.isLoading.set(false);
        console.error('Chatbot error:', err);
      }
    });
  }
}
