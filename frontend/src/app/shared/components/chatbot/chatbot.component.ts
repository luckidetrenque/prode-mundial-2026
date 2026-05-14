import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../../core/services/chatbot.service';

interface Message {
  text: string;
  type: 'user' | 'bot';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  userMessage = '';
  isLoading = false;
  messages: Message[] = [
    { text: '¡Hola! Soy tu asistente de Prode 2026. ¿En qué puedo ayudarte hoy?', type: 'bot' }
  ];

  constructor(private chatbotService: ChatbotService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }, 0);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  contactAdmin() {
    window.location.href = 'mailto:proyectos.lucho.tati@gmail.com?subject=Consulta Prode 2026';
  }

  sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    const userText = this.userMessage;
    this.messages.push({ text: userText, type: 'user' });
    this.userMessage = '';
    this.isLoading = true;

    this.chatbotService.ask(userText).subscribe({
      next: (res) => {
        this.messages.push({ text: res.response, type: 'bot' });
        this.isLoading = false;
      },
      error: (err) => {
        this.messages.push({ 
          text: 'Lo siento, no puedo responder en este momento. Por favor, verifica tu conexión o intenta más tarde.', 
          type: 'bot' 
        });
        this.isLoading = false;
        console.error('Chatbot error:', err);
      }
    });
  }
}
