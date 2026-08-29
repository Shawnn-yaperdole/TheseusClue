import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyChats } from '../api/chats';
import ChatWindow from '../components/ChatWindow';
import AppShell from '../components/AppShell';
import '../styles/pages-styles/ChatPage.css';
import BackButton from '../components/BackButton';

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

  useEffect(() => {
    const chatIdParam = searchParams.get('chatId');
    if (chatIdParam) setSelectedChatId(chatIdParam);
  }, [searchParams]);

  const currentList = chats[activeTab];

  return (
    <AppShell>
      <BackButton fallback="/market" label="Back" />
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Conversations</p>
          <h1 className="page-title">Chat</h1>
        </div>
      </div>

      <div className={selectedChatId ? 'chat-layout has-selection' : 'chat-layout'}>
        <div className="chat-sidebar">
          <div className="chat-tabs">
            <button className={activeTab === 'single' ? 'chat-tab active' : 'chat-tab'} onClick={() => setActiveTab('single')}>
              Single
            </button>
            <button className={activeTab === 'group' ? 'chat-tab active' : 'chat-tab'} onClick={() => setActiveTab('group')}>
              Group
            </button>
          </div>
          <div className="chat-list">
            {currentList.length === 0 ? (
              <p className="chat-list-empty">No conversations yet.</p>
            ) : (
              currentList.map((c) => (
                <button
                  key={c._id}
                  className={selectedChatId === c._id ? 'chat-list-item active' : 'chat-list-item'}
                  onClick={() => setSelectedChatId(c._id)}
                >
                  {c.type === 'group'
                    ? c.projectId?.title || 'Project chat'
                    : c.participants.map((p) => p.name).join(', ')}
                </button>
              ))
            )}
          </div>
        </div>

        {selectedChatId ? (
          <ChatWindow chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />
        ) : (
          <div className="chat-window">
            <div className="chat-empty-state">Select a conversation to start messaging.</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}