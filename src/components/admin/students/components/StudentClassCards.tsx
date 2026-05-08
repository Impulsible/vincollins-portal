// components/admin/students/components/StudentClassCards.tsx

'use client'

import { CLASSES } from '../constants'
import { ClassGroup } from '../types'
import { StudentClassCard } from './StudentClassCard'

interface StudentClassCardsProps {
  classGroups: Record<string, ClassGroup>
  onClassClick: (className: string) => void
}

export function StudentClassCards({ classGroups, onClassClick }: StudentClassCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {CLASSES.map((className, index) => (
        <StudentClassCard
          key={className}
          className={className}
          group={classGroups[className]}
          index={index}
          onClick={onClassClick}
        />
      ))}
    </div>
  )
}