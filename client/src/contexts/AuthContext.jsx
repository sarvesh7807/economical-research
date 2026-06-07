import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  db,
  isFirebaseConfigured 
} from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  signInWithPopup, 
  onAuthStateChanged,
  updateProfile,
  deleteUser as fbDeleteUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getDocId = (url) => {
  if (!url) return `art-${Date.now()}`;
  try {
    return btoa(unescape(encodeURIComponent(url)))
      .replace(/=/g, '')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .substring(0, 100);
  } catch (e) {
    return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [readingStats, setReadingStats] = useState({
    articlesRead: 0,
    timeSpentMinutes: 0
  });
  const [subscription, setSubscription] = useState({
    tier: 'Basic',
    plan: null,
    expiresAt: null,
    status: 'Inactive'
  });
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    language: 'English',
    notifications: true,
    privacy: 'private',
    emailAlerts: true,
    pushAlerts: true,
    favTopicAlerts: true,
    subReminderAlerts: true,
    activityAlerts: true,
    quietHours: { enabled: false, start: "22:00", end: "07:00" },
    alertFrequency: "Instant"
  });
  const [notifications, setNotifications] = useState([]);

  // Sync settings, bookmarks, history, stats, subscription, notifications on user change
  useEffect(() => {
    let unsubscribeSettings = () => {};
    let unsubscribeBookmarks = () => {};
    let unsubscribeHistory = () => {};
    let unsubscribeNotifications = () => {};

    if (user) {
      const isMockUser = user.uid.startsWith('mock-');

      if (isFirebaseConfigured && db && !isMockUser) {
        // --- 1. FIREBASE REALTIME SYNC ---
        
        // Sync Settings, Stats & Subscriptions
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeSettings = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.settings) setSettings(data.settings);
            if (data.stats) setReadingStats(data.stats);
            if (data.subscription) setSubscription(data.subscription);
          } else {
            // Set defaults in Firestore
            setDoc(userDocRef, { settings, stats: readingStats, subscription }, { merge: true });
          }
        }, (err) => console.error('Error fetching user document:', err));

        // Sync Bookmarks
        const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
        unsubscribeBookmarks = onSnapshot(bookmarksRef, (snap) => {
          const loaded = [];
          snap.forEach((doc) => loaded.push(doc.data()));
          setBookmarks(loaded);
        }, (err) => console.error('Error fetching bookmarks:', err));

        // Sync Reading History
        const historyRef = collection(db, 'users', user.uid, 'history');
        const historyQuery = query(historyRef, orderBy('readAt', 'desc'), limit(100));
        unsubscribeHistory = onSnapshot(historyQuery, (snap) => {
          const loaded = [];
          snap.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() }));
          setReadingHistory(loaded);
        }, (err) => console.error('Error fetching history:', err));

        // Sync Notifications
        const notificationsRef = collection(db, 'users', user.uid, 'notifications');
        const notificationsQuery = query(notificationsRef, orderBy('timestamp', 'desc'), limit(30));
        unsubscribeNotifications = onSnapshot(notificationsQuery, (snap) => {
          const loaded = [];
          snap.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() }));
          setNotifications(loaded);
        }, (err) => console.error('Error fetching notifications:', err));

      } else {
        // --- 2. LOCALSTORAGE FALLBACK FOR MOCK USERS ---
        const uid = user.uid;

        // Load Settings
        const savedSettings = localStorage.getItem(`er_settings_${uid}`);
        if (savedSettings) setSettings(JSON.parse(savedSettings));
        else setSettings({
          theme: 'light',
          fontSize: 'medium',
          language: 'English',
          notifications: true,
          privacy: 'private',
          emailAlerts: true,
          pushAlerts: true,
          favTopicAlerts: true,
          subReminderAlerts: true,
          activityAlerts: true,
          quietHours: { enabled: false, start: "22:00", end: "07:00" },
          alertFrequency: "Instant"
        });

        // Load Stats
        const savedStats = localStorage.getItem(`er_stats_${uid}`);
        if (savedStats) setReadingStats(JSON.parse(savedStats));
        else setReadingStats({ articlesRead: 0, timeSpentMinutes: 0 });

        // Load Subscriptions
        const savedSub = localStorage.getItem(`er_sub_${uid}`);
        if (savedSub) setSubscription(JSON.parse(savedSub));
        else setSubscription({ tier: 'Basic', plan: null, expiresAt: null, status: 'Active' });

        // Load Bookmarks
        const savedBookmarks = localStorage.getItem(`er_bookmarks_${uid}`);
        setBookmarks(savedBookmarks ? JSON.parse(savedBookmarks) : []);

        // Load History
        const savedHistory = localStorage.getItem(`er_history_${uid}`);
        setReadingHistory(savedHistory ? JSON.parse(savedHistory) : []);

        // Load Notifications
        const savedNotifs = localStorage.getItem(`er_notifications_${uid}`);
        setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);
      }

      // Load Search Ledger
      const searchKey = `search_history_${user.uid}`;
      const savedSearch = localStorage.getItem(searchKey);
      setSearchHistory(savedSearch ? JSON.parse(savedSearch) : []);

    } else {
      // Guest state defaults
      setBookmarks([]);
      setReadingHistory([]);
      setSearchHistory([]);
      setNotifications([]);
      setReadingStats({ articlesRead: 0, timeSpentMinutes: 0 });
      setSubscription({ tier: 'Basic', plan: null, expiresAt: null, status: 'Inactive' });
      setSettings({
        theme: 'light',
        fontSize: 'medium',
        language: 'English',
        notifications: true,
        privacy: 'private',
        emailAlerts: true,
        pushAlerts: true,
        favTopicAlerts: true,
        subReminderAlerts: true,
        activityAlerts: true,
        quietHours: { enabled: false, start: "22:00", end: "07:00" },
        alertFrequency: "Instant"
      });
    }

    return () => {
      unsubscribeSettings();
      unsubscribeBookmarks();
      unsubscribeHistory();
      unsubscribeNotifications();
    };
  }, [user]);

  // Auth Observer
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      const cached = localStorage.getItem('er_mock_user');
      if (cached) setUser(JSON.parse(cached));
      setLoading(false);
    }
  }, []);

  const signup = async (email, password, displayName) => {
    // Welcome Notification template
    const welcomeNotif = {
      id: `notif-welcome-${Date.now()}`,
      type: 'welcome',
      title: 'Welcome to Economical Research! 👋',
      text: 'Your research account has been successfully created. Explore today\'s bulletins.',
      timestamp: new Date().toISOString(),
      read: false,
      url: null
    };

    // Trigger Welcome Email
    fetch('/api/notifications/dispatch-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'welcome' })
    }).catch(err => console.error('Welcome Email Dispatch Error:', err));

    if (isFirebaseConfigured && auth) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Save welcome notification to firestore
      try {
        const docRef = doc(db, 'users', userCredential.user.uid, 'notifications', welcomeNotif.id);
        await setDoc(docRef, welcomeNotif);
      } catch (err) {
        console.error('Error saving welcome notification in Firestore:', err);
      }

      return userCredential.user;
    } else {
      const mockUsers = JSON.parse(localStorage.getItem('er_mock_users') || '[]');
      if (mockUsers.some(u => u.email === email)) {
        throw new Error('An account with this email already exists.');
      }
      const newUser = {
        uid: `mock-user-${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: null
      };
      mockUsers.push({ ...newUser, password });
      localStorage.setItem('er_mock_users', JSON.stringify(mockUsers));
      localStorage.setItem('er_mock_user', JSON.stringify(newUser));
      
      // Save welcome notification locally
      localStorage.setItem(`er_notifications_${newUser.uid}`, JSON.stringify([welcomeNotif]));

      setUser(newUser);
      return newUser;
    }
  };

  const login = async (email, password) => {
    // Activity Notification template
    const activityNotif = {
      id: `notif-activity-${Date.now()}`,
      type: 'activity',
      title: 'Security Alert: New Sign-in 🔐',
      text: `We registered a new login request for your account on ${new Date().toLocaleDateString()}.`,
      timestamp: new Date().toISOString(),
      read: false,
      url: null
    };

    if (isFirebaseConfigured && auth) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Save activity notification to firestore
      try {
        const docRef = doc(db, 'users', userCredential.user.uid, 'notifications', activityNotif.id);
        await setDoc(docRef, activityNotif);
      } catch (err) {
        console.error('Error saving activity notification in Firestore:', err);
      }

      return userCredential.user;
    } else {
      const mockUsers = JSON.parse(localStorage.getItem('er_mock_users') || '[]');
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      if (!foundUser) {
        throw new Error('Invalid email or password combination.');
      }
      const loggedUser = {
        uid: foundUser.uid,
        email: foundUser.email,
        displayName: foundUser.displayName,
        photoURL: foundUser.photoURL
      };
      localStorage.setItem('er_mock_user', JSON.stringify(loggedUser));

      // Append activity notification locally
      const key = `er_notifications_${loggedUser.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([activityNotif, ...saved].slice(0, 30)));

      setUser(loggedUser);
      return loggedUser;
    }
  };

  const loginWithGoogle = async () => {
    const activityNotif = {
      id: `notif-activity-${Date.now()}`,
      type: 'activity',
      title: 'Security Alert: Google Sign-in 🔐',
      text: 'New sign-in successfully authorized via Google account sync.',
      timestamp: new Date().toISOString(),
      read: false,
      url: null
    };

    if (isFirebaseConfigured && auth && googleProvider) {
      const userCredential = await signInWithPopup(auth, googleProvider);
      try {
        const docRef = doc(db, 'users', userCredential.user.uid, 'notifications', activityNotif.id);
        await setDoc(docRef, activityNotif);
      } catch (err) {
        console.error('Error saving activity notification in Firestore:', err);
      }
      return userCredential.user;
    } else {
      const mockGoogleUser = {
        uid: 'mock-google-user-123',
        email: 'researcher.er@gmail.com',
        displayName: 'Dr. Jane Devlin',
        photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jane'
      };
      localStorage.setItem('er_mock_user', JSON.stringify(mockGoogleUser));

      const key = `er_notifications_${mockGoogleUser.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([activityNotif, ...saved].slice(0, 30)));

      setUser(mockGoogleUser);
      return mockGoogleUser;
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    } else {
      localStorage.removeItem('er_mock_user');
      setUser(null);
    }
  };

  // --- STATS LOGGING ---
  const incrementArticlesRead = async () => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const updatedStats = { ...readingStats, articlesRead: readingStats.articlesRead + 1 };

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await setDoc(doc(db, 'users', user.uid), { stats: updatedStats }, { merge: true });
      } catch (e) {
        console.error('Error saving stats to Firestore:', e);
      }
    } else {
      localStorage.setItem(`er_stats_${user.uid}`, JSON.stringify(updatedStats));
      setReadingStats(updatedStats);
    }
  };

  const incrementTimeSpent = async (minutes) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const updatedStats = { ...readingStats, timeSpentMinutes: Math.round((readingStats.timeSpentMinutes + minutes) * 10) / 10 };

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await setDoc(doc(db, 'users', user.uid), { stats: updatedStats }, { merge: true });
      } catch (e) {
        console.error('Error saving time stats to Firestore:', e);
      }
    } else {
      localStorage.setItem(`er_stats_${user.uid}`, JSON.stringify(updatedStats));
      setReadingStats(updatedStats);
    }
  };

  // --- SUBSCRIPTIONS CONTROLS ---
  const upgradeToPro = async (planType) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const sub = {
      tier: 'PRO',
      plan: planType,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active'
    };

    // Dispatch billing confirmation email
    fetch('/api/notifications/dispatch-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        type: 'subscription',
        data: { plan: planType }
      })
    }).catch(err => console.error('Subscription Email Dispatch Error:', err));

    // Send Payment receipt email
    const invoiceId = `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`;
    fetch('/api/notifications/dispatch-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        type: 'receipt',
        data: { invoiceId }
      })
    }).catch(err => console.error('Receipt Email Dispatch Error:', err));

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await setDoc(doc(db, 'users', user.uid), { subscription: sub }, { merge: true });
      } catch (e) {
        console.error('Error saving subscription to Firestore:', e);
      }
    } else {
      localStorage.setItem(`er_sub_${user.uid}`, JSON.stringify(sub));
      setSubscription(sub);
    }

    // Add in-app notification
    addNotification('subscription', 'Subscription Active! 💳', `You have been upgraded to the ER PRO ${planType} plan. paywalls lifted.`);
  };

  const cancelSubscription = async () => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const sub = {
      tier: 'Basic',
      plan: null,
      expiresAt: null,
      status: 'Cancelled'
    };

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await setDoc(doc(db, 'users', user.uid), { subscription: sub }, { merge: true });
      } catch (e) {
        console.error('Error saving subscription cancel to Firestore:', e);
      }
    } else {
      localStorage.setItem(`er_sub_${user.uid}`, JSON.stringify(sub));
      setSubscription(sub);
    }

    addNotification('subscription', 'Subscription Cancelled 💳', 'Your PRO subscription has been cancelled. Account will revert to Basic tier.');
  };

  // --- ACCOUNT DELETION ---
  const deleteUserAccount = async () => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        if (auth.currentUser) {
          await fbDeleteUser(auth.currentUser);
        }
        setUser(null);
      } catch (e) {
        console.error('Error executing Firestore user delete:', e);
      }
    } else {
      const uid = user.uid;
      localStorage.removeItem(`er_settings_${uid}`);
      localStorage.removeItem(`er_bookmarks_${uid}`);
      localStorage.removeItem(`er_history_${uid}`);
      localStorage.removeItem(`er_stats_${uid}`);
      localStorage.removeItem(`er_sub_${uid}`);
      localStorage.removeItem(`search_history_${uid}`);
      localStorage.removeItem(`er_notifications_${uid}`);

      const mockUsers = JSON.parse(localStorage.getItem('er_mock_users') || '[]');
      const filtered = mockUsers.filter(u => u.uid !== uid);
      localStorage.setItem('er_mock_users', JSON.stringify(filtered));

      localStorage.removeItem('er_mock_user');
      setUser(null);
    }
  };

  // --- BOOKMARKS CONTROLS ---
  const saveBookmark = async (article) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const docId = getDocId(article.url);

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'bookmarks', docId), {
          ...article,
          bookmarkedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error saving bookmark:', e);
      }
    } else {
      const key = `er_bookmarks_${user.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.some(art => art.url === article.url)) {
        const updated = [...saved, { ...article, bookmarkedAt: new Date().toISOString() }];
        localStorage.setItem(key, JSON.stringify(updated));
        setBookmarks(updated);
      }
    }
  };

  const deleteBookmark = async (articleUrl) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const docId = getDocId(articleUrl);

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', docId));
      } catch (e) {
        console.error('Error deleting bookmark:', e);
      }
    } else {
      const key = `er_bookmarks_${user.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = saved.filter(art => art.url !== articleUrl);
      localStorage.setItem(key, JSON.stringify(updated));
      setBookmarks(updated);
    }
  };

  const isBookmarked = (articleUrl) => bookmarks.some(art => art.url === articleUrl);

  // --- READING HISTORY ---
  const logReadingEvent = async (article) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    
    // Auto increment articles read count stat
    await incrementArticlesRead();

    // Check if new article matches favorites topics to notify user!
    const isFavoriteTopic = settings.favTopicAlerts && settings.favorites?.some(favCat => {
      return article.title?.toLowerCase().includes(favCat.toLowerCase()) || 
             article.description?.toLowerCase().includes(favCat.toLowerCase());
    });

    if (isFavoriteTopic) {
      addNotification('topic', 'Favorite Topic Bulletin 📰', `New dispatch aligns with your "${settings.favorites[0]}" reading profile: ${article.title.substring(0, 50)}...`, article.url);
    }

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'history'), {
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          source: article.source,
          publishedAt: article.publishedAt,
          readAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error logging history:', e);
      }
    } else {
      const key = `er_history_${user.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = saved.filter(art => art.url !== article.url);
      const updated = [{ ...article, readAt: new Date().toISOString() }, ...filtered].slice(0, 100);
      localStorage.setItem(key, JSON.stringify(updated));
      setReadingHistory(updated);
    }
  };

  const clearReadingHistory = async () => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        setReadingHistory([]);
        const ref = collection(db, 'users', user.uid, 'history');
        const snap = await getDocs(ref);
        const batch = writeBatch(db);
        snap.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      } catch (e) {
        console.error('Error clearing history:', e);
      }
    } else {
      localStorage.removeItem(`er_history_${user.uid}`);
      setReadingHistory([]);
    }
  };

  // --- SETTINGS CONTROLS ---
  const updateSettings = async (newSettings) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    const updated = { ...settings, ...newSettings };

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        await setDoc(doc(db, 'users', user.uid), { settings: updated }, { merge: true });
        setSettings(updated);
      } catch (e) {
        console.error('Error saving settings:', e);
      }
    } else {
      localStorage.setItem(`er_settings_${user.uid}`, JSON.stringify(updated));
      setSettings(updated);
    }
  };

  const updateUserProfile = async (displayName, photoURL) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');
    if (isFirebaseConfigured && auth && auth.currentUser && !isMockUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL });
      setUser({
        ...user,
        displayName,
        photoURL
      });
    } else {
      const updatedUser = { ...user, displayName, photoURL };
      localStorage.setItem('er_mock_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Also update in mock users list
      const mockUsers = JSON.parse(localStorage.getItem('er_mock_users') || '[]');
      const updatedList = mockUsers.map(u => u.uid === user.uid ? { ...u, displayName, photoURL } : u);
      localStorage.setItem('er_mock_users', JSON.stringify(updatedList));
    }
  };

  const saveSearchQuery = (query) => {
    if (!query || query.trim() === '') return;
    const clean = query.trim();
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      if (user) {
        localStorage.setItem(`search_history_${user.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteSearchQuery = (queryToDelete) => {
    setSearchHistory(prev => {
      const updated = prev.filter(q => q !== queryToDelete);
      if (user) {
        localStorage.setItem(`search_history_${user.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (user) {
      localStorage.removeItem(`search_history_${user.uid}`);
    }
  };

  // --- NOTIFICATIONS METHODS ---
  const addNotification = async (type, title, text, url = null) => {
    // Quiet hours range checks
    const isQuietHours = () => {
      if (!settings.quietHours?.enabled) return false;
      const now = new Date();
      const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const { start, end } = settings.quietHours;
      if (start <= end) {
        return currentStr >= start && currentStr <= end;
      } else {
        return currentStr >= start || currentStr <= end;
      }
    };

    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title,
      text,
      timestamp: new Date().toISOString(),
      read: false,
      url
    };

    const isMockUser = !user || user.uid.startsWith('mock-');

    // Trigger Browser Push if allowed and not in quiet hours
    if (settings.pushAlerts && Notification.permission === 'granted' && !isQuietHours()) {
      try {
        new Notification(title, { body: text, icon: '/favicon.ico' });
      } catch (e) {
        console.error('HTML5 Push Notification Constructor Failed:', e);
      }
    }

    // Trigger Email notification logs
    if (settings.emailAlerts && user && user.email) {
      fetch('/api/notifications/dispatch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          type: type === 'welcome' ? 'welcome' : type === 'subscription' ? 'subscription' : 'breaking',
          data: { headline: title }
        })
      }).catch(err => console.error('Dispatch Email Alert Error:', err));
    }

    if (user) {
      if (isFirebaseConfigured && db && !isMockUser) {
        try {
          const docRef = doc(db, 'users', user.uid, 'notifications', newNotif.id);
          await setDoc(docRef, newNotif);
        } catch (e) {
          console.error('Error writing notification to Firestore:', e);
        }
      } else {
        const key = `er_notifications_${user.uid}`;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = [newNotif, ...saved].slice(0, 30);
        localStorage.setItem(key, JSON.stringify(updated));
        setNotifications(updated);
      }
    } else {
      // Guest fallback alert
      setNotifications(prev => [newNotif, ...prev].slice(0, 30));
    }
  };

  const markAsRead = async (id) => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        const docRef = doc(db, 'users', user.uid, 'notifications', id);
        await setDoc(docRef, { read: true }, { merge: true });
      } catch (e) {
        console.error('Error marking notification read in Firestore:', e);
      }
    } else {
      const key = `er_notifications_${user.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = saved.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(key, JSON.stringify(updated));
      setNotifications(updated);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        const ref = collection(db, 'users', user.uid, 'notifications');
        const snap = await getDocs(ref);
        const batch = writeBatch(db);
        snap.forEach((docSnap) => {
          if (!docSnap.data().read) {
            batch.update(docSnap.ref, { read: true });
          }
        });
        await batch.commit();
      } catch (e) {
        console.error('Error marking all read in Firestore:', e);
      }
    } else {
      const key = `er_notifications_${user.uid}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = saved.map(n => ({ ...n, read: true }));
      localStorage.setItem(key, JSON.stringify(updated));
      setNotifications(updated);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    const isMockUser = user.uid.startsWith('mock-');

    if (isFirebaseConfigured && db && !isMockUser) {
      try {
        setNotifications([]);
        const ref = collection(db, 'users', user.uid, 'notifications');
        const snap = await getDocs(ref);
        const batch = writeBatch(db);
        snap.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      } catch (e) {
        console.error('Error clearing notifications in Firestore:', e);
      }
    } else {
      localStorage.removeItem(`er_notifications_${user.uid}`);
      setNotifications([]);
    }
  };

  const registerFcmToken = async (token) => {
    if (!user) return;
    try {
      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, token })
      });
    } catch (e) {
      console.error('Error registering FCM token on backend:', e);
    }
  };

  // Polling for server-side broadcasts
  useEffect(() => {
    if (!user) return;

    const pollBroadcasts = () => {
      fetch('/api/notifications/broadcasts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(prev => {
              let updated = [...prev];
              let changed = false;

              data.forEach(broadcast => {
                // If topic match, filter by favorites
                if (broadcast.type === 'topic' && settings?.favTopicAlerts) {
                  const favs = settings.favorites || [];
                  const matches = favs.some(fav => broadcast.category === fav.toLowerCase());
                  if (!matches) return;
                }

                const exists = updated.some(n => n.id === broadcast.id || (n.title === broadcast.title && n.text === broadcast.text));
                if (!exists) {
                  const isQuietHours = () => {
                    if (!settings?.quietHours?.enabled) return false;
                    const now = new Date();
                    const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const { start, end } = settings.quietHours;
                    if (start <= end) {
                      return currentStr >= start && currentStr <= end;
                    } else {
                      return currentStr >= start || currentStr <= end;
                    }
                  };

                  if (settings?.pushAlerts && Notification.permission === 'granted' && !isQuietHours()) {
                    try {
                      new Notification(broadcast.title, { body: broadcast.text, icon: '/favicon.ico' });
                    } catch (e) {
                      console.error('HTML5 Push Notification Constructor Failed:', e);
                    }
                  }

                  updated = [{
                    id: broadcast.id,
                    type: broadcast.type,
                    title: broadcast.title,
                    text: broadcast.text,
                    timestamp: broadcast.timestamp,
                    read: false,
                    url: broadcast.url
                  }, ...updated];
                  changed = true;
                }
              });

              if (changed) {
                const limited = updated.slice(0, 30);
                const isMockUser = user.uid.startsWith('mock-');
                if (!isMockUser && isFirebaseConfigured && db) {
                  // Firestore will sync automatically
                } else {
                  localStorage.setItem(`er_notifications_${user.uid}`, JSON.stringify(limited));
                }
                return limited;
              }
              return prev;
            });
          }
        })
        .catch(err => console.error('Error polling broadcasts:', err));
    };

    pollBroadcasts();
    const interval = setInterval(pollBroadcasts, 4000);
    return () => clearInterval(interval);
  }, [user, settings?.pushAlerts, settings?.quietHours, settings?.favTopicAlerts, settings?.favorites]);

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    searchHistory,
    saveSearchQuery,
    deleteSearchQuery,
    clearSearchHistory,
    bookmarks,
    saveBookmark,
    deleteBookmark,
    isBookmarked,
    readingHistory,
    logReadingEvent,
    clearReadingHistory,
    readingStats,
    incrementTimeSpent,
    subscription,
    upgradeToPro,
    cancelSubscription,
    settings,
    updateSettings,
    deleteUserAccount,
    updateUserProfile,
    isFirebaseConfigured,
    notifications,
    addNotification,
    markAsRead,
    markAllRead,
    clearAllNotifications,
    registerFcmToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
