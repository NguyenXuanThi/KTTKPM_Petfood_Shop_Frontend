import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  X,
  Send,
  Image as ImageIcon,
  Smile,
  MessageSquare,
} from "lucide-react";
import Picker from "emoji-picker-react";
import { productService } from "@/services/product.service";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const LIVE_SERVICE_URL = "http://localhost:3012";
const UPLOAD_SERVICE_URL = "http://localhost:3006";

interface Conversation {
  _id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage?: string;
  _preview?: string;
  _lastMessageAt?: string;
  lastMessageAt?: string;
}

interface Message {
  _id?: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  message: string;
  messageType?: string;
  fileUrl?: string;
  productData?: any;
  senderName?: string;
  senderAvatar?: string;
  createdAt: string;
}

export default function MessageManagement() {
  const { user: authUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollEnabled = useRef(true);
  const currentConversationIdRef = useRef<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const productPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const typingTimeouts = useRef<Record<string, any>>({});
  const localTypingIdle = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentConversation = conversations.find(
    (c) => c._id === currentConversationId,
  );

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    if (
      !authUser ||
      (authUser.role !== "admin" && authUser.role !== ("support" as any))
    ) {
      window.location.href = "/";
      return undefined;
    }

    const ls = io(LIVE_SERVICE_URL, { transports: ["websocket", "polling"] });
    setSocket(ls);
    setCurrentUserId(authUser.id || authUser._id || "support_1");

    ls.on("connect", () => {
      console.log("Connected to live chat service");
      ls.emit("joinConversation", {
        conversationId: null,
        userId: authUser.id || authUser._id || "support_1",
        role: authUser.role,
      });
    });

    ls.on("conversationUpdated", async (list: Conversation[]) => {
      console.debug("conversationUpdated", list?.length);
      const convs = list || [];
      const enriched = await Promise.all(
        convs.map(async (c) => {
          try {
            const res = await fetch(
              `${LIVE_SERVICE_URL}/api/live/conversations/${c._id}/messages`,
            );
            const data = await res.json();
            if (
              data.success &&
              Array.isArray(data.data) &&
              data.data.length > 0
            ) {
              const msgs = data.data;
              const last = msgs[msgs.length - 1];
              const isMine =
                authUser &&
                (authUser.id === last.senderId ||
                  authUser._id === last.senderId);
              const senderLabel = isMine
                ? "Bạn"
                : last.senderName || c.customerName || "Customer";
              const preview = `${senderLabel}: ${last.message}`;
              return {
                ...c,
                _preview: preview,
                _lastMessageAt: c.lastMessageAt || last.createdAt,
              };
            }
            return { ...c, _preview: c.lastMessage ? c.lastMessage : "" };
          } catch (e) {
            return { ...c, _preview: c.lastMessage ? c.lastMessage : "" };
          }
        }),
      );
      setConversations(enriched);
    });

    ls.on("receiveMessage", (data) => {
      console.debug("receiveMessage", data);
      if (!data) return;
      if (data.messages) {
        // full sync for a conversation
        setLiveMessages(data.messages);
        return;
      }
      if (data.message) {
        const msg = data.message;

        // Update conversation preview and move conversation to top in sidebar in real-time
        setConversations((prev) => {
          try {
            const convId = msg.conversationId;
            const senderLabel =
              msg.senderName ||
              (msg.senderRole === "admin" || msg.senderRole === "support"
                ? "Support"
                : "User");
            const preview = `${senderLabel}: ${msg.message || ""}`;

            const others = prev.filter((c) => c._id !== convId);
            const exists = prev.find((c) => c._id === convId);
            if (exists) {
              const updated = {
                ...exists,
                _preview: preview,
                _lastMessageAt: msg.createdAt || new Date().toISOString(),
              } as Conversation;
              return [updated, ...others];
            }

            const newConv: Conversation = {
              _id: convId,
              customerId: msg.senderId || "",
              customerName: msg.senderName || "User",
              customerAvatar: msg.senderAvatar || undefined,
              lastMessage: msg.message || "",
              _preview: preview,
              _lastMessageAt: msg.createdAt || new Date().toISOString(),
            };
            return [newConv, ...others];
          } catch (e) {
            return prev;
          }
        });

        // Only append incoming message to the currently-open conversation view
        if (msg.conversationId === currentConversationIdRef.current) {
          setLiveMessages((prev) => [...prev, msg]);
        }
      }
    });

    // Listen for typing events
    ls.on("typing", (data) => {
      if (!data || !data.conversationId) return;
      const convId = data.conversationId;
      if (data.typing === false) {
        if (typingTimeouts.current[convId]) {
          clearTimeout(typingTimeouts.current[convId]);
          delete typingTimeouts.current[convId];
        }
        setTypingMap((p) => ({ ...p, [convId]: false }));
        return;
      }
      setTypingMap((p) => ({ ...p, [convId]: true }));
      if (typingTimeouts.current[convId])
        clearTimeout(typingTimeouts.current[convId]);
      typingTimeouts.current[convId] = setTimeout(() => {
        setTypingMap((p) => ({ ...p, [convId]: false }));
        delete typingTimeouts.current[convId];
      }, 2000);
    });

    ls.on("error", (err) => console.error("Live socket error", err));

    return () => {
      ls.close();
    };
  }, [authUser]);

  useEffect(() => {
    if (!autoScrollEnabled.current) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveMessages]);

  // When no conversation is selected (placeholder shown), poll conversations
  // so the sidebar updates when new messages/conversations arrive even if
  // socket events aren't received for some reason.
  useEffect(() => {
    let t: any = null;
    const fetchConversations = async () => {
      try {
        const r = await fetch(`${LIVE_SERVICE_URL}/api/live/conversations`);
        const res = await r.json();
        if (res.success && Array.isArray(res.data)) {
          setConversations(res.data);
        }
      } catch (e) {
        // ignore
      }
    };

    if (!currentConversationId) {
      // fetch immediately and then poll
      fetchConversations();
      t = setInterval(fetchConversations, 3000);
    }

    return () => {
      if (t) clearInterval(t);
    };
  }, [currentConversationId]);

  // Product picker search when opened
  useEffect(() => {
    if (!showProductPicker) return;
    let mounted = true;
    let t: any = null;
    const doSearch = async (q: string) => {
      try {
        setIsSearchingProducts(true);
        const res = await productService.listProducts({
          keyword: q || "",
          limit: 10,
        });
        if (!mounted) return;
        setProductResults(res.items || []);
      } catch (err) {
        console.error("product search error", err);
      } finally {
        setIsSearchingProducts(false);
      }
    };

    t = setTimeout(() => doSearch(productQuery), 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [productQuery, showProductPicker]);

  // Close pickers when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inProduct =
        productPickerRef.current && productPickerRef.current.contains(target);
      const inEmoji =
        emojiPickerRef.current && emojiPickerRef.current.contains(target);
      const onEmojiButton =
        emojiButtonRef.current && emojiButtonRef.current.contains(target);

      if (!inProduct && !inEmoji && !onEmojiButton) {
        if (showProductPicker) setShowProductPicker(false);
        if (showEmojiPicker) setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showProductPicker, showEmojiPicker]);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    try {
      // join first so socket rooms are ready to receive real-time updates
      socket?.emit("joinConversation", {
        conversationId,
        userId: authUser?.id || authUser?._id || "support_1",
        role: authUser?.role,
      });
    } catch (err) {
      console.error("joinConversation emit failed", err);
    }

    // clear old messages while we fetch new ones
    setLiveMessages([]);
    setHasMoreMessages(true);
    (async () => {
      try {
        const r = await fetch(
          `${LIVE_SERVICE_URL}/api/live/conversations/${conversationId}/messages?limit=20`,
        );
        const res = await r.json();
        console.debug("fetched messages for", conversationId, res);
        if (res.success) {
          setLiveMessages(res.data || []);
          // if we received fewer than requested, no more messages
          if (!res.data || res.data.length < 20) setHasMoreMessages(false);
          // allow auto-scroll to bottom for initial load
          autoScrollEnabled.current = true;
        } else {
          console.warn("Failed to fetch messages", res);
        }
      } catch (e) {
        console.error("fetch messages error", e);
      }
    })();
  };

  const loadMoreMessages = async () => {
    if (!currentConversationId || isLoadingMore || !hasMoreMessages) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    setIsLoadingMore(true);
    autoScrollEnabled.current = false;

    // measure scroll position to restore after prepend
    const previousScrollHeight = container.scrollHeight;
    try {
      const earliest = liveMessages[0];
      const before = earliest
        ? encodeURIComponent(earliest.createdAt)
        : undefined;
      const url = `${LIVE_SERVICE_URL}/api/live/conversations/${currentConversationId}/messages?limit=20${before ? `&before=${before}` : ""}`;
      const r = await fetch(url);
      const res = await r.json();
      if (res.success) {
        const newMsgs: Message[] = res.data || [];
        if (newMsgs.length === 0) {
          setHasMoreMessages(false);
        } else {
          setLiveMessages((prev) => [...newMsgs, ...prev]);
          if (newMsgs.length < 20) setHasMoreMessages(false);
          // wait for DOM to update, then adjust scroll to keep view stable
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
            // re-enable auto scroll after small delay
            setTimeout(() => {
              autoScrollEnabled.current = true;
            }, 50);
          });
        }
      }
    } catch (e) {
      console.error("loadMoreMessages error", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const emitTyping = () => {
    if (!socket || !currentConversationId) return;
    try {
      socket.emit("typing", {
        conversationId: currentConversationId,
        senderId: currentUserId,
        senderRole: authUser?.role,
        typing: true,
      });
    } catch (e) {}
    if (localTypingIdle.current) clearTimeout(localTypingIdle.current);
    localTypingIdle.current = setTimeout(() => {
      try {
        socket.emit("typing", {
          conversationId: currentConversationId,
          senderId: currentUserId,
          senderRole: authUser?.role,
          typing: false,
        });
      } catch (e) {}
    }, 1500);
  };

  const handleSendMessage = (text: string) => {
    if (!socket || !currentConversationId) return;
    socket.emit("sendMessage", {
      conversationId: currentConversationId,
      senderId: currentUserId,
      senderRole: authUser?.role,
      message: text,
      senderName: authUser?.fullName || "Support",
      senderAvatar: authUser?.avatarUrl || "",
    });
    // Optimistically move conversation to top and update preview
    setConversations((prev) => {
      try {
        const convId = currentConversationId as string;
        const others = prev.filter((c) => c._id !== convId);
        const exists = prev.find((c) => c._id === convId);
        const preview = `${authUser?.fullName || "Support"}: ${text}`;
        if (exists) {
          const updated: Conversation = {
            ...exists,
            _preview: preview,
            _lastMessageAt: new Date().toISOString(),
          };
          return [updated, ...others];
        }
        const newConv: Conversation = {
          _id: convId,
          customerId: currentUserId || "",
          customerName: currentConversation?.customerName || "User",
          customerAvatar: currentConversation?.customerAvatar,
          lastMessage: text,
          _preview: preview,
          _lastMessageAt: new Date().toISOString(),
        };
        return [newConv, ...others];
      } catch (e) {
        return prev;
      }
    });
    // stop typing indicator
    try {
      socket.emit("typing", {
        conversationId: currentConversationId,
        senderId: currentUserId,
        senderRole: authUser?.role,
        typing: false,
      });
    } catch (e) {}
    if (localTypingIdle.current) {
      clearTimeout(localTypingIdle.current);
      localTypingIdle.current = null;
    }
  };

  const handleUploadFile = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      alert("Chỉ chấp nhận ảnh jpg, png, webp");
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
      form.append("file", file);
      form.append("type", "chat");

      const res = await fetch(`${UPLOAD_SERVICE_URL}/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        alert("Upload thất bại");
        return;
      }

      const data = await res.json();
      const fileUrl =
        data.url || data.secure_url || (data.data && data.data.url) || "";

      if (!fileUrl) {
        alert("Upload không trả về URL");
        return;
      }

      socket?.emit("sendMessage", {
        conversationId: currentConversationId,
        senderId: currentUserId,
        senderRole: authUser?.role,
        message: "",
        messageType: "image",
        fileUrl,
        senderName: authUser?.fullName || "Support",
        senderAvatar: authUser?.avatarUrl || "",
      });
    } catch (err) {
      console.error("file upload error", err);
      alert("Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    if (!socket || !currentConversationId) return;
    const productData = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      price: product.price,
    };

    socket.emit("sendMessage", {
      conversationId: currentConversationId,
      senderId: currentUserId,
      senderRole: authUser?.role,
      message: "",
      messageType: "product",
      productId: product._id,
      productData,
      senderName: authUser?.fullName || "Support",
      senderAvatar: authUser?.avatarUrl || "",
    });

    setShowProductPicker(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 gap-4">
      {/* Conversations Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 flex flex-col overflow-hidden h-full">
        <div className="mb-2 flex flex-shrink-0 flex-wrap items-end justify-between gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-orange-500">
              Support Panel
            </p>
            <h1 className="text-xl font-black text-gray-950 dark:text-white">
              Quản lý tin nhắn
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Giờ làm việc: 08:00–12:00 &amp; 13:00–17:00
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 p-2">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No conversations
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => handleSelectConversation(c._id)}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-800",
                  currentConversationId === c._id
                    ? "bg-orange-50 dark:bg-orange-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
              >
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  {c.customerName}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {c._preview || c.lastMessage || "No messages"}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {c._lastMessageAt || c.lastMessageAt
                    ? new Date(
                        (c._lastMessageAt || c.lastMessageAt) as string,
                      ).toLocaleString()
                    : ""}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
        {currentConversationId ? (
          <>
            {/* Chat Header */}
            <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                  {currentConversation?.customerAvatar ? (
                    <img
                      src={currentConversation.customerAvatar}
                      alt={currentConversation.customerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-600">
                      U
                    </div>
                  )}
                </div>
                <div className="font-semibold text-gray-950 dark:text-white">
                  {currentConversation?.customerName}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={(e) => {
                const el = e.target as HTMLDivElement;
                if (el.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
                  loadMoreMessages();
                }
              }}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4"
            >
              {liveMessages.map((msg, idx) => {
                const isSupport =
                  msg.senderRole === "support" || msg.senderRole === "admin";
                const date = new Date(msg.createdAt);
                const showDate =
                  idx === 0 ||
                  new Date(liveMessages[idx - 1].createdAt).toDateString() !==
                    date.toDateString();

                return (
                  <div key={msg._id || idx}>
                    {showDate && (
                      <div className="flex justify-center py-2">
                        <span className="text-xs text-gray-400 dark:text-gray-600">
                          {date.toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex gap-3",
                        isSupport && "flex-row-reverse",
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center",
                          isSupport
                            ? "bg-orange-100 dark:bg-orange-500/20"
                            : "bg-gray-200 dark:bg-gray-700",
                        )}
                      >
                        {msg.senderAvatar ? (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {msg.senderName?.[0] || "U"}
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          "max-w-xs",
                          isSupport && "flex flex-col items-end",
                        )}
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {msg.senderName || "User"}
                        </div>

                        {msg.messageType === "image" && msg.fileUrl && (
                          <img
                            src={msg.fileUrl}
                            alt="attachment"
                            className="max-h-48 rounded-lg"
                          />
                        )}

                        {msg.messageType === "product" && msg.productData && (
                          <button
                            onClick={() =>
                              window.open(
                                `/products/${msg.productData._id}`,
                                "_blank",
                              )
                            }
                            className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            {msg.productData.imageUrl && (
                              <img
                                src={msg.productData.imageUrl}
                                alt={msg.productData.name}
                                className="h-16 w-16 object-cover rounded"
                              />
                            )}
                            <div className="text-left">
                              <div className="font-semibold text-sm">
                                {msg.productData.name}
                              </div>
                              <div className="text-sm text-orange-600 font-bold">
                                {(msg.productData.price || 0).toLocaleString(
                                  "vi-VN",
                                )}
                                đ
                              </div>
                            </div>
                          </button>
                        )}

                        {msg.message && (
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2 text-sm",
                              isSupport
                                ? "bg-orange-500 text-white dark:bg-orange-600"
                                : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white",
                            )}
                          >
                            {msg.message}
                          </div>
                        )}

                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {date.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingMap[currentConversationId || ""] && (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Đang nhập...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3" />

              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    emitTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && inputText.trim()) {
                      handleSendMessage(inputText);
                      setInputText("");
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />

                <button
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="rounded-2xl bg-gray-100 p-2.5 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
                >
                  <Smile
                    size={18}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </button>

                <label className="flex items-center justify-center rounded-2xl bg-gray-100 p-2.5 cursor-pointer hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition">
                  <ImageIcon
                    size={18}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFile(file);
                    }}
                    disabled={isUploading}
                  />
                </label>

                <button
                  onClick={() => setShowProductPicker((s) => !s)}
                  className="rounded-2xl bg-gray-100 p-2.5 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
                  title="Gửi sản phẩm"
                >
                  🛍️
                </button>

                <button
                  onClick={() => {
                    if (inputText.trim()) {
                      handleSendMessage(inputText);
                      setInputText("");
                    }
                  }}
                  disabled={isUploading || !inputText.trim()}
                  className="rounded-2xl bg-orange-500 p-2.5 text-white hover:bg-orange-600 transition disabled:opacity-50 dark:hover:bg-orange-600"
                >
                  <Send size={18} />
                </button>
              </div>

              {showProductPicker && (
                <div
                  ref={productPickerRef}
                  style={{
                    position: "absolute",
                    bottom: 80,
                    right: 20,
                    zIndex: 60,
                    width: 360,
                    height: 420,
                    display: "flex",
                    flexDirection: "column",
                    background: "white",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Tìm sản phẩm..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {isSearchingProducts ? <div>Đang tìm...</div> : null}
                    {productResults.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          padding: 8,
                          cursor: "pointer",
                          borderRadius: 6,
                        }}
                      >
                        <img
                          src={p.imageUrl || "https://placehold.co/80x80"}
                          alt={p.name}
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "cover",
                            borderRadius: 8,
                            flex: "0 0 56px",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {(p.price || 0).toLocaleString("vi-VN")}đ
                          </div>
                        </div>
                      </div>
                    ))}
                    {productResults.length === 0 && !isSearchingProducts && (
                      <div style={{ padding: 8, color: "#6b7280" }}>
                        Không tìm thấy sản phẩm
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  style={{
                    position: "absolute",
                    bottom: 72,
                    right: 56,
                    zIndex: 70,
                  }}
                >
                  <Picker
                    onEmojiClick={(e) =>
                      setInputText((v) => v + (e.emoji || ""))
                    }
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-0 items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a conversation to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
