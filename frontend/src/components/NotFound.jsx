import React from 'react';
import { ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = ({ navigate }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div 
      className="page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="clay-card page-card not-found-layout" style={{ maxWidth: '580px', margin: '2rem auto' }}>
        
        {/* Animated Icon Circle */}
        <motion.div className="not-found-icon-container animate-pulse" variants={itemVariants} style={{ margin: '0 auto 1.5rem auto' }}>
          <HelpCircle size={36} />
        </motion.div>

        {/* Big stylized 404 text */}
        <motion.h1 className="not-found-code text-gradient" variants={itemVariants}>
          404
        </motion.h1>

        <motion.h3 variants={itemVariants}>
          Page Not Found
        </motion.h3>

        <motion.p variants={itemVariants}>
          The page you are looking for does not exist, has been removed, or has moved to a different coordinate.
        </motion.p>

        {/* Action Buttons */}
        <motion.div className="not-found-actions" variants={itemVariants} style={{ margin: '0 auto' }}>
          <button 
            className="btn-clay btn-clay-secondary" 
            onClick={handleGoBack}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          
          <button 
            className="btn-clay btn-clay-primary" 
            onClick={() => navigate('/')}
          >
            <Home size={16} /> Home
          </button>
        </motion.div>
        
      </div>
    </motion.div>
  );
};

export default NotFound;
