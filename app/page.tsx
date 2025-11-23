'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../lib/supabase.js/supabase"; 
import { 
  MessageSquare, Hash, Users, Search, 
  Share2, Send, Home as HomeIcon, TrendingUp, ThumbsUp, LogIn, LogOut, X, Loader2,
  Plus, DollarSign // <--- Added these imports for the Marketplace
} from 'lucide-react';

// --- CHAT LOUNGE COMPONENT ---
const ChatLounge = ({ communitySlug, user }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('community_slug', communitySlug)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel('realtime messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [communitySlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!user) {
        alert("Please sign in to chat!");
        return;
    }

    const username = user.email.split('@')[0];

    await supabase.from('messages').insert({
      content: newMessage,
      user_display_name: username, 
      community_slug: communitySlug
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F0F2F5]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.user_display_name === user?.email?.split('@')[0] ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.user_display_name === user?.email?.split('@')[0]
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.user_display_name}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={user ? "Message #future-tech..." : "Sign in to chat..."}
          disabled={!user}
          className="flex-1 bg-gray-100 border-0 rounded-full px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
        />
        <button disabled={!user} type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50">
          <Send className="w-5 h-5 pl-0.5" />
        </button>
      </form>
    </div>
  );
};

// --- MARKETPLACE COMPONENT ---
const MarketplaceView = ({ user }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // New Item Form State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleSellItem = async () => {
    if (!user) return alert("Please sign in to sell items!");
    if (!newItemTitle || !newItemPrice || !newItemImage) return alert("Please fill in all fields");

    setIsUploading(true);

    // 1. Upload Image
    const fileName = `${Date.now()}-${newItemImage.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('marketplace')
      .upload(fileName, newItemImage);

    if (uploadError) {
      alert("Error uploading image: " + uploadError.message);
      setIsUploading(false);
      return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('marketplace')
      .getPublicUrl(fileName);

    // 3. Save to Database
    const { error: dbError } = await supabase.from('market_items').insert({
      title: newItemTitle,
      price: parseFloat(newItemPrice),
      image_url: publicUrl,
      seller_email: user.email
    });

    if (dbError) alert(dbError.message);
    else {
      setIsFormOpen(false);
      setNewItemTitle('');
      setNewItemPrice('');
      setNewItemImage(null);
      fetchItems(); // Refresh grid
    }
    setIsUploading(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
        <button 
          onClick={() => user ? setIsFormOpen(!isFormOpen) : alert("Sign in to sell!")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Sell Item
        </button>
      </div>

      {/* SELL FORM */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4">List new item</h3>
          <div className="space-y-4">
            <input 
              placeholder="Item Title (e.g. iPhone 15)" 
              className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-green-500"
              value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)}
            />
            <div className="flex gap-4">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                <input 
                  type="number" 
                  placeholder="Price" 
                  className="w-full p-3 pl-9 border border-gray-200 rounded-lg outline-none focus:border-green-500"
                  value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                />
              </div>
              <input 
                type="file" 
                accept="image/*"
                className="flex-1 p-2 border border-gray-200 rounded-lg"
                onChange={e => e.target.files && setNewItemImage(e.target.files[0])}
              />
            </div>
            <button 
              onClick={handleSellItem}
              disabled={isUploading}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'List Item'}
            </button>
          </div>
        </div>
      )}

      {/* ITEMS GRID */}
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-100 relative">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">
                Sold by {item.seller_email.split('@')[0]}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
              <p className="text-green-700 font-bold text-xl">${item.price}</p>
              <button className="w-full mt-3 border border-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 text-sm">
                Message Seller
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- THREAD CARD COMPONENT (WITH LIKES & COMMENTS) ---
const ThreadCard = ({ post, currentUser }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Like State
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);

  // Check Like Status
  useEffect(() => {
    if (!currentUser) return;
    const checkLikeStatus = async () => {
      const { data } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_email', currentUser.email)
        .single();
      if (data) setLiked(true);
    };
    checkLikeStatus();
  }, [currentUser, post.id]);

  const toggleLike = async () => {
    if (!currentUser) return alert("Please sign in to like posts!");
    
    const newLikedState = !liked;
    const newCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(newLikedState);
    setLikeCount(newCount);

    if (newLikedState) {
      await supabase.from('post_likes').insert({ post_id: post.id, user_email: currentUser.email });
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', post.id);
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_email', currentUser.email);
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', post.id);
    }
  };

  const toggleComments = async () => {
    if (!isExpanded) {
      setLoadingComments(true);
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
      setLoadingComments(false);
    }
    setIsExpanded(!isExpanded);
  };

  const postComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    const fakeComment = {
      id: Math.random(), 
      content: newComment, 
      user_display_name: currentUser.email.split('@')[0], 
      created_at: new Date().toISOString() 
    };
    setComments([...comments, fakeComment]);
    setNewComment('');

    await supabase.from('comments').insert({
      content: fakeComment.content,
      post_id: post.id,
      user_display_name: fakeComment.user_display_name
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 mb-4 hover:shadow-md transition-shadow">
      <div className="p-4 pb-2 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_display_name}`} alt="avatar" />
          </div>
          <div>
            <div className="flex items-center">
               <span className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer">
                 {post.user_display_name}
               </span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
               <span>{new Date(post.created_at).toLocaleDateString()}</span>
               <Users className="w-3 h-3 ml-1 mr-1" />
               <span>Public</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-2">
        <p className="text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="px-2 py-1 flex items-center justify-between border-t border-gray-100 mt-2">
        <button 
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm transition-colors ${
            liked ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> {Math.max(0, likeCount)}
        </button>
        <button 
          onClick={toggleComments}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}
        >
          <MessageSquare className="w-5 h-5" /> {isExpanded ? 'Close' : 'Comment'}
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-md text-gray-500 font-medium text-sm">
          <Share2 className="w-5 h-5" /> Share
        </button>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2">
           <div className="space-y-3 mb-4 pl-2">
              {loadingComments ? (
                 <p className="text-gray-400 text-sm italic">Loading comments...</p>
              ) : comments.length === 0 ? (
                 <p className="text-gray-400 text-sm italic">No comments yet. Be the first!</p>
              ) : (
                 comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-300 shrink-0 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_display_name}`} alt="av" />
                       </div>
                       <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none border border-gray-200 shadow-sm">
                          <span className="text-xs font-bold text-gray-900 block mb-0.5">{c.user_display_name}</span>
                          <p className="text-sm text-gray-700">{c.content}</p>
                       </div>
                    </div>
                 ))
              )}
           </div>
           <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={currentUser ? "Write a reply..." : "Sign in to reply"} 
                disabled={!currentUser}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && postComment()}
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm outline-none focus:border-blue-500"
              />
              <button 
                onClick={postComment}
                disabled={!currentUser || !newComment}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold disabled:opacity-50"
              >
                Reply
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

// Updated Sidebar Item to accept onClick
const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all mb-1 ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-full ${active ? 'bg-blue-100' : 'bg-gray-100'}`}>
         <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-600'}`} />
      </div>
      <span className={`font-medium text-[15px] ${active ? 'font-semibold' : ''}`}>{label}</span>
    </div>
  </div>
);

const TabButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-4 py-3 text-[15px] font-semibold border-b-[3px] transition-all ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
    {label}
  </button>
);

// --- MAIN APP COMPONENT ---

export default function Home() {
  const [viewMode, setViewMode] = useState('threads'); // 'threads' | 'lounge' | 'market'
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Data State
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPostBoxOpen, setIsPostBoxOpen] = useState(false);

  // Load User & Posts
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });

    fetchPosts();

    return () => subscription.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
          email: loginEmail,
          options: {
             emailRedirectTo: `${window.location.origin}`,
          }
      });
      if (error) {
          alert(error.message);
      } else {
          alert('Magic Link sent! Check your email.');
          setIsLoginOpen(false);
      }
      setAuthLoading(false);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    if (!user) {
        setIsLoginOpen(true);
        return;
    }
    
    setIsPosting(true);

    const { error } = await supabase.from('posts').insert({
        content: newPostContent,
        user_display_name: user.email.split('@')[0], 
        community_slug: 'future-tech'
    });

    if (error) {
        alert("Error posting: " + error.message);
    } else {
        await fetchPosts(); 
        setNewPostContent('');
        setIsPostBoxOpen(false);
    }
    setIsPosting(false);
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-gray-900 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 bg-white shadow-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 border-b border-gray-200">
         <div className="flex items-center gap-3 w-64">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white">
               <Hash className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-blue-600 tracking-tighter">Dialect</span>
         </div>
         <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
               <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Search Dialect..." className="w-full bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-blue-500 rounded-full py-2 pl-10 pr-4 transition-all text-sm outline-none" />
            </div>
         </div>
         
         {/* AUTH BUTTONS IN HEADER */}
         <div className="flex items-center gap-4 w-64 justify-end">
            {user ? (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold hidden md:block">{user.email.split('@')[0]}</span>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500" title="Sign Out">
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.email[0].toUpperCase()}
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-full font-bold text-sm transition-colors"
                >
                    <LogIn className="w-4 h-4" /> Sign In
                </button>
            )}
         </div>
      </header>

      {/* LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsLoginOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to Dialect</h2>
                    <p className="text-gray-500 mt-1">Enter your email to sign in or create an account.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="email" 
                        required
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button 
                        disabled={authLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {authLoading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Send Magic Link'}
                    </button>
                </form>
                <p className="text-xs text-center text-gray-400 mt-4">We'll email you a magic link for a password-free sign in.</p>
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex pt-14 w-full max-w-[1600px] mx-auto h-full">
         <div className="w-[280px] hidden lg:flex flex-col p-4 overflow-y-auto h-full fixed left-0 top-14 bottom-0">
            {/* 1. Home Button switches to 'threads' */}
            <SidebarItem 
              icon={HomeIcon} 
              label="Home Feed" 
              active={viewMode === 'threads' || viewMode === 'lounge'} 
              onClick={() => setViewMode('threads')} 
            />
            
            <SidebarItem icon={Users} label="Friends" />

            {/* 2. Marketplace Button switches to 'market' */}
            <SidebarItem 
              icon={TrendingUp} 
              label="Marketplace" 
              active={viewMode === 'market'} 
              onClick={() => setViewMode('market')} 
            />

            <div className="border-t border-gray-200 my-2"></div>
            <span className="text-gray-500 font-semibold text-[13px] px-3 mt-2 mb-1">Your Communities</span>
            <SidebarItem icon={Hash} label="Future Tech" active={viewMode === 'threads' || viewMode === 'lounge'} onClick={() => setViewMode('threads')} />
         </div>

         <div className="flex-1 flex justify-center overflow-y-auto lg:ml-[280px] lg:mr-[320px] w-full p-4 custom-scrollbar">
            <div className="w-full max-w-[680px] pb-20">
               
               {/* BANNER (Only shows when NOT in marketplace) */}
               {viewMode !== 'market' && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                    <div className="px-6 pb-4">
                        <div className="flex justify-between items-end -mt-6 mb-4">
                           <div className="bg-white p-1 rounded-xl shadow-sm">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                 <Hash className="w-10 h-10 text-gray-400" />
                              </div>
                           </div>
                           <button className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md text-sm">Joined</button>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Future Tech</h1>
                        <p className="text-gray-600 mt-3 text-sm border-t border-gray-100 pt-3">Discussing the bleeding edge of technology.</p>
                    </div>
                    <div className="px-4 flex border-t border-gray-200">
                        <TabButton active={viewMode === 'threads'} onClick={() => setViewMode('threads')} label="Posts" />
                        <TabButton active={viewMode === 'lounge'} onClick={() => setViewMode('lounge')} label="Chat Lounge" />
                    </div>
                 </div>
               )}

               {/* CONTENT AREA */}
               
               {/* 1. Show Marketplace */}
               {viewMode === 'market' && (
                 <MarketplaceView user={user} />
               )}

               {/* 2. Show Threads (Feed) */}
               {viewMode === 'threads' && (
                  <div className="animate-in fade-in duration-300">
                      
                      {/* CREATE POST BOX */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                         <div className="flex gap-3">
                            {user ? (
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                    {user.email[0].toUpperCase()}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                            )}
                            
                            {!isPostBoxOpen ? (
                                <div 
                                    onClick={() => user ? setIsPostBoxOpen(true) : setIsLoginOpen(true)}
                                    className="flex-1 bg-gray-100 rounded-full px-4 flex items-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    What's on your mind?
                                </div>
                            ) : (
                                <div className="flex-1 animate-in fade-in">
                                    <textarea 
                                        autoFocus
                                        className="w-full min-h-[100px] resize-none outline-none text-gray-600 placeholder-gray-400 text-lg"
                                        placeholder="Share your thoughts..."
                                        value={newPostContent}
                                        onChange={e => setNewPostContent(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                                        <button onClick={() => setIsPostBoxOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium">Cancel</button>
                                        <button 
                                            onClick={handleCreatePost}
                                            disabled={!newPostContent || isPosting}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isPosting && <Loader2 className="w-3 h-3 animate-spin"/>} Post
                                        </button>
                                    </div>
                                </div>
                            )}
                         </div>
                      </div>
                      
                      {/* THREAD LIST */}
                      {posts.length === 0 ? (
                         <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                             <p>No posts yet. Be the first to start the conversation!</p>
                         </div>
                      ) : (
                         posts.map(post => (
                             <ThreadCard key={post.id} post={post} currentUser={user} />
                         ))
                      )}
                  </div>
               )}

               {/* 3. Show Chat */}
               {viewMode === 'lounge' && (
                  <ChatLounge communitySlug="future-tech" user={user} />
               )}
            </div>
         </div>

         {/* RIGHT SIDEBAR */}
         <div className="hidden lg:block w-[320px] p-4 fixed right-0 top-14 bottom-0 overflow-y-auto h-full border-l border-gray-200 bg-white z-10">
            <h3 className="text-gray-500 font-semibold text-[13px] mb-3">Sponsored</h3>
            <div className="flex gap-3 mb-3 cursor-pointer group">
               <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0"></div>
               <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:underline">Learn Rust</p>
                  <p className="text-xs text-gray-500">rust-lang.org</p>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}