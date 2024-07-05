'use client';

import { useState } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatIcon() {
  const [isOpen, setIsOpen] = useState(false);

    return (
    
        <div>
            <div
        style={iconStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </div>
      
      {isOpen && <ChatWindow />}
    </div>
  );
}

const iconStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  backgroundColor: '#007bff',
  color: '#fff',
  borderRadius: '50%',
  width: '50px',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '24px',
};
