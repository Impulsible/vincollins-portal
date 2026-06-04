// components/admin/students/components/StudentClassCards.tsx
'use client'

import { CLASSES, getDepartmentFromClass, getYearGroup } from '../constants'
import { ClassGroup } from '../types'
import { StudentClassCard } from './StudentClassCard'

interface StudentClassCardsProps {
  classGroups: Record<string, ClassGroup>
  onClassClick: (className: string) => void
}

// Sort order: JSS 1, JSS 2, JSS 3, SS1, SS1 Science, SS1 Arts, SS1 Commercial, SS2...
const getSortOrder = (className: string): number => {
  const orderMap: Record<string, number> = {
    'JSS 1': 1, 'JSS 2': 2, 'JSS 3': 3,
    'SS1': 4, 'SS1 Science': 5, 'SS1 Arts': 6, 'SS1 Commercial': 7,
    'SS2': 8, 'SS2 Science': 9, 'SS2 Arts': 10, 'SS2 Commercial': 11,
    'SS3': 12, 'SS3 Science': 13, 'SS3 Arts': 14, 'SS3 Commercial': 15,
  }
  return orderMap[className] || 100
}

export function StudentClassCards({ classGroups, onClassClick }: StudentClassCardsProps) {
  const sortedClasses = [...CLASSES].sort((a, b) => getSortOrder(a) - getSortOrder(b))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {sortedClasses.map((className, index) => (
        <StudentClassCard
          key={className}
          className={className}
          group={classGroups[className] || { students: [], count: 0, totalMale: 0, totalFemale: 0 }}
          index={index}
          onClick={onClassClick}
        />
      ))}
    </div>
  )
}