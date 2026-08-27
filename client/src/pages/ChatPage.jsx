import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyChats } from '../api/chats';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const [chats, setChats] = useState({ single: [], group: [] });
  const [activeTab, setActiveTab] = useState('single');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchChats = async () => {
      const res = await getMyChats();
      setChats(res.data);
    };
    fetchChats();
  }, []);

  // Allow deep-linking to a specific chat, e.g. /chat?chatId=xyz (used by the Market Page "Contact" button in Phase 5/7)
  useEffect(() => {
    const chatIdParam = searchParams.get('chatId');
    if (chatIdParam) setSelectedChatId(chatIdParam);
  }, [searchParams]);

  const currentList = chats[activeTab];

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ width: '250px' }}>
        <h2>Chats</h2>
        <div>
          <button onClick={() => setActiveTab('single')} disabled={activeTab === 'single'}>
            Single Chats
          </button>
          <button onClick={() => setActiveTab('group')} disabled={activeTab === 'group'}>
            Group Chats
          </button>
        </div>

        <ul>
          {currentList.length === 0 && <li>No chats yet</li>}
          {currentList.map((c) => (
            <li key={c._id}>
              <button onClick={() => setSelectedChatId(c._id)}>
                {c.type === 'group'
                  ? c.projectId?.title || 'Project Chat'
                  : c.participants.map((p) => p.name).join(', ')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        {selectedChatId ? (
          <ChatWindow chatId={selectedChatId} />
        ) : (
          <p>Select a chat to start messaging</p>
        )}
      </div>
    </div>
  );
}