import React, { useState, useEffect, useRef } from "react";

/*
AirAssist — 3-phase mock app (Before booking, After booking, Cancelled)
- Phase 1 (before booking): Search flights. No chat icon until flights are listed.
  After search, show chat launcher. Chat operates entirely inside modal:
  -> predict delay (per flight)
  -> suggest flight for the day (choose least-risk flight)
  -> booking redirects to Air Canada portal and adds booking to "My Trips"
- Phase 2 (after booking): My Trips shows booked flights. Each flight has chat launcher.
  In-chat options: predict delay, suggest rebook (if chosen redirect to AC portal),
  request cancel (cancels booking in-app via chat).
- Phase 3 (cancelled scenario): Demonstration of an automatic cancellation.
  Chat options: show refund policy, re-accommodation guidance, rebook (redirect).
All behavior is mocked. No external popups except redirect to Air Canada (window.open).
*/

const DUMMY_FLIGHTS = [
  // 2025-10-16 (5)
  { id: "AC1601", from: "YYZ", to: "YVR", dep: "2025-10-16T06:00:00Z", arr: "2025-10-16T08:30:00Z", price: "CAD 359", seats: 12 },
  { id: "AC1602", from: "YYZ", to: "YVR", dep: "2025-10-16T09:00:00Z", arr: "2025-10-16T11:30:00Z", price: "CAD 379", seats: 9 },
  { id: "AC1603", from: "YYZ", to: "YVR", dep: "2025-10-16T12:00:00Z", arr: "2025-10-16T14:30:00Z", price: "CAD 399", seats: 7 },
  { id: "AC1604", from: "YYZ", to: "YVR", dep: "2025-10-16T15:30:00Z", arr: "2025-10-16T18:00:00Z", price: "CAD 429", seats: 5 },
  { id: "AC1605", from: "YYZ", to: "YVR", dep: "2025-10-16T20:45:00Z", arr: "2025-10-17T00:15:00Z", price: "CAD 459", seats: 4 },

  // 2025-10-17 (5)
  { id: "AC1701", from: "YYZ", to: "YVR", dep: "2025-10-17T05:30:00Z", arr: "2025-10-17T08:00:00Z", price: "CAD 349", seats: 10 },
  { id: "AC1702", from: "YYZ", to: "YVR", dep: "2025-10-17T08:45:00Z", arr: "2025-10-17T11:15:00Z", price: "CAD 369", seats: 8 },
  { id: "AC1703", from: "YYZ", to: "YVR", dep: "2025-10-17T11:50:00Z", arr: "2025-10-17T14:20:00Z", price: "CAD 389", seats: 6 },
  { id: "AC1704", from: "YYZ", to: "YVR", dep: "2025-10-17T14:30:00Z", arr: "2025-10-17T17:00:00Z", price: "CAD 419", seats: 5 },
  { id: "AC1705", from: "YYZ", to: "YVR", dep: "2025-10-17T19:15:00Z", arr: "2025-10-17T21:45:00Z", price: "CAD 449", seats: 3 },

  // 2025-10-18 (5)
  { id: "AC1801", from: "YYZ", to: "YVR", dep: "2025-10-18T06:15:00Z", arr: "2025-10-18T08:45:00Z", price: "CAD 339", seats: 14 },
  { id: "AC1802", from: "YYZ", to: "YVR", dep: "2025-10-18T09:30:00Z", arr: "2025-10-18T12:00:00Z", price: "CAD 359", seats: 11 },
  { id: "AC1803", from: "YYZ", to: "YVR", dep: "2025-10-18T12:45:00Z", arr: "2025-10-18T15:15:00Z", price: "CAD 389", seats: 8 },
  { id: "AC1804", from: "YYZ", to: "YVR", dep: "2025-10-18T16:00:00Z", arr: "2025-10-18T18:30:00Z", price: "CAD 419", seats: 6 },
  { id: "AC1805", from: "YYZ", to: "YVR", dep: "2025-10-18T21:00:00Z", arr: "2025-10-19T00:30:00Z", price: "CAD 479", seats: 2 },

  // sample other routes
  { id: "AC2001", from: "YYZ", to: "YUL", dep: "2025-10-16T07:00:00Z", arr: "2025-10-16T08:20:00Z", price: "CAD 159", seats: 20 },
  { id: "AC2002", from: "YYZ", to: "YUL", dep: "2025-10-17T10:00:00Z", arr: "2025-10-17T11:20:00Z", price: "CAD 179", seats: 12 },
];

function predictDelayRisk(flight, dateStr) {
  // mock deterministic-ish score from flight id + date
  const base = flight.to === "YVR" ? 0.35 : 0.15;
  const d = new Date(dateStr || flight.dep);
  const dayPenalty = (d.getDate() % 3 === 0) ? 0.12 : (d.getDate() % 2 === 0 ? 0.07 : 0.0);
  const pseudo = (flight.id.charCodeAt(2) % 10) / 100; // small pseudo-random from id
  const score = Math.min(0.95, Math.round((base + dayPenalty + pseudo) * 100) / 100);
  const label = score > 0.6 ? "High" : score > 0.3 ? "Medium" : "Low";
  const reason = `Mock factors: historical route delays, weather-window and time-of-day for ${flight.from}→${flight.to}.`;
  return { score, label, reason };
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-full bg-[#F01428] flex items-center justify-center text-white font-bold">A</div>
      <div className="font-medium">AirAssist</div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("before"); // before | after | cancelled
  const [from, setFrom] = useState("YYZ");
  const [to, setTo] = useState("YVR");
  const [date, setDate] = useState("2025-10-16");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  // bookings stored here (after booking)
  const [bookings, setBookings] = useState([]); // { ...flight, bookingRef, status }
  // cancelled scenario sample flight
  const cancelledFlight = {
    id: "ACX999",
    from: "YYZ",
    to: "YVR",
    dep: "2025-10-16T09:00:00Z",
    arr: "2025-10-16T11:30:00Z",
    price: "CAD 399",
    reason: "Severe storm — automatic cancellation",
  };

  const [chatContext, setChatContext] = useState(null); // { mode: 'search'|'mytrip'|'cancelled', flights:[], selectedFlight }

  // Search flights (filter by from/to/date)
  function searchFlights() {
    const fFrom = (from || "").trim().toUpperCase();
    const fTo = (to || "").trim().toUpperCase();
    const target = date ? new Date(date).toISOString().slice(0, 10) : null;
    const res = DUMMY_FLIGHTS.filter(f => {
      const matchFrom = !fFrom || f.from === fFrom;
      const matchTo = !fTo || f.to === fTo;
      const matchDate = !target || new Date(f.dep).toISOString().slice(0, 10) === target;
      return matchFrom && matchTo && matchDate;
    });
    setResults(res);
    setSelected(res[0] || null);
  }

  function handleBook(flight) {
    // create booking, redirect to Air Canada booking portal
    const ref = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookings(b => [...b, { ...flight, bookingRef: ref, status: "Booked" }]);
    // redirect
    const url = `https://www.aircanada.com/booking?flight=${flight.id}&from=${flight.from}&to=${flight.to}&date=${(date||flight.dep).slice(0,10)}`;
    window.open(url, "_blank");
    // navigate to after-booking phase (my trips)
    setPhase("after");
  }

  function cancelBooking(bookingRef) {
    setBookings(b => b.map(x => x.bookingRef === bookingRef ? { ...x, status: "Cancelled" } : x));
  }

  // open chat context
  function openChat(mode, flights = [], sel = null) {
    setChatContext({ mode, flights, selectedFlight: sel });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" style={{ fontFamily: "Inter, system-ui" }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Logo />
          <div className="flex gap-2">
            <button onClick={() => setPhase("before")} className={`px-3 py-1 rounded ${phase==="before" ? "bg-[#F01428] text-white" : "bg-white border"}`}>Before booking</button>
            <button onClick={() => setPhase("after")} className={`px-3 py-1 rounded ${phase==="after" ? "bg-[#F01428] text-white" : "bg-white border"}`}>After booking</button>
            <button onClick={() => setPhase("cancelled")} className={`px-3 py-1 rounded ${phase==="cancelled" ? "bg-[#F01428] text-white" : "bg-white border"}`}>Cancelled scenario</button>
          </div>
        </header>

        {/* PHASE 1 - BEFORE BOOKING */}
        {phase === "before" && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-9">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Search flights (Before booking)</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <input className="border p-2 rounded" value={from} onChange={e=>setFrom(e.target.value)} />
                  <input className="border p-2 rounded" value={to} onChange={e=>setTo(e.target.value)} />
                  <input type="date" className="border p-2 rounded" value={date} onChange={e=>setDate(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={searchFlights} className="bg-[#F01428] text-white px-4 py-2 rounded">Search</button>
                    <button onClick={()=>{ setFrom(""); setTo(""); setDate(""); setResults([]); setSelected(null); }} className="px-4 py-2 border rounded">Clear</button>
                  </div>
                </div>

                <div className="mt-6">
                  {results.length === 0 ? (
                    <div className="text-sm text-gray-500">No flights. After search, a chat launcher will appear to analyze results.</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {results.map(f => (
                          <div key={f.id} className={`p-3 border rounded flex items-center justify-between ${selected?.id===f.id ? "bg-red-50 border-[#F01428]" : ""}`}>
                            <div>
                              <div className="font-medium">{f.from} → {f.to} • {f.id}</div>
                              <div className="text-xs text-gray-500">Dep: {new Date(f.dep).toLocaleString()} • Seats: {f.seats}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-gray-700">{f.price}</div>
                              <button onClick={()=>setSelected(f)} className="px-3 py-1 border rounded">Select</button>
                              <button onClick={()=>handleBook(f)} className="px-3 py-1 bg-[#F01428] text-white rounded">Book (redirect)</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat launcher icon appears only after results are present */}
                      <div className="mt-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-xs text-gray-500 mr-auto">Use chat for predictions and suggestions (in-chat only)</div>
                          <ChatLauncher onOpen={() => openChat("search", results, selected)} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* right panel info */}
            <div className="col-span-12 md:col-span-3">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="font-medium mb-2">How chat works</div>
                <div className="text-sm text-gray-600">
                  - Predict delay per listed flight. <br/>
                  - Suggest best flight for selected day (least delay risk). <br/>
                  - Booking always redirects to Air Canada portal.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2 - AFTER BOOKING (My Trips) */}
        {phase === "after" && (
          <div>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">My upcoming trips</h2>

              {bookings.length === 0 ? (
                <div className="text-sm text-gray-500">No booked flights. Book one from the Search tab.</div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div key={b.bookingRef} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{b.from} → {b.to} • {b.id}</div>
                        <div className="text-xs text-gray-500">Booking: {b.bookingRef} • Dep: {new Date(b.dep).toLocaleString()} • Status: {b.status}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChatLauncher onOpen={() => openChat("mytrip", bookings, b)} />
                        <button onClick={() => cancelBooking(b.bookingRef)} className="px-3 py-1 border rounded">Cancel (immediate)</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 3 - CANCELLED SCENARIO */}
        {phase === "cancelled" && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Automatic cancellation example</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Cancelled flight</div>
                <div className="text-sm">
                  <div>{cancelledFlight.id} • {cancelledFlight.from} → {cancelledFlight.to}</div>
                  <div className="text-xs text-gray-500">Dep: {new Date(cancelledFlight.dep).toLocaleString()}</div>
                  <div className="mt-2 text-sm text-red-600 font-semibold">{cancelledFlight.reason}</div>
                </div>
              </div>

              <div className="p-4 border rounded flex flex-col justify-between">
                <div>
                  <div className="font-medium mb-2">Passenger options</div>
                  <ul className="list-disc ml-5 text-sm text-gray-700">
                    <li>View refund & cancellation policy in chat.</li>
                    <li>Request re-accommodation or rebooking (redirect to Air Canada portal for rebooking).</li>
                  </ul>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <ChatLauncher onOpen={() => openChat("cancelled", [cancelledFlight], cancelledFlight)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat modal appears when chatContext set */}
        {chatContext && (
          <ChatModal
            context={chatContext}
            onClose={() => setChatContext(null)}
            onBook={(flight) => handleBook(flight)}
            onCancelBooking={(bookingRef) => cancelBooking(bookingRef)}
            onRedirectToAC={(flight, action) => {
              const url = `https://www.aircanada.com/booking?flight=${flight.id}&from=${flight.from}&to=${flight.to}&date=${(date||flight.dep).slice(0,10)}&action=${action}`;
              window.open(url, "_blank");
            }}
            bookings={bookings}
            setBookings={setBookings}
          />
        )}
      </div>
    </div>
  );
}

/* Chat launcher icon */
function ChatLauncher({ onOpen }) {
  return (
    <button onClick={onOpen} className="w-10 h-10 rounded-full bg-[#F01428] flex items-center justify-center text-white shadow">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7.03 3 3 6.58 3 11c0 1.94.82 3.74 2.25 5.14L5 21l4.27-1.21C10.17 20.06 11.06 20.25 12 20.25c4.97 0 9-3.58 9-8.25S16.97 3 12 3z"/></svg>
    </button>
  );
}

/* ChatModal: all chat interactions happen here (messages shown inside modal)
   Supported commands / buttons per context:
   - mode 'search': predict <flightId>, suggest-day (suggest least-risk flight among listed)
   - mode 'mytrip': predict, suggest rebook (redirect), cancel booking (in-chat)
   - mode 'cancelled': show refund policy, rebook redirect
*/
function ChatModal({ context, onClose, onBook, onCancelBooking, onRedirectToAC, bookings, setBookings }) {
  const { mode, flights, selectedFlight } = context;
  const [messages, setMessages] = useState(() => [
    { id: 1, from: "bot", text: mode === "search" ? "Chat ready. You can ask: predict <flightId>, suggest day, or 'book <flightId>'." : mode === "mytrip" ? "Chat ready for your booked flight. Options: predict, suggest rebook, cancel booking." : "Chat for cancelled flight. Options: refund policy, rebook." }
  ]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(selectedFlight || (flights && flights[0]) || null);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function pushUser(text) {
    if (!text || !text.trim()) return;
    const u = { id: Date.now(), from: "user", text, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    setMessages(m => [...m, u]);
    handleCommand(text.trim());
    setInput("");
  }

  function pushBot(text) {
    const b = { id: Date.now()+1, from: "bot", text, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    setMessages(m => [...m, b]);
  }

  function findFlightById(id) {
    return flights.find(f => f.id.toLowerCase() === id.toLowerCase()) || DUMMY_FLIGHTS.find(f => f.id.toLowerCase() === id.toLowerCase());
  }

  function handleCommand(raw) {
    const cmd = raw.toLowerCase();
    // booking command (search mode)
    if (cmd.startsWith("book ")) {
      const id = raw.split(/\s+/)[1];
      const f = findFlightById(id);
      if (!f) { pushBot(`Flight ${id} not found in current list.`); return; }
      pushBot(`Redirecting to Air Canada booking for ${f.id}.`);
      onBook(f);
      return;
    }

    // predict <id> or predict (for selected)
    if (cmd.startsWith("predict")) {
      const parts = raw.split(/\s+/);
      const id = parts.length > 1 ? parts[1] : (selected ? selected.id : null);
      const f = id ? findFlightById(id) : selected;
      if (!f) { pushBot("No flight selected. Provide a flight id or select one."); return; }
      const r = predictDelayRisk(f, (f.dep || null));
      pushBot(`Prediction for ${f.id}: ${r.label} risk (${Math.round(r.score*100)}%). Reason: ${r.reason}`);
      return;
    }

    // suggest day: compute least-risk flight among flights for the date
    if (cmd.includes("suggest") && cmd.includes("day")) {
      if (!flights || flights.length === 0) { pushBot("No flights in current list to evaluate."); return; }
      // compute risk for each flight for the selected date (use search date if available)
      const scored = flights.map(f => ({ f, r: predictDelayRisk(f, (f.dep || null)) }));
      scored.sort((a,b) => a.r.score - b.r.score);
      const best = scored[0];
      const text = `Suggestion: ${best.f.id} (${best.f.from}→${best.f.to} at ${new Date(best.f.dep).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}) is the lowest risk ( ${best.r.label}, ${Math.round(best.r.score*100)}% ).`;
      pushBot(text);
      return;
    }

    // suggest rebook (mytrip): show options and offer redirect
    if (cmd.includes("suggest") && cmd.includes("rebook")) {
      // if selected booking provided via selected variable or single flight in context
      const f = selected || (flights && flights[0]);
      if (!f) { pushBot("No flight selected to suggest rebook for."); return; }
      // find alternatives same route different times
      const alternatives = DUMMY_FLIGHTS.filter(x => x.from===f.from && x.to===f.to && x.id!==f.id).slice(0,3);
      if (alternatives.length === 0) { pushBot("No alternative flights available in mock data."); return; }
      const list = alternatives.map(a => `${a.id} • Dep ${new Date(a.dep).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • ${a.price}`).join("\n- ");
      pushBot(`Suggested alternatives:\n- ${list}\nReply with 'rebook <flightId>' to proceed (this will redirect you).`);
      return;
    }

    // rebook command triggers redirect (mytrip/cancelled)
    if (cmd.startsWith("rebook ")) {
      const id = raw.split(/\s+/)[1];
      const f = findFlightById(id);
      if (!f) { pushBot(`Flight ${id} not found.`); return; }
      pushBot(`Redirecting to booking portal for ${f.id}.`);
      onRedirectToAC(f, "rebook");
      return;
    }

    // request rebook (creates a request in-app, no external popup)
    if (cmd.includes("request rebook") || cmd.startsWith("request")) {
      const f = selected || (flights && flights[0]);
      if (!f) { pushBot("No flight selected to request rebook for."); return; }
      const reqRef = `RB-${Math.floor(1000 + Math.random()*9000)}`;
      pushBot(`Rebook request created for ${f.id}. Request ref: ${reqRef}. An agent will follow up.`);
      return;
    }

    // cancel booking (in chat only). expects "cancel <bookingRef>" or "cancel"
    if (cmd.startsWith("cancel")) {
      // if bookingRef provided
      const parts = raw.split(/\s+/);
      let ref = parts[1];
      if (!ref) {
        // try to find a booking corresponding to selected flight
        const sel = selected || (flights && flights[0]);
        if (sel) {
          const book = bookings.find(b => b.id === sel.id) || bookings[0];
          ref = book ? book.bookingRef : null;
        }
      }
      if (!ref) { pushBot("No booking reference provided or selected. Provide 'cancel <bookingRef>'."); return; }
      onCancelBooking(ref);
      pushBot(`Booking ${ref} cancelled (mock).`);
      return;
    }

    // refund / policy (cancelled mode)
    if (cmd.includes("refund") || cmd.includes("policy")) {
      pushBot("Refund policy (summary): Refunds depend on fare class and reason for disruption. Processing 3-7 business days typically. For full details visit Air Canada site.");
      return;
    }

    // help fallback
    pushBot("I didn't understand. Use commands like: predict <flightId>, suggest day, suggest rebook, rebook <flightId>, request rebook, cancel <bookingRef>, refund.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <div className="relative w-full md:w-3/5 lg:w-2/5 bg-white rounded-t-xl md:rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F01428] flex items-center justify-center text-white font-bold">A</div>
            <div>
              <div className="font-medium">AirAssist Chat</div>
              <div className="text-xs text-gray-500">{mode === "search" ? "Before booking" : mode === "mytrip" ? "After booking" : "Cancelled flow"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
          </div>
        </div>

        <div className="p-4 h-[60vh] md:h-[70vh] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3" ref={listRef}>
            {/* flight selector inside chat (if multiple) */}
            {flights && flights.length > 0 && (
              <div className="p-2 border rounded">
                <div className="text-xs text-gray-600 mb-2">Flights in current context (click to select):</div>
                <div className="flex gap-2 flex-wrap">
                  {flights.map(f => (
                    <button key={f.id}
                      onClick={() => { setSelected(f); pushBot(`Selected ${f.id} in chat.`); }}
                      className={`px-2 py-1 text-xs border rounded ${selected?.id===f.id ? "bg-[#F01428] text-white" : "bg-white"}`}>
                      {f.id} • {new Date(f.dep).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={m.from==="bot" ? "flex items-start gap-3" : "flex items-end justify-end"}>
                {m.from === "bot" ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs text-red-700">A</div>
                    <div>
                      <div className="bg-gray-50 px-3 py-2 rounded-xl text-sm text-gray-900" style={{whiteSpace: "pre-wrap"}}>{m.text}</div>
                      <div className="text-xs text-gray-400 mt-1">{m.time}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-400 mr-2">{m.time}</div>
                    <div className="bg-[#F01428] px-3 py-2 rounded-xl text-sm text-white">{m.text}</div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 border-t pt-3">
            <div className="flex gap-2 mb-2">
              {/* quick action buttons vary by mode */}
              {mode === "search" && (
                <>
                  <button onClick={() => { pushUser("predict " + (selected?.id || "")); }} className="px-3 py-1 bg-[#F01428] text-white rounded text-sm">Predict</button>
                  <button onClick={() => { pushUser("suggest day"); }} className="px-3 py-1 border rounded text-sm">Suggest day</button>
                  <button onClick={() => { if(selected) pushUser("book " + selected.id); else pushUser("book"); }} className="px-3 py-1 border rounded text-sm">Book (redirect)</button>
                </>
              )}
              {mode === "mytrip" && (
                <>
                  <button onClick={() => { pushUser("predict " + (selected?.id || "")); }} className="px-3 py-1 bg-[#F01428] text-white rounded text-sm">Predict</button>
                  <button onClick={() => { pushUser("suggest rebook"); }} className="px-3 py-1 border rounded text-sm">Suggest rebook</button>
                  <button onClick={() => { pushUser("request rebook"); }} className="px-3 py-1 border rounded text-sm">Request rebook</button>
                  <button onClick={() => { pushUser("cancel"); }} className="px-3 py-1 border rounded text-sm">Cancel booking</button>
                </>
              )}
              {mode === "cancelled" && (
                <>
                  <button onClick={() => { pushUser("refund policy"); }} className="px-3 py-1 border rounded text-sm">Refund policy</button>
                  <button onClick={() => { pushUser("rebook"); }} className="px-3 py-1 bg-[#F01428] text-white rounded text-sm">Rebook (redirect)</button>
                </>
              )}
            </div>

            <form onSubmit={(e)=>{ e.preventDefault(); pushUser(input); }} className="flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a command (predict, suggest day, rebook <id>, request rebook, cancel <ref>)" className="flex-1 border px-3 py-2 rounded" />
              <button type="submit" className="px-4 py-2 bg-[#F01428] text-white rounded">Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}