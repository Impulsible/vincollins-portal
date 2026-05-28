/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/generate-comments/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { studentName, averageScore, subjects, className, gender } = await req.json()

    // Determine performance level with more granular ranges
    const getPerformanceLevel = (score: number) => {
      if (score >= 90) return 'outstanding'
      if (score >= 80) return 'excellent'
      if (score >= 75) return 'veryGood'
      if (score >= 70) return 'good'
      if (score >= 65) return 'aboveAverage'
      if (score >= 60) return 'average'
      if (score >= 55) return 'belowAverage'
      if (score >= 50) return 'marginal'
      if (score >= 45) return 'poor'
      return 'failing'
    }

    const performanceLevel = getPerformanceLevel(averageScore)
    const pronoun = gender?.toLowerCase() === 'female' ? 'She' : 'He'
    const possessive = gender?.toLowerCase() === 'female' ? 'her' : 'his'
    const objective = gender?.toLowerCase() === 'female' ? 'her' : 'him'

    // Get best and worst subjects
    const bestSubject = subjects.length > 0 
      ? subjects.reduce((a: any, b: any) => a.score > b.score ? a : b)
      : { name: 'various subjects', score: 0 }
    
    const weakestSubject = subjects.length > 0
      ? subjects.reduce((a: any, b: any) => a.score < b.score ? a : b)
      : { name: 'some subjects', score: 0 }

    // Teacher comment templates
    const teacherTemplates: Record<string, string[]> = {
      outstanding: [
        `Outstanding performance, ${studentName}. With an exceptional average of ${averageScore}%, ${pronoun.toLowerCase()} has demonstrated mastery across the curriculum. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is particularly noteworthy. ${pronoun} consistently exhibits critical thinking and intellectual curiosity. This is the standard of excellence we encourage. Congratulations on a stellar term!`,
        
        `Exceptional achievement, ${studentName}. ${pronoun} has attained a remarkable average of ${averageScore}%, placing ${objective} among the top performers this term. ${possessive} work in ${bestSubject.name} (${bestSubject.score}%) reflects deep understanding and dedication. Maintain this outstanding momentum.`,
        
        `Brilliant results, ${studentName}. Scoring ${averageScore}% on average is a testament to ${possessive} hard work and intellectual ability. ${pronoun} has shown exceptional grasp of ${bestSubject.name} (${bestSubject.score}%). Continue to push the boundaries of excellence.`,
        
        `Superb achievement, ${studentName}. ${pronoun} has demonstrated exceptional academic ability, particularly excelling in ${bestSubject.name} with ${bestSubject.score}%. ${possessive} diligence and commitment to learning are commendable. Well done on an outstanding term.`,
      ],
      excellent: [
        `Excellent performance, ${studentName}. With an average of ${averageScore}%, ${pronoun.toLowerCase()} has shown strong command of the curriculum. ${possessive} work in ${bestSubject.name} (${bestSubject.score}%) stands out. Keep up this impressive momentum.`,
        
        `Very impressive, ${studentName}. ${pronoun} has achieved ${averageScore}% on average, demonstrating solid understanding of core concepts. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is commendable. Continue striving for excellence.`,
        
        `Well done, ${studentName}. ${pronoun} has produced excellent work this term with an ${averageScore}% average. ${bestSubject.name} at ${bestSubject.score}% is a highlight. With continued effort, even greater results await.`,
        
        `Commendable performance, ${studentName}. ${pronoun} has earned an ${averageScore}% average through consistent effort. ${possessive} strength in ${bestSubject.name} (${bestSubject.score}%) is evident. Proud of your progress this term.`,
      ],
      veryGood: [
        `Very good work, ${studentName}. ${pronoun} has maintained a solid average of ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a clear strength. To reach excellence, focus on improving ${weakestSubject.name} (${weakestSubject.score}%). You are making excellent progress.`,
        
        `Good progress, ${studentName}. With an ${averageScore}% average, ${pronoun.toLowerCase()} is on the right track. ${bestSubject.name} (${bestSubject.score}%) demonstrates your potential. A little more attention to ${weakestSubject.name} (${weakestSubject.score}%) will elevate your overall performance.`,
        
        `Nice work, ${studentName}. ${pronoun} has achieved an ${averageScore}% average this term. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is impressive. Challenge yourself to improve ${weakestSubject.name} from ${weakestSubject.score}% to above 70% next term.`,
        
        `Satisfactory effort, ${studentName}. ${pronoun} has shown consistency with an ${averageScore}% average. ${bestSubject.name} remains your strongest subject at ${bestSubject.score}%. Let us develop strategies to boost ${weakestSubject.name} (${weakestSubject.score}%) next term.`,
      ],
      good: [
        `Good effort, ${studentName}. ${pronoun} has achieved an ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) was solid. With consistent revision, ${pronoun.toLowerCase()} can improve ${weakestSubject.name} (${weakestSubject.score}%). Keep going.`,
        
        `Satisfactory work, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) is your strong area. Dedicate more study time to ${weakestSubject.name} (${weakestSubject.score}%) to see overall improvement. You have the ability to excel.`,
        
        `You are making progress, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) is a highlight. The gap in ${weakestSubject.name} (${weakestSubject.score}%) can be closed with focused practice. Keep pushing forward.`,
        
        `Well attempted, ${studentName}. ${pronoun} did well in ${bestSubject.name} (${bestSubject.score}%). Setting daily study goals for ${weakestSubject.name} will boost your overall average next term.`,
      ],
      aboveAverage: [
        `Fair performance, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) was decent. However, ${weakestSubject.name} (${weakestSubject.score}%) requires more attention. Seek extra support in that subject to improve.`,
        
        `You passed, ${studentName}, but there is room to grow. ${bestSubject.name} (${bestSubject.score}%) shows you can do well. Focus on improving ${weakestSubject.name} (${weakestSubject.score}%) next term for better results.`,
        
        `Notable effort, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) is promising. Your challenge is to raise ${weakestSubject.name} from ${weakestSubject.score}% to at least 60%. With consistent effort, you can achieve this.`,
        
        `Average performance, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) was acceptable. Create a study schedule to address ${weakestSubject.name} (${weakestSubject.score}%) more effectively next term.`,
      ],
      average: [
        `Credit level achieved, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) was your best. Allocate more time to ${weakestSubject.name} (${weakestSubject.score}%) to raise your overall performance.`,
        
        `You have done enough to pass, ${studentName}. Your effort in ${bestSubject.name} (${bestSubject.score}%) paid off. Now apply that same dedication to ${weakestSubject.name} (${weakestSubject.score}%) for improvement.`,
        
        `Passing grade achieved, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) is decent. Let us work on strategies to improve ${weakestSubject.name} from ${weakestSubject.score}% to above 55%.`,
        
        `You made it, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) was good. To improve further, focus on strengthening ${weakestSubject.name} (${weakestSubject.score}%) next term.`,
      ],
      belowAverage: [
        `${studentName}, you narrowly passed. ${bestSubject.name} (${bestSubject.score}%) was acceptable, but ${weakestSubject.name} (${weakestSubject.score}%) affected your overall performance. More effort is needed next term.`,
        
        `Your performance was borderline, ${studentName}. While ${bestSubject.name} (${bestSubject.score}%) was acceptable, ${weakestSubject.name} (${weakestSubject.score}%) requires urgent improvement. Please consult your teachers for support.`,
        
        `Close call, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) helped you pass. You must improve ${weakestSubject.name} significantly to avoid similar challenges next term.`,
        
        `You passed, but barely, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) shows potential. Consider forming a study group for ${weakestSubject.name} to improve.`,
      ],
      marginal: [
        `${studentName}, this was a close one. Your performance in ${bestSubject.name} (${bestSubject.score}%) helped you pass. ${weakestSubject.name} (${weakestSubject.score}%) needs serious attention next term.`,
        
        `Just made it, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) was decent, but ${weakestSubject.name} (${weakestSubject.score}%) is affecting your progress. Time to refocus your efforts.`,
        
        `Barely passed, ${studentName}. You need to work much harder, especially on ${weakestSubject.name} (${weakestSubject.score}%). Consider extra tutoring or study groups.`,
        
        `Squeaked through, ${studentName}. ${bestSubject.name} (${bestSubject.score}%) was your saving grace. Let us develop a study plan for ${weakestSubject.name} next term.`,
      ],
      poor: [
        `${studentName}, unfortunately you did not meet the passing requirement this term. Your performance in ${weakestSubject.name} (${weakestSubject.score}%) is particularly concerning. Please see your class teacher immediately for support.`,
        
        `Significant improvement needed, ${studentName}. You struggled across most subjects, especially ${weakestSubject.name} (${weakestSubject.score}%). Let us work together next term to address these gaps.`,
        
        `${studentName}, this performance is concerning. ${weakestSubject.name} (${weakestSubject.score}%) requires urgent attention. Parents are advised to meet with the school to discuss progress.`,
        
        `Unsatisfactory performance, ${studentName}. You need to dedicate much more effort. ${weakestSubject.name} at ${weakestSubject.score}% is below the passing standard. Let us meet to discuss improvement strategies.`,
      ],
      failing: [
        `${studentName}, this is a serious concern. Scoring ${weakestSubject.score}% in ${weakestSubject.name} indicates significant learning gaps. A parent-teacher meeting is required urgently.`,
        
        `Critical intervention needed, ${studentName}. Your overall performance is unsatisfactory, with ${weakestSubject.name} (${weakestSubject.score}%) being a major concern. We need to discuss a recovery plan immediately.`,
        
        `${studentName}, you are at risk of repeating the class. ${weakestSubject.name} at ${weakestSubject.score}% is below acceptable standards. Please meet with your subject teachers before next term begins.`,
        
        `Urgent action required, ${studentName}. Your performance across all subjects is below standard, particularly in ${weakestSubject.name} (${weakestSubject.score}%). Extra lessons are mandatory next term.`,
      ],
    }

    // Principal comment templates
    const principalTemplates: Record<string, string[]> = {
      outstanding: [
        `Outstanding academic performance. ${pronoun} is among the best students this term. Promoted with distinction. Continue to set the standard of excellence.`,
        `Exceptional results. ${pronoun} has demonstrated academic excellence across all subjects. Promoted with high honors. Very proud of this achievement.`,
        `Remarkable performance. ${pronoun} has shown what dedication can achieve. Promoted with distinction. Continue this excellent trajectory.`,
      ],
      excellent: [
        `Excellent performance. ${pronoun} has worked diligently, and the results speak for themselves. Promoted with honors. Well done.`,
        `Very impressive results. ${pronoun} has shown strong commitment to academic excellence. Promoted with honors. Keep striving.`,
        `Superb achievement. ${pronoun} has made significant progress this term. Promoted with honors. Continue this momentum.`,
      ],
      veryGood: [
        `Very good performance. ${pronoun} has shown great promise this term. Promoted to the next class. Keep building on this foundation.`,
        `Good results. ${pronoun} is on the right track. Promoted to the next class. With continued effort, excellence is within reach.`,
        `Solid performance. ${pronoun} has shown consistency and dedication. Promoted to the next class. Aim higher next term.`,
      ],
      good: [
        `Good performance. ${pronoun} has shown understanding across most subjects. Promoted to the next class. Keep working hard.`,
        `Satisfactory results. ${pronoun} has met the basic requirements. Promoted to the next class. There is room for improvement.`,
        `Commendable effort. ${pronoun} has made progress this term. Promoted to the next class. Continue to build on this momentum.`,
      ],
      aboveAverage: [
        `Fair performance. ${pronoun} has passed but can do better. Promoted to the next class. More dedication needed next term.`,
        `Average results. ${pronoun} meets the minimum standard. Promoted to the next class. Aim higher next term for better outcomes.`,
        `Satisfactory but not impressive. ${pronoun} is promoted but needs to work harder next term.`,
      ],
      average: [
        `Credit performance. ${pronoun} passed, but there is room for growth. Promoted to the next class. Encourage more focused study habits.`,
        `You passed, ${studentName}. Work harder next term to improve. Promoted conditionally.`,
        `Barely passed. ${pronoun} needs to put in more effort next term. Promoted conditionally.`,
      ],
      belowAverage: [
        `A pass. Significant improvement needed. Promoted conditionally. Parents are advised to monitor progress closely.`,
        `Borderline performance. ${pronoun} needs to work much harder next term. Promoted conditionally.`,
        `Passed by a narrow margin. Immediate improvement required. Promoted conditionally.`,
      ],
      marginal: [
        `Barely passed. Serious improvement required next term. Promoted conditionally.`,
        `Marginal pass. ${pronoun} must improve significantly to avoid retention. Promoted conditionally.`,
        `Close call. ${pronoun} needs to double efforts next term. Promoted conditionally.`,
      ],
      poor: [
        `Poor performance. ${pronoun} has failed to meet the required standard. May need to repeat the class.`,
        `Unsatisfactory results. ${pronoun} must improve dramatically next term or face retention.`,
        `Failed to meet expectations. ${pronoun} requires intensive intervention. Parents must meet with the school.`,
      ],
      failing: [
        `Failed. ${pronoun} must repeat the class. Immediate intervention and support are required.`,
        `Academic probation recommended. ${pronoun} has failed to meet minimum requirements. Retention likely without significant improvement.`,
        `Failed to reach passing standard. ${pronoun} will need to repeat this term or attend remedial classes.`,
      ],
    }

    const teacherTemplatesList = teacherTemplates[performanceLevel] || teacherTemplates.average
    const principalTemplatesList = principalTemplates[performanceLevel] || principalTemplates.average

    const teacherComment = teacherTemplatesList[Math.floor(Math.random() * teacherTemplatesList.length)]
    const principalComment = principalTemplatesList[Math.floor(Math.random() * principalTemplatesList.length)]

    return NextResponse.json({
      teacher_comment: teacherComment,
      principal_comment: principalComment,
      performance_level: performanceLevel,
    })
  } catch (error) {
    console.error('Error generating comments:', error)
    return NextResponse.json(
      { error: 'Failed to generate comments' },
      { status: 500 }
    )
  }
}