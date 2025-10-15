import React, { useState, useEffect, useRef } from "react";

/*
AirAssist — Multi-day mock flow with expanded dummy flights
- Now includes 5 flight options for each day: 2025-10-16, 2025-10-17, 2025-10-18.
- Save as src/App.js or src/pages/AirAssistApp.js
- Tailwind CSS required.
- All data mocked. Redirects use placeholder Air Canada booking URL.
*/

const FLIGHTS = [
  // 2025-10-16 (5 options)
  { id: "AC1601", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-16T06:00:00Z", arr: "2025-10-16T08:30:00Z", price: "CAD 359", seats: 12 },
  { id: "AC1602", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-16T09:00:00Z", arr: "2025-10-16T11:30:00Z", price: "CAD 379", seats: 9 },
  { id: "AC1603", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-16T12:00:00Z", arr: "2025-10-16T14:30:00Z", price: "CAD 399", seats: 7 },
  { id: "AC1604", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-16T15:30:00Z", arr: "2025-10-16T18:00:00Z", price: "CAD 429", seats: 5 },
  { id: "AC1605", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-16T20:45:00Z", arr: "2025-10-17T00:15:00Z", price: "CAD 459", seats: 4 },

  // 2025-10-17 (5 options)
  { id: "AC1701", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-17T05:30:00Z", arr: "2025-10-17T08:00:00Z", price: "CAD 349", seats: 10 },
  { id: "AC1702", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-17T08:45:00Z", arr: "2025-10-17T11:15:00Z", price: "CAD 369", seats: 8 },
  { id: "AC1703", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-17T11:50:00Z", arr: "2025-10-17T14:20:00Z", price: "CAD 389", seats: 6 },
  { id: "AC1704", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-17T14:30:00Z", arr: "2025-10-17T17:00:00Z", price: "CAD 419", seats: 5 },
  { id: "AC1705", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-17T19:15:00Z", arr: "2025-10-17T21:45:00Z", price: "CAD 449", seats: 3 },

  // 2025-10-18 (5 options)
  { id: "AC1801", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-18T06:15:00Z", arr: "2025-10-18T08:45:00Z", price: "CAD 339", seats: 14 },
  { id: "AC1802", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-18T09:30:00Z", arr: "2025-10-18T12:00:00Z", price: "CAD 359", seats: 11 },
  { id: "AC1803", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-18T12:45:00Z", arr: "2025-10-18T15:15:00Z", price: "CAD 389", seats: 8 },
  { id: "AC1804", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-18T16:00:00Z", arr: "2025-10-18T18:30:00Z", price: "CAD 419", seats: 6 },
  { id: "AC1805", from: "YYZ", to: "YVR", route: "YYZ → YVR", dep: "2025-10-18T21:00:00Z", arr: "2025-10-19T00:30:00Z", price: "CAD 479", seats: 2 },

  // some other routes for variety
  { id: "AC2001", from: "YYZ", to: "YUL", route: "YYZ → YUL", dep: "2025-10-16T07:00:00Z", arr: "2025-10-16T08:20:00Z", price: "CAD 159", seats: 20 },
  { id: "AC2002", from: "YYZ", to: "YUL", route: "YYZ → YUL", dep: "2025-10-17T10:00:00Z", arr: "2025-10-17T11:20:00Z", price: "CAD 179", seats: 12 },
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

function predictDelayRisk(flight, date) {
  const base = flight.to === "YVR" ? 0.35 : 0.15;
  const d = new Date(date || flight.dep);
  const dayPenalty = d.getDate() % 2 === 0 ? 0.1 : 0.0;
  const score = Math.min(0.95, Math.round((base + dayPenalty + Math.random() * 0.15) * 100) / 100);
  const label = score > 0.6 ? "High" : score > 0.3 ? "Medium" : "Low";
  const reason = `Mock factors: weather history for ${flight.route} and time-of-day.`;
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

export default function AirAssistApp() {
  const [page, setPage] = useState("search"); // search | mytrip | cancelled
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [booked, setBooked] = useState([]); // list of booked flights
  const [showChat, setShowChat] = useState(false);

  function runSearch() {
    const fFrom = (from || "").trim().toUpperCase();
    const fTo = (to || "").trim().toUpperCase();
    const target = date ? new Date(date).toISOString().slice(0, 10) : null;
    const res = FLIGHTS.filter((f) => {
      const matchFrom = !fFrom || f.from === fFrom;
      const matchTo = !fTo || f.to === fTo;
      const matchDate = !target || new Date(f.dep).toISOString().slice(0, 10) === target;
      return matchFrom && matchTo && matchDate;
    });
    setResults(res);
    setSelected(res[0] || null);
  }

  function handleBookRedirect(flight) {
    const url = `https://www.aircanada.com/booking?flight=${flight.id}&from=${flight.from}&to=${flight.to}&date=${(date||flight.dep).slice(0,10)}`;
    setBooked((b) => [...b, { ...flight, bookingRef: `BK-${Math.floor(100000 + Math.random()*900000)}` }]);
    window.open(url, "_blank");
    setPage("mytrip");
  }

  function cancelBooking(bookingRef) {
    setBooked((b) => b.filter((x) => x.bookingRef !== bookingRef));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" style={{ fontFamily: "Inter, system-ui" }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Logo />
          <nav className="flex gap-3">
            <button onClick={() => setPage("search")} className={`px-3 py-1 rounded ${page==='search'?'bg-[#F01428] text-white':'bg-white border'}`}>Search</button>
            <button onClick={() => setPage("mytrip")} className={`px-3 py-1 rounded ${page==='mytrip'?'bg-[#F01428] text-white':'bg-white border'}`}>My Trip</button>
            <button onClick={() => setPage("cancelled")} className={`px-3 py-1 rounded ${page==='cancelled'?'bg-[#F01428] text-white':'bg-white border'}`}>Cancelled Flow</button>
          </nav>
        </header>

        {page === "search" && (
          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-9">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Search flights</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <input className="border p-2 rounded" placeholder="From (IATA e.g. YYZ)" value={from} onChange={(e)=>setFrom(e.target.value)} />
                  <input className="border p-2 rounded" placeholder="To (IATA e.g. YVR)" value={to} onChange={(e)=>setTo(e.target.value)} />
                  <input type="date" className="border p-2 rounded" value={date} onChange={(e)=>setDate(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={runSearch} className="bg-[#F01428] text-white px-4 py-2 rounded">Search</button>
                    <button onClick={()=>{ setFrom(''); setTo(''); setDate(''); setResults([]); setSelected(null); }} className="px-4 py-2 border rounded">Clear</button>
                  </div>
                </div>

                <div className="mt-6">
                  {results.length === 0 ? (
                    <div className="text-sm text-gray-500">No results. Try a different query or use chat for recommendations.</div>
                  ) : (
                    <div className="space-y-3">
                      {results.map(f => (
                        <div key={f.id} className={`p-3 border rounded flex items-center justify-between ${selected?.id===f.id?'bg-red-50 border-[#F01428]':''}`}>
                          <div>
                            <div className="font-medium">{f.route} • {f.id}</div>
                            <div className="text-xs text-gray-500">Dep: {new Date(f.dep).toLocaleString()} • Seats: {f.seats}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-700 mr-4">{f.price}</div>
                            <button onClick={()=>setSelected(f)} className="px-3 py-1 border rounded">Select</button>
                            <button onClick={()=>handleBookRedirect(f)} className="px-3 py-1 bg-[#F01428] text-white rounded">Book</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-3">
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-3">
                <div className="text-sm font-semibold">AirAssist Chat</div>
                <p className="text-xs text-gray-500 text-center">Open chat to get delay predictions, day-suggestions and rebook options.</p>
                <button onClick={()=>setShowChat(true)} className="mt-2 px-4 py-2 bg-[#F01428] text-white rounded">Open Chat</button>

                <div className="mt-4 w-full text-xs text-gray-600">
                  <div className="font-medium">Quick tips</div>
                  <ul className="list-disc ml-4 mt-2">
                    <li>Search flights then open chat to ask for suggestions.</li>
                    <li>Click Book to go to Air Canada booking page.</li>
                    <li>Try dates 2025-10-16, 2025-10-17, 2025-10-18 for multiple options.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === "mytrip" && (
          <section>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">My Trip</h2>
              {booked.length === 0 ? (
                <div className="text-sm text-gray-500">You have no booked flights. Book from Search.</div>
              ) : (
                <div className="space-y-3">
                  {booked.map(b => (
                    <div key={b.bookingRef} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{b.route} • {b.id}</div>
                        <div className="text-xs text-gray-500">Booking: {b.bookingRef} • Dep: {new Date(b.dep).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>setShowChat(true)} className="px-3 py-1 border rounded">Open Chat</button>
                        <button onClick={()=>{ cancelBooking(b.bookingRef); }} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {page === "cancelled" && (
          <section>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Cancelled Flight — Disruption Flow</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                  <h3 className="font-medium mb-2">Refund policy (summary)</h3>
                  <ul className="text-sm text-gray-700 list-disc ml-5">
                    <li>Refunds depend on fare class and disruption reason.</li>
                    <li>Processing time: 3-7 business days for standard cases.</li>
                    <li>Contact support for expedited review.</li>
                  </ul>
                </div>

                <div className="p-4 border rounded">
                  <h3 className="font-medium mb-2">Re-accommodation & Rebooking</h3>
                  <div className="text-sm text-gray-700">
                    <p>Options:</p>
                    <ol className="list-decimal ml-5">
                      <li>Automatic re-accommodation on next available flight.</li>
                      <li>Manual rebook through agent with alternative dates.</li>
                      <li>Full refund and redirect to booking portal to select new flight.</li>
                    </ol>

                    <div className="mt-3 flex gap-2">
                      <button onClick={()=>setShowChat(true)} className="px-3 py-2 bg-[#F01428] text-white rounded">Chat for rebook</button>
                      <button onClick={()=>window.open("https://www.aircanada.com", "_blank")} className="px-3 py-2 border rounded">Go to booking portal</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Chat modal */}
        {showChat && (
          <ChatModal
            onClose={() => setShowChat(false)}
            selectedFlight={selected}
            onSuggestDay={(flight, altDate) => {
              alert(`Suggestion for ${flight?.id || 'selected flight'}: avoid ${altDate || 'this date'}. Mock reason: high disruption risk.`);
            }}
            onRequestRebook={(flight) => {
              if (!flight) return alert("Select a flight first.");
              const reqRef = `RB-${Math.floor(1000 + Math.random()*9000)}`;
              alert(`Rebook request created for ${flight.id}. Ref ${reqRef}. Agent will contact you.`);
            }}
            onPredict={(flight, d) => {
              if (!flight) return alert("Select a flight first.");
              const r = predictDelayRisk(flight, d);
              alert(`Prediction for ${flight.id} on ${d || flight.dep}: ${r.label} risk (${Math.round(r.score*100)}%).\n${r.reason}`);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ChatModal({ onClose, selectedFlight, onSuggestDay, onRequestRebook, onPredict }) {
  const [input, setInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const listRef = useRef(null);

  useEffect(()=>{ if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full md:w-3/5 lg:w-2/5 bg-white rounded-t-xl md:rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F01428] flex items-center justify-center text-white font-bold">A</div>
            <div>
              <div className="font-medium">AirAssist Chat</div>
              <div className="text-xs text-gray-500">{selectedFlight ? `${selectedFlight.route} • ${selectedFlight.id}` : "No flight selected"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
          </div>
        </div>

        <div className="p-4 h-[60vh] md:h-[60vh] flex flex-col">
          <div ref={listRef} className="flex-1 overflow-y-auto space-y-3">
            <div className="text-sm text-gray-700">
              Welcome. Use buttons below or type commands: <span className="font-mono">predict</span>, <span className="font-mono">suggest rebook</span>, <span className="font-mono">request rebook</span>, or <span className="font-mono">search</span>.
            </div>

            <div className="p-3 border rounded">
              <div className="font-medium mb-2">Actions for selected flight</div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input type="date" value={dateInput} onChange={(e)=>setDateInput(e.target.value)} className="flex-1 border rounded px-2 py-1" />
                  <button onClick={()=>onPredict(selectedFlight, dateInput)} className="px-3 py-1 bg-[#F01428] text-white rounded">Predict delay</button>
                </div>

                <div className="flex gap-2">
                  <button onClick={()=>onSuggestDay(selectedFlight, dateInput || null)} className="flex-1 px-3 py-2 border rounded">Suggest alternative day</button>
                  <button onClick={()=>onRequestRebook(selectedFlight)} className="px-3 py-2 bg-[#F01428] text-white rounded">Request rebook</button>
                </div>

                <div className="flex gap-2">
                  <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Type a chat command" className="flex-1 border rounded px-2 py-1" />
                  <button onClick={()=>{
                    const cmd = (input||"").toLowerCase();
                    if(cmd.startsWith("search")) {
                      alert("Use the Search page for search flow.");
                    } else if(cmd.includes("predict")) {
                      onPredict(selectedFlight, dateInput || null);
                    } else if(cmd.includes("suggest")) {
                      onSuggestDay(selectedFlight, dateInput || null);
                    } else if(cmd.includes("request")) {
                      onRequestRebook(selectedFlight);
                    } else {
                      alert("Unknown command. Try predict / suggest / request.");
                    }
                    setInput("");
                  }} className="px-3 py-1 bg-gray-200 rounded">Run</button>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded text-sm text-gray-600">
              Notes:
              <ul className="list-disc ml-5 mt-2">
                <li>"Predict delay" returns a mock risk for the chosen date.</li>
                <li>"Suggest alternative day" advises if the selected date looks risky.</li>
                <li>"Request rebook" simulates raising a request and returns a reference.</li>
                <li>"Book" action on Search redirects user to Air Canada booking page (opens in new tab).</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="flex gap-2">
              <button onClick={()=>onPredict(selectedFlight, dateInput || null)} className="px-3 py-2 bg-[#F01428] text-white rounded flex-1">Predict delay</button>
              <button onClick={()=>onSuggestDay(selectedFlight, dateInput || null)} className="px-3 py-2 border rounded">Suggest day</button>
              <button onClick={()=>onRequestRebook(selectedFlight)} className="px-3 py-2 border rounded">Request rebook</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}