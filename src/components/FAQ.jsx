import { useState } from 'react';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    { question: "How accurate are your tornado predictions?", answer: "Our AI models constantly update using real-time data to provide the best accuracy possible." },
    { question: "Is AeroCastAI free to use?", answer: "Currently, AeroCastAI is free during our early access phase." },
    { question: "How is the data collected?", answer: "We pull real-time weather updates from trusted meteorological agencies and satellite systems." },
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
