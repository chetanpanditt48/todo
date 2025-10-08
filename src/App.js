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





xxxxxxxxxxxxxxx

import React, { useState, useEffect, useRef } from "react";

/*
AirAssist — Enhanced mock chatbot UI
Features added from uploaded Passenger Disruption Management PPT:
- Predictive delay alert (mocked)
- Quick rebook / suggestion flow
- FAQ retrieval (mock)
- Multilingual toggle (EN/FR)
- Typing indicator, human handoff
- All mock data. No external API calls.

Save as: src/components/AirAssistEnhanced.js
Tailwind required. Use Roboto/Noto Sans for UI font.
Legal: This is a mock. Do not use Air Canada trademarks without permission.
*/

const MOCK_BOOKINGS = [
  { id: "AC123456", route: "YYZ → YVR", status: "Confirmed", dep: "2025-10-12T19:30:00Z", price: "CAD 499" },
  { id: "AC987654", route: "YYZ → YUL", status: "Checked-in", dep: "2025-10-04T08:00:00Z", price: "CAD 129" },
];

const FAQ = {
  en: [
    { q: "What is the refund policy?", a: "Refunds depend on fare class. Submit booking ref to check eligibility." },
    { q: "How early can I check-in?", a: "Check-in opens 24 hours before scheduled departure." },
  ],
  fr: [
    { q: "Quelle est la politique de remboursement?", a: "Les remboursements dépendent de la classe tarifaire. Envoyez la réservation pour vérifier." },
    { q: "Quand puis-je m'enregistrer?", a: "L'enregistrement ouvre 24 heures avant le départ prévu." },
  ],
};

// Simple mock predictive model: returns risk level and reasoning using booking data
function predictDelayRisk(booking) {
  // mock heuristics based on route and date
  const hour = new Date(booking.dep).getUTCHours();
  const routeRisk = booking.route.includes("YVR") ? 0.3 : 0.1; // Vancouver wetter
  const nightPenalty = hour >= 0 && hour <= 6 ? 0.2 : 0;
  const base = 0.05 + routeRisk + nightPenalty;
  const score = Math.min(0.95, Math.round((base + Math.random() * 0.15) * 100) / 100);
  const label = score > 0.6 ? "High" : score > 0.3 ? "Medium" : "Low";
  const reason = `Weather-window + historical delays on ${booking.route}. Night departures add risk.`;
  return { score, label, reason };
}

function Mark() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded-full bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23F01428'/%3E%3Cpath d='M7 12a5 5 0 0 1 10 0 5 5 0 0 1-10 0z' fill='%23fff'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="text-sm font-medium" style={{ fontFamily: "Roboto, Noto Sans, system-ui" }}>
        AirAssist
      </div>
    </div>
  );
}

export default function AirAssistEnhanced() {
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Welcome to AirAssist. Ask about flight status, delays or rebooking.", time: "10:00" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selected, setSelected] = useState(MOCK_BOOKINGS[0]);
  const [handoff, setHandoff] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function appendUser(text) {
    if (!text.trim()) return;
    const u = { id: Date.now(), from: "user", text: text.trim(), time: nowTime() };
    setMessages((p) => [...p, u]);
    setInput("");
    botReply(text.trim());
  }

  function botReply(text) {
    setIsTyping(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "";
      if (lower.includes("predict") || lower.includes("risk") || lower.includes("delay")) {
        const risk = predictDelayRisk(selected);
        reply = `Prediction: ${risk.label} risk (${Math.round(risk.score * 100)}%). Reason: ${risk.reason}`;
      } else if (lower.includes("rebook") || lower.includes("suggest")) {
        reply =
          "Suggested options: 1) Rebook to next flight (+CAD 40). 2) Refund (fare rules apply). Reply with 'rebook 1' or 'refund'.";
      } else if (lower.includes("faq") || lower.includes("policy") || lower.includes("refund")) {
        setShowFAQ(true);
        reply = lang === "en" ? "Opened FAQ. Select a question." : "FAQ ouvert. Sélectionnez une question.";
      } else if (lower.includes("agent") || handoff) {
        setHandoff(true);
        reply = lang === "en" ? "Connecting to human agent. ETA 2-5 min." : "Connexion à un agent. Délai 2-5 min.";
      } else if (lower.startsWith("rebook")) {
        // mock parsing
        reply = "Rebook confirmed on next available flight. Confirmation: REBOOK-4567. Check email.";
      } else if (lower.startsWith("refund")) {
        reply = "Refund request submitted. Reference: RF-2025-998. Processing in 3-7 business days.";
      } else {
        reply = lang === "en" ? "Sorry, I didn't understand. Try 'predict delay', 'rebook' or 'faq'." : "Désolé, je n'ai pas compris. Essayez 'predict delay', 'rebook' ou 'faq'.";
      }
      const b = { id: Date.now() + 1, from: "bot", text: reply, time: nowTime() };
      setMessages((p) => [...p, b]);
      setIsTyping(false);
    }, 700 + Math.random() * 600);
  }

  function quick(action) {
    if (action === "predict") appendUser("predict delay");
    if (action === "rebook") appendUser("suggest rebook");
    if (action === "faq") appendUser("open faq");
    if (action === "agent") {
      setHandoff(true);
      appendUser("connect agent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-5xl grid grid-cols-12 gap-4" style={{ fontFamily: "Roboto, Noto Sans, system-ui" }}>
        {/* Chat */}
        <div className="col-span-12 md:col-span-8 bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Mark />
              <div className="text-xs text-gray-500">Passenger Disruption Management • Demo</div>
            </div>
            <div className="flex items-center gap-3">
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-sm border rounded px-2 py-1">
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
              <button onClick={() => setShowFAQ((s) => !s)} className="text-sm px-3 py-1 border rounded">FAQ</button>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            <div ref={listRef} className="flex-1 overflow-auto space-y-3 mb-4">
              {messages.map((m) => (
                <div key={m.id} className={m.from === "bot" ? "flex items-start gap-3" : "flex items-end justify-end"}>
                  {m.from === "bot" ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs text-red-700">A</div>
                      <div>
                        <div className="bg-gray-50 px-3 py-2 rounded-xl max-w-xl text-sm text-gray-900">{m.text}</div>
                        <div className="text-xs text-gray-400 mt-1">{m.time}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-gray-400 mr-2">{m.time}</div>
                      <div className="bg-[#F01428] px-3 py-2 rounded-xl max-w-xl text-sm text-white">{m.text}</div>
                    </>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs text-red-700">A</div>
                  <div className="ml-2 text-sm text-gray-600 italic">{lang === "en" ? "AirAssist is typing..." : "AirAssist écrit..."}</div>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex gap-2 mb-3">
                <button onClick={() => quick("predict")} className="px-3 py-1 rounded-full bg-[#F01428] text-white text-sm font-medium">Predict delay</button>
                <button onClick={() => quick("rebook")} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Suggest rebook</button>
                <button onClick={() => quick("faq")} className="px-3 py-1 rounded-full bg-gray-200 text-sm">FAQ</button>
                <button onClick={() => quick("agent")} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Agent</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); appendUser(input); }} className="flex gap-2">
                <input
                  aria-label="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang === "en" ? "Type message or booking ref" : "Tapez message ou référence"}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button type="submit" className="px-4 py-2 bg-[#F01428] text-white rounded-lg">{lang === "en" ? "Send" : "Envoyer"}</button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Context & Tools */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">{lang === "en" ? "Bookings" : "Réservations"}</div>
              <div className="text-xs text-gray-500">{MOCK_BOOKINGS.length}</div>
            </div>

            <div className="space-y-3">
              {MOCK_BOOKINGS.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className={`p-3 rounded-lg border cursor-pointer ${selected.id === b.id ? "border-[#F01428] bg-red-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{b.route}</div>
                    <div className="text-xs text-gray-500">{b.price}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{b.id}</div>
                  <div className="mt-2 text-sm">Status: <span className="font-semibold">{b.status}</span></div>
                  <div className="text-xs text-gray-400">{new Date(b.dep).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <button onClick={() => appendUser(`predict delay ${selected.id}`)} className="text-sm text-blue-600">{lang === "en" ? "Run prediction" : "Lancer prédiction"}</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">{lang === "en" ? "Conversation context" : "Contexte"}</div>
              <div className="text-xs text-gray-500">{handoff ? (lang === "en" ? "Agent requested" : "Agent demandé") : (lang === "en" ? "No agent" : "Aucun agent")}</div>
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-700">{lang === "en" ? "Selected booking" : "Réservation sélectionnée"}</div>
              <div className="mt-2 p-3 rounded-lg border border-gray-100">
                <div className="text-sm font-medium">{selected.route}</div>
                <div className="text-xs text-gray-500">{selected.id}</div>
                <div className="mt-2 text-sm">Status: <span className="font-semibold">{selected.status}</span></div>
                <div className="text-xs text-gray-400">{new Date(selected.dep).toLocaleString()}</div>
              </div>

              <div className="mt-3">
                <button onClick={() => appendUser(`rebook ${selected.id}`)} className="w-full py-2 rounded-md border border-gray-200">{lang === "en" ? "Request seat change / rebook" : "Demander changement / réreservation"}</button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input id="handoff" type="checkbox" checked={handoff} onChange={(e) => setHandoff(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="handoff" className="text-sm">{lang === "en" ? "Request human agent" : "Demander agent humain"}</label>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">{lang === "en" ? "Mock UI. Do not use trademarks." : "Interface factice. Ne pas utiliser les marques."}</div>
        </div>

        {/* FAQ drawer (simple) */}
        {showFAQ && (
          <div className="fixed right-6 top-20 w-96 bg-white rounded-xl shadow-lg p-4 z-40">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">{lang === "en" ? "Frequently Asked Questions" : "Questions fréquentes"}</div>
              <button onClick={() => setShowFAQ(false)} className="text-xs text-gray-500">Close</button>
            </div>
            <div className="space-y-3 max-h-72 overflow-auto">
              {FAQ[lang].map((f, i) => (
                <div key={i} className="border-b pb-2">
                  <div className="text-sm font-medium">{f.q}</div>
                  <div className="text-xs text-gray-600 mt-1">{f.a}</div>
                  <div className="mt-2">
                    <button onClick={() => appendUser(`faq ${i}`)} className="text-xs text-blue-600">Ask bot about this</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}