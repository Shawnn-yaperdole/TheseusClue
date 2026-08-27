import { useEffect, useRef, useState } from 'react';
import { getChatById } from '../api/chats';
import { getSocket } from '../socket';
import { useAuthStore } from '../store/authStore';

export default function ChatWindow({ chatId }) {
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

  if (!chat) return <p>Loading chat...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #ccc' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
        <strong>
          {chat.type === 'group'
            ? `Group: ${chat.projectId?.title || 'Project Chat'}`
            : chat.participants.find((p) => p._id !== currentUser.id)?.name || 'Chat'}
        </strong>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {messages.map((m, i) => (
          <div
            key={m._id || i}
            style={{
              fontStyle: m.type === 'system' ? 'italic' : 'normal',
              color: m.type === 'system' ? '#888' : '#000',
              marginBottom: '4px'
            }}
          >
            {m.type === 'system' ? (
              <span>{m.content}</span>
            ) : (
              <span>
                <strong>{m.senderId?.name || 'User'}:</strong> {m.content}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #ccc' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}