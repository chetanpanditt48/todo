import React, { useState, useEffect, useRef } from 'react';

const MOCK_ORDERS = [
  {
    id: 'OD123456789',
    item: 'Noise Cancelling Headphones',
    status: 'Out for delivery',
    eta: 'Today, 7:30 PM',
    price: '₹3,199',
    vendor: 'Acme Audio'
  },
  {
    id: 'OD987654321',
    item: 'Stainless Steel Water Bottle',
    status: 'Delivered',
    eta: 'Delivered on Oct 4, 2025',
    price: '₹499',
    vendor: 'Home Essentials'
  }
];

const INITIAL_MESSAGES = [
  { id: 1, from: 'bot', text: 'Hi! I am Flippi. How can I help you today?', time: '10:00' },
  { id: 2, from: 'bot', text: 'You can ask about orders, returns, refunds or talk to support.', time: '10:00' }
];

function IconLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#1f2937" />
        <path d="M6 12h12M6 8h8M6 16h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-sm font-semibold">Flippi UI Mock</div>
    </div>
  );
}

export default function FlipChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOrders, setShowOrders] = useState(true);
  const [humanHandoff, setHumanHandoff] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(MOCK_ORDERS[0]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: text.trim(), time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const botReply = automatedReply(text.trim());
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: botReply, time: getTime() }]);
      setIsTyping(false);
    }, 700 + Math.random() * 800);
  }

  function automatedReply(text) {
    const lower = text.toLowerCase();
    if (lower.includes('order') && lower.includes('status')) {
      return `Your latest order ${selectedOrder.id} is ${selectedOrder.status}. ETA: ${selectedOrder.eta}.`;
    }
    if (lower.includes('return') || lower.includes('refund')) {
      return 'To start a return or refund I need the order id. You can also pick from recent orders.';
    }
    if (lower.includes('human') || lower.includes('agent') || humanHandoff) {
      setHumanHandoff(true);
      return 'Connecting you to a human agent. Estimated wait 2-5 mins. Meanwhile share order id or issue details.';
    }
    if (lower.includes('hi') || lower.includes('hello')) {
      return 'Hello again. You can ask about orders, returns or refunds.';
    }
    return "Sorry, I didn't catch that. Try 'order status OD123...' or choose a quick action.";
  }

  function quickAction(action) {
    if (action === 'track') sendMessage('Track my latest order');
    else if (action === 'return') sendMessage('I want to return an item');
    else if (action === 'agent') {
      setHumanHandoff(true);
      sendMessage('Connect me to a human agent');
    }
  }

  function getTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl grid grid-cols-12 gap-4">
        {/* Chat Section */}
        <div className="col-span-12 md:col-span-7 bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <IconLogo />
            <div className="text-xs text-gray-500">Demo • Mock data</div>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            <div ref={listRef} className="flex-1 overflow-auto space-y-3 mb-4">
              {messages.map(m => <MessageBubble key={m.id} message={m} />)}
              {isTyping && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">F</div>
                  <div className="ml-2 text-sm text-gray-600 italic">Flippi is typing...</div>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex gap-2 mb-3">
                <button onClick={() => quickAction('track')} className="px-3 py-1 rounded-full bg-yellow-400 text-sm font-medium">Track order</button>
                <button onClick={() => quickAction('return')} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Start return</button>
                <button onClick={() => quickAction('agent')} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Talk to agent</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message"
                  className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
                <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg">Send</button>
              </form>
            </div>
          </div>
        </div>

        {/* Orders / Context Section */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Recent orders</div>
              <div className="text-xs text-gray-500">{MOCK_ORDERS.length} orders</div>
            </div>

            <div className="space-y-3">
              {MOCK_ORDERS.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-3 rounded-lg border cursor-pointer ${selectedOrder.id === o.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{o.item}</div>
                    <div className="text-xs text-gray-500">{o.price}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{o.id}</div>
                  <div className="mt-2 text-sm">Status: <span className="font-semibold">{o.status}</span></div>
                  <div className="text-xs text-gray-400">{o.eta}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <button onClick={() => setShowOrders(s => !s)} className="text-sm text-blue-600">
                {showOrders ? 'Hide' : 'Show'} orders
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Conversation context</div>
              <div className="text-xs text-gray-500">Agent: {humanHandoff ? 'Requested' : 'Not requested'}</div>
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-700">Selected order</div>
              <div className="mt-2 p-3 rounded-lg border border-gray-100">
                <div className="text-sm font-medium">{selectedOrder.item}</div>
                <div className="text-xs text-gray-500">{selectedOrder.id} • {selectedOrder.vendor}</div>
                <div className="mt-2 text-sm">Status: <span className="font-semibold">{selectedOrder.status}</span></div>
                <div className="text-xs text-gray-400">ETA: {selectedOrder.eta}</div>
              </div>

              <div className="mt-3">
                <button onClick={() => { setInput(`I want a refund for ${selectedOrder.id}`); }} className="w-full py-2 rounded-md border border-gray-200">
                  Start refund
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input id="handoff" type="checkbox" checked={humanHandoff} onChange={(e) => setHumanHandoff(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="handoff" className="text-sm">Request human agent</label>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">This UI is a mock. Integrate your API to make it functional.</div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.from === 'bot') {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">F</div>
        <div>
          <div className="bg-gray-100 px-3 py-2 rounded-xl max-w-md text-sm text-gray-900">{message.text}</div>
          <div className="text-xs text-gray-400 mt-1">{message.time}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end justify-end">
      <div className="text-xs text-gray-400 mr-2">{message.time}</div>
      <div className="bg-yellow-400 px-3 py-2 rounded-xl max-w-md text-sm text-gray-900">{message.text}</div>
    </div>
  );
}