import React, { useState } from 'react';

/**
 * Reusable user ProfileAvatar with automated image error fallback handling.
 * Displays user's Google/Email photo if valid, otherwise displays their first letter in a gold 3D gradient ring.
 */
export default function ProfileAvatar({ user, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  
  if (!user) return null;
  
  if (user.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'User'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '6px',
          objectFit: 'cover',
          border: '2px solid #F4A726',
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          flexShrink: 0,
          minWidth: `${size}px`,
          minHeight: `${size}px`
        }}
      />
    );
  }
  
  // Fallback: Show first letter of name
  const letter = user.displayName?.[0] || 
    user.email?.[0] || 'U';
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '6px',
      background: 'linear-gradient(135deg, #F4A726, #D4A843)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0A1628',
      fontWeight: '900',
      fontSize: `${size * 0.4}px`,
      border: '2px solid #F4A726',
      flexShrink: 0,
      minWidth: `${size}px`,
      minHeight: `${size}px`,
      textTransform: 'uppercase',
      boxShadow: '0 2px 8px rgba(244,167,38,0.4)'
    }}>
      {letter}
    </div>
  );
}
