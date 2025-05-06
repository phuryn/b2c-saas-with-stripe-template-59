
import React from "react";
import { Star } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  company: string;
  image: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, author, company, image }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-4">
        <img src={image} alt={author} className="w-12 h-12 rounded-full object-cover mr-4" />
        <div>
          <h4 className="font-semibold transition-colors duration-200 hover:text-primary-blue">{author}</h4>
          <p className="text-gray-500 text-sm">{company}</p>
        </div>
      </div>
      <div className="flex mb-3 text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} fill="currentColor" />
        ))}
      </div>
      <p className="text-gray-600 italic">"{quote}"</p>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote: "TRUSTY has completely transformed our workflow. We're now able to deliver projects 40% faster than before.",
      author: "Sarah Johnson",
      company: "Tech Innovations",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      quote: "The analytics tools have helped us identify opportunities we would have otherwise missed. It's a game-changer for us.",
      author: "Michael Chen",
      company: "Growth Partners",
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      quote: "The security features give us peace of mind, and the customer support team is always there when we need them.",
      author: "Rachel Adams",
      company: "Secure Solutions",
      image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      quote: "TRUSTY's API is the most well-documented I've ever worked with. Integration was a breeze.",
      author: "David Williams",
      company: "DevOps Team Lead",
      image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80"
    }
  ];

  return (
    <section className="section-padding bg-gray-highlight">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-4 transition-transform duration-300 hover:scale-105 hover:text-primary-blue inline-block">What Our Customers Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Thousands of companies rely on TRUSTY to build and scale their business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              company={testimonial.company}
              image={testimonial.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
