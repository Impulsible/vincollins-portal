// components/admin/BulkPromotionButton.tsx
'use client'

import { useState } from 'react'

export function BulkPromotionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleBulkPromotion = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/promotions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create promotions')
      }

      setSuccess(`✅ ${data.message}! ${data.count} students marked for promotion.`)
      
      // Refresh the page after 2 seconds to show new promotions
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            📚 End of Term Promotions
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Create promotion requests for all eligible students
          </p>
        </div>
        <button
          onClick={handleBulkPromotion}
          disabled={loading}
          className={`
            px-6 py-3 rounded-lg font-medium text-white whitespace-nowrap
            transition-colors duration-200 shadow-sm
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            '🔄 Create Promotions'
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
        <p className="font-medium">ℹ️ What will happen:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>JSS 1 → JSS 2</li>
          <li>JSS 2 → JSS 3</li>
          <li>JSS 3 → SS1 Science (can change later)</li>
          <li>SS1 Science → SS2 Science</li>
          <li>SS1 Arts → SS2 Arts</li>
          <li>SS2 Science → SS3 Science</li>
          <li>SS2 Arts → SS3 Arts</li>
        </ul>
      </div>
    </div>
  )
}