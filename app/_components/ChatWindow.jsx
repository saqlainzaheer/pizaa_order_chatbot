'use client'
import { useState } from 'react';
import axios from 'axios';

const API_URL = "https://react-fast-pizza-api.onrender.com/api";

export async function getMenu() {
  const res = await fetch(`${API_URL}/menu`);
  if (!res.ok) throw Error("Failed getting menu");
  const { data } = await res.json();
  return data;
}

export async function createOrder(newOrder) {
  try {
    const res = await fetch(`${API_URL}/order`, {
      method: "POST",
      body: JSON.stringify(newOrder),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw Error();
    const { data } = await res.json();
    return data;
  } catch {
    throw Error("Failed creating your order");
  }
}

export default function ChatWindow() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setChat([...chat, { role: 'user', content: message }]);
    setMessage('');
    setLoading(true);

    try {
      let reply;
      if (message.toLowerCase().includes('menu')) {
        const menu = await getMenu();
        reply = `Here is our menu: ${menu.map(item => item.name).join(', ')}`;
      } else if (message.toLowerCase().includes('order')) {
        const orderDetails = {
          // Replace with actual order details
          pizza: "Margherita",
          size: "Medium",
          quantity: 1,
        };
        const order = await createOrder(orderDetails);
        reply = `Your order has been placed. Order ID: ${order.id}`;
      } else {
        const response = await axios.post('/api/chat', { message });
        reply = response.data.reply;
      }
      
      setChat([...chat, { role: 'user', content: message }, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Error sending message', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    if (msg.role === 'user') {
      return (
        <div className="flex items-center mb-2" key={index}>
          <img className="w-8 h-8 rounded-full mr-2" src="https://picsum.photos/50/50" alt="User Avatar" />
          <div className="bg-gray-300 text-gray-700 rounded-lg p-2 shadow max-w-xs">
            {msg.content}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-end mb-2" key={index}>
          <div className="bg-blue-500 text-white rounded-lg p-2 shadow mr-2 max-w-xs">
            <div dangerouslySetInnerHTML={{ __html: msg.content }} />
          </div>
          <img className="w-8 h-8 rounded-full" src="https://picsum.photos/50/50" alt="Assistant Avatar" />
        </div>
      );
    }
  };

  return (
    <div className="h-screen w-[50%] flex flex-col">
      <div className="bg-gray-200 flex-1 overflow-y-scroll">
        <div className="px-4 py-2">
          {chat.map(renderMessage)}
          {loading && (
            <div className="flex items-center justify-end mb-2">
              <div className="bg-blue-500 text-white rounded-lg p-2 shadow mr-2 max-w-xs">
                <div className="flex items-center">
                  <div className="dot-pulse"></div>
                  <div className="dot-pulse"></div>
                  <div className="dot-pulse"></div>
                </div>
              </div>
              <img className="w-8 h-8 rounded-full" src="https://picsum.photos/50/50" alt="Assistant Avatar" />
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-2">
        <div className="flex items-center">
          <input
            className="w-full border rounded-full py-2 px-4 mr-2 text-gray-700"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Add the following CSS to your global styles or in a separate CSS file
