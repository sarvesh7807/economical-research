import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaXTwitter,
  FaFacebookF,
  FaWhatsapp,
  FaLinkedinIn,
  FaTelegram,
  FaRedditAlien,
} from 'react-icons/fa6';
import { FiLink, FiPrinter, FiX, FiDownload, FiShare2 } from 'react-icons/fi';
import { BsFiletypePdf } from 'react-icons/bs';
import { MdOutlineImage } from 'react-icons/md';

/* ─── Utility: open social share URLs ─────────────────────────── */
function socialHref(platform, url, text) {
  const enc = encodeURIComponent;
  const urls = {
    twitter:  `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${enc(text + ' ' + url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${enc(url)}&title=${enc(text)}`,
    telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    reddit:   `https://reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
  };
  return urls[platform];
}

/* ─── Social button config ─────────────────────────────────────── */
const SOCIALS = [
  { key: 'twitter',  Icon: FaXTwitter,     label: 'X (Twitter)',  color: '#000000', bg: 'rgba(0,0,0,0.85)' },
  { key: 'whatsapp', Icon: FaWhatsapp,     label: 'WhatsApp',     color: '#25D366', bg: 'rgba(37,211,102,0.15)' },
  { key: 'facebook', Icon: FaFacebookF,   label: 'Facebook',     color: '#1877F2', bg: 'rgba(24,119,242,0.15)' },
  { key: 'linkedin', Icon: FaLinkedinIn,  label: 'LinkedIn',     color: '#0A66C2', bg: 'rgba(10,102,194,0.15)' },
  { key: 'telegram', Icon: FaTelegram,    label: 'Telegram',     color: '#26A5E4', bg: 'rgba(38,165,228,0.15)' },
  { key: 'reddit',   Icon: FaRedditAlien, label: 'Reddit',       color: '#FF4500', bg: 'rgba(255,69,0,0.15)' },
];

/* ─── Main ShareModal ──────────────────────────────────────────── */
/**
 * @param {Object}   props
 * @param {boolean}  props.open          — controls visibility
 * @param {Function} props.onClose       — called when user closes modal
 * @param {string}   props.shareUrl      — URL to share (defaults to current page)
 * @param {string}   props.shareTitle    — text/title for social posts
 * @param {string}   [props.downloadFilename]  — base filename for downloads (no ext)
 * @param {React.RefObject} [props.captureRef] — ref of DOM node to screenshot/PDF
 * @param {boolean}  [props.showPrint]   — show Print button (default true)
 * @param {boolean}  [props.showDownload] — show Download buttons (default true)
 */
export default function ShareModal({
  open,
  onClose,
  shareUrl,
  shareTitle = 'Check this out on Economical Research',
  downloadFilename = 'economical-research',
  captureRef = null,
  showPrint = true,
  showDownload = true,
}) {
  const url = shareUrl || window.location.href;
  const [copied, setCopied]         = useState(false);
  const [dlStatus, setDlStatus]     = useState('');   // '' | 'working' | 'done'

  if (!open) return null;

  /* ── Copy link ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  /* ── Social open ── */
  const openSocial = (platform) => {
    window.open(socialHref(platform, url, shareTitle), '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  /* ── Download JPG / PDF ── */
  const handleDownload = async (format) => {
    if (!captureRef?.current) return;
    setDlStatus('working');

    try {
      // Dynamically import so bundle stays light when modal isn't open
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0A1628',
      });

      if (format === 'jpg') {
        const link = document.createElement('a');
        link.download = `${downloadFilename}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.click();
        setDlStatus('done');
        setTimeout(() => setDlStatus(''), 2000);
        return;
      }

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const imgData  = canvas.toDataURL('image/jpeg', 0.92);
        const pdf      = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2],
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`${downloadFilename}.pdf`);
        setDlStatus('done');
        setTimeout(() => setDlStatus(''), 2000);
      }
    } catch (err) {
      console.error('Download failed:', err);
      setDlStatus('');
    }
  };

  /* ── Print ── */
  const handlePrint = () => {
    window.print();
  };

  /* ── Backdrop click closes ── */
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="share-modal-backdrop" onClick={handleBackdrop}>
      <div className="share-modal" role="dialog" aria-modal="true" aria-label="Share">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F4A726, #e08c0f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(244,167,38,0.4)',
            }}>
              <FiShare2 size={16} color="#0A1628" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>Share Article</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Spread the intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#aaa'; }}
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Social buttons row */}
        <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Share via
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
          {SOCIALS.map(({ key, Icon, label, color, bg }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <button
                className="share-btn-3d"
                onClick={() => openSocial(key)}
                title={label}
                style={{ background: `linear-gradient(145deg, ${bg}, rgba(0,0,0,0.5))`, borderColor: `${color}30` }}
              >
                <Icon size={22} color={color} />
              </button>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '4px 0 20px' }} />

        {/* Copy link */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '10px 14px', overflow: 'hidden',
          }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {url}
            </p>
          </div>
          <button
            className="share-action-btn"
            onClick={handleCopy}
            style={{ width: 'auto', padding: '10px 16px', borderRadius: 10, gap: 6 }}
          >
            <FiLink size={14} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{copied ? '✓ Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Download + Print actions */}
        {(showDownload || showPrint) && (
          <>
            <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Export
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: showDownload && showPrint ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
              {showDownload && captureRef && (
                <>
                  <button
                    className="share-action-btn"
                    onClick={() => handleDownload('jpg')}
                    disabled={dlStatus === 'working'}
                    style={{ padding: '10px 8px', borderRadius: 10, flexDirection: 'column', gap: 4, fontSize: 11 }}
                  >
                    <MdOutlineImage size={18} color="#F4A726" />
                    <span>{dlStatus === 'working' ? '…' : dlStatus === 'done' ? '✓ Done' : 'Save JPG'}</span>
                  </button>
                  <button
                    className="share-action-btn"
                    onClick={() => handleDownload('pdf')}
                    disabled={dlStatus === 'working'}
                    style={{ padding: '10px 8px', borderRadius: 10, flexDirection: 'column', gap: 4, fontSize: 11 }}
                  >
                    <BsFiletypePdf size={18} color="#F4A726" />
                    <span>{dlStatus === 'working' ? '…' : dlStatus === 'done' ? '✓ Done' : 'Save PDF'}</span>
                  </button>
                </>
              )}
              {showPrint && (
                <button
                  className="share-action-btn"
                  onClick={handlePrint}
                  style={{ padding: '10px 8px', borderRadius: 10, flexDirection: 'column', gap: 4, fontSize: 11 }}
                >
                  <FiPrinter size={18} color="#F4A726" />
                  <span>Print</span>
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>,
    document.body
  );
}
