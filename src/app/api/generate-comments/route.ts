/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/generate-comments/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { studentName, averageScore, subjects, className, gender } = await req.json()

    // Determine performance level
    const getPerformanceLevel = (score: number) => {
      if (score >= 75) return 'excellent'
      if (score >= 60) return 'good'
      if (score >= 45) return 'average'
      return 'needs improvement'
    }

    const performanceLevel = getPerformanceLevel(averageScore)
    const pronoun = gender?.toLowerCase() === 'female' ? 'She' : 'He'
    const possessive = gender?.toLowerCase() === 'female' ? 'her' : 'his'

    // Generate teacher comment based on performance
    const generateTeacherComment = () => {
      const bestSubject = subjects.length > 0 
        ? subjects.reduce((a: { score: number }, b: { score: number }) => a.score > b.score ? a : b)
        : { name: 'various subjects', score: 0 }
      
      const weakestSubject = subjects.length > 0
        ? subjects.reduce((a: { score: number }, b: { score: number }) => a.score < b.score ? a : b)
        : { name: 'some subjects', score: 0 }

      const templates = {
        excellent: [
          `${studentName} has demonstrated outstanding academic performance this term with an average score of ${averageScore}%. ${pronoun} shows exceptional understanding in ${bestSubject.name} and consistently produces high-quality work. ${pronoun} is a dedicated student who actively participates in class discussions and completes assignments with great attention to detail. Keep up the excellent work!`,
          
          `An impressive performance from ${studentName} this term! With an average of ${averageScore}%, ${pronoun} has proven to be among the top performers. ${possessive} work in ${bestSubject.name} is particularly noteworthy. ${pronoun} demonstrates strong analytical skills and a genuine passion for learning. Continue to shine!`,
        ],
        good: [
          `${studentName} has shown good progress this term with an average score of ${averageScore}%. ${pronoun} performs well in ${bestSubject.name} and shows consistent effort across all subjects. While ${possessive} overall performance is commendable, there is room for improvement in ${weakestSubject.name}. With continued dedication, ${pronoun} can achieve even greater heights.`,
          
          `A solid performance from ${studentName} this term. ${pronoun} maintains a good average of ${averageScore}% and demonstrates understanding of core concepts. ${pronoun} is attentive in class and completes assignments on time. I encourage ${possessive} to participate more actively and seek help when needed to strengthen ${possessive} understanding in challenging areas.`,
        ],
        average: [
          `${studentName} has achieved an average score of ${averageScore}% this term. ${pronoun} shows understanding in ${bestSubject.name} but needs to put in more effort in other subjects, particularly ${weakestSubject.name}. ${pronoun} is capable of better performance with more focused study habits and consistent practice. I encourage ${possessive} to review notes regularly and ask questions when concepts are unclear.`,
          
          `${studentName} has maintained an average performance this term with ${averageScore}%. While ${pronoun} grasps basic concepts, there is significant room for improvement. ${pronoun} would benefit from dedicating more time to independent study and seeking clarification on challenging topics. With determination and hard work, ${pronoun} can improve ${possessive} performance next term.`,
        ],
        'needs improvement': [
          `${studentName} has struggled this term with an average score of ${averageScore}%. ${pronoun} finds certain subjects challenging and needs additional support to improve ${possessive} understanding. I recommend that ${pronoun} attends extra help sessions and develops a consistent study routine. With proper guidance and effort, ${pronoun} can overcome these challenges.`,
          
          `This term has been challenging for ${studentName}, as reflected in ${possessive} average score of ${averageScore}%. ${pronoun} needs to focus on building foundational knowledge and improving study habits. I encourage regular communication between home and school to provide the necessary support. Don't give up - improvement is possible with dedication.`,
        ],
      }

      const templateArray = templates[performanceLevel as keyof typeof templates]
      return templateArray[Math.floor(Math.random() * templateArray.length)]
    }

    // Generate principal comment
    const generatePrincipalComment = () => {
      const templates = {
        excellent: [
          `I am delighted with ${studentName}'s exceptional performance this term. ${possessive} dedication to academic excellence is truly commendable. ${pronoun} represents the values we uphold at Vincollins College. Keep soaring higher!`,
          
          `Outstanding work, ${studentName}! Your excellent results reflect your hard work and commitment. I am proud of your achievements and confident in your continued success. Well done!`,
        ],
        good: [
          `Well done, ${studentName}! You have shown good progress this term. Continue to build on this foundation and strive for excellence. I believe in your potential to achieve even more.`,
          
          `${studentName} has demonstrated commendable effort this term. With continued dedication and focus, I am confident that ${pronoun} will reach new heights. Keep up the good work!`,
        ],
        average: [
          `${studentName} has shown satisfactory performance this term. I encourage you to push beyond your comfort zone and aim higher. Remember, consistent effort yields remarkable results.`,
          
          `There is room for growth, ${studentName}. I believe you have the potential to achieve more. Take advantage of available resources and never hesitate to ask for help.`,
        ],
        'needs improvement': [
          `${studentName}, this term's results indicate areas that need attention. I encourage you to reflect on your study habits and seek support where needed. Remember, challenges are opportunities for growth.`,
          
          `Every student's journey is unique, and challenges are part of growth. I encourage ${studentName} to view this as motivation to work harder and smarter next term. We are here to support you.`,
        ],
      }

      const templateArray = templates[performanceLevel as keyof typeof templates]
      return templateArray[Math.floor(Math.random() * templateArray.length)]
    }

    const teacherComment = generateTeacherComment()
    const principalComment = generatePrincipalComment()

    return NextResponse.json({
      teacher_comment: teacherComment,
      principal_comment: principalComment,
    })
  } catch (error) {
    console.error('Error generating comments:', error)
    return NextResponse.json(
      { error: 'Failed to generate comments' },
      { status: 500 }
    )
  }
}