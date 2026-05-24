import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import Picker from 'emoji-picker-react';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/product.service';
import './ChatBot.css';

export default function LiveChat({ LIVE_SERVICE_URL, UPLOAD_SERVICE_URL, authUser, liveLocked }) {
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
  const liveMessagesEndRef = useRef(null);
  const liveInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const productPickerRef = useRef(null);
  const [liveText, setLiveText] = useState('');

  const isGuest = !authUser;
  const [liveSocket, setLiveSocket] = useState(null);

  // Initialize live socket when this component mounts (mounted when activeTab === 'live')
  useEffect(() => {
    if (liveLocked) return;

    const ls = io(LIVE_SERVICE_URL, { transports: ['websocket', 'polling'] });
    setLiveSocket(ls);

    ls.on('connect', () => {
      try {
        if (authUser && (authUser.role === 'admin' || authUser.role === 'support')) {
          setCurrentUserId(authUser.id || authUser._id || 'admin_1');
          setCurrentUserName(authUser.name || authUser.fullName || authUser.username || 'Support');
          setCurrentUserAvatar(authUser.avatar || authUser.picture || '');
          ls.emit('joinConversation', { conversationId: null, userId: authUser.id || authUser._id || 'admin_1', role: authUser.role });
        } else if (authUser) {
          const customerId = authUser.id || authUser._id;
          const customerName = authUser.name || authUser.fullName || authUser.username || '';
          const customerAvatar = authUser.avatar || authUser.picture || '';
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

    ls.on('receiveMessage', (data) => {
      if (!data) return;
      if (data.messages) {
        setLiveMessages(data.messages);
      } else if (data.message) {
        setLiveMessages(prev => [...prev, data.message]);
      }
    });

    ls.on('conversationUpdated', async (list) => {
      const convs = list || [];
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
      // console.log('Live socket disconnected');
    });
    ls.on('error', (err) => console.error('Live socket error', err));

    return () => ls.close();
  }, [LIVE_SERVICE_URL, authUser, liveLocked]);

  // Auto-scroll
  const scrollToBottom = (smooth = true) => {
    const container = liveMessagesContainerRef.current;
    if (!container) return;
    // Prefer scrolling the end ref for smooth behavior
    try {
      if (liveAutoScrollEnabled.current && liveMessagesEndRef.current) {
        liveMessagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
    } catch (e) {
      // ignore
    }
    // Fallback: ensure container is scrolled after layout
    setTimeout(() => {
      try { container.scrollTop = container.scrollHeight; } catch (e) {}
    }, 60);
  };

  useEffect(() => {
    if (!liveAutoScrollEnabled.current) return;
    scrollToBottom(true);
  }, [liveMessages]);

  // Ensure we scroll to bottom when the component mounts (e.g., when switching tabs)
  useEffect(() => {
    // give the browser a moment to layout the container
    const t = setTimeout(() => scrollToBottom(false), 80);
    return () => clearTimeout(t);
  }, []);

  // Fetch initial messages when conversation changes
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
  }, [currentConversationId, LIVE_SERVICE_URL]);

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
    if (!text) return;
    if (!liveSocket || !currentConversationId) return;
    if (isUploading) return;

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

  const handleEmojiClick = (emojiData) => {
    try {
      const emoji = emojiData?.emoji || (emojiData?.unified ? emojiData.native : '');
      const el = liveInputRef.current;
      if (!el) return;
      const start = el.selectionStart || el.value.length;
      const end = el.selectionEnd || el.value.length;
      const newVal = el.value.substring(0, start) + emoji + el.value.substring(end);
      el.value = newVal;
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
      el.focus();
    } catch (err) {
      console.warn('emoji insert error', err);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Product picker
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
    if (showProductPicker) document.addEventListener('mousedown', onClickOutside);
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

  const handleProductClick = (productId) => {
    window.open(`/products/${productId}`, '_blank');
  };

  const handleQuickCheckout = (cart) => {
    if (!cart || cart.length === 0) return;
    const cartData = cart.map(item => ({
      productId: item.product._id,
      quantity: item.quantity,
      name: item.product.name,
      price: item.product.price,
      image: item.product.imageUrl
    }));
    localStorage.setItem('quick_checkout_cart', JSON.stringify(cartData));
    window.location.href = '/checkout';
  };

  if (liveLocked) {
    return (
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
    );
  }

  return (
    <div className="live-container">
      {authUser && (authUser.role === 'admin' || authUser.role === 'support') && (
        <div className="live-sidebar">
          {conversations.map((c) => (
            <div key={c._id} className={`conversation-item ${currentConversationId===c._id ? 'active' : ''}`} onClick={() => {
              setCurrentConversationId(c._id);
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
          // allow small tolerance so near-top scroll also triggers
          if (el.scrollTop <= 10 && hasMoreLiveMessages && !isLoadingMoreLive) {
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
  );
}
