function HistoricalTornadoes() {
  const events = [
    {
      title: "Tri-State Tornado (1925)",
      date: "March 18, 1925",
      location: "Missouri, Illinois, Indiana",
      deaths: 695,
      details: "The deadliest tornado in U.S. history, it traveled 219 miles, destroying towns and killing 695 people. It was rated EF5 retroactively."
    },
    {
      title: "Joplin Tornado (2011)",
      date: "May 22, 2011",
      location: "Joplin, Missouri",
      deaths: 158,
      details: "An EF5 tornado struck Joplin, killing 158 and injuring over 1,000. Caused nearly $3 billion in damage — one of the costliest on record."
    },
    {
      title: "Moore Tornado (2013)",
      date: "May 20, 2013",
      location: "Moore, Oklahoma",
      deaths: 24,
      details: "A devastating EF5 tornado struck Moore with winds exceeding 200 mph. It caused widespread destruction including schools and hospitals."
    }
  ];

  return (
    <section className="text-center py-16 px-6 bg-[#1B263B]">
      <h3 className="text-3xl font-bold mb-8">Historic Tornado Disasters</h3>
      <div className="grid gap-6 md:grid-cols-3">
        {events.map((event, index) => (
          <div key={index} className="bg-[#415A77] rounded-lg p-6 shadow-md text-left">
            <h4 className="text-xl font-bold mb-1">{event.title}</h4>
            <p className="text-gray-300 text-sm mb-1">{event.date} | {event.location}</p>
            <p className="text-red-300 font-semibold mb-2">Fatalities: {event.deaths}</p>
            <p className="text-gray-200">{event.details}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
export default HistoricalTornadoes;
