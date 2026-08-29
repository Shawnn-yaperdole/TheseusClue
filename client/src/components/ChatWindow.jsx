import { useEffect, useRef, useState } from 'react';
import { getChatById } from '../api/chats';
import { getSocket } from '../socket';
import { useAuthStore } from '../store/authStore';
import '../styles/pages-styles/ChatPage.css';
import { Link } from 'react-router-dom';

export default function ChatWindow({ chatId, onBack }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const currentUser = useAuthStore((state) => state.user);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();

    const loadChat = async () => {
      const res = await getChatById(chatId);
      setChat(res.data);
      setMessages(res.data.messages);
    };
    loadChat();

    socket.emit('join_chat', chatId);

    const handleNewMessage = ({ chatId: incomingChatId, message }) => {
      if (incomingChatId === chatId) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('new_message', handleNewMessage);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('send_message', { chatId, content: input });
    setInput('');
  };

  if (!chat) return <div className="chat-empty-state">Loading chat…</div>;

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        {onBack && (
          <button className="chat-back-mobile" onClick={onBack} aria-label="Back to conversations">
            ←  
          </button>
        )}
        {chat.type === 'group' ? (
            `Group: ${chat.projectId?.title || 'Project chat'}`
          ) : (
            <Link to={`/profile/${chat.participants.find((p) => p._id !== currentUser.id)?._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {chat.participants.find((p) => p._id !== currentUser.id)?.name || 'Chat'}
            </Link>
          )}
      </div>

      <div className="chat-window-messages">
        {messages.map((m, i) => (
          <div key={m._id || i} className={m.type === 'system' ? 'chat-message system' : 'chat-message'}>
            {m.type !== 'system' && <span className="chat-message-sender">{m.senderId?.name || 'User'}</span>}
            {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-window-input" onSubmit={handleSend}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" />
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>Send</button>
      </form>
    </div>
  );
}