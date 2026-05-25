import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, X, Send, Image as ImageIcon, Smile } from 'lucide-react';
import Picker from 'emoji-picker-react';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/product.service';
import './ChatBot.css';

const CHAT_SERVICE_URL = 'http://localhost:3011'; // AI Service
const LIVE_SERVICE_URL = 'http://localhost:3012'; // Live Chat Service
const UPLOAD_SERVICE_URL = 'http://localhost:3006';

export default function ChatBot() {
  
  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem('chatbot_open') === 'true';
  });
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chatbot_messages');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse session chatbot_messages', e);
      return [];
    }
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    return sessionStorage.getItem('chatbot_session') || null;
  });
  const [socket, setSocket] = useState(null);
  const [liveSocket, setLiveSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('ai');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const [isLoadingMoreLive, setIsLoadingMoreLive] = useState(false);
  const [hasMoreLiveMessages, setHasMoreLiveMessages] = useState(true);
  const liveMessagesContainerRef = useRef(null);
  const liveAutoScrollEnabled = useRef(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const messagesEndRef = useRef(null);
  const liveInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const liveMessagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const productPickerRef = useRef(null);
  const [liveText, setLiveText] = useState('');

  const safeParse = (str) => {
    try {
      return str ? JSON.parse(str) : null;
    } catch (e) {
      console.warn('Failed to parse JSON from localStorage.authUser', e);
      return null;
    }
  };
  const rawAuth = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;
  const authUser = safeParse(rawAuth);
  const [liveLocked, setLiveLocked] = useState(false);
  const isGuest = !authUser;

  // Save state to sessionStorage (auto-clear when browser closes)
  useEffect(() => {
    sessionStorage.setItem('chatbot_open', isOpen);
  }, [isOpen]);

  useEffect(() => {
    sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('chatbot_session', sessionId);
    }
  }, [sessionId]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(CHAT_SERVICE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat service');
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = `session_${Date.now()}`;
        setSessionId(currentSessionId);
      }
      newSocket.emit('join_conversation', { sessionId: currentSessionId });
    });

    newSocket.on('receive_message', (data) => {
      console.log('Received message data:', data);
      setIsTyping(false);
      if (data.success) {
        console.log('Products received:', data.data.products);
        console.log('Cart:', data.data.cart);
        console.log('Show checkout:', data.data.showCheckoutButton);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.assistantMessage,
          products: data.data.products,
          cart: data.data.cart,
          showCheckoutButton: data.data.showCheckoutButton,
          timestamp: new Date()
        }]);
      }
    });

    newSocket.on('error', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date()
      }]);
    });

    return () => newSocket.close();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle live tab activation: setup live socket when needed
  useEffect(() => {
    if (activeTab !== 'live' || liveLocked) return;

    const ls = io(LIVE_SERVICE_URL, { transports: ['websocket', 'polling'] });
    setLiveSocket(ls);

    ls.on('connect', () => {
      console.log('Connected to live chat service');
      try {
        const raw = localStorage.getItem('authUser');
        const user = safeParse(raw);
        if (user && (user.role === 'admin' || user.role === 'support')) {
          // set current user info for admin or support
          setCurrentUserId(user.id || user._id || 'admin_1');
          setCurrentUserName(user.name || user.fullName || user.username || 'Support');
          setCurrentUserAvatar(user.avatar || user.picture || '');
          ls.emit('joinConversation', { conversationId: null, userId: user.id || user._id || 'admin_1', role: user.role });
        } else if (user) {
          // customer: create/get conversation via REST then join
          const customerId = user.id || user._id;
          const customerName = user.name || user.fullName || user.username || '';
          const customerAvatar = user.avatar || user.picture || '';
          fetch(`${LIVE_SERVICE_URL}/api/live/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, customerName, customerAvatar })
          }).then(r => r.json()).then(res => {
            if (res.success) {
              const cid = res.data._id;
              setCurrentConversationId(cid);
              setCurrentUserId(customerId);
              setCurrentUserName(customerName);
              setCurrentUserAvatar(customerAvatar);
              ls.emit('joinConversation', { conversationId: cid, userId: customerId, role: 'customer' });
            }
          }).catch(e => console.error(e));
        } else {
          // guest: create temporary conversation id in-memory
          const guestId = 'guest_' + Date.now();
          const guestName = 'Guest';
          const guestAvatar = '';
          fetch(`${LIVE_SERVICE_URL}/api/live/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: guestId, customerName: guestName, customerAvatar: guestAvatar })
          }).then(r => r.json()).then(res => {
            if (res.success) {
              const cid = res.data._id;
              setCurrentConversationId(cid);
              setCurrentUserId(guestId);
              setCurrentUserName(guestName);
              setCurrentUserAvatar(guestAvatar);
              ls.emit('joinConversation', { conversationId: cid, userId: guestId, role: 'customer' });
            }
          }).catch(e => console.error(e));
        }
      } catch (err) {
        console.error('live init error', err);
      }
    });

    // Receive full message list or single message
    ls.on('receiveMessage', (data) => {
      if (!data) return;
      if (data.messages) {
        setLiveMessages(data.messages);
      } else if (data.message) {
        // single new message
        setLiveMessages(prev => [...prev, data.message]);
      }
    });

    // Conversation list update for admin
    ls.on('conversationUpdated', async (list) => {
      const convs = list || [];
      // enrich conversations with preview info (fetch last message to determine sender)
      const enriched = await Promise.all(convs.map(async (c) => {
        try {
          const res = await fetch(`${LIVE_SERVICE_URL}/api/live/conversations/${c._id}/messages`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const msgs = data.data;
            const last = msgs[msgs.length - 1];
            const isMine = authUser && (authUser.id === last.senderId || authUser._id === last.senderId);
            const senderLabel = isMine ? 'Bạn' : (last.senderName || c.customerName || 'Người dùng');
            const preview = `${senderLabel}: ${last.message}`;
            return { ...c, _preview: preview, _lastMessageAt: c.lastMessageAt || last.createdAt };
          }
          return { ...c, _preview: c.lastMessage ? c.lastMessage : '' };
        } catch (e) {
          return { ...c, _preview: c.lastMessage ? c.lastMessage : '' };
        }
      }));
      setConversations(enriched);
    });

    ls.on('disconnect', () => {
      console.log('Live socket disconnected');
    });

    ls.on('error', (err) => console.error('Live socket error', err));

    return () => ls.close();
  }, [activeTab]);

  // Add welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Xin chào! 👋 Tôi là trợ lý AI của PetFood. Tôi có thể giúp bạn:\n\n• Tìm kiếm sản phẩm\n• Kiểm tra giá và tồn kho\n• Đặt hàng nhanh chóng\n\nBạn cần tôi giúp gì?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket || !sessionId) return;

    const userMessage = inputMessage.trim();
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    // Send to server
    socket.emit('send_message', {
      sessionId,
      message: userMessage,
      userId: 'guest_' + Date.now()
    });

    setInputMessage('');
    setIsTyping(true);
  };

  // Live send
  useEffect(() => {
    if (!liveAutoScrollEnabled.current) return;
    liveMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  // Fetch initial page of live messages when conversation changes
  useEffect(() => {
    if (!currentConversationId) return;
    (async () => {
      try {
        setLiveMessages([]);
        setHasMoreLiveMessages(true);
        const r = await fetch(`${LIVE_SERVICE_URL}/api/live/conversations/${currentConversationId}/messages?limit=20`);
        const res = await r.json();
        if (res.success) {
          setLiveMessages(res.data || []);
          if (!res.data || res.data.length < 20) setHasMoreLiveMessages(false);
          liveAutoScrollEnabled.current = true;
        }
      } catch (e) {
        console.error('fetch initial live messages error', e);
      }
    })();
  }, [currentConversationId]);

  const loadMoreLiveMessages = async () => {
    if (!currentConversationId || isLoadingMoreLive || !hasMoreLiveMessages) return;
    const container = liveMessagesContainerRef.current;
    if (!container) return;
    setIsLoadingMoreLive(true);
    liveAutoScrollEnabled.current = false;
    const previousScrollHeight = container.scrollHeight;
    try {
      const earliest = liveMessages[0];
      const before = earliest ? encodeURIComponent(earliest.createdAt) : undefined;
      const url = `${LIVE_SERVICE_URL}/api/live/conversations/${currentConversationId}/messages?limit=20${before ? `&before=${before}` : ''}`;
      const r = await fetch(url);
      const res = await r.json();
      if (res.success) {
        const newMsgs = res.data || [];
        if (newMsgs.length === 0) {
          setHasMoreLiveMessages(false);
        } else {
          setLiveMessages((prev) => [...newMsgs, ...prev]);
          if (newMsgs.length < 20) setHasMoreLiveMessages(false);
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
            setTimeout(() => { liveAutoScrollEnabled.current = true; }, 50);
          });
        }
      }
    } catch (e) {
      console.error('loadMoreLiveMessages error', e);
    } finally {
      setIsLoadingMoreLive(false);
    }
  };

  const handleSendLive = async () => {
    if (!liveInputRef.current) return;
    const text = (liveInputRef.current.value || '').trim();
    if (!text) return; // require non-empty trimmed text
    if (!liveSocket || !currentConversationId) return;
    if (isUploading) return; // prevent sending while uploading

    // prepare sender info from stored current user
    const senderId = currentUserId || (authUser && (authUser.id || authUser._id)) || `guest_${Date.now()}`;
    const senderRole = authUser && (authUser.role === 'admin' || authUser.role === 'support') ? authUser.role : 'customer';
    const senderName = currentUserName || (authUser && (authUser.name || authUser.fullName || authUser.username)) || 'Guest';
    const senderAvatar = currentUserAvatar || (authUser && (authUser.avatar || authUser.picture)) || '';

    liveInputRef.current.value = '';
    setLiveText('');
    liveSocket.emit('sendMessage', {
      conversationId: currentConversationId,
      senderId,
      senderRole,
      message: text,
      senderName,
      senderAvatar
    });
  };

  const handleLiveKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendLive();
    }
  };

  const handleEmojiClick = (emojiData, event) => {
    try {
      const emoji = emojiData?.emoji || (emojiData?.unified ? emojiData.native : '');
      const el = liveInputRef.current;
      if (!el) return;
      const start = el.selectionStart || el.value.length;
      const end = el.selectionEnd || el.value.length;
      const newVal = el.value.substring(0, start) + emoji + el.value.substring(end);
      el.value = newVal;
      // move cursor after inserted emoji
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
      el.focus();
    } catch (err) {
      console.warn('emoji insert error', err);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // basic validation (allowed types and size enforced by upload-service as well)
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận ảnh jpg, png, webp');
      return;
    }

    const maxMb = 5;
    if (file.size > maxMb * 1024 * 1024) {
      alert(`Kích thước ảnh lớn hơn ${maxMb}MB`);
      return;
    }

    // upload to upload-service
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'chat');

      const res = await fetch(`${UPLOAD_SERVICE_URL}/upload`, {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error('upload error', txt);
        alert('Upload thất bại');
        return;
      }

      const data = await res.json();
      const fileUrl = data.url || data.secure_url || (data.data && data.data.url) || '';
      if (!fileUrl) {
        alert('Upload không trả về URL');
        return;
      }

      // emit image message
      const senderId = currentUserId || (authUser && (authUser.id || authUser._id)) || `guest_${Date.now()}`;
      const senderRole = authUser && (authUser.role === 'admin' || authUser.role === 'support') ? authUser.role : 'customer';
      const senderName = currentUserName || (authUser && (authUser.name || authUser.fullName || authUser.username)) || 'Guest';
      const senderAvatar = currentUserAvatar || (authUser && (authUser.avatar || authUser.picture)) || '';

      liveSocket.emit('sendMessage', {
        conversationId: currentConversationId,
        senderId,
        senderRole,
        message: '',
        messageType: 'image',
        fileUrl,
        metadata: data.metadata || {},
        senderName,
        senderAvatar
      });
    } catch (err) {
      console.error('file upload error', err);
      alert('Upload thất bại');
    } finally {
      setIsUploading(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Product picker logic
  useEffect(() => {
    if (!showProductPicker) return;
    let mounted = true;
    let t = null;
    const doSearch = async (q) => {
      try {
        setIsSearchingProducts(true);
        const res = await productService.listProducts({ keyword: q || '', limit: 10 });
        if (!mounted) return;
        setProductResults(res.items || []);
      } catch (err) {
        console.error('product search error', err);
      } finally {
        setIsSearchingProducts(false);
      }
    };

    t = setTimeout(() => doSearch(productQuery), 300);
    return () => { mounted = false; clearTimeout(t); };
  }, [productQuery, showProductPicker]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (productPickerRef.current && !productPickerRef.current.contains(e.target)) {
        setShowProductPicker(false);
      }
    };
    if (showProductPicker) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showProductPicker]);

  const handleSelectProduct = (product) => {
    if (!liveSocket || !currentConversationId) return;
    const senderId = currentUserId || (authUser && (authUser.id || authUser._id)) || `guest_${Date.now()}`;
    const senderRole = authUser && (authUser.role === 'admin' || authUser.role === 'support') ? authUser.role : 'customer';
    const senderName = currentUserName || (authUser && (authUser.name || authUser.fullName || authUser.username)) || 'Guest';
    const senderAvatar = currentUserAvatar || (authUser && (authUser.avatar || authUser.picture)) || '';

    const productData = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      price: product.price,
    };

    liveSocket.emit('sendMessage', {
      conversationId: currentConversationId,
      senderId,
      senderRole,
      message: '',
      messageType: 'product',
      productId: product._id,
      productData,
      senderName,
      senderAvatar,
    });

    setShowProductPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProductClick = (productId) => {
    // Open in new tab to keep chat open
    window.open(`/products/${productId}`, '_blank');
  };

  const handleQuickCheckout = (cart) => {
    if (!cart || cart.length === 0) return;
    
    // Add items to cart and navigate to checkout
    const cartData = cart.map(item => ({
      productId: item.product._id,
      quantity: item.quantity,
      name: item.product.name,
      price: item.product.price,
      image: item.product.imageUrl
    }));
    
    // Store in localStorage for checkout page
    localStorage.setItem('quick_checkout_cart', JSON.stringify(cartData));
    
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  // Route-based UI hiding (UI-only). Keep component mounted so sockets/state persist.
  // Use a reactive `currentPath` state and listen to history/navigation events
  // so the chat UI updates immediately on SPA route changes without using
  // React Router hooks (safe when component is mounted outside a Router).
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' && window.location ? window.location.pathname : '/'));

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname || '/');

    // Patch pushState/replaceState to dispatch a custom event so we can
    // observe SPA navigations that don't trigger popstate.
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function () {
      const result = origPush.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    history.replaceState = function () {
      const result = origReplace.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('locationchange', onLocationChange);

    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('locationchange', onLocationChange);
      // restore
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  const hiddenExact = ['/login', '/support', '/register', '/admin'];
  const hiddenPrefixes = ['/auth'];
  const shouldHideUI = hiddenExact.some(p => currentPath === p || currentPath.startsWith(p + '/')) || hiddenPrefixes.some(p => currentPath.startsWith(p));
  if (shouldHideUI) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-bot-button"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="chat-icon-wrapper">
            <MessageCircle size={28} />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-bot-window">
          {/* Header */}
          <div className="chat-bot-header">
            <div className="chat-bot-header-content">
              <div className="chat-bot-avatar">
                🐾
              </div>
              <div>
                <h3 className="chat-bot-title">PetFood Chat</h3>
                <p className="chat-bot-subtitle">Chọn chế độ chat</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chat-bot-close"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="chat-tabs">
            <button className={`chat-tab ${activeTab==='ai' ? 'active':''}`} onClick={() => { setActiveTab('ai'); setLiveLocked(false); }}>AI Chat</button>
            <button
              className={`chat-tab ${activeTab==='live' ? 'active':''} ${(isGuest || (authUser && (authUser.role === 'admin' || authUser.role === 'support'))) ? 'disabled' : ''}`}
              onClick={() => {
                if (isGuest || (authUser && (authUser.role === 'admin' || authUser.role === 'support'))) {
                  // lock live tab for guests, admins and staff accounts
                  setActiveTab('live');
                  setLiveLocked(true);
                } else {
                  setActiveTab('live');
                  setLiveLocked(false);
                }
              }}
            >
              Live Chat
            </button>
          </div>
          {/* Body: contains tab content with stable layout */}
          <div className="chat-bot-body">
            {/* Messages or Live */}
            {activeTab === 'ai' ? (
            <div className="ai-tab-content">
              <div className="chat-bot-messages">
                {messages.map((message, index) => (
                  <div key={index}>
                    <div className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-bot'}`}>
                      <div className="chat-message-content">{message.content}</div>
                      <div className="chat-message-time">
                        {new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Product Cards */}
                    {message.products && message.products.length > 0 && (
                      <div className="product-cards">
                        {message.products.map((product) => (
                          <div key={product._id} className="product-card" onClick={() => handleProductClick(product._id)}>
                            <div className="product-card-image">
                              <img
                                src={product.imageUrl || product.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'}
                                alt={product.name}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                              />
                            </div>
                            <div className="product-card-info">
                              <h4 className="product-card-name">{product.name}</h4>
                              <p className="product-card-price">{product.price?.toLocaleString('vi-VN')}đ</p>
                              {product.stock > 0 ? (
                                <span className="product-card-stock in-stock">Còn {product.stock} sản phẩm</span>
                              ) : (
                                <span className="product-card-stock out-of-stock">Hết hàng</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Checkout Button */}
                    {message.showCheckoutButton && message.cart && message.cart.length > 0 && (
                      <div className="quick-checkout-container">
                        <button className="quick-checkout-button" onClick={() => handleQuickCheckout(message.cart)}>
                          🛒 Tạo đơn hàng nhanh ({message.cart.length} sản phẩm)
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-message chat-message-bot">
                    <div className="chat-message-content">
                      <div className="typing-indicator"><span></span><span></span><span></span></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* AI input - only when AI tab active */}
              <div className="chat-bot-input-container" style={{ display: 'flex' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="chat-bot-input"
                />
                <button onClick={handleSendMessage} disabled={!inputMessage.trim()} className="chat-bot-send" aria-label="Send message">
                  <Send size={20} />
                </button>
              </div>
            </div>
          ) : null}

            {activeTab === 'live' && (
            <div className="live-container">
              {liveLocked ? (
                <div className="live-locked">
                  <div className="live-locked-inner">
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
                    {authUser && (authUser.role === 'admin' || authUser.role === 'support') ? (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Tài khoản nhân viên không sử dụng được Live Chat phía khách hàng</div>
                        <div style={{ marginBottom: 10, color: '#6b7280', textAlign: 'center' }}>Vui lòng sử dụng Support Dashboard để quản lý hội thoại khách hàng.</div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <Button size="lg" onClick={() => { window.location.href = '/support'; }}>Mở Support Dashboard</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Bạn cần đăng nhập để sử dụng Live Chat</div>
                        <div style={{ marginBottom: 8, color: '#6b7280' }}>Live Chat chỉ dành cho tài khoản đã đăng nhập.</div>
                        <div>
                          <Button size="lg" onClick={() => { window.location.href = '/login'; }}>Đăng nhập ngay</Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="live-inner" style={{ display: 'contents' }}>
                  {authUser && (authUser.role === 'admin' || authUser.role === 'support') && (
                    <div className="live-sidebar">
                      {conversations.map((c) => (
                        <div key={c._id} className={`conversation-item ${currentConversationId===c._id ? 'active' : ''}`} onClick={() => {
                          setCurrentConversationId(c._id);
                          // join the room as admin; messages will be fetched by the effect watching `currentConversationId`
                          liveSocket?.emit('joinConversation', { conversationId: c._id, userId: authUser.id || authUser._id || 'admin_1', role: authUser.role });
                        }}>
                          <div className="left">
                            <img src={c.customerAvatar || '/default-avatar.png'} alt={c.customerName || c.customerId} />
                            <div>
                              <div className="customer-name">{c.customerName || c.customerId}</div>
                              <div className="meta">{c._preview || c.lastMessage || '—'}</div>
                              <div className="timestamp">{(c._lastMessageAt || c.lastMessageAt) ? new Date(c._lastMessageAt || c.lastMessageAt).toLocaleString() : ''}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="live-main">
                    <div className="live-messages" ref={liveMessagesContainerRef} onScroll={(e) => {
                      const el = e.target;
                      if (el.scrollTop === 0 && hasMoreLiveMessages && !isLoadingMoreLive) {
                        loadMoreLiveMessages();
                      }
                    }}>
                    {liveMessages.map((m, i) => {
                      const isSameDay = (a, b) => {
                        if (!a || !b) return false;
                        const da = new Date(a);
                        const db = new Date(b);
                        return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
                      };

                      const formatDateLabel = (iso) => {
                        const d = new Date(iso);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);
                        if (isSameDay(d, today)) return 'Hôm nay';
                        if (isSameDay(d, yesterday)) return 'Hôm qua';
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const yyyy = d.getFullYear();
                        return `${dd}/${mm}/${yyyy}`;
                      };

                      const formatTime = (iso) => {
                        if (!iso) return '';
                        try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
                      };

                      const prev = liveMessages[i - 1];
                      const showDate = !prev || !isSameDay(m.createdAt, prev?.createdAt);
                      const isMe = m.senderId === currentUserId;
                      const alignClass = isMe ? 'chat-message-user' : 'chat-message-bot';
                      const name = m.senderName || (m.senderRole === 'admin' || m.senderRole === 'support' ? 'Support' : (m.senderId || 'User'));
                      const avatar = m.senderAvatar || '';

                      return (
                        <div key={m._id || i}>
                          {showDate && <div className="date-separator">{formatDateLabel(m.createdAt)}</div>}
                          <div className={`chat-message ${alignClass}`}>
                            <div style={{display:'flex',gap:8,alignItems:'flex-end', justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                              {!isMe && (
                                <img src={avatar || '/default-avatar.png'} alt={name} style={{width:32,height:32,borderRadius:16,objectFit:'cover'}} />
                              )}
                              <div style={{display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start'}}>
                                {!isMe && <div style={{fontSize:12,color:'#374151',marginBottom:4}}>{name}</div>}
                                <div className="chat-message-content">
                                  {m.messageType === 'image' ? (
                                    <div className="image-message-wrapper">
                                      <img src={m.fileUrl || m.message} alt="image" className="image-message" onError={(e)=>{e.target.src='/image-placeholder.png'}} />
                                    </div>
                                  ) : m.messageType === 'product' && m.productData ? (
                                    <div className="product-card" style={{ display:'flex', gap:12, alignItems:'center', cursor:'pointer' }} onClick={() => handleProductClick(m.productData._id)}>
                                      <div className="product-card-image" style={{ width:70, height:70, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                                        <img src={m.productData.imageUrl || 'https://placehold.co/150x150'} alt={m.productData.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                      </div>
                                      <div className="product-card-info" style={{ minWidth:0 }}>
                                        <h4 className="product-card-name" style={{ margin:0, fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.productData.name}</h4>
                                        <p className="product-card-price" style={{ margin:0, color:'#f97316', fontWeight:700 }}>{(m.productData.price || 0).toLocaleString('vi-VN')}đ</p>
                                      </div>
                                    </div>
                                  ) : (
                                    m.message
                                  )}
                                </div>
                                <div className="chat-message-time">{formatTime(m.createdAt)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  <div ref={liveMessagesEndRef} />
                </div>

                <div className="live-input">
                    <input
                      ref={liveInputRef}
                      className="chat-bot-input live-input-field"
                      placeholder="Nhập tin nhắn..."
                      onKeyDown={handleLiveKeyDown}
                      onChange={(e) => setLiveText(e.target.value)}
                    />
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <button type="button" className="icon-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
                        <Smile size={18} />
                      </button>
                      <button type="button" className="icon-button" onClick={handleUploadClick} title="Upload image">
                        <ImageIcon size={18} />
                      </button>
                      <button type="button" className="icon-button" onClick={() => setShowProductPicker(!showProductPicker)} title="Gửi sản phẩm">
                        🛍️
                      </button>
                      <button className="chat-bot-send" onClick={handleSendLive} disabled={isUploading || !liveText.trim()}><Send size={18} /></button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    {showEmojiPicker && (
                      <div style={{ position: 'absolute', bottom: 70, right: 20, zIndex: 60 }}>
                        <Picker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                    {showProductPicker && (
                      <div ref={productPickerRef} style={{ position: 'absolute', bottom: 70, right: 20, zIndex: 60, width: 360, height: 420, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          <input value={productQuery} onChange={(e)=>setProductQuery(e.target.value)} placeholder="Tìm sản phẩm..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {isSearchingProducts ? <div>Đang tìm...</div> : null}
                          {productResults.map(p => (
                            <div key={p._id} onClick={() => handleSelectProduct(p)} style={{ display:'flex', gap:8, alignItems:'center', padding:8, cursor:'pointer', borderRadius:6 }}>
                              <img src={p.imageUrl || 'https://placehold.co/80x80'} alt={p.name} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flex: '0 0 56px' }} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                                <div style={{ fontSize:12, color:'#6b7280' }}>{(p.price || 0).toLocaleString('vi-VN')}đ</div>
                              </div>
                            </div>
                          ))}
                          {productResults.length === 0 && !isSearchingProducts && (
                            <div style={{ padding:8, color:'#6b7280' }}>Không tìm thấy sản phẩm</div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
                </div>
              )}</div>
                  
          )}
          </div>

          {/* no shared input here; inputs are per-tab */}
        </div>
      )}
    </>
  );
}