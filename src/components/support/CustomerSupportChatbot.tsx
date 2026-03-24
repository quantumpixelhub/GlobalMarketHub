'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  message: string;
  timestamp: Date;
  category?: string;
  escalated?: boolean;
  isThinking?: boolean;
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
  }, [messages, isLoading]);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: `greeting-${Date.now()}`,
        role: 'agent',
        message:
          "👋 Hello! I'm GlobalMarketHub's AI support assistant. I can help you with products, orders, payments, delivery, returns, coupons, and more! What can I help you with today?",
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

    // Add thinking indicator
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'agent',
      message: 'Thinking...',
      timestamp: new Date(),
      isThinking: true,
    };
    setMessages((prev) => [...prev, thinkingMessage]);

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

        // Remove thinking message and add agent message
        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.isThinking);
          return [
            ...filtered,
            {
              id: `agent-${Date.now()}`,
              role: 'agent',
              message: data.reply || 'Sorry, I could not process your message.',
              timestamp: new Date(),
              category: data.category,
              escalated: data.escalateToHuman,
            },
          ];
        });

        // Handle escalation
        if (data.escalateToHuman) {
          setIsEscalated(true);
          setTimeout(() => {
            const escalationMsg: Message = {
              id: `escalation-${Date.now()}`,
              role: 'agent',
              message:
                "📞 I'm connecting you with our human support team. You'll be assisted shortly. Our team is available 10 AM - 6 PM daily (Sunday-Thursday).",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, escalationMsg]);
          }, 1000);
        }
      } else {
        // Remove thinking message and add error
        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.isThinking);
          return [
            ...filtered,
            {
              id: `error-${Date.now()}`,
              role: 'agent',
              message:
                '❌ Sorry, I encountered a technical error. Let me connect you with our human support team.',
              timestamp: new Date(),
            },
          ];
        });
        setIsEscalated(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove thinking message and add error
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isThinking);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: 'agent',
            message: '⚠️ Connection error. Our support team will be in touch soon.',
            timestamp: new Date(),
          },
        ];
      });
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
        className={`fixed bottom-6 right-6 p-4 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition transform hover:scale-110 z-40 ${className}`}
        title="Open support chat"
      >
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <span className="hidden sm:block font-semibold text-sm">Support</span>
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
          isEscalated ? 'bg-blue-600' : 'bg-blue-600'
        } text-white px-4 py-3 rounded-t-lg flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          {isEscalated ? (
            <>
              <span className="text-xl">👤</span>
              <div>
                <h3 className="font-bold text-sm">Human Support Agent</h3>
                <p className="text-xs opacity-90">A team member is helping you</p>
              </div>
            </>
          ) : (
            <>
              <Bot size={20} />
              <div>
                <h3 className="font-bold text-sm">AI Support Assistant</h3>
                <p className="text-xs opacity-90">Always here to help</p>
              </div>
            </>
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
            {msg.role === 'agent' && !msg.isThinking && (
              <div className="mr-2 text-xl">🤖</div>
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.isThinking
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 rounded-bl-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              } ${msg.isThinking ? 'animate-pulse' : ''}`}
            >
              {msg.isThinking ? (
                <div className="flex items-center gap-1">
                  <span>💭 Thinking</span>
                  <span className="inline-flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </span>
                </div>
              ) : (
                <>
                  {msg.message}
                  <div
                    className={`text-xs mt-1 ${
                      msg.role === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
        {isEscalated && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-2 border border-blue-200">
            ℹ️ You've been escalated to a human agent. Response may take a few minutes.
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading || isEscalated}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || isEscalated}
            className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition"
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
