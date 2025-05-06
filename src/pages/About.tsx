
import React from "react";

const About: React.FC = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <h1 className="text-center font-bold mb-8">About TRUSTY</h1>
        <div className="max-w-3xl mx-auto">
          <p className="text-lg mb-6">
            TRUSTY provides all the tools you need to transform your ideas into reality, with enterprise-grade reliability and security.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="mb-6">
            At TRUSTY, we're committed to empowering developers and businesses with cutting-edge tools that accelerate innovation and bring ideas to life.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <div className="bg-gray-highlight p-6 rounded-lg mb-6">
            <p className="mb-2"><strong>Company Name:</strong> TRUSTY LTD</p>
            <p className="mb-2"><strong>Address:</strong> 123 Tech Avenue, Silicon Valley, CA 94043, USA</p>
            <p className="mb-2"><strong>Email:</strong> <a href="mailto:contact@trusty.com" className="text-primary-blue hover:underline">contact@trusty.com</a></p>
            <p><strong>Website:</strong> <a href="https://trustyboilerplate.io" className="text-primary-blue hover:underline">https://trustyboilerplate.io</a></p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
