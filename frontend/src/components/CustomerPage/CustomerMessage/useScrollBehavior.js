import { useState, useEffect, useRef } from "react";

export const useScrollBehavior = (messages) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Add scroll detection for showing/hiding scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowScrollButton(scrollBottom > 100);
      }
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    
    // Check if user is already near bottom (within 300px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
    
    if (messages.length > 0 && isNearBottom) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };
  
  return {
    messagesEndRef,
    messagesContainerRef,
    showScrollButton,
    scrollToBottom
  };
};