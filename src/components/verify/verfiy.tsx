import React, { useState } from "react";

import { Component as HeroFuturistic } from "@/components/ui/hero-futuristic";

interface ComponentProps {
  onComplete?: () => void;
}
const Verify= ({ onComplete }: ComponentProps) => {
  const [showSecond, setShowSecond] = useState<boolean>(false);

  const handleClick = () => {
    setShowSecond(true);
  };
 
   if(showSecond)return <HeroFuturistic onComplete={onComplete} />  
   return (
    <div>
      
          <h1>First Component</h1>
          <button onClick={handleClick}>
            Go to Second Component
          </button>
     
    </div>
  );
};

export default Verify;