import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Message } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Xin chào! Tôi là trợ lý tài chính của bạn với sức mạnh AI và dữ liệu vnstock. Bạn có thể hỏi tôi về:\n\n• Thông tin cổ phiếu (VNM, FPT, VCB, HPG...)\n• Giá cổ phiếu và dữ liệu lịch sử\n• Thông tin công ty và báo cáo tài chính\n• Tin tức thị trường\n• Phân tích kỹ thuật (RSI, SMA, MACD)\n\nBạn cần hỗ trợ gì hôm nay?',
    timestamp: new Date(),
  },
];

export function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check backend connection
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setIsConnected(data.status === 'healthy'))
      .catch(() => setIsConnected(false));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder for streaming response
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to server');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? { ...msg, content: 'Xin lỗi, không thể kết nối đến server. Vui lòng chạy backend trước.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">FinBot</h1>
            <p className="text-sm text-gray-500">Trợ lý tài chính AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-sm ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-2">
          {['Giá VNM hôm nay?', 'Thông tin công ty FPT', 'Báo cáo tài chính VCB', 'Tin tức thị trường'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600
                         hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
