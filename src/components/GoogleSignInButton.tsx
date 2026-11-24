import React, { useEffect, useState } from 'react';

export const GoogleGLogo: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 87.3 78" className={className} aria-hidden="true">
    <path
      fill="#0066da"
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
    />
    <path
      fill="#00ac47"
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"
    />
    <path
      fill="#ea4335"
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
    />
    <path
      fill="#00832d"
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
    />
    <path
      fill="#2684fc"
      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
    />
    <path
      fill="#ffba00"
      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
    />
  </svg>
);

export const GoogleSignInButton: React.FC<{
  onClick: () => void;
  loading?: boolean;
  label?: string;
  isDark?: boolean;
  fullWidth?: boolean;
}> = ({ onClick, loading = false, label = 'Đăng nhập với Google', isDark = false, fullWidth = true }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`gsi-material-button h-11 px-4 rounded-full border inline-flex items-center justify-center gap-2.5 text-sm font-medium cursor-pointer transition active:scale-[0.98] disabled:opacity-60 ${
      fullWidth ? 'w-full' : ''
    }`}
    style={{
      backgroundColor: isDark ? '#131314' : '#ffffff',
      color: isDark ? '#e3e3e3' : '#1f1f1f',
      borderColor: isDark ? '#8e918f' : '#747775',
    }}
  >
    <GoogleGLogo className="w-[18px] h-[18px] shrink-0" />
    <span>{loading ? 'Đang kết nối Google…' : label}</span>
  </button>
);

function getInitials(name?: string | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'G';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[parts.length - 2][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function isSafeImageSrc(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(url)) return url;
  return null;
}

export const GoogleAvatar: React.FC<{
  photoURL?: string | null;
  name?: string | null;
  size?: number;
  bgColor: string;
  fgColor: string;
  showGoogleBadge?: boolean;
  badgeBorderColor?: string;
}> = ({
  photoURL,
  name,
  size = 56,
  bgColor,
  fgColor,
  showGoogleBadge = false,
  badgeBorderColor = '#ffffff',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [photoURL]);

  const initials = getInitials(name);
  const safeUrl = isSafeImageSrc(photoURL);
  const badgeSize = Math.max(16, Math.round(size * 0.36));

  return (
    <div className="relative shrink-0 inline-flex" style={{ width: size, height: size }}>
      {safeUrl && !imgFailed ? (
        <img
          src={safeUrl}
          alt={name || 'Google Avatar'}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full rounded-full object-cover border border-black/10"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-bold relative overflow-hidden"
          style={{
            backgroundColor: bgColor,
            color: fgColor,
            fontSize: Math.max(12, Math.round(size * 0.34)),
          }}
        >
          <svg
            viewBox="0 0 64 64"
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
            aria-hidden="true"
          >
            <circle cx="32" cy="23" r="11" fill="currentColor" />
            <path d="M12 58c2-11 10-18 20-18s18 7 20 18z" fill="currentColor" />
          </svg>
          <span className="relative z-10 tracking-tight">{initials}</span>
        </div>
      )}
      {showGoogleBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white flex items-center justify-center shadow-sm"
          style={{
            width: badgeSize,
            height: badgeSize,
            border: `2px solid ${badgeBorderColor}`,
          }}
        >
          <GoogleGLogo className="w-[62%] h-[62%]" />
        </span>
      )}
    </div>
  );
};
