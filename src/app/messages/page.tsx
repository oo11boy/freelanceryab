// app/messages/page.tsx
'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { useUILayout } from '@/app/hooks/useUILayout';
import { messagesAPI, contractsAPI, reviewsAPI } from '@/app/services/api';
import { initializeSocket, getSocket } from '@/app/services/socket';
import ContractBar from '@/app/components/ContractBar';
import RatingModal from '@/app/components/RatingModal';

interface Message {
  id: number;
  text: string;
  message: string;
  sender_id: number;
  receiver_id: number;
  post_id?: number | null;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  post_id: number | null;
  post_title?: string | null;
  user_id: number;
  user_name: string;
  user_avatar: string;
  online_status?: number;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  online?: boolean;
}

interface ContractData {
  contract: any;
  myReview: any;
  otherReview: any;
  role: 'client' | 'freelancer' | null;
  postOwnerId: number | null;
  postStatus: string | null;
}

const EMPTY_CONTRACT: ContractData = {
  contract: null,
  myReview: null,
  otherReview: null,
  role: null,
  postOwnerId: null,
  postStatus: null,
};

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();
  const { setHideBottomNav } = useUILayout();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const [contractData, setContractData] = useState<ContractData>(EMPTY_CONTRACT);
  const [postIdForChat, setPostIdForChat] = useState<number | null>(null);
  const [postTitleForChat, setPostTitleForChat] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<number | null>(null);
  const postIdRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedFromUrl = useRef(false);

  const contractPollRef = useRef<NodeJS.Timeout | null>(null);
  const lastContractStatusRef = useRef<string | null>(null);
  const lastPostStatusRef = useRef<string | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    postIdRef.current = postIdForChat;
  }, [postIdForChat]);

  useEffect(() => {
    setHideBottomNav(!!selectedChat);
    return () => setHideBottomNav(false);
  }, [selectedChat, setHideBottomNav]);

  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    isVisibleRef.current = !document.hidden;
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!selectedChat) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
      }
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();

    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [selectedChat]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
    }
  };

  const reloadContract = async (
    postId: number,
    otherUserId: number,
    force: boolean = false
  ) => {
    try {
      const data = await contractsAPI.get(postId, otherUserId);
      const newStatus = data.contract?.status || null;
      const newPostStatus = data.postStatus || null;

      if (
        !force &&
        newStatus === lastContractStatusRef.current &&
        newPostStatus === lastPostStatusRef.current
      ) {
        return;
      }

      lastContractStatusRef.current = newStatus;
      lastPostStatusRef.current = newPostStatus;

      setContractData({
        contract: data.contract,
        myReview: data.myReview,
        otherReview: data.otherReview,
        role: data.role,
        postOwnerId: data.postOwnerId,
        postStatus: data.postStatus,
      });
    } catch (error) {
      // silent
    }
  };

  useEffect(() => {
    if (contractPollRef.current) {
      clearInterval(contractPollRef.current);
      contractPollRef.current = null;
    }

    if (!selectedChat || !postIdForChat) return;

    reloadContract(postIdForChat, selectedChat, true);

    if (isConnected) return;

    contractPollRef.current = setInterval(() => {
      if (!isVisibleRef.current) return;
      if (!selectedChatRef.current || !postIdRef.current) return;
      reloadContract(postIdRef.current, selectedChatRef.current);
    }, 8000);

    return () => {
      if (contractPollRef.current) {
        clearInterval(contractPollRef.current);
        contractPollRef.current = null;
      }
    };
  }, [selectedChat, postIdForChat, isConnected]);

  useEffect(() => {
    lastContractStatusRef.current = null;
    lastPostStatusRef.current = null;
  }, [selectedChat, postIdForChat]);

  // ===================================================
  // Socket
  // ===================================================
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const socket = initializeSocket(token);
    if (!socket) return;

    // 🔑 اینجا user_id را به سرور می‌گوییم تا user_online درست emit شود
    const joinRoom = () => {
      if (user?.id) {
        socket.emit('join_user_room', { user_id: user.id });
      }
    };

    const onConnect = () => {
      setIsConnected(true);
      joinRoom();
      loadConversations();
    };
    const onDisconnect = () => setIsConnected(false);

    const onNewMessage = (data: Message) => {
      const currentChat = selectedChatRef.current;
      const currentPostId = postIdRef.current;
      const myId = user?.id;

      const samePostId = (data.post_id ?? null) === (currentPostId ?? null);

      const isCurrentChat =
        samePostId &&
        ((data.sender_id === myId && data.receiver_id === currentChat) ||
          (data.sender_id === currentChat && data.receiver_id === myId));

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });

        if (data.receiver_id === myId) {
          socket.emit('mark_read', {
            message_id: data.id,
            sender_id: data.sender_id,
          });
        }
      }

      loadConversations();
    };

    const onMessageSent = (data: Message) => {
      const currentChat = selectedChatRef.current;
      const currentPostId = postIdRef.current;
      const samePostId = (data.post_id ?? null) === (currentPostId ?? null);

      if (samePostId && data.receiver_id === currentChat) {
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

    const onConversationRead = ({
      conversation_id,
    }: {
      conversation_id: number;
    }) => {
      const currentChat = selectedChatRef.current;
      if (conversation_id === currentChat) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
      }
    };

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

    const onMessageError = (data: { error: string }) => {
      console.error('Message error:', data.error);
    };

    const onContractEvent = (data: any) => {
      const myId = user?.id;
      const currentChat = selectedChatRef.current;
      const currentPostId = postIdRef.current;

      if (!currentChat || !currentPostId) return;

      const isMyEvent =
        (data.clientId === myId || data.freelancerId === myId) &&
        data.postId === currentPostId;

      if (!isMyEvent) return;

      reloadContract(currentPostId, currentChat, true);
    };

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
    socket.on('contract_event', onContractEvent);

    // اگر همین الان وصل است
    if (socket.connected) {
      setIsConnected(true);
      joinRoom();
    }

    loadConversations();

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
      socket.off('contract_event', onContractEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => scrollToBottom('smooth'), 100);
      return () => clearTimeout(t);
    }
  }, [messages]);

  useEffect(() => {
    if (selectedChat) {
      const t = setTimeout(() => scrollToBottom('auto'), 400);
      return () => clearTimeout(t);
    }
  }, [selectedChat]);

  const loadConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);
      return data.conversations || [];
    } catch (error) {
      return [];
    }
  };

  const loadMessages = async (userId: number, postId: number | null) => {
    setLoading(true);
    try {
      const data = await messagesAPI.getMessages(userId, postId);
      setMessages(data.messages || []);

      const socket = getSocket();
      if (socket) {
        socket.emit('mark_conversation_read', { sender_id: userId });
      }
    } catch (error) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadContract = async () => {
    if (!selectedChat || !postIdForChat) {
      setContractData(EMPTY_CONTRACT);
      return;
    }
    try {
      const data = await contractsAPI.get(postIdForChat, selectedChat);
      lastContractStatusRef.current = data.contract?.status || null;
      lastPostStatusRef.current = data.postStatus || null;
      setContractData({
        contract: data.contract,
        myReview: data.myReview,
        otherReview: data.otherReview,
        role: data.role,
        postOwnerId: data.postOwnerId,
        postStatus: data.postStatus,
      });
    } catch (error) {
      // silent
    }
  };

  useEffect(() => {
    if (selectedChat && postIdForChat) {
      loadContract();
    } else {
      setContractData(EMPTY_CONTRACT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, postIdForChat]);

  useEffect(() => {
    if (initializedFromUrl.current) return;
    if (conversations.length === 0) return;

    const userIdParam = searchParams.get('user');
    const postIdParam = searchParams.get('post');

    if (!userIdParam) return;

    const userIdNum = parseInt(userIdParam, 10);
    const postIdNum = postIdParam ? parseInt(postIdParam, 10) : null;

    if (isNaN(userIdNum)) return;

    const conv = conversations.find(
      (c) =>
        c.user_id === userIdNum && (c.post_id ?? null) === (postIdNum ?? null)
    );

    if (conv) {
      initializedFromUrl.current = true;
      handleSelectConversation(conv);
      router.replace('/messages', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams]);

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedChat(conv.user_id);
    setPostIdForChat(conv.post_id);
    setPostTitleForChat(conv.post_title || null);
    setContractData(EMPTY_CONTRACT);
    lastContractStatusRef.current = null;
    lastPostStatusRef.current = null;
    await loadMessages(conv.user_id, conv.post_id);
  };

  const handleBack = () => {
    setSelectedChat(null);
    setPostIdForChat(null);
    setPostTitleForChat(null);
    setMessages([]);
    setContractData(EMPTY_CONTRACT);
    loadConversations();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('send_message', {
          receiver_id: selectedChat,
          message: newMessage.trim(),
          post_id: postIdForChat || undefined,
        });
        setNewMessage('');
      } else {
        await messagesAPI.sendMessage(
          selectedChat,
          newMessage.trim(),
          postIdForChat || undefined
        );
        setNewMessage('');
        await loadMessages(selectedChat, postIdForChat);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket?.emit('typing', { receiver_id: selectedChat, is_typing: false });
      inputRef.current?.focus();
    } catch (error) {
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

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

  const handleSubmitRating = async (rating: number, comment?: string) => {
    if (!contractData.contract) return;
    await reviewsAPI.submit(contractData.contract.id, rating, comment);
    await loadContract();
  };

  const formatTime = (date: string) => {
    try {
      const d = new Date(date);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      if (isToday) {
        return d.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      if (isYesterday) return 'دیروز';
      return d.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatDateSeparator = (date: string) => {
    try {
      const d = new Date(date);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return 'امروز';
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'دیروز';
      return d.toLocaleDateString('fa-IR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const currentChat = conversations.find(
    (c) =>
      c.user_id === selectedChat &&
      (c.post_id ?? null) === (postIdForChat ?? null)
  );
  const isTyping = selectedChat ? typingUsers.has(selectedChat) : false;
  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  // 🟢 وضعیت آنلاین: اول socket (online)، اگر نبود از API (online_status)
  const isCurrentUserOnline =
    !!currentChat && (currentChat.online || currentChat.online_status === 1);

  // ===================================================
  // 🧩 بلوک‌های JSX مشترک
  // ===================================================

  const renderConversationList = () => {
    if (conversations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[60vh]">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center text-5xl mb-5">
            💬
          </div>
          <p className="text-lg font-bold text-gray-800 mb-2">هیچ پیامی ندارید</p>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-xs">
            با ارسال پیام به آگهی‌ها، مکالمه خود را شروع کنید
          </p>
          <button
            onClick={() => router.push('/explore')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            جستجوی آگهی
          </button>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100 bg-white">
        {conversations.map((conv) => {
          const key = `${conv.user_id}-${conv.post_id ?? 'general'}`;
          const isActive =
            selectedChat === conv.user_id &&
            (postIdForChat ?? null) === (conv.post_id ?? null);
          const isOnline = conv.online || conv.online_status === 1;

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectConversation(conv)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectConversation(conv);
                }
              }}
              className={`w-full text-right px-4 py-3 lg:py-4 flex items-center gap-3 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 lg:bg-blue-50 border-r-2 lg:border-r-4 border-blue-600'
                  : 'bg-white hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl text-white font-bold shadow-md">
                  {conv.user_name?.charAt(0) || '👤'}
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-semibold truncate ${
                        conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {conv.user_name}
                    </span>
                    {conv.post_id ? (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded shrink-0 font-medium">
                        پروژه
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0 font-medium">
                        عمومی
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatTime(conv.last_message_time)}
                  </span>
                </div>
                {conv.post_title && (
                  <p className="text-[10px] lg:text-xs text-blue-600 truncate mb-0.5 font-medium">
                    📋 {conv.post_title}
                  </p>
                )}
                <div className="flex justify-between items-center gap-2">
                  <p
                    className={`text-sm truncate ${
                      conv.unread_count > 0
                        ? 'text-gray-700 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    {conv.last_message}
                  </p>
                  {conv.unread_count > 0 && (
                    <div className="min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChatHeader = (showBack: boolean) => {
    return (
      <>
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 lg:px-4 py-3 flex items-center gap-2 lg:gap-3 shrink-0 shadow-sm">
          {showBack && (
            <button
              onClick={handleBack}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="بازگشت"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div className="relative">
            <div className="w-11 h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg lg:text-xl text-white font-bold shadow-md">
              {currentChat?.user_name?.charAt(0) || '👤'}
            </div>
            {isCurrentUserOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 truncate text-sm lg:text-base">
              {currentChat?.user_name}
            </div>
            <div className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
              {isTyping ? (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  در حال نوشتن
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              ) : isCurrentUserOnline ? (
                <span className="text-green-600">آنلاین</span>
              ) : (
                <span>آفلاین</span>
              )}
            </div>
          </div>
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
            }`}
            title={isConnected ? 'متصل' : 'قطع'}
          />
          <button
            onClick={() => currentChat && router.push(`/user/${currentChat.user_id}`)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shrink-0"
            aria-label="مشاهده پروفایل"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {postTitleForChat && (
          <div className="bg-blue-600/95 backdrop-blur-md border-b border-blue-700 px-3 lg:px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm shrink-0">📋</span>
              <p className="text-xs lg:text-sm text-white font-semibold truncate flex-1">
                {postTitleForChat}
              </p>
              <button
                onClick={() => router.push(`/post/${postIdForChat}`)}
                className="text-[10px] lg:text-xs bg-white/20 text-white px-2 py-1 rounded-md hover:bg-white/30 active:scale-95 transition-all shrink-0 font-medium"
              >
                مشاهده
              </button>
            </div>
          </div>
        )}

        {postIdForChat && selectedChat && (
          <ContractBar
            contract={contractData.contract}
            role={contractData.role}
            postId={postIdForChat}
            otherUserId={selectedChat}
            onRefresh={loadContract}
            onRate={() => setShowRating(true)}
            hasRated={!!contractData.myReview}
            otherReview={contractData.otherReview}
            postStatus={contractData.postStatus}
          />
        )}
      </>
    );
  };

  const renderMessagesBody = () => {
    return (
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 lg:px-6 py-4 space-y-2"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">در حال بارگذاری پیام‌ها...</p>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              const showDate =
                index === 0 ||
                new Date(msg.created_at).toDateString() !==
                  new Date(messages[index - 1]?.created_at).toDateString();
              const prevMsg = messages[index - 1];
              const showAvatar =
                !isMe &&
                (index === 0 ||
                  prevMsg?.sender_id !== msg.sender_id ||
                  showDate);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm font-medium">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 shrink-0">
                        {showAvatar ? (
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                            {currentChat?.user_name?.charAt(0) || '👤'}
                          </div>
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] lg:max-w-[65%] rounded-2xl px-3.5 lg:px-4 py-2.5 shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                      }`}
                    >
                      <p className="text-sm lg:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text || msg.message}
                      </p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] lg:text-[11px] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        <span>{formatTime(msg.created_at)}</span>
                        {isMe && (
                          <span className={msg.is_read ? 'text-blue-100' : 'text-blue-200/70'}>
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-end gap-1.5 justify-start">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {currentChat?.user_name?.charAt(0) || '👤'}
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-4xl mb-4">
              💬
            </div>
            <p className="text-gray-700 font-semibold mb-1">هنوز پیامی نیست</p>
            <p className="text-sm text-gray-500">اولین پیام را شما ارسال کنید</p>
          </div>
        )}
      </div>
    );
  };

  const renderMessageInput = () => {
    return (
      <div className="bg-white border-t border-gray-200 px-3 lg:px-4 py-2.5 lg:py-3 shadow-lg shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && handleSendMessage()
              }
              placeholder="پیام خود را بنویسید..."
              className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm lg:text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              disabled={sending}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/40 active:scale-95 transition-all shrink-0"
            aria-label="ارسال"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 rotate-180" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== موبایل ===== */}
      <div className="lg:hidden">
        {selectedChat && currentChat ? (
          <div
            className="fixed inset-x-0 top-0 flex flex-col bg-gradient-to-b from-blue-50 via-gray-50 to-gray-50 z-30"
            style={{
              height: '100dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {renderChatHeader(true)}
            {renderMessagesBody()}
            {renderMessageInput()}
          </div>
        ) : (
          <>
            <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-800">پیام‌ها</h1>
                  {totalUnread > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'آنلاین' : 'قطع'}
                  </span>
                </div>
              </div>
            </div>
            <div className="pb-24">{renderConversationList()}</div>
          </>
        )}
      </div>

      {/* ===== دسکتاپ ===== */}
      <div className="hidden lg:block bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            style={{ height: 'calc(100vh - 8rem)' }}
          >
            <div className="grid grid-cols-[360px_1fr] h-full min-h-0">
              {/* ستون راست: لیست مکالمات */}
              <aside className="border-l border-gray-100 flex flex-col bg-white min-h-0">
                <div className="px-5 py-4 border-b border-gray-100 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-gray-800">پیام‌ها</h1>
                      {totalUnread > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" title={isConnected ? 'متصل' : 'قطع'}>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {isConnected ? 'آنلاین' : 'قطع'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {renderConversationList()}
                </div>
              </aside>

              {/* ستون چپ: چت */}
              <main className="flex flex-col bg-gradient-to-b from-blue-50/30 via-gray-50 to-gray-50 min-h-0">
                {selectedChat && currentChat ? (
                  <>
                    <div className="shrink-0">{renderChatHeader(false)}</div>
                    {renderMessagesBody()}
                    <div className="shrink-0">{renderMessageInput()}</div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center text-6xl mb-6 shadow-inner">
                      💬
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-2">
                      یک گفتگو انتخاب کنید
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                      از لیست سمت راست یک مکالمه را انتخاب کنید تا پیام‌ها نمایش داده شوند
                    </p>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>

      <RatingModal
        open={showRating}
        targetName={currentChat?.user_name || 'کاربر'}
        onClose={() => setShowRating(false)}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}

function MessagesFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 text-sm">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesFallback />}>
      <MessagesContent />
    </Suspense>
  );
}