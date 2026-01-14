import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store';

function formatMessage(text: string): React.ReactNode {
  const mention = '@shinneeshinn';
  const lowerText = text.toLowerCase();
  const lowerMention = mention.toLowerCase();
  
  if (!lowerText.includes(lowerMention)) {
    return text;
  }
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerMention);
  
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <span key={idx} className="twitch-chat__mention">
        {text.slice(idx, idx + mention.length)}
      </span>
    );
    lastIndex = idx + mention.length;
    idx = lowerText.indexOf(lowerMention, lastIndex);
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
}

export function TwitchChat() {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const participants = useGameStore((s) => s.gameState?.participants || []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const registeredSet = new Set(participants.map(p => p.toLowerCase()));
  const isRegistered = (username: string) => registeredSet.has(username.toLowerCase());
  
  // Check if scrolled to bottom
  const checkIfAtBottom = () => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };
  
  // Handle scroll
  const handleScroll = () => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setAutoScroll(true);
    }
  };
  
  // Auto-scroll when new messages arrive (only if at bottom)
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages, autoScroll]);
  
  // When user scrolls up, disable auto-scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      // Scrolling up
      setAutoScroll(false);
    }
  };
  
  // Click to scroll to bottom
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
      setIsAtBottom(true);
    }
  };
  
  return (
    <div className="twitch-chat">
      <div 
        className="twitch-chat__messages"
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {chatMessages.map((msg, i) => (
          <div key={`${msg.ts}-${i}`} className="twitch-chat__message">
            <span className={`twitch-chat__username ${isRegistered(msg.username) ? 'twitch-chat__username--registered' : ''}`}>
              {msg.username}
            </span>
            <span className="twitch-chat__text">
              {formatMessage(msg.message)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Show "scroll down" indicator when not at bottom */}
      {!isAtBottom && (
        <button className="twitch-chat__scroll-btn" onClick={scrollToBottom}>
          ↓
        </button>
      )}
    </div>
  );
}
