import { useState } from 'react';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    { question: "Is the AeroCast score a tornado probability?", answer: "No. It is an experimental model risk score based on current weather inputs, not a guaranteed probability or official forecast." },
    { question: "Is AeroCastAI free to use?", answer: "Currently, AeroCastAI is free during our early access phase." },
    { question: "How is the data collected?", answer: "The V3 backend requests current and previous-hour weather variables from Open-Meteo. Official alerts are retrieved separately from the National Weather Service." },
    { question: "Should I rely on AeroCastAI in an emergency?", answer: "No. Use official NWS alerts, local authorities, and established emergency notification systems." },
  ];

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="text-center py-16 px-6">
      <h3 className="text-3xl font-bold mb-8">Frequently Asked Questions</h3>
      <div className="space-y-4 max-w-3xl mx-auto text-left">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-[#415A77] p-4 rounded-md">
            <button onClick={() => toggle(index)} className="w-full text-left text-lg font-semibold text-white">
              {faq.question}
            </button>
            {openIndex === index && (
              <p className="mt-2 text-gray-200">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
export default FAQ;
