import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Heart, CornerDownRight, Send, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function CommentsSection({ articleUrl }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    let unsubscribe = () => {};

    if (db) {
      const q = query(
        collection(db, 'comments'),
        where('articleUrl', '==', articleUrl),
        orderBy('createdAt', 'asc')
      );
      unsubscribe = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setComments(list);
      }, (err) => {
        console.error('Error fetching comments from firestore:', err);
      });
    }

    return () => unsubscribe();
  }, [articleUrl]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const commentData = {
      articleUrl,
      text: text.trim(),
      uid: user ? user.uid : 'guest',
      displayName: user ? (user.displayName || user.email.split('@')[0]) : 'Guest Reader',
      photoURL: user ? user.photoURL : `https://api.dicebear.com/7.x/identicon/svg?seed=${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      parentId: null
    };

    if (db) {
      try {
        await addDoc(collection(db, 'comments'), commentData);
        setText('');
      } catch (err) {
        console.error('Error adding comment:', err);
      }
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const replyData = {
      articleUrl,
      text: replyText.trim(),
      uid: user ? user.uid : 'guest',
      displayName: user ? (user.displayName || user.email.split('@')[0]) : 'Guest Reader',
      photoURL: user ? user.photoURL : `https://api.dicebear.com/7.x/identicon/svg?seed=${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      parentId: parentId
    };

    if (db) {
      try {
        await addDoc(collection(db, 'comments'), replyData);
        setReplyText('');
        setReplyTo(null);
      } catch (err) {
        console.error('Error adding reply:', err);
      }
    }
  };

  const handleLike = async (commentId) => {
    const viewerUid = user ? user.uid : 'guest';
    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment) return;

    const likedBy = targetComment.likedBy || [];
    const index = likedBy.indexOf(viewerUid);
    let newLikes = targetComment.likes || 0;
    let newLikedBy = [...likedBy];

    if (index > -1) {
      newLikedBy.splice(index, 1);
      newLikes = Math.max(0, newLikes - 1);
    } else {
      newLikedBy.push(viewerUid);
      newLikes += 1;
    }

    if (db) {
      try {
        await updateDoc(doc(db, 'comments', commentId), {
          likes: newLikes,
          likedBy: newLikedBy
        });
      } catch (err) {
        console.error('Error updating comment likes:', err);
      }
    }
  };

  const handleDelete = async (commentId) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
      } catch (err) {
        console.error('Error deleting comment:', err);
      }
    }
  };

  // Group threads
  const parentComments = comments.filter(c => !c.parentId);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  return (
    <div class="mt-4 pt-4 border-t border-paper-border dark:border-paper-borderDark text-xs">
      <div class="flex items-center gap-1.5 font-bold uppercase tracking-wider text-navy dark:text-gold mb-3 font-serif">
        <MessageSquare size={13} />
        <span>Reader Debate Ledger ({comments.length})</span>
      </div>

      {/* Main Comment Input */}
      <form onSubmit={handleAddComment} class="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder={user ? "Submit your analysis to the wire..." : "Log in to join the reader debate..."}
          disabled={!user}
          value={text}
          onChange={(e) => setText(e.target.value)}
          class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
        />
        <button
          type="submit"
          disabled={!user || !text.trim()}
          class="bg-navy hover:bg-navy-light text-gold p-1.5 rounded transition-all disabled:opacity-50 shrink-0"
        >
          <Send size={13} />
        </button>
      </form>

      {/* Comments List */}
      <div class="space-y-4 max-h-[250px] overflow-y-auto pr-1 scrollbar-none">
        {parentComments.length === 0 ? (
          <p class="text-[10px] text-gray-400 italic text-center py-2">No statements recorded on this wire briefing.</p>
        ) : (
          parentComments.map((comm) => (
            <div key={comm.id} class="space-y-2 border-b border-gray-550/30 dark:border-gray-800/30 pb-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-1.5">
                  <img src={comm.photoURL} alt="avatar" class="w-4.5 h-4.5 rounded-full object-cover border border-gold/40" />
                  <span class="font-bold text-navy dark:text-gray-250 uppercase text-[10px]">{comm.displayName}</span>
                  <span class="text-[9px] text-gray-400 font-mono">{new Date(comm.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <button 
                    onClick={() => handleLike(comm.id)}
                    class="flex items-center gap-0.5 text-gray-400 hover:text-red-500 font-bold"
                  >
                    <Heart size={11} class={comm.likedBy?.includes(user?.uid) ? "fill-red-500 text-red-500" : ""} />
                    <span class="font-mono text-[9px]">{comm.likes || 0}</span>
                  </button>
                  <button 
                    onClick={() => setReplyTo(replyTo === comm.id ? null : comm.id)}
                    class="text-gold hover:underline text-[9px] font-bold uppercase"
                  >
                    Reply
                  </button>
                  {user && (user.uid === comm.uid || user.email === 'admin@economicalresearch.com') && (
                    <button 
                      onClick={() => handleDelete(comm.id)}
                      class="text-red-400 hover:text-red-500"
                      title="Erase Statement"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
              <p class="text-navy/90 dark:text-gray-300 pl-6 leading-relaxed text-[11px] font-sans">{comm.text}</p>

              {/* Reply Input */}
              {replyTo === comm.id && (
                <form onSubmit={(e) => handleAddReply(e, comm.id)} class="flex gap-2 pl-6 pt-1">
                  <input
                    type="text"
                    placeholder="Enter dispatch response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    class="bg-navy text-gold px-2 py-1 rounded text-[10px] uppercase font-bold"
                  >
                    Submit
                  </button>
                </form>
              )}

              {/* Replies Thread */}
              {repliesMap[comm.id] && repliesMap[comm.id].map((rep) => (
                <div key={rep.id} class="pl-6 flex items-start gap-2 pt-1.5">
                  <CornerDownRight size={12} class="text-gray-405 shrink-0 mt-1" />
                  <div class="flex-grow space-y-1 bg-gray-50/50 dark:bg-navy-light/5 p-2 rounded border border-gray-100 dark:border-gray-850">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5">
                        <img src={rep.photoURL} alt="avatar" class="w-4 h-4 rounded-full object-cover" />
                        <span class="font-bold text-navy dark:text-gray-300 uppercase text-[9px]">{rep.displayName}</span>
                        <span class="text-[8px] text-gray-400 font-mono">{new Date(rep.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleLike(rep.id)}
                          class="flex items-center gap-0.5 text-gray-400 hover:text-red-500"
                        >
                          <Heart size={10} class={rep.likedBy?.includes(user?.uid) ? "fill-red-500 text-red-500" : ""} />
                          <span class="font-mono text-[8px]">{rep.likes || 0}</span>
                        </button>
                        {user && (user.uid === rep.uid || user.email === 'admin@economicalresearch.com') && (
                          <button 
                            onClick={() => handleDelete(rep.id)}
                            class="text-red-400 hover:text-red-500"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p class="text-navy/80 dark:text-gray-300 text-[10.5px] leading-relaxed font-sans">{rep.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
