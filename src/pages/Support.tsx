
import React from "react";

const Support: React.FC = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <h1 className="text-center font-bold mb-8">Contact Support</h1>
        <div className="max-w-3xl mx-auto">
          <p className="text-lg mb-6">
            Have questions or need assistance? Our support team is here to help.
          </p>
          
          <div className="bg-gray-highlight p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="mb-6">
              For any support inquiries, please email us at:{" "}
              <a 
                href="mailto:contact@trusty.com" 
                className="text-primary-blue hover:underline font-medium"
              >
                contact@trusty.com
              </a>
            </p>
            
            <p className="text-gray-600">
              We aim to respond to all support requests within 24-48 hours during business days.
            </p>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <p>
              Before contacting support, you might find answers to common questions in our{" "}
              <a href="/faqs" className="text-primary-blue hover:underline">
                FAQs
              </a>{" "}
              or{" "}
              <a href="/knowledge" className="text-primary-blue hover:underline">
                Knowledge Base
              </a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Support;
