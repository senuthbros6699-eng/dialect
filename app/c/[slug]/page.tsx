'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../../lib/supabase.js/supabase"; 
import { 
  MessageSquare, Hash, Users, Search, 
  Share2, Send, Home as HomeIcon, TrendingUp, ThumbsUp, LogIn, LogOut, X, Loader2,
  Plus, DollarSign 
} from 'lucide-react';

// --- USER PROFILE MODAL --- (Code omitted for brevity but included in the final paste)
const UserProfile = ({ username, currentUser, onClose }: any) => {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ postCount: 0, totalLikes: 0 });
  const [profileData, setProfileData] = useState<any>({ avatar_url: null, banner_url: null });
  const [isUploading, setIsUploading] = useState(false);
  const isMyProfile = currentUser?.email?.split('@')[0] === username;

  useEffect(() => {
    const fetchData = async () => {
      const { data: posts } = await supabase.from('posts').select('*').eq('user_display_name', username).order('created_at', { ascending: false });
      if (posts) {
        setUserPosts(posts);
        const totalLikes = posts.reduce((acc, post) => acc + Math.max(0, post.likes_count || 0), 0);
        setStats({ postCount: posts.length, totalLikes });
      }

      const { data: profile } = await supabase.from('user_profiles').select('*').eq('username', username).single();
      if (profile) setProfileData(profile);
    };
    fetchData();
  }, [username]);

  const handleImageUpload = async (event: any, type: 'avatar' | 'banner') => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);
    const file = event.target.files[0];
    const fileName = `${username}-${type}-${Date.now()}`;
    
    const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file);

    if (uploadError) {
      alert("Error uploading: " + uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
    const updates = type === 'avatar' ? { avatar_url: publicUrl } : { banner_url: publicUrl };
    
    await supabase.from('user_profiles').upsert({ username: username, ...profileData, ...updates });
    setProfileData({ ...profileData, ...updates });
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 relative">
        <div className="h-32 bg-gray-200 relative group">
            {profileData.banner_url ? (
                <img src={profileData.banner_url} className="w-full h-full object-cover" alt="banner" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
            
            {isMyProfile && (
                <label className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg cursor-pointer text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Change Banner
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner')} />
                </label>
            )}

            <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-4">
             <div className="w-24 h-24 bg-white p-1 rounded-full shadow-md inline-block relative group">
               <img 
                 src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
                 alt="avatar" 
                 className="w-full h-full rounded-full bg-gray-100 object-cover"
               />
               {isMyProfile && (
                   <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white text-xs font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                       Edit
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
                   </label>
               )}
             </div>
             {isUploading && <span className="ml-3 text-sm text-blue-600 font-bold animate-pulse">Uploading...</span>}
          </div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">@{username}</h2>
              <p className="text-gray-500 text-sm">Community Member {isMyProfile && "(You)"}</p>
            </div>
            <div className="flex gap-4 text-center">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="block font-bold text-blue-700 text-xl">{stats.postCount}</span>
                <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">Posts</span>
              </div>
              <div className="bg-orange-50 px-4 py-2 rounded-lg">
                <span className="block font-bold text-orange-700 text-xl">{stats.totalLikes}</span>
                <span className="text-xs text-orange-600 uppercase font-bold tracking-wider">Karma</span>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
            <HomeIcon className="w-4 h-4" /> Recent Activity
          </h3>
          <div className="h-64 overflow-y-auto custom-scrollbar pr-2 space-y-3">
             {userPosts.length === 0 ? (
               <p className="text-gray-400 italic">No posts yet.</p>
             ) : (
               userPosts.map(post => (
                 <div key={post.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <p className="text-sm text-gray-800 line-clamp-2">{post.content}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {Math.max(0, post.likes_count || 0)}
                      </span>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- CHAT LOUNGE COMPONENT --- (Code omitted for brevity but included in the final paste)
const ChatLounge = ({ communitySlug, user }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('community_slug', communitySlug).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel('realtime messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [communitySlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!user) { alert("Please sign in to chat!"); return; }

    const username = user.email.split('@')[0];

    await supabase.from('messages').insert({ content: newMessage, user_display_name: username, community_slug: communitySlug });
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

// --- MARKETPLACE COMPONENT --- (Code omitted for brevity but included in the final paste)
const MarketplaceView = ({ user }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleSellItem = async () => {
    if (!user) return alert("Please sign in to sell items!");
    if (!newItemTitle || !newItemPrice || !newItemImage) return alert("Please fill in all fields");
    setIsUploading(true);
    const fileName = `${Date.now()}-${newItemImage.name}`;
    const { error: uploadError } = await supabase.storage.from('marketplace').upload(fileName, newItemImage);
    if (uploadError) { alert("Error uploading image: " + uploadError.message); setIsUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('marketplace').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('market_items').insert({
      title: newItemTitle, price: parseFloat(newItemPrice), image_url: publicUrl, seller_email: user.email
    });

    if (dbError) alert(dbError.message);
    else { setIsFormOpen(false); setNewItemTitle(''); setNewItemPrice(''); setNewItemImage(null); fetchItems(); }
    setIsUploading(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
        <button onClick={() => user ? setIsFormOpen(!isFormOpen) : alert("Sign in to sell!")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        > <Plus className="w-5 h-5" /> Sell Item </button>
      </div>
      {isFormOpen && ( /* Sell Form JSX */
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4">List new item</h3>
          <div className="space-y-4">
            <input placeholder="Item Title (e.g. iPhone 15)" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-green-500" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
            <div className="flex gap-4">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                <input type="number" placeholder="Price" className="w-full p-3 pl-9 border border-gray-200 rounded-lg outline-none focus:border-green-500" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
              </div>
              <input type="file" accept="image/*" className="flex-1 p-2 border border-gray-200 rounded-lg" onChange={e => e.target.files && setNewItemImage(e.target.files[0])} />
            </div>
            <button onClick={handleSellItem} disabled={isUploading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black disabled:opacity-50" >
              {isUploading ? 'Uploading...' : 'List Item'}
            </button>
          </div>
        </div>
      )}
      {/* Items Grid JSX */}
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-100 relative">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm"> Sold by {item.seller_email.split('@')[0]} </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
              <p className="text-green-700 font-bold text-xl">${item.price}</p>
              <button className="w-full mt-3 border border-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 text-sm"> Message Seller </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- THREAD CARD COMPONENT --- (Code omitted for brevity but included in the final paste)
const ThreadCard = ({ post, currentUser, onUserClick, profileMap }: any) => {
  // Determine the correct avatar URL: custom URL first, then DiceBear fallback
  const customAvatarUrl = profileMap[post.user_display_name]?.avatar_url;
  const avatarSrc = customAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_display_name}`;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);

  useEffect(() => {
    if (!currentUser) return;
    const checkLikeStatus = async () => {
      const { data } = await supabase.from('post_likes').select('*').eq('post_id', post.id).eq('user_email', currentUser.email).single();
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
      const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
      if (data) setComments(data);
      setLoadingComments(false);
    }
    setIsExpanded(!isExpanded);
  };

  const postComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    const fakeComment = { id: Math.random(), content: newComment, user_display_name: currentUser.email.split('@')[0], created_at: new Date().toISOString() };
    setComments([...comments, fakeComment]);
    setNewComment('');
    await supabase.from('comments').insert({ content: fakeComment.content, post_id: post.id, user_display_name: fakeComment.user_display_name });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 mb-4 hover:shadow-md transition-shadow">
      <div className="p-4 pb-2 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
             <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center">
               <span onClick={() => onUserClick(post.user_display_name)} className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer">
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
      <div className="px-4 py-2"> <p className="text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p> </div>
      <div className="px-2 py-1 flex items-center justify-between border-t border-gray-100 mt-2">
        <button onClick={toggleLike} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm transition-colors ${ liked ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50' }`} >
          <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> {Math.max(0, likeCount)}
        </button>
        <button onClick={toggleComments} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`} >
          <MessageSquare className="w-5 h-5" /> {isExpanded ? 'Close' : 'Comment'}
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-md text-gray-500 font-medium text-sm"> <Share2 className="w-5 h-5" /> Share </button>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2">
           <div className="space-y-3 mb-4 pl-2">
              {loadingComments ? ( <p className="text-gray-400 text-sm italic">Loading comments...</p> ) : comments.length === 0 ? ( <p className="text-gray-400 text-sm italic">No comments yet.</p> ) : (
                 comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-300 shrink-0 overflow-hidden"> <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_display_name}`} alt="av" /> </div>
                       <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none border border-gray-200 shadow-sm">
                          <span className="text-xs font-bold text-gray-900 block mb-0.5">{c.user_display_name}</span>
                          <p className="text-sm text-gray-700">{c.content}</p>
                       </div>
                    </div>
                 ))
              )}
           </div>
           <div className="flex gap-2">
              <input type="text" placeholder={currentUser ? "Write a reply..." : "Sign in to reply"} disabled={!currentUser} value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()} className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm outline-none focus:border-blue-500" />
              <button onClick={postComment} disabled={!currentUser || !newComment} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold disabled:opacity-50"> Reply </button>
           </div>
        </div>
      )}
    </div>
  );
};
// --- SIDEBAR ITEM COMPONENT ---
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

// --- TAB BUTTON COMPONENT ---
const TabButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-4 py-3 text-[15px] font-semibold border-b-[3px] transition-all ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
    {label}
  </button>
);

// --- DYNAMIC SIDEBAR LIST COMPONENT --- (Code omitted for brevity but included in the final paste)
const CommunityList = ({ currentSlug }: { currentSlug: string }) => {
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase.from('communities').select('*').order('name', { ascending: true });
      if (data) setCommunities(data);
    };
    fetchCommunities();
  }, []);

  return (
    <>
      <span className="text-gray-500 font-semibold text-[13px] px-3 mt-2 mb-1">Your Communities</span>
      {communities.map(community => (
        <SidebarItem
          key={community.slug}
          icon={Hash}
          label={community.name}
          active={currentSlug === community.slug}
          onClick={() => window.location.href = `/c/${community.slug}`}
        />
      ))}
    </>
  );
};

// --- MAIN COMMUNITY PAGE ---
export default function CommunityPage({ params }: { params: { slug: string } }) {
  const currentCommunitySlug = params.slug; 

  const [viewMode, setViewMode] = useState('threads'); 
  const [viewProfile, setViewProfile] = useState<string | null>(null);
  
  // Community Data States
  const [communityData, setCommunityData] = useState<any>(null);
  const [isCommunityLoading, setIsCommunityLoading] = useState(true);

  // Auth, Posts, and other Data States... (omitted for brevity)
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPostBoxOpen, setIsPostBoxOpen] = useState(false);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});


  // EFFECT 1: Auth & Initial Load (runs once)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // EFFECT 2: Community Data Fetch (runs whenever slug changes)
  useEffect(() => {
    const fetchCommunityDetails = async () => {
        setIsCommunityLoading(true);
        const { data } = await supabase
            .from('communities')
            .select('*')
            .eq('slug', currentCommunitySlug)
            .single();

        setCommunityData(data);
        
        if (data) {
            fetchPosts(currentCommunitySlug);
            setIsCommunityLoading(false);
        } else {
            setCommunityData(null); // Explicitly set to null if not found
            setIsCommunityLoading(false);
            setPosts([]);
        }
    };
    fetchCommunityDetails();
  }, [currentCommunitySlug]);

  const fetchPosts = async (slug: string) => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('community_slug', slug)
      .order('created_at', { ascending: false });

    if (postsData) {
        setPosts(postsData);
        
        const usernames = [...new Set(postsData.map(p => p.user_display_name))];
        const { data: profilesData } = await supabase.from('user_profiles').select('username, avatar_url').in('username', usernames);
        
        if (profilesData) {
            const newMap = profilesData.reduce((acc, p) => ({ ...acc, [p.username]: p }), {});
            setProfilesMap(newMap);
        }
    } else {
        setPosts([]);
        setProfilesMap({});
    }
  };

  const handleLogin = async (e: React.FormEvent) => { /* Omitted for brevity */
      e.preventDefault();
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
          email: loginEmail,
          options: { emailRedirectTo: `${window.location.origin}` }
      });
      if (error) { alert(error.message); } else { alert('Magic Link sent! Check your email.'); setIsLoginOpen(false); }
      setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleCreatePost = async () => { /* Omitted for brevity */
    if (!newPostContent.trim()) return;
    if (!user) { setIsLoginOpen(true); return; }
    setIsPosting(true);
    const { error } = await supabase.from('posts').insert({
        content: newPostContent, user_display_name: user.email.split('@')[0], community_slug: currentCommunitySlug
    });
    if (error) { alert("Error posting: " + error.message); } 
    else { await fetchPosts(currentCommunitySlug); setNewPostContent(''); setIsPostBoxOpen(false); }
    setIsPosting(false);
  };
  
  // Render "Community Not Found" if the slug exists but fetched data is null
  if (!isCommunityLoading && !communityData) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F0F2F5] text-center">
            <div className="bg-white p-10 rounded-lg shadow-xl border border-gray-300">
                <Hash className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Community Not Found</h1>
                <p className="text-gray-600">The community /{currentCommunitySlug} does not exist.</p>
                <button onClick={() => window.location.href = '/c/future-tech'} className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
                    Go to Home Feed
                </button>
            </div>
        </div>
    );
  }

  // Render Loading Spinner if data is still fetching
  if (isCommunityLoading) {
    return (
        <div className="p-10 flex items-center gap-2 justify-center h-screen bg-[#F0F2F5]">
             <Loader2 className="animate-spin w-6 h-6 text-blue-600"/> 
             <span className="text-blue-600">Loading Community...</span>
        </div>
    );
  }


  return (
    <div className="flex h-screen bg-[#F0F2F5] text-gray-900 font-sans overflow-hidden">
      {/* HEADER (Omitted for brevity) */}
      <header className="h-14 bg-white shadow-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 border-b border-gray-200">
         <div className="flex items-center gap-3 w-64">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white"> <Hash className="w-6 h-6" /> </div>
            <span className="text-2xl font-bold text-blue-600 tracking-tighter">Dialect</span>
         </div>
         <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full"> <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> <input type="text" placeholder="Search Dialect..." className="w-full bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-blue-500 rounded-full py-2 pl-10 pr-4 transition-all text-sm outline-none" /> </div>
         </div>
         <div className="flex items-center gap-4 w-64 justify-end">
            {user ? ( /* Auth Buttons */
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold hidden md:block">{user.email.split('@')[0]}</span>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500" title="Sign Out"> <LogOut className="w-5 h-5" /> </button>
                    <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold"> {user.email[0].toUpperCase()} </div>
                </div>
            ) : ( <button onClick={() => setIsLoginOpen(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-full font-bold text-sm transition-colors"> <LogIn className="w-4 h-4" /> Sign In </button> )}
         </div>
      </header>

      {/* LOGIN MODAL (Omitted for brevity) */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsLoginOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"> <X className="w-6 h-6" /> </button>
                <div className="mb-6"> <h2 className="text-2xl font-bold text-gray-900">Welcome to Dialect</h2> <p className="text-gray-500 mt-1">Enter your email to sign in or create an account.</p> </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" required placeholder="name@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    <button disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70">
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
            <SidebarItem icon={HomeIcon} label="Home Feed" active={viewMode === 'threads' || viewMode === 'lounge'} onClick={() => window.location.href = `/c/future-tech`} />
            <SidebarItem icon={Users} label="Friends" />
            <SidebarItem icon={TrendingUp} label="Marketplace" active={viewMode === 'market'} onClick={() => setViewMode('market')} />
            <div className="border-t border-gray-200 my-2"></div>
            {/* DYNAMIC COMMUNITY LIST */}
            <CommunityList currentSlug={currentCommunitySlug} />
         </div>

         <div className="flex-1 flex justify-center overflow-y-auto lg:ml-[280px] lg:mr-[320px] w-full p-4 custom-scrollbar">
            <div className="w-full max-w-[680px] pb-20">
               
               {/* BANNER (DYNAMIC CONTENT) */}
               {viewMode !== 'market' && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                    <div className="px-6 pb-4">
                        <div className="flex justify-between items-end -mt-6 mb-4">
                           <div className="bg-white p-1 rounded-xl shadow-sm">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"> <Hash className="w-10 h-10 text-gray-400" /> </div>
                           </div>
                           <button className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md text-sm">Joined</button>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{communityData?.name || currentCommunitySlug}</h1>
                        <p className="text-gray-600 mt-3 text-sm border-t border-gray-100 pt-3">{communityData?.description || 'Community details loading...'}</p>
                    </div>
                    <div className="px-4 flex border-t border-gray-200">
                        <TabButton active={viewMode === 'threads'} onClick={() => setViewMode('threads')} label="Posts" />
                        <TabButton active={viewMode === 'lounge'} onClick={() => setViewMode('lounge')} label="Chat Lounge" />
                    </div>
                 </div>
               )}

               {viewMode === 'market' && ( <MarketplaceView user={user} /> )}

               {viewMode === 'threads' && (
                  <div className="animate-in fade-in duration-300">
                      {/* CREATE POST BOX (Omitted for brevity) */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                         <div className="flex gap-3">
                            {user ? (
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0">
                                    {profilesMap[user.email.split('@')[0]]?.avatar_url ? ( <img src={profilesMap[user.email.split('@')[0]].avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" /> ) : ( user.email[0].toUpperCase() )}
                                </div>
                            ) : ( <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0"> <Users className="w-5 h-5" /> </div> )}
                            
                            {!isPostBoxOpen ? (
                                <div onClick={() => user ? setIsPostBoxOpen(true) : setIsLoginOpen(true)} className="flex-1 bg-gray-100 rounded-full px-4 flex items-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"> What's on your mind? </div>
                            ) : (
                                <div className="flex-1 animate-in fade-in">
                                    <textarea autoFocus className="w-full min-h-[100px] resize-none outline-none text-gray-600 placeholder-gray-400 text-lg" placeholder="Share your thoughts..." value={newPostContent} onChange={e => setNewPostContent(e.target.value)} />
                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                                        <button onClick={() => setIsPostBoxOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium">Cancel</button>
                                        <button onClick={handleCreatePost} disabled={!newPostContent || isPosting} className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                            {isPosting && <Loader2 className="w-3 h-3 animate-spin"/>} Post
                                        </button>
                                    </div>
                                </div>
                            )}
                         </div>
                      </div>
                      
                      {/* THREAD LIST */}
                      {posts.length === 0 ? (
                         <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed"> <p>No posts yet. Be the first to start the conversation!</p> </div>
                      ) : (
                         posts.map(post => (
                             <ThreadCard key={post.id} post={post} currentUser={user} onUserClick={(name: string) => setViewProfile(name)} profileMap={profilesMap} />
                         ))
                      )}
                  </div>
               )}

               {viewMode === 'lounge' && ( <ChatLounge communitySlug={currentCommunitySlug} user={user} /> )}
            </div>
         </div>

         {/* RIGHT SIDEBAR (Omitted for brevity) */}
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
      
      {/* USER PROFILE MODAL (Omitted for brevity) */}
      {viewProfile && ( <UserProfile username={viewProfile} currentUser={user} onClose={() => setViewProfile(null)} /> )}
    </div>
  );
}