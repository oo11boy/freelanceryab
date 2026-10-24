// app/messages/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { messagesAPI } from '@/app/services/api';
import { initializeSocket, getSocket } from '@/app/services/socket';

interface Message {
  id: number;
  text: string;
  message: string;
  sender_id: number;
  receiver_id: number;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  online?: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // همگام‌سازی selectedChat با ref
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // -------------------------------------------------
  // راه‌اندازی Socket و شنونده‌ها
  // -------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const socket = initializeSocket(token);

    // --- شنونده‌های اتصال ---
    const onConnect = () => {
      console.log('✅ Connected');
      setIsConnected(true);
    };
    const onDisconnect = () => {
      console.log('❌ Disconnected');
      setIsConnected(false);
    };

    // --- شنونده‌های پیام ---
    const onNewMessage = (data: Message) => {
      const currentChat = selectedChatRef.current;
      const myId = user?.id;

      const isCurrentChat =
        (data.sender_id === myId && data.receiver_id === currentChat) ||
        (data.sender_id === currentChat && data.receiver_id === myId);

      if (isCurrentChat) {
        setMessages((prev) => {
          // جلوگیری از تکرار
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });

        // اگر من گیرنده هستم، پیام را خوانده علامت بزن
        if (data.receiver_id === myId) {
          socket.emit('mark_read', {
            message_id: data.id,
            sender_id: data.sender_id,
          });
        }
      }

      // به‌روزرسانی لیست مکالمات
      loadConversations();
    };

    const onMessageSent = (data: Message) => {
      const currentChat = selectedChatRef.current;
      if (data.receiver_id === currentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    const onMessageRead = ({ message_id }: { message_id: number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message_id ? { ...msg, is_read: true } : msg
        )
      );
    };

    const onConversationRead = ({ conversation_id }: { conversation_id: number }) => {
      const currentChat = selectedChatRef.current;
      if (conversation_id === currentChat) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
      }
    };

    // --- شنونده‌های وضعیت آنلاین ---
    const onOnlineUsers = ({ user_ids }: { user_ids: number[] }) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          online: user_ids.includes(conv.user_id),
        }))
      );
    };

    const onUserOnline = ({ user_id }: { user_id: number }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.user_id === user_id ? { ...conv, online: true } : conv
        )
      );
    };

    const onUserOffline = ({ user_id }: { user_id: number }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.user_id === user_id ? { ...conv, online: false } : conv
        )
      );
    };

    // --- تایپ کردن ---
    const onUserTyping = ({
      user_id,
      is_typing,
    }: {
      user_id: number;
      is_typing: boolean;
    }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (is_typing) next.add(user_id);
        else next.delete(user_id);
        return next;
      });
    };

    // --- خطاها ---
    const onMessageError = (data: { error: string }) => {
      console.error('Message error:', data.error);
      alert(data.error);
    };

    // ثبت شنونده‌ها
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('message_sent', onMessageSent);
    socket.on('message_read', onMessageRead);
    socket.on('conversation_read', onConversationRead);
    socket.on('online_users', onOnlineUsers);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);
    socket.on('user_typing', onUserTyping);
    socket.on('message_error', onMessageError);

    // اگر سوکت از قبل متصل است
    if (socket.connected) {
      setIsConnected(true);
    }

    loadConversations();

    // cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('message_sent', onMessageSent);
      socket.off('message_read', onMessageRead);
      socket.off('conversation_read', onConversationRead);
      socket.off('online_users', onOnlineUsers);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
      socket.off('user_typing', onUserTyping);
      socket.off('message_error', onMessageError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, user?.id]);

  // -------------------------------------------------
  // اسکرول خودکار
  // -------------------------------------------------
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // -------------------------------------------------
  // بارگذاری مکالمات
  // -------------------------------------------------
  const loadConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('خطا در بارگذاری مکالمات:', error);
    }
  };

  // -------------------------------------------------
  // بارگذاری پیام‌ها
  // -------------------------------------------------
  const loadMessages = async (userId: number) => {
    setLoading(true);
    try {
      const data = await messagesAPI.getMessages(userId);
      setMessages(data.messages || []);

      // علامت خوانده شدن کل مکالمه
      const socket = getSocket();
      if (socket) {
        socket.emit('mark_conversation_read', { sender_id: userId });
      }
    } catch (error) {
      console.error('خطا در بارگذاری پیام‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------
  // انتخاب مکالمه
  // -------------------------------------------------
  const handleSelectChat = async (userId: number) => {
    setSelectedChat(userId);
    await loadMessages(userId);
  };

  // -------------------------------------------------
  // ارسال پیام
  // -------------------------------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('send_message', {
          receiver_id: selectedChat,
          message: newMessage.trim(),
        });
        setNewMessage('');
      } else {
        // fallback به REST API
        await messagesAPI.sendMessage(selectedChat, newMessage.trim());
        setNewMessage('');
        await loadMessages(selectedChat);
      }

      // توقف تایپ
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket?.emit('typing', { receiver_id: selectedChat, is_typing: false });
    } catch (error) {
      console.error('خطا:', error);
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  // -------------------------------------------------
  // تایپ کردن
  // -------------------------------------------------
  const handleTyping = (value: string) => {
    setNewMessage(value);
    const socket = getSocket();
    if (!socket || !selectedChat) return;

    socket.emit('typing', { receiver_id: selectedChat, is_typing: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { receiver_id: selectedChat, is_typing: false });
    }, 1500);
  };

  // -------------------------------------------------
  // فرمت زمان
  // -------------------------------------------------
  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const currentChat = conversations.find((c) => c.user_id === selectedChat);
  const isTyping = selectedChat ? typingUsers.has(selectedChat) : false;

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* هدر */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-center flex-1">پیام‌ها</h1>
        {!isConnected && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            قطع
          </span>
        )}
      </div>

      {selectedChat && currentChat ? (
        // ---------- صفحه چت ----------
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* هدر چت */}
          <div className="bg-white px-4 py-3 flex items-center gap-3 border-b sticky top-0 z-10">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-2xl"
            >
              ←
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl text-white">
                    {currentChat.user_name?.charAt(0) || '👤'}
                  </div>
                  {currentChat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{currentChat.user_name}</div>
                  <div className="text-xs text-gray-500">
                    {isTyping
                      ? 'در حال نوشتن...'
                      : currentChat.online
                      ? 'آنلاین'
                      : 'آفلاین'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* پیام‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-10 text-gray-500">
                در حال بارگذاری...
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                const showDate =
                  index === 0 ||
                  new Date(msg.created_at).toDateString() !==
                    new Date(messages[index - 1]?.created_at).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          {new Date(msg.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text || msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? 'text-blue-200' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                          {isMe && (
                            <span className="ml-1">
                              {msg.is_read ? ' ✓✓' : ' ✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-20">
                <p>هیچ پیامی وجود ندارد</p>
                <p className="text-sm mt-2">اولین پیام را شما ارسال کنید</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ورودی پیام */}
          <div className="bg-white border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                }
                placeholder="پیام خود را بنویسید..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 text-white px-6 rounded-lg disabled:bg-blue-400"
              >
                {sending ? '...' : 'ارسال'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ---------- لیست مکالمات ----------
        <div>
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.user_id}
                onClick={() => handleSelectChat(conv.user_id)}
                className="bg-white border-b p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl text-white">
                    {conv.user_name?.charAt(0) || '👤'}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{conv.user_name}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTime(conv.last_message_time)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.last_message}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-20">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-semibold mb-2">هیچ پیامی ندارید</p>
              <p className="text-sm">
                با ارسال پیام به آگهی‌ها، مکالمه خود را شروع کنید
              </p>
              <button
                onClick={() => router.push('/explore')}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                جستجوی آگهی
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}