// ============================================
// DASHBOARD SKELETON LOADER
// ============================================

'use client'

import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'

export function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl" />
          <Briefcase className="h-16 w-16 sm:h-20 sm:w-20 text-blue-600 mx-auto relative" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mt-6 text-xl sm:text-2xl font-semibold text-gray-800">
            Setting up your workspace
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500">
            Preparing your teaching dashboard...
          </p>
        </motion.div>
        
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-blue-500"
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        <motion.div 
          className="mt-8 w-48 sm:w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  )
}