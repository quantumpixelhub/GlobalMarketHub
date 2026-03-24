'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  message: string;
  timestamp: Date;
  category?: string;
  escalated?: boolean;
}

interface ChatbotProps {
  orderId?: string;
  productId?: string;
  className?: string;
}

export const CustomerSupportChatbot: React.FC<ChatbotProps> = ({
  orderId,
  productId,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: `greeting-${Date.now()}`,
        role: 'agent',
        message:
          "👋 Hello! I'm GlobalMarketHub's AI support assistant. How can I help you today? Ask about orders, payments, returns, or anything else!",
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          orderId: orderId || null,
          productId: productId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add agent message
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          message: data.reply || 'Sorry, I could not process your message.',
          timestamp: new Date(),
          category: data.category,
          escalated: data.escalateToHuman,
        };

        setMessages((prev) => [...prev, agentMessage]);

        // Handle escalation
        if (data.escalateToHuman) {
          setIsEscalated(true);
          setTimeout(() => {
            const escalationMsg: Message = {
              id: `escalation-${Date.now()}`,
              role: 'agent',
              message:
                "I'm connecting you with our human support team. You'll be assisted shortly. Our team is available 10 AM - 6 PM daily.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, escalationMsg]);
          }, 1000);
        }
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'agent',
          message:
            'Sorry, I encountered an error. Our human support team will help you shortly.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsEscalated(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'agent',
        message: 'Connection error. Our support team will be in touch soon.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsEscalated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition transform hover:scale-110 z-40 ${className}`}
        title="Open support chat"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          <span className="hidden sm:block font-semibold">Support</span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div
        className={`${
          isEscalated ? 'bg-orange-500' : 'bg-emerald-600'
        } text-white px-4 py-3 rounded-t-lg flex items-center justify-between`}
      >
        <div>
          <h3 className="font-bold text-sm">
            {isEscalated ? '👤 Support Agent' : '🤖 AI Support Assistant'}
          </h3>
          {isEscalated && (
            <p className="text-xs opacity-90">A human agent is assisting you</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setIsEscalated(false);
          }}
          className="hover:bg-white/20 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.message}
              <div
                className={`text-xs mt-1 ${
                  msg.role === 'user'
                    ? 'text-emerald-100'
                    : 'text-gray-500'
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
        {isEscalated && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-2 border border-orange-200">
            ℹ️ You've been escalated to a human agent. Response may take a few minutes.
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || isEscalated}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || isEscalated}
            className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition"
            title="Send message (Enter)"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Available 24/7
        </p>
      </div>
    </div>
  );
};

export default CustomerSupportChatbot;
