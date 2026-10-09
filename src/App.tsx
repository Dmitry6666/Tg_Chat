import { useState, useEffect, useCallback, useRef } from 'react';
import {
  sendMessage,
  receiveNotification,
  deleteNotification,
  checkAccount,
} from './api';
import type { AuthData, ChatMessage } from './types';
import './App.css';

function App() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = () => {
    if (!idInstance.trim() || !apiTokenInstance.trim()) return;
    setAuth({ idInstance, apiTokenInstance });
  };

  const handleLogout = () => {
    setAuth(null);
    setChatId(null);
    setMessages([]);
    setPhoneNumber('');
  };

  const handleCreateChat = async () => {
    if (!auth) return;
    const clean = phoneNumber.replace(/\D/g, '');
    if (!clean) return;

    setChecking(true);
    try {
      const result = await checkAccount(auth, clean);
      if (result.exist && result.chatId) {
        setChatId(result.chatId);
        setMessages([]);
      } else {
        alert('На этом номере нет аккаунта Telegram');
      }
    } catch (error) {
      console.error('Ошибка проверки номера:', error);
      alert('Не удалось проверить номер. Попробуйте ещё раз.');
    } finally {
      setChecking(false);
    }
  };

  const pollNotifications = useCallback(async () => {
    if (!auth) return;
    let notification: any = null;
    try {
      notification = await receiveNotification(auth);
      if (!notification) return;

      const body = notification.body;

      if (
        body?.typeWebhook === 'incomingMessageReceived' &&
        body?.messageData?.typeMessage === 'textMessage' &&
        body?.messageData?.textMessageData?.textMessage
      ) {
        const text = body.messageData.textMessageData.textMessage;
        const senderChatId = body.senderData?.chatId;

        if (senderChatId === chatId) {
          setMessages(prev => [
            ...prev,
            {
              id: `${notification.receiptId}-in-${Date.now()}`,
              text,
              type: 'incoming',
              timestamp: Date.now(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Ошибка обработки уведомления:', error);
    } finally {
      if (notification?.receiptId) {
        try {
          await deleteNotification(auth, notification.receiptId);
        } catch (err) {
          console.error('Ошибка удаления уведомления:', err);
        }
      }
    }
  }, [auth, chatId]);

  useEffect(() => {
    if (!auth) return;
    const interval = setInterval(pollNotifications, 5000);
    return () => clearInterval(interval);
  }, [auth, pollNotifications]);

  const handleSend = async () => {
    if (!auth || !chatId || !inputText.trim() || sending) return;

    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      const result = await sendMessage(auth, chatId, text);
      if (result.idMessage) {
        setMessages(prev => [
          ...prev,
          {
            id: result.idMessage,
            text,
            type: 'outgoing',
            timestamp: Date.now(),
          },
        ]);
      } else {
        alert('Не удалось отправить сообщение. Проверьте данные.');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

  // ─── Экран входа ───────────────────────────────────────────
  if (!auth) {
    return (
      <div className="tg-login">
        <div className="tg-login__logo">
          <svg viewBox="0 0 240 240" width="120" height="120">
            <circle cx="120" cy="120" r="120" fill="#3390ec" />
            <path
              fill="#fff"
              d="M54 118l96-38c4-1.5 8 1 7 6l-16 76c-1 5-4 6-8 4l-22-16-10 10c-2 2-4 2-5-1l-6-24-17-5c-4-1-4-4 0-6z"
            />
          </svg>
          <h1>Telegram</h1>
          <p>Войдите в свой аккаунт Green-API</p>
        </div>

        <div className="tg-login__form">
          <input
            className="tg-input"
            placeholder="idInstance"
            value={idInstance}
            onChange={e => setIdInstance(e.target.value)}
          />
          <input
            className="tg-input"
            type="password"
            placeholder="apiTokenInstance"
            value={apiTokenInstance}
            onChange={e => setApiTokenInstance(e.target.value)}
          />
          <button className="tg-btn tg-btn--primary" onClick={handleLogin}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  // ─── Основной интерфейс ────────────────────────────────────
  return (
    <div className="tg-app">
      {/* Левая колонка: список чатов */}
      <aside className="tg-sidebar">
        <header className="tg-sidebar__header">
          <div className="tg-sidebar__burger">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="tg-sidebar__search">
            <input placeholder="Поиск" />
          </div>
        </header>

        <div className="tg-sidebar__section">
          <label className="tg-sidebar__label">Новый чат по номеру</label>
          <div className="tg-sidebar__newchat">
            <input
              className="tg-input tg-input--small"
              placeholder="79991234567"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateChat()}
            />
            <button
              className="tg-btn tg-btn--icon"
              onClick={handleCreateChat}
              disabled={checking}
              title="Создать чат"
            >
              {checking ? '…' : '→'}
            </button>
          </div>
        </div>

        <div className="tg-sidebar__chats">
          {chatId ? (
            <div className="tg-chat-item tg-chat-item--active">
              <div className="tg-avatar">#</div>
              <div className="tg-chat-item__body">
                <div className="tg-chat-item__title">Чат {chatId}</div>
                <div className="tg-chat-item__subtitle">
                  {messages.length > 0
                    ? messages[messages.length - 1].text
                    : 'Нет сообщений'}
                </div>
              </div>
            </div>
          ) : (
            <div className="tg-sidebar__empty">
              Выберите чат или создайте новый
            </div>
          )}
        </div>

        <footer className="tg-sidebar__footer">
          <button className="tg-btn tg-btn--ghost" onClick={handleLogout}>
            Выйти
          </button>
        </footer>
      </aside>

      {/* Правая колонка: чат */}
      <main className="tg-main">
        {!chatId ? (
          <div className="tg-main__placeholder">
            <p>Выберите чат, чтобы начать общение</p>
          </div>
        ) : (
          <>
            <header className="tg-main__header">
              <div className="tg-avatar tg-avatar--small">#</div>
              <div>
                <div className="tg-main__title">Чат {chatId}</div>
                <div className="tg-main__status">в сети</div>
              </div>
            </header>

            <div className="tg-messages">
              {messages.length === 0 && (
                <div className="tg-messages__empty">
                  Нет сообщений. Напишите первым!
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`tg-bubble tg-bubble--${m.type}`}>
                  <div className="tg-bubble__text">{m.text}</div>
                  <div className="tg-bubble__time">
                    {formatTime(m.timestamp)}
                    {m.type === 'outgoing' && <span className="tg-check">✓✓</span>}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <footer className="tg-composer">
              <textarea
                className="tg-composer__input"
                placeholder="Написать сообщение..."
                rows={1}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="tg-composer__send"
                onClick={handleSend}
                disabled={sending || !inputText.trim()}
                title="Отправить"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                  <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
                </svg>
              </button>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;