import { Component, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private chatbotService: ChatbotService, 
    private cdr: ChangeDetectorRef
  ) {}

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

  sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    const userText = this.userMessage;
    this.messages.push({ text: userText, type: 'user' });
    this.userMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges(); // fuerza el render del loading

    this.chatbotService.ask(userText).subscribe({
      next: (res) => {
        this.messages.push({ text: res.response, type: 'bot' });
        this.isLoading = false;
        this.cdr.detectChanges(); // fuerza el render de la respuesta
      },
      error: (err) => {
        this.messages.push({ 
          text: 'Lo siento, no puedo responder en este momento.', 
          type: 'bot' 
        });
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Chatbot error:', err);
      }
    });
  }
}
