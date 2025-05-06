
import React from "react";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CounterSection from "@/components/home/CounterSection";

const Index: React.FC = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CounterSection />
      <TestimonialsSection />
    </>
  );
};

export default Index;
