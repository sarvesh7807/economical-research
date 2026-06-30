import React from 'react';
import { FaXTwitter, FaInstagram } from 'react-icons/fa6';

const socialLinks = [
  {
    name: 'X',
    url: 'https://x.com/ERNewsDesk',
    icon: <FaXTwitter size={18}/>,
    color: '#000000'
  },
  {
    name: 'Instagram', 
    url: 'https://www.instagram.com/economical.research',
    icon: <FaInstagram size={18}/>,
    color: '#E1306C'
  }
];

export default function SocialLinks() {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }}>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'linear-gradient(145deg, #1A3A5C, #0A1628)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            color: '#fff',
            textDecoration: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.borderColor = social.color
            e.currentTarget.style.boxShadow = 
              `0 8px 25px rgba(0,0,0,0.4), 
               0 0 15px ${social.color}40`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 
              'rgba(255,255,255,0.2)'
            e.currentTarget.style.boxShadow = 
              '0 4px 15px rgba(0,0,0,0.3)'
          }}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
}
