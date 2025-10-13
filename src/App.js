import React, { useState, useEffect, useRef } from "react";

/*
AirAssist — Search-based mock chatbot UI
Save as: src/components/AirAssistEnhanced.js
Requires: Tailwind CSS and a UI font (Roboto / Noto Sans) loaded globally.

Behavior:
- User searches flights by From/To/Date in right panel.
- Matching flights (mocked) are listed.
- User selects a flight. Chat can act on selected flight (status, book, predict delay).
- All data is mock. No external APIs.
- Do not use Air Canada trademarks without permission.
*/

const FLIGHTS = [
  { id: "AC101", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-15T07:00:00Z", arr: "2025-10-15T09:30:00Z", price: "CAD 399", seats: 12 },
  { id: "AC202", from: "YYZ", to: "YUL", route: "YYZ → YUL", dep: "2025-10-15T10:00:00Z", arr: "2025-10-15T11:15:00Z", price: "CAD 199", seats: 8 },
  { id: "AC303", from: "YUL", to: "YYZ", route: "YUL → YYZ", dep: "2025-10-15T14:00:00Z", arr: "2025-10-15T15:15:00Z", price: "CAD 179", seats: 6 },
  { id: "AC404", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-16T12:00:00Z", arr: "2025-10-16T14:30:00Z", price: "CAD 429", seats: 5 },
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

function predictDelayRisk(flight) {
  const hour = new Date(flight.dep).getUTCHours();
  const routeRisk = flight.to === "YVR" ? 0.3 : 0.1;
  const nightPenalty = hour >= 0 && hour <= 6 ? 0.2 : 0;
  const base = 0.05 + routeRisk + nightPenalty;
  const score = Math.min(0.95, Math.round((base + Math.random() * 0.15) * 100) / 100);
  const label = score > 0.6 ? "High" : score > 0.3 ? "Medium" : "Low";
  const reason = `Weather-window + historical delays on ${flight.route}. Night departures add risk.`;
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
    { id: 1, from: "bot", text: "Welcome to AirAssist. Search flights or ask about flight status.", time: "10:00" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // search states
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  // UI state
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
    if (!text || !text.trim()) return;
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

      // book flow
      if (lower.startsWith("book") || lower.startsWith("reserve")) {
        if (!selected) {
          reply = "No flight selected. Use the search on the right and select a flight first.";
        } else {
          // mock booking confirmation
          const conf = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
          reply = `Booking confirmed for ${selected.id} (${selected.route}). Confirmation: ${conf}.`;
        }
      }
      // flight status about selected flight
      else if (lower.includes("status") || lower.includes("flight status")) {
        if (!selected) reply = "No flight selected. Search and select a flight to see status.";
        else reply = `Flight ${selected.id} status: Confirmed. Departure: ${new Date(selected.dep).toLocaleString()}.`;
      }
      // predict delay for selected flight
      else if (lower.includes("predict") || lower.includes("delay") || lower.includes("risk")) {
        if (!selected) reply = "No flight selected. Select a flight to run prediction.";
        else {
          const r = predictDelayRisk(selected);
          reply = `Prediction for ${selected.id}: ${r.label} risk (${Math.round(r.score * 100)}%). Reason: ${r.reason}`;
        }
      }
      // open FAQ
      else if (lower.includes("faq") || lower.includes("policy") || lower.includes("refund")) {
        setShowFAQ(true);
        reply = lang === "en" ? "Opened FAQ. Select a question." : "FAQ ouvert. Sélectionnez une question.";
      }
      // connect to agent
      else if (lower.includes("agent") || lower.includes("human") || handoff) {
        setHandoff(true);
        reply = lang === "en" ? "Connecting to human agent. ETA 2-5 min." : "Connexion à un agent. Délai 2-5 min.";
      }
      // handle simple search typed in chat: "search YYZ YVR 2025-10-15"
      else if (lower.startsWith("search")) {
        const parts = text.split(/\s+/);
        // naive parsing: expect "search FROM TO YYYY-MM-DD"
        if (parts.length >= 4) {
          const sFrom = parts[1].toUpperCase();
          const sTo = parts[2].toUpperCase();
          const sDate = parts[3];
          runSearch(sFrom, sTo, sDate);
          reply = `Searching flights from ${sFrom} to ${sTo} on ${sDate}...`;
        } else {
          reply = "To search in chat: `search <FROM> <TO> <YYYY-MM-DD>`. Example: search YYZ YVR 2025-10-15";
        }
      }
      // ask about booking or unknown commands
      else {
        reply = lang === "en"
          ? "Try: search <FROM> <TO> <DATE>, 'predict', 'status', 'book', 'faq' or use the search form on the right."
          : "Essayez : search <FROM> <TO> <DATE>, 'predict', 'status', 'book', 'faq' ou utilisez le formulaire de recherche à droite.";
      }

      const b = { id: Date.now() + 1, from: "bot", text: reply, time: nowTime() };
      setMessages((p) => [...p, b]);
      setIsTyping(false);
    }, 600 + Math.random() * 600);
  }

  function runSearch(sFrom, sTo, sDate) {
    const fFrom = (sFrom || from || "").toLowerCase();
    const fTo = (sTo || to || "").toLowerCase();
    // filter flights by from/to. Date matching optional: match by date if provided.
    const res = FLIGHTS.filter((f) => {
      const matchFrom = f.from.toLowerCase().includes(fFrom);
      const matchTo = f.to.toLowerCase().includes(fTo);
      let matchDate = true;
      if (sDate || date) {
        const target = (sDate || date).split("T")[0] || (sDate || date);
        matchDate = new Date(f.dep).toISOString().slice(0, 10) === target;
      }
      return matchFrom && matchTo && matchDate;
    });
    setResults(res);
    setSelected(res.length > 0 ? res[0] : null);
    // push a bot message summarizing results
    const summary = res.length === 0 ? `No flights found from ${sFrom || from} to ${sTo || to}` : `Found ${res.length} flights from ${sFrom || from} to ${sTo || to}. Select a flight from the list.`;
    const botMsg = { id: Date.now() + 5, from: "bot", text: summary, time: nowTime() };
    setMessages((p) => [...p, botMsg]);
  }

  function onSearchClick() {
    // validate minimal fields
    if (!from.trim() || !to.trim() || !date) {
      appendUser("Please provide From, To and Date in the search form.");
      return;
    }
    runSearch(from.trim().toUpperCase(), to.trim().toUpperCase(), date);
  }

  function quick(action) {
    if (action === "predict") appendUser("predict");
    if (action === "book") appendUser("book");
    if (action === "status") appendUser("status");
    if (action === "faq") appendUser("faq");
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
              <div className="text-xs text-gray-500">Search & Book • Demo</div>
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
                <button onClick={() => quick("status")} className="px-3 py-1 rounded-full bg-[#F01428] text-white text-sm font-medium">Status</button>
                <button onClick={() => quick("predict")} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Predict delay</button>
                <button onClick={() => quick("book")} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Book selected</button>
                <button onClick={() => quick("agent")} className="px-3 py-1 rounded-full bg-gray-200 text-sm">Agent</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); appendUser(input); }} className="flex gap-2">
                <input
                  aria-label="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang === "en" ? "Type message (e.g. search YYZ YVR 2025-10-15)" : "Tapez message (ex: search YYZ YVR 2025-10-15)"}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button type="submit" className="px-4 py-2 bg-[#F01428] text-white rounded-lg">{lang === "en" ? "Send" : "Envoyer"}</button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Search & Results */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-sm font-semibold mb-2">{lang === "en" ? "Search flights" : "Rechercher vols"}</div>

            <input type="text" placeholder="From (IATA e.g. YYZ)" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full mb-2 border rounded px-2 py-1 text-sm" />
            <input type="text" placeholder="To (IATA e.g. YVR)" value={to} onChange={(e) => setTo(e.target.value)} className="w-full mb-2 border rounded px-2 py-1 text-sm" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mb-3 border rounded px-2 py-1 text-sm" />

            <div className="flex gap-2">
              <button onClick={onSearchClick} className="flex-1 bg-[#F01428] text-white py-2 rounded-md text-sm">Search</button>
              <button onClick={() => { setFrom(""); setTo(""); setDate(""); setResults([]); setSelected(null); }} className="px-3 py-2 border rounded-md text-sm">Clear</button>
            </div>

            {results.length > 0 && (
              <div className="mt-4 space-y-3">
                {results.map((f) => (
                  <div key={f.id} onClick={() => setSelected(f)} className={`p-3 rounded-lg border cursor-pointer ${selected?.id === f.id ? "border-[#F01428] bg-red-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{f.route}</div>
                      <div className="text-xs text-gray-500">{f.price}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{f.id} • Dep: {new Date(f.dep).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-xs text-gray-400">Seats left: {f.seats}</div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && <div className="mt-3 text-xs text-gray-500">No results. Use the form above or search in chat.</div>}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">{lang === "en" ? "Selected flight" : "Vol sélectionné"}</div>
              <div className="text-xs text-gray-500">{handoff ? (lang === "en" ? "Agent requested" : "Agent demandé") : (lang === "en" ? "No agent" : "Aucun agent")}</div>
            </div>

            <div className="flex-1">
              {selected ? (
                <>
                  <div className="text-sm text-gray-700">{lang === "en" ? "Flight details" : "Détails du vol"}</div>
                  <div className="mt-2 p-3 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium">{selected.route}</div>
                    <div className="text-xs text-gray-500">{selected.id}</div>
                    <div className="mt-2 text-sm">Departs: {new Date(selected.dep).toLocaleString()}</div>
                    <div className="text-sm">Arrives: {new Date(selected.arr).toLocaleString()}</div>
                    <div className="text-sm mt-1">Price: {selected.price}</div>
                    <div className="text-xs text-gray-400 mt-1">Seats left: {selected.seats}</div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => appendUser(`status`)} className="py-2 rounded-md border border-gray-200 text-sm">Check status</button>
                      <button onClick={() => appendUser(`predict`)} className="py-2 rounded-md border border-gray-200 text-sm">Predict delay</button>
                      <button onClick={() => appendUser(`book`)} className="col-span-2 mt-2 py-2 bg-[#F01428] text-white rounded-md text-sm">Book this flight</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500">No flight selected. Search and pick a flight.</div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <input id="handoff" type="checkbox" checked={handoff} onChange={(e) => setHandoff(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="handoff" className="text-sm">{lang === "en" ? "Request human agent" : "Demander agent humain"}</label>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">{lang === "en" ? "Mock UI. Do not use trademarks." : "Interface factice. Ne pas utiliser les marques."}</div>
        </div>

        {/* FAQ drawer */}
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
                    <button onClick={() => appendUser(`${f.q}`)} className="text-xs text-blue-600">Ask bot about this</button>
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