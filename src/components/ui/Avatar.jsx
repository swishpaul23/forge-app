import React from 'react';

const Avatar = ({ name, size = 32, onClick, imageUrl }) => {
  const initials = (name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: imageUrl ? 'transparent' : 'linear-gradient(135deg, var(--accent) 0%, #E5A73B 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: size * 0.4,
        letterSpacing: '.02em',
        color: 'var(--bg-0)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;