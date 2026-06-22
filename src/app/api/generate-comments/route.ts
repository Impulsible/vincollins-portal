/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/generate-comments/route.ts - ENHANCED WITH 30+ UNIQUE COMMENTS PER LEVEL

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { studentName, averageScore, subjects, className, gender } = await req.json()

    // Determine performance level with more granular ranges
    const getPerformanceLevel = (score: number) => {
      if (score >= 90) return 'outstanding'
      if (score >= 85) return 'excellent'
      if (score >= 80) return 'veryGood'
      if (score >= 75) return 'good'
      if (score >= 70) return 'aboveAverage'
      if (score >= 65) return 'satisfactory'
      if (score >= 60) return 'average'
      if (score >= 55) return 'belowAverage'
      if (score >= 50) return 'marginal'
      if (score >= 45) return 'poor'
      return 'veryPoor'
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

    // 30+ UNIQUE TEACHER COMMENT TEMPLATES PER LEVEL
    const teacherTemplates: Record<string, string[]> = {
      outstanding: [
        `${studentName} has demonstrated exceptional academic excellence this term, achieving an outstanding average of ${averageScore}%. ${pronoun} consistently produces work of the highest quality, particularly in ${bestSubject.name} where ${pronoun} scored an impressive ${bestSubject.score}%. ${pronoun} exhibits strong critical thinking and analytical skills.`,
        
        `Outstanding performance by ${studentName}! With a remarkable average of ${averageScore}%, ${pronoun} has set a high standard for academic excellence. ${possessive} mastery of ${bestSubject.name} (${bestSubject.score}%) is particularly noteworthy. ${pronoun} is encouraged to maintain this exceptional momentum.`,
        
        `${studentName} has produced an outstanding body of work this term, averaging ${averageScore}%. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) reflects ${possessive} dedication and intellectual ability. ${pronoun} is a role model for peers.`,
        
        `Exceptional achievement! ${studentName} has earned an outstanding average of ${averageScore}%, placing ${objective} among the top students in ${className}. ${possessive} strength in ${bestSubject.name} is evident with ${bestSubject.score}%. ${pronoun} is advised to continue this excellent trajectory.`,
        
        `${studentName} has surpassed all expectations this term with an outstanding ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} demonstrates ${possessive} exceptional grasp of the subject matter.`,
        
        `Truly outstanding results, ${studentName}! With ${averageScore}% average, ${pronoun} has shown mastery across the curriculum. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is particularly impressive. Keep shining!`,
        
        `${studentName} has delivered an exceptional performance this term. Averaging ${averageScore}% with a standout ${bestSubject.score}% in ${bestSubject.name} - this is the standard of excellence we encourage.`,
        
        `Superb academic achievement, ${studentName}! ${pronoun} has maintained an outstanding average of ${averageScore}% throughout the term. ${possessive} ${bestSubject.score}% in ${bestSubject.name} reflects ${possessive} strong intellectual capacity.`,
        
        `${studentName} continues to excel academically with an outstanding ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is a testament to ${possessive} hard work and natural ability.`,
        
        `Absolutely brilliant, ${studentName}! With ${averageScore}% average and an impressive ${bestSubject.score}% in ${bestSubject.name}, ${pronoun} has demonstrated what dedication to learning can achieve.`,
        
        `${studentName} has performed at an outstanding level this term, achieving ${averageScore}% average. ${possessive} exceptional ${bestSubject.score}% in ${bestSubject.name} shows ${possessive} deep understanding of the subject.`,
        
        `Top-tier performance, ${studentName}! ${pronoun} has earned an outstanding ${averageScore}% average, with ${bestSubject.name} being a particular strength at ${bestSubject.score}%.`,
        
        `${studentName} has set a high benchmark with an outstanding ${averageScore}% average this term. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `Exceptional work, ${studentName}! ${pronoun} has achieved an outstanding ${averageScore}% average, demonstrating ${possessive} ability to excel across all subjects.`,
        
        `${studentName} has proven ${possessive} academic prowess with an outstanding ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is commendable.`,
        
        `Brilliant performance, ${studentName}! With ${averageScore}% average, ${pronoun} has shown what excellence looks like. ${bestSubject.name} (${bestSubject.score}%) is a clear strength.`,
        
        `${studentName} has excelled tremendously this term, achieving an outstanding ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} reflects ${possessive} dedication.`,
        
        `Outstanding academic display, ${studentName}! ${pronoun} has averaged ${averageScore}% with an impressive ${bestSubject.score}% in ${bestSubject.name}. Keep up the great work!`,
        
        `${studentName} has demonstrated exceptional ability this term, earning an outstanding ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is exemplary.`,
        
        `Superlative performance, ${studentName}! With ${averageScore}% average and ${bestSubject.score}% in ${bestSubject.name}, ${pronoun} has made us proud.`,
        
        `${studentName} has achieved academic excellence with an outstanding ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is particularly noteworthy.`,
        
        `Remarkable results, ${studentName}! ${pronoun} has earned an outstanding ${averageScore}% average, demonstrating consistent high performance across all subjects.`,
        
        `${studentName} has set a new standard of excellence with ${averageScore}% average this term. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is outstanding.`,
        
        `Exceptional academic performance, ${studentName}! With ${averageScore}% average, ${pronoun} has shown what dedicated students can achieve.`,
        
        `${studentName} has proven to be an exceptional student with an outstanding ${averageScore}% average. ${possessive} strength in ${bestSubject.name} is evident.`,
        
        `Outstanding effort and results, ${studentName}! ${pronoun} has achieved ${averageScore}% average with a stellar ${bestSubject.score}% in ${bestSubject.name}.`,
        
        `${studentName} has delivered an outstanding academic performance this term, averaging ${averageScore}% across all subjects. Well done!`,
        
        `Exceptional achievement unlocked! ${studentName} has earned an outstanding ${averageScore}% average with ${bestSubject.name} as ${possessive} strongest subject at ${bestSubject.score}%.`,
        
        `${studentName} has shown what academic excellence looks like with an outstanding ${averageScore}% average this term. Keep soaring!`,
        
        `Outstanding results, ${studentName}! ${pronoun} has achieved ${averageScore}% average, placing ${objective} among the crème de la crème of ${className}.`,
        
        `${studentName} has demonstrated exceptional intellectual capacity with an outstanding ${averageScore}% average this term. ${possessive} future looks bright!`,
      ],
      excellent: [
        `${studentName} has performed excellently this term, achieving a commendable average of ${averageScore}%. ${pronoun} demonstrates strong grasp of concepts across subjects, with ${bestSubject.name} being a particular strength (${bestSubject.score}%). ${pronoun} is encouraged to maintain this high standard.`,
        
        `Excellent work, ${studentName}! With an average of ${averageScore}%, ${pronoun} has shown consistent dedication to ${possessive} studies. ${possessive} ${bestSubject.score}% in ${bestSubject.name} reflects ${possessive} ability. Keep up the impressive momentum.`,
        
        `${studentName} has produced excellent results this term, averaging ${averageScore}%. ${pronoun} excels particularly in ${bestSubject.name} (${bestSubject.score}%). This performance demonstrates ${possessive} academic potential.`,
        
        `Very impressive performance by ${studentName}. Achieving an average of ${averageScore}% across all subjects is commendable. ${possessive} standout performance in ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `${studentName} has shown excellent understanding of the curriculum with an average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is impressive. Continue striving for excellence.`,
        
        `Excellent effort, ${studentName}! With ${averageScore}% average, ${pronoun} has demonstrated strong academic ability. ${bestSubject.name} (${bestSubject.score}%) is a clear strength.`,
        
        `${studentName} has performed very well this term, achieving an excellent average of ${averageScore}%. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `Very good results, ${studentName}! ${pronoun} has earned an excellent average of ${averageScore}%, with ${bestSubject.name} being ${possessive} strongest subject at ${bestSubject.score}%.`,
        
        `${studentName} has shown remarkable improvement and consistency, achieving an excellent ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is noteworthy.`,
        
        `Excellent academic display, ${studentName}! With ${averageScore}% average and ${bestSubject.score}% in ${bestSubject.name}, ${pronoun} has made significant progress.`,
        
        `${studentName} has performed excellently across all subjects, averaging ${averageScore}%. ${possessive} strength in ${bestSubject.name} (${bestSubject.score}%) is commendable.`,
        
        `Very good work, ${studentName}! ${pronoun} has achieved an excellent average of ${averageScore}%, demonstrating strong understanding of the curriculum.`,
        
        `${studentName} has shown consistent excellence this term with an average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is a highlight.`,
        
        `Excellent progress, ${studentName}! With ${averageScore}% average, ${pronoun} has shown what focused effort can achieve. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has delivered an excellent performance this term, averaging ${averageScore}%. Keep up this wonderful momentum!`,
        
        `Very impressive, ${studentName}! ${pronoun} has earned an excellent average of ${averageScore}%, with ${bestSubject.name} as a particular strength at ${bestSubject.score}%.`,
        
        `${studentName} has shown excellent academic ability this term, achieving ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
        
        `Excellent results, ${studentName}! With ${averageScore}% average, ${pronoun} has proven ${possessive} capability to excel. ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `${studentName} has performed excellently, earning ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} reflects ${possessive} dedication.`,
        
        `Very good effort, ${studentName}! ${pronoun} has achieved an excellent average of ${averageScore}% this term. Well done!`,
        
        `${studentName} has demonstrated excellent understanding across subjects with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Excellent academic performance, ${studentName}! With ${averageScore}% average, ${pronoun} has made us proud. Continue shining!`,
        
        `${studentName} has shown excellence in ${possessive} studies with an average of ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is particularly impressive.`,
        
        `Very good work, ${studentName}! ${pronoun} has earned an excellent average of ${averageScore}%, demonstrating strong academic potential.`,
        
        `${studentName} has performed excellently this term, achieving ${averageScore}% average. Keep striving for greatness!`,
        
        `Excellent results, ${studentName}! With ${averageScore}% average, ${pronoun} has shown what dedication can achieve.`,
        
        `${studentName} has demonstrated excellent academic ability with ${averageScore}% average this term. ${possessive} future is bright.`,
        
        `Very impressive, ${studentName}! ${pronoun} has achieved an excellent average of ${averageScore}%, showing consistent high performance.`,
        
        `${studentName} has excelled this term with an excellent average of ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `Excellent work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown what focused students can achieve.`,
        
        `${studentName} has performed admirably with an excellent average of ${averageScore}%. Keep up the good work!`,
      ],
      veryGood: [
        `${studentName} has performed very well this term with an average of ${averageScore}%. ${pronoun} shows good understanding across the curriculum, particularly in ${bestSubject.name} (${bestSubject.score}%). To improve further, ${pronoun} should focus more on ${weakestSubject.name} where ${pronoun} scored ${weakestSubject.score}%.`,
        
        `Very good effort, ${studentName}! With an average of ${averageScore}%, ${pronoun} has demonstrated solid academic progress. ${bestSubject.name} remains ${possessive} strongest subject at ${bestSubject.score}%. Paying more attention to ${weakestSubject.name} will help raise overall performance.`,
        
        `${studentName} has shown consistent improvement this term, achieving a very good average of ${averageScore}%. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is impressive. With extra effort in ${weakestSubject.name}, even greater success awaits.`,
        
        `Satisfactory progress! ${studentName} has maintained a very good average of ${averageScore}%. ${pronoun} excels in ${bestSubject.name} (${bestSubject.score}%) and should apply similar strategies to improve ${weakestSubject.name} from ${weakestSubject.score}%.`,
        
        `${studentName} has achieved a solid very good average of ${averageScore}% this term. ${possessive} strength in ${bestSubject.name} (${bestSubject.score}%) is evident. A little more attention to ${weakestSubject.name} will yield better results.`,
        
        `Very good performance, ${studentName}! With ${averageScore}% average, ${pronoun} has shown good understanding. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `${studentName} has performed very well, earning ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is impressive. Focus on ${weakestSubject.name} to improve further.`,
        
        `Good progress, ${studentName}! ${pronoun} has achieved a very good average of ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `${studentName} has shown very good understanding this term with ${averageScore}% average. ${possessive} performance in ${bestSubject.name} stands out at ${bestSubject.score}%.`,
        
        `Very good effort, ${studentName}! With ${averageScore}% average, ${pronoun} is on the right track. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has delivered a very good performance, averaging ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Good work, ${studentName}! ${pronoun} has achieved a very good average of ${averageScore}% this term. Keep pushing forward.`,
        
        `${studentName} has shown very good academic ability with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a clear strength.`,
        
        `Very good results, ${studentName}! With ${averageScore}% average, ${pronoun} has demonstrated solid understanding. ${bestSubject.name} (${bestSubject.score}%) is noteworthy.`,
        
        `${studentName} has performed very well, earning ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
        
        `Good effort, ${studentName}! ${pronoun} has achieved a very good average of ${averageScore}%. Keep up the momentum.`,
        
        `${studentName} has shown very good progress with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `Very good performance, ${studentName}! With ${averageScore}% average, ${pronoun} has made us proud. Continue working hard.`,
        
        `${studentName} has achieved a very good average of ${averageScore}% this term. ${possessive} strength in ${bestSubject.name} is evident.`,
        
        `Good results, ${studentName}! ${pronoun} has earned a very good average of ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `${studentName} has shown very good understanding, averaging ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is impressive.`,
        
        `Very good work, ${studentName}! With ${averageScore}% average, ${pronoun} has demonstrated solid academic progress.`,
        
        `${studentName} has performed very well this term, achieving ${averageScore}% average. Keep up the good work!`,
        
        `Very good effort, ${studentName}! ${pronoun} has earned ${averageScore}% average, showing good understanding across subjects.`,
        
        `${studentName} has shown very good academic ability with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Good progress, ${studentName}! With ${averageScore}% average, ${pronoun} is on the path to excellence.`,
        
        `${studentName} has achieved a very good average of ${averageScore}% this term. Well done!`,
        
        `Very good performance, ${studentName}! ${pronoun} has shown consistent effort and understanding.`,
        
        `${studentName} has demonstrated very good academic skills with ${averageScore}% average. Keep striving!`,
        
        `Good work, ${studentName}! With ${averageScore}% average, ${pronoun} has made commendable progress.`,
        
        `${studentName} has performed very well, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
      ],
      good: [
        `${studentName} has achieved a good average of ${averageScore}% this term. ${pronoun} shows strength in ${bestSubject.name} (${bestSubject.score}%). Consistent revision and additional focus on ${weakestSubject.name} (${weakestSubject.score}%) would further enhance ${possessive} performance.`,
        
        `Good effort, ${studentName}! With an average of ${averageScore}%, ${pronoun} has met the expected learning outcomes. ${possessive} best performance was in ${bestSubject.name} (${bestSubject.score}%). ${pronoun} is encouraged to put more effort into ${weakestSubject.name} next term.`,
        
        `${studentName} has performed satisfactorily with an average of ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is ${possessive} strongest area. To achieve better results, ${pronoun} needs to improve in ${weakestSubject.name} (${weakestSubject.score}%).`,
        
        `Well attempted, ${studentName}. ${pronoun} has achieved a good average of ${averageScore}%. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is commendable. With more dedication to ${weakestSubject.name}, ${pronoun} can reach higher levels.`,
        
        `${studentName} has shown good understanding this term with an average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is impressive. Focus on ${weakestSubject.name} for improvement.`,
        
        `Good performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met expectations. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `${studentName} has achieved a good average of ${averageScore}% this term. ${possessive} performance in ${bestSubject.name} stands out at ${bestSubject.score}%.`,
        
        `Satisfactory effort, ${studentName}! ${pronoun} has earned ${averageScore}% average, showing good grasp of key concepts.`,
        
        `${studentName} has performed well, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is ${possessive} strongest subject.`,
        
        `Good work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown consistent effort throughout the term.`,
        
        `${studentName} has achieved a good average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is commendable.`,
        
        `Satisfactory performance, ${studentName}! ${pronoun} has earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `${studentName} has shown good academic ability with ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is noteworthy.`,
        
        `Good results, ${studentName}! With ${averageScore}% average, ${pronoun} has met the required standards.`,
        
        `${studentName} has achieved a good average of ${averageScore}% this term. Keep working hard!`,
        
        `Satisfactory work, ${studentName}! ${pronoun} has earned ${averageScore}% average, showing good understanding.`,
        
        `${studentName} has performed well, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `Good effort, ${studentName}! With ${averageScore}% average, ${pronoun} has shown consistent progress.`,
        
        `${studentName} has achieved a good average of ${averageScore}%. ${possessive} performance in ${bestSubject.name} stands out.`,
        
        `Satisfactory results, ${studentName}! ${pronoun} has earned ${averageScore}% average this term.`,
        
        `${studentName} has shown good understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Good performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met expectations.`,
        
        `${studentName} has achieved a good average of ${averageScore}% this term. Well done!`,
        
        `Satisfactory effort, ${studentName}! ${pronoun} has earned ${averageScore}% average. Keep pushing!`,
        
        `${studentName} has performed well, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is noteworthy.`,
        
        `Good work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown solid progress.`,
        
        `${studentName} has achieved a good average of ${averageScore}%. Keep up the momentum!`,
        
        `Satisfactory performance, ${studentName}! ${pronoun} has earned ${averageScore}% average.`,
        
        `${studentName} has shown good academic ability with ${averageScore}% average. Well done!`,
        
        `Good results, ${studentName}! With ${averageScore}% average, ${pronoun} has made commendable progress.`,
        
        `${studentName} has achieved a good average of ${averageScore}% this term. Continue striving!`,
      ],
      aboveAverage: [
        `${studentName} has performed fairly this term with an average of ${averageScore}%. ${pronoun} did well in ${bestSubject.name} (${bestSubject.score}%) but needs to improve in ${weakestSubject.name} (${weakestSubject.score}%). Additional practice and focused revision are recommended to strengthen understanding.`,
        
        `Fair performance, ${studentName}. ${pronoun} achieved ${averageScore}% average, passing all subjects. ${possessive} best subject was ${bestSubject.name} at ${bestSubject.score}%. ${pronoun} is encouraged to seek extra support in ${weakestSubject.name} to build confidence.`,
        
        `${studentName} has met the minimum requirements with a fair average of ${averageScore}%. ${pronoun} performed best in ${bestSubject.name} (${bestSubject.score}%). More effort and attention to ${weakestSubject.name} will lead to better results next term.`,
        
        `Acceptable performance, ${studentName}. With ${averageScore}% average, ${pronoun} has passed. ${weakestSubject.name} at ${weakestSubject.score}% shows room for growth. A structured study plan would be beneficial.`,
        
        `${studentName} has achieved an above average performance with ${averageScore}%. ${pronoun} excels in ${bestSubject.name} (${bestSubject.score}%) and has the ability to improve in ${weakestSubject.name} with consistent effort.`,
        
        `Fair results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is a strength to build upon.`,
        
        `${studentName} has performed fairly, earning ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential for even greater achievement.`,
        
        `Acceptable work, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) is impressive and can be a model for other subjects.`,
        
        `${studentName} has shown fair understanding with ${averageScore}% average. Focusing on ${weakestSubject.name} will help unlock ${possessive} full potential.`,
        
        `Fair performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met basic requirements. Continued effort will lead to improvement.`,
        
        `${studentName} has achieved an above average average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is good. Building on this strength will bring success.`,
        
        `Acceptable results, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) stands out as a foundation for growth.`,
        
        `${studentName} has performed fairly, achieving ${averageScore}% average. With dedication to ${weakestSubject.name}, ${pronoun} can achieve more.`,
        
        `Fair work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown some understanding. Consistent revision will strengthen knowledge.`,
        
        `${studentName} has achieved an above average performance at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a strength to continue developing.`,
        
        `Acceptable performance, ${studentName}! ${pronoun} has earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is impressive and shows what ${pronoun} can achieve.`,
        
        `${studentName} has shown fair academic ability with ${averageScore}% average. Taking extra time with ${weakestSubject.name} will build confidence.`,
        
        `Fair results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is good and can be further strengthened.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable and shows potential.`,
        
        `Acceptable work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Continued effort will yield improvement.`,
        
        `${studentName} has performed fairly, achieving ${averageScore}% average. A focus on ${weakestSubject.name} next term will help balance skills.`,
        
        `Fair performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met expectations. There is room to grow with consistent effort.`,
        
        `${studentName} has shown fair understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength to leverage for improvement.`,
        
        `Acceptable results, ${studentName}! ${pronoun} has earned ${averageScore}% average. Hard work and dedication will bring success.`,
        
        `${studentName} has achieved an above average average of ${averageScore}%. Well done! Continued focus will bring even better results.`,
        
        `Fair work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown progress. Keep building on this foundation.`,
        
        `${studentName} has performed fairly, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good and can inspire further growth.`,
        
        `Acceptable performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term. Every step forward counts.`,
        
        `${studentName} has shown fair academic ability with ${averageScore}% average. Continued effort will lead to improvement.`,
        
        `Fair results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. Good job! Next term, aim to strengthen weaker areas.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable and worth building upon.`,
      ],
      satisfactory: [
        `${studentName} has achieved a satisfactory average of ${averageScore}% this term. ${pronoun} performed best in ${bestSubject.name} (${bestSubject.score}%). Consistent effort and attention to ${weakestSubject.name} will help improve overall performance.`,
        
        `Satisfactory performance, ${studentName}. With ${averageScore}% average, ${pronoun} has met the basic requirements. ${bestSubject.name} (${bestSubject.score}%) is ${possessive} strongest area. With more dedication to ${weakestSubject.name}, ${pronoun} can achieve better results.`,
        
        `${studentName} has shown adequate understanding this term, averaging ${averageScore}%. ${pronoun} has the ability to improve in ${weakestSubject.name} with focused effort and support.`,
        
        `Fairly satisfactory results, ${studentName}. ${pronoun} achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is good, and consistent practice in ${weakestSubject.name} will bring improvement.`,
        
        `${studentName} has performed at a satisfactory level with ${averageScore}% average. ${possessive} strength in ${bestSubject.name} is evident at ${bestSubject.score}%. Building on this will help in other areas.`,
        
        `Satisfactory work, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is a highlight to celebrate.`,
        
        `${studentName} has achieved satisfactory results at ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential for growth.`,
        
        `Adequate performance, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has shown satisfactory understanding with ${averageScore}% average. Focusing on ${weakestSubject.name} will help ${objective} improve.`,
        
        `Satisfactory results, ${studentName}! With ${averageScore}% average, ${pronoun} has met expectations. Keep working hard!`,
        
        `${studentName} has achieved a satisfactory average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is good and shows what ${pronoun} can do.`,
        
        `Adequate work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. With effort, ${weakestSubject.name} can improve.`,
        
        `${studentName} has performed satisfactorily, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) stands out as a strength.`,
        
        `Satisfactory effort, ${studentName}! With ${averageScore}% average, ${pronoun} has shown understanding. Continued focus will bring growth.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable and worth building upon.`,
        
        `Adequate performance, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Keep pushing forward.`,
        
        `${studentName} has shown satisfactory academic ability with ${averageScore}% average. Taking extra time with ${weakestSubject.name} will help.`,
        
        `Satisfactory results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is noteworthy and shows potential.`,
        
        `Adequate work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Hard work pays off.`,
        
        `${studentName} has performed satisfactorily, achieving ${averageScore}% average. A focus on ${weakestSubject.name} next term will bring balance.`,
        
        `Satisfactory performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met requirements. Keep building on this.`,
        
        `${studentName} has shown satisfactory understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Adequate results, ${studentName}! ${pronoun} has earned ${averageScore}% average. Continued effort brings success.`,
        
        `${studentName} has achieved a satisfactory average of ${averageScore}%. Well done!`,
        
        `Satisfactory work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown progress. Keep it up!`,
        
        `${studentName} has performed satisfactorily, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `Adequate performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term. Every step counts.`,
        
        `${studentName} has shown satisfactory academic ability with ${averageScore}% average. Keep striving for improvement.`,
        
        `Satisfactory results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. Good job!`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
      ],
      average: [
        `${studentName} has achieved an average of ${averageScore}%. ${pronoun} performed best in ${bestSubject.name} (${bestSubject.score}%). With consistent effort and practice in ${weakestSubject.name} (${weakestSubject.score}%), ${pronoun} can make significant progress next term.`,
        
        `Credit level achieved, ${studentName}. With ${averageScore}% average, ${pronoun} has passed all subjects. ${bestSubject.name} was ${possessive} strongest at ${bestSubject.score}%. ${pronoun} is encouraged to work on ${weakestSubject.name} with renewed focus.`,
        
        `${studentName} has met the pass mark with an average of ${averageScore}%. ${pronoun} excels in ${bestSubject.name} (${bestSubject.score}%) and has the ability to improve ${weakestSubject.name} (${weakestSubject.score}%) with extra effort.`,
        
        `Passing grade achieved. ${studentName} scored ${averageScore}% on average. ${possessive} best subject is ${bestSubject.name} (${bestSubject.score}%). Developing strategies for ${weakestSubject.name} will raise overall performance.`,
        
        `${studentName} has achieved an average performance with ${averageScore}%. ${possessive} strength in ${bestSubject.name} is evident at ${bestSubject.score}%. Continued effort will bring improvement.`,
        
        `Average results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is a highlight to celebrate.`,
        
        `${studentName} has earned ${averageScore}% average this term. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential for growth.`,
        
        `Credit performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has shown average understanding with ${averageScore}% average. Focusing on ${weakestSubject.name} will help build confidence.`,
        
        `Average performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met basic requirements. Keep working hard.`,
        
        `${studentName} has achieved an average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is good. Building on this will help.`,
        
        `Credit work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Extra effort on ${weakestSubject.name} will bring progress.`,
        
        `${studentName} has performed at an average level, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `Average effort, ${studentName}! With ${averageScore}% average, ${pronoun} has shown understanding. Continued focus will bring growth.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
        
        `Credit performance, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Keep pushing forward.`,
        
        `${studentName} has shown average academic ability with ${averageScore}% average. Taking extra time with ${weakestSubject.name} will help.`,
        
        `Average results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is noteworthy.`,
        
        `Credit work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Hard work pays off.`,
        
        `${studentName} has performed at an average level, achieving ${averageScore}% average. A focus on ${weakestSubject.name} next term will help.`,
        
        `Average performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met requirements. Keep building on this.`,
        
        `${studentName} has shown average understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Credit results, ${studentName}! ${pronoun} has earned ${averageScore}% average. Continued effort brings success.`,
        
        `${studentName} has achieved an average of ${averageScore}%. Well done!`,
        
        `Average work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown progress. Keep it up!`,
        
        `${studentName} has performed at an average level, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `Credit performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term. Every step counts.`,
        
        `${studentName} has shown average academic ability with ${averageScore}% average. Keep striving for improvement.`,
        
        `Average results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. Good job!`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
      ],
      belowAverage: [
        `${studentName} has shown potential this term with an average of ${averageScore}%. ${pronoun} performed relatively well in ${bestSubject.name} (${bestSubject.score}%) and has the capacity to improve in ${weakestSubject.name} (${weakestSubject.score}%) with additional support and consistent effort. Extra lessons are strongly recommended to build confidence and understanding.`,
        
        `${studentName} achieved ${averageScore}% average this term. ${possessive} ${bestSubject.score}% in ${bestSubject.name} demonstrates ability. With targeted support in ${weakestSubject.name}, ${pronoun} can make meaningful progress. We encourage ${objective} to seek extra help and practice regularly.`,
        
        `${studentName} has passed with ${averageScore}% average. While ${bestSubject.name} (${bestSubject.score}%) was acceptable, ${weakestSubject.name} (${weakestSubject.score}%) needs additional focus. With dedicated effort and support, ${pronoun} can improve significantly.`,
        
        `${studentName}, your performance this term was ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is your strength, and we believe you can improve in ${weakestSubject.name} (${weakestSubject.score}%) with consistent effort. Please speak with your teachers for additional support.`,
        
        `${studentName} passed with ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows what ${pronoun} can achieve. With focused effort on ${weakestSubject.name}, ${pronoun} can raise ${possessive} overall performance.`,
        
        `Below average performance, ${studentName}. With ${averageScore}% average, ${pronoun} has room to grow. We believe in ${possessive} ability to improve with dedication and support.`,
        
        `${studentName} achieved ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) is a strength to build upon. ${pronoun} is encouraged to seek extra help in weaker areas.`,
        
        `${studentName} passed with ${averageScore}% average. ${possessive} performance in ${bestSubject.name} shows potential. Additional support in ${weakestSubject.name} will help.`,
        
        `${studentName} has shown the ability to succeed, achieving ${averageScore}% average. With more consistent effort, especially in ${weakestSubject.name}, ${pronoun} can improve.`,
        
        `Below average effort, ${studentName}. With ${averageScore}% average, ${pronoun} has passed. We encourage ${objective} to work harder next term and seek support when needed.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs attention. With the right support and effort, ${pronoun} can improve.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) was good. Building on this will help in other subjects.`,
        
        `${studentName} achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is encouraging. We believe ${pronoun} can improve in weaker areas.`,
        
        `Below average results, ${studentName}. With ${averageScore}% average, ${pronoun} needs improvement. We are here to support ${possessive} growth.`,
        
        `${studentName} met the pass mark at ${averageScore}%. Focusing on ${weakestSubject.name} next term will bring balance to ${possessive} overall performance.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength. ${pronoun} can achieve more with consistent effort.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} requires additional attention. We encourage ${objective} to seek extra support.`,
        
        `Below average performance, ${studentName}. With ${averageScore}% average, ${pronoun} has the potential to do better with more dedication and effort.`,
        
        `${studentName} achieved ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential. We believe in ${possessive} ability to improve.`,
        
        `${studentName} passed with ${averageScore}% average. Continued effort on ${weakestSubject.name} will bring improvement.`,
        
        `${studentName} achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a highlight. ${pronoun} can use this strength to improve other areas.`,
        
        `Below average results, ${studentName}. With ${averageScore}% average, ${pronoun} needs support in ${weakestSubject.name}. We are committed to helping ${objective} succeed.`,
        
        `${studentName} met requirements at ${averageScore}%. Focusing on improvement areas will help ${objective} grow.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good. We encourage ${objective} to keep pushing.`,
        
        `${studentName} achieved ${averageScore}% average. With extra effort on ${weakestSubject.name}, ${pronoun} can make significant progress.`,
        
        `Below average effort, ${studentName}. With ${averageScore}% average, ${pronoun} has room for improvement. We are here to support ${possessive} journey.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs work. With consistent practice, ${pronoun} can improve.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is promising. Building on this will bring success.`,
        
        `${studentName} achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is encouraging. We believe ${pronoun} can do better.`,
        
        `Below average results, ${studentName}. With ${averageScore}% average, ${pronoun} needs extra support. We are committed to ${possessive} success.`,
        
        `${studentName} passed with ${averageScore}% average. A focus on ${weakestSubject.name} next term will help ${objective} improve overall.`,
      ],
      marginal: [
        `${studentName} passed this term with ${averageScore}% average. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) was satisfactory, and we believe ${pronoun} can improve in ${weakestSubject.name} (${weakestSubject.score}%) with additional support and consistent study habits. We encourage ${objective} to seek extra help and practice regularly.`,
        
        `${studentName} achieved ${averageScore}% average, meeting the minimum requirements. ${bestSubject.name} (${bestSubject.score}%) was ${possessive} strongest area. With focused effort and support, especially in ${weakestSubject.name}, ${pronoun} can make meaningful progress next term.`,
        
        `Marginal pass. ${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs attention. We recommend additional academic support and regular practice to build understanding and confidence.`,
        
        `${studentName} passed by a slim margin. ${possessive} average of ${averageScore}% indicates areas that need strengthening, especially ${weakestSubject.name} (${weakestSubject.score}%). Extra tutoring is strongly recommended to help ${objective} succeed.`,
        
        `${studentName} achieved ${averageScore}% average this term. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows ${possessive} potential. With extra effort and support in ${weakestSubject.name}, ${pronoun} can improve.`,
        
        `Marginal results, ${studentName}. With ${averageScore}% average, ${pronoun} needs to focus on improvement. We believe in ${possessive} ability to succeed with consistent effort.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) was good, but ${weakestSubject.name} needs attention. We encourage ${objective} to seek extra help.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs work. With support and dedication, ${pronoun} can improve.`,
        
        `${studentName} met requirements at ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} helped. Strengthening ${weakestSubject.name} will bring balance.`,
        
        `Marginal pass, ${studentName}. With ${averageScore}% average, ${pronoun} must improve next term. We are here to support ${possessive} growth.`,
        
        `${studentName} passed with ${averageScore}% average. ${weakestSubject.name} requires urgent attention. We recommend extra practice and support.`,
        
        `${studentName} achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength. Using this to build confidence in other subjects will help.`,
        
        `${studentName} passed at ${averageScore}%. ${possessive} performance in ${bestSubject.name} is encouraging. With effort, ${pronoun} can improve overall.`,
        
        `Marginal performance, ${studentName}. With ${averageScore}% average, ${pronoun} needs extra support. We are committed to ${possessive} success.`,
        
        `${studentName} met expectations at ${averageScore}%. Focusing on ${weakestSubject.name} next term will bring improvement.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) was good. Building on this will help in other subjects.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs work. With consistent effort, ${pronoun} can improve.`,
        
        `Marginal results, ${studentName}. With ${averageScore}% average, ${pronoun} must work harder. We believe in ${possessive} potential.`,
        
        `${studentName} passed with ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential. Keep pushing!`,
        
        `${studentName} achieved ${averageScore}% average. Continued effort on ${weakestSubject.name} will bring improvement.`,
        
        `${studentName} passed at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a highlight. We encourage ${objective} to use this as motivation.`,
        
        `Marginal performance, ${studentName}. With ${averageScore}% average, ${pronoun} needs improvement. We are here to help ${objective} succeed.`,
        
        `${studentName} met requirements at ${averageScore}%. Focusing on ${weakestSubject.name} urgently will help ${objective} improve.`,
        
        `${studentName} passed with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good. Keep working hard!`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} requires significant effort. With support, ${pronoun} can improve.`,
        
        `Marginal pass, ${studentName}. With ${averageScore}% average, ${pronoun} must improve next term. We believe in ${possessive} ability.`,
        
        `${studentName} passed with ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is promising. Building on this will help.`,
        
        `${studentName} achieved ${averageScore}% average. Continued effort on ${weakestSubject.name} will bring success.`,
        
        `${studentName} passed at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a strength to build upon.`,
        
        `Marginal results, ${studentName}. With ${averageScore}% average, ${pronoun} needs extra support. We are committed to ${possessive} growth.`,
        
        `${studentName} passed with ${averageScore}% average. Focusing on improvement areas will help ${objective} next term.`,
      ],
      poor: [
        `${studentName} has faced challenges this term, achieving ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) is an area that needs attention. With additional academic support, consistent effort, and a structured study plan, ${pronoun} can work toward improvement next term. We encourage parents to partner with the school to support ${possessive} progress.`,
        
        `${studentName} scored ${averageScore}% average this term. ${weakestSubject.name} at ${weakestSubject.score}% shows room for growth. Extra lessons and regular practice are strongly recommended to help ${objective} build understanding and confidence. A parent-teacher meeting is encouraged to discuss ${possessive} progress.`,
        
        `Performance this term was below expectations. ${studentName} achieved ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) requires significant attention. We recommend additional academic support and a personalized learning plan to help ${objective} succeed.`,
        
        `${studentName} has underperformed this term, achieving ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) is critically low. We strongly recommend extra tutoring and regular practice. Parents are encouraged to work closely with the school to support improvement.`,
        
        `${studentName} achieved ${averageScore}% average this term. ${weakestSubject.name} at ${weakestSubject.score}% is concerning. With focused intervention and consistent effort, ${pronoun} can make progress. Additional academic support is strongly recommended.`,
        
        `Poor results, ${studentName}. With ${averageScore}% average, ${pronoun} needs significant improvement. We are committed to providing the support needed for ${possessive} success.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) requires urgent attention. Extra lessons and consistent practice are recommended.`,
        
        `${studentName} has shown potential but needs to improve, achieving ${averageScore}% average. We recommend additional support and a structured study plan.`,
        
        `${studentName} scored below expectations at ${averageScore}%. ${weakestSubject.name} needs immediate support. We encourage parents to work with the school.`,
        
        `Poor achievement, ${studentName}. With ${averageScore}% average, ${pronoun} must improve dramatically. We believe in ${possessive} ability with the right support.`,
        
        `${studentName} performed below standard at ${averageScore}%. A parent-teacher meeting is encouraged to discuss ${possessive} progress.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} is a concern. We recommend extra support and regular practice.`,
        
        `${studentName} has underperformed at ${averageScore}%. Academic intervention is recommended to help ${objective} improve.`,
        
        `Poor performance, ${studentName}. With ${averageScore}% average, ${pronoun} requires extra support. We are here to help.`,
        
        `${studentName} scored below expectations at ${averageScore}%. ${weakestSubject.name} needs urgent work. We recommend additional tutoring.`,
        
        `${studentName} achieved ${averageScore}% average. Extra lessons are strongly recommended. Parents are encouraged to support ${possessive} learning journey.`,
        
        `${studentName} performed poorly at ${averageScore}%. ${weakestSubject.name} at ${weakestSubject.score}% is concerning. With support, ${pronoun} can improve.`,
        
        `Below standard results, ${studentName}. With ${averageScore}% average, ${pronoun} needs improvement. We are committed to ${possessive} success.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} requires attention. Additional academic support is recommended.`,
        
        `Poor achievement, ${studentName}. ${pronoun} achieved ${averageScore}% average. Extra lessons are strongly recommended.`,
        
        `${studentName} scored below expectations at ${averageScore}%. Immediate action is encouraged to support ${possessive} learning.`,
        
        `${studentName} has faced challenges, achieving ${averageScore}% average. With extra effort and support, ${pronoun} can improve.`,
        
        `${studentName} performed below standard at ${averageScore}%. ${weakestSubject.name} needs urgent support. We encourage parents to partner with the school.`,
        
        `Poor results, ${studentName}. ${pronoun} earned ${averageScore}% average. Academic support is strongly recommended.`,
        
        `${studentName} underperformed at ${averageScore}%. A parent-teacher meeting is encouraged to discuss ${possessive} progress.`,
        
        `${studentName} achieved ${averageScore}% average. With additional support and consistent effort, ${pronoun} can improve.`,
        
        `${studentName} performed poorly at ${averageScore}%. ${weakestSubject.name} is a major concern. Extra tutoring is strongly recommended.`,
        
        `Below standard results, ${studentName}. ${pronoun} achieved ${averageScore}% average. We recommend extra support and practice.`,
        
        `${studentName} scored below expectations at ${averageScore}%. Immediate improvement is needed. We are here to help.`,
        
        `Poor performance, ${studentName}. With ${averageScore}% average, ${pronoun} requires intervention. We believe in ${possessive} potential.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} needs urgent work. Additional academic support is recommended.`,
      ],
      veryPoor: [
        `${studentName} has faced significant challenges this term, achieving ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) shows critical gaps in understanding. We strongly recommend intensive academic support, extra tutoring, and a structured learning plan. Parents are encouraged to work closely with the school to help ${objective} succeed next term.`,
        
        `${studentName} scored ${averageScore}% average, which is below expectations. ${weakestSubject.name} at ${weakestSubject.score}% indicates major learning gaps. We recommend comprehensive academic intervention, extra lessons, and a parent-teacher conference to discuss strategies for improvement.`,
        
        `Performance this term requires urgent attention. ${studentName} achieved ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) is a critical concern. We strongly recommend intensive tutoring, regular practice, and a collaborative approach between school and home to support ${possessive} learning.`,
        
        `${studentName} has underperformed significantly this term, achieving ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) requires immediate intervention. We recommend extra lessons, additional academic support, and a parent-teacher meeting to discuss ${possessive} progress.`,
        
        `${studentName} performed very poorly with ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% is critically low. Intensive academic support and consistent practice are strongly recommended. Parents are encouraged to partner with the school.`,
        
        `Critical results, ${studentName}. With ${averageScore}% average, ${pronoun} needs urgent intervention. We are committed to helping ${objective} succeed.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} requires immediate support. Extra lessons and regular practice are recommended.`,
        
        `Very poor performance, ${studentName}. ${pronoun} earned ${averageScore}% average. We strongly recommend extra lessons and academic support.`,
        
        `${studentName} scored far below expectations at ${averageScore}%. ${weakestSubject.name} is a major concern. Intensive support is recommended.`,
        
        `Critical achievement level, ${studentName}. With ${averageScore}% average, ${pronoun} requires intensive help. We are here to support ${possessive} growth.`,
        
        `${studentName} performed very poorly at ${averageScore}%. A parent-teacher meeting is strongly recommended to discuss ${possessive} progress.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} is critical. We recommend comprehensive academic intervention.`,
        
        `${studentName} underperformed at ${averageScore}%. Urgent academic intervention is needed. We are committed to helping ${objective}.`,
        
        `Very poor performance, ${studentName}. With ${averageScore}% average, ${pronoun} requires immediate support. Extra tutoring is strongly recommended.`,
        
        `${studentName} scored far below standard at ${averageScore}%. ${weakestSubject.name} needs urgent work. We encourage parents to seek additional support.`,
        
        `Critical effort level, ${studentName}. ${pronoun} earned ${averageScore}% average. Remedial classes are strongly recommended.`,
        
        `${studentName} performed very poorly at ${averageScore}%. ${weakestSubject.name} at ${weakestSubject.score}% is critical. Intensive support is needed.`,
        
        `${studentName} has faced challenges, achieving ${averageScore}% average. We recommend comprehensive intervention and extra support.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} requires urgent attention. We are here to help.`,
        
        `Very poor achievement, ${studentName}. ${pronoun} achieved ${averageScore}% average. Extra lessons are strongly recommended.`,
        
        `${studentName} scored far below expectations at ${averageScore}%. Immediate action is encouraged to support ${possessive} learning.`,
        
        `Critical results, ${studentName}. With ${averageScore}% average, ${pronoun} must improve dramatically. We believe in ${possessive} potential.`,
        
        `${studentName} performed very poorly at ${averageScore}%. ${weakestSubject.name} needs urgent support. Parents are encouraged to work with the school.`,
        
        `${studentName} achieved ${averageScore}% average. Intensive intervention is recommended to help ${objective} improve.`,
        
        `${studentName} underperformed at ${averageScore}%. A parent-teacher conference is strongly recommended.`,
        
        `Very poor achievement, ${studentName}. With ${averageScore}% average, ${pronoun} needs immediate help. We are committed to ${possessive} success.`,
        
        `${studentName} performed very poorly at ${averageScore}%. ${weakestSubject.name} is a serious concern. Extra support is recommended.`,
        
        `Critical academic concern, ${studentName}. ${pronoun} achieved ${averageScore}% average. Urgent action is needed. We are here to help.`,
        
        `${studentName} scored far below standard at ${averageScore}%. Immediate improvement is needed with additional support.`,
        
        `Very poor performance, ${studentName}. With ${averageScore}% average, ${pronoun} requires major intervention. We believe improvement is possible.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} needs urgent work. Parents are encouraged to seek extra support.`,
      ],
    }

    // PRINCIPAL COMMENT TEMPLATES - ALL SUPPORTIVE, NO REPEATING CLASS
    const principalTemplates: Record<string, string[]> = {
      outstanding: [
        `The Management commends ${studentName} for an outstanding academic performance with ${averageScore}% average. ${pronoun} has demonstrated excellence, discipline, and intellectual prowess. ${pronoun} is hereby PROMOTED to the next class with HIGH DISTINCTION. We encourage ${possessive} parents to continue supporting this exceptional child.`,
        
        `Exceptional results! ${studentName} achieved ${averageScore}% average, placing ${objective} among the best students. ${pronoun} is PROMOTED with HIGH HONORS. The school is very proud of this achievement.`,
        
        `Remarkable performance. ${studentName} scored ${averageScore}% on average, showing mastery across all subjects. ${pronoun} is PROMOTED with DISTINCTION. Continue this excellent trajectory.`,
        
        `Outstanding achievement, ${studentName}! ${pronoun} has set a benchmark with ${averageScore}% average. PROMOTED with HIGH DISTINCTION.`,
        
        `Superb results! ${studentName} earned ${averageScore}% average. PROMOTED with DISTINCTION. Keep shining!`,
        
        `Exceptional academic display. ${studentName} is PROMOTED with HIGH HONORS for ${averageScore}% average.`,
        
        `Brilliant performance! ${studentName} achieved ${averageScore}% average. PROMOTED with DISTINCTION. Well done!`,
        
        `Outstanding work, ${studentName}! ${pronoun} is PROMOTED with HIGH DISTINCTION for exceptional results.`,
        
        `Remarkable achievement! ${studentName} scored ${averageScore}% average. PROMOTED with DISTINCTION.`,
        
        `Top-tier performance, ${studentName}! ${pronoun} is PROMOTED with HIGH HONORS. Very proud!`,
        
        `Exceptional results! ${studentName} is PROMOTED with DISTINCTION. Keep excelling!`,
        
        `Outstanding academic year for ${studentName}! PROMOTED with HIGH DISTINCTION.`,
        
        `Superb achievement! ${studentName} earns PROMOTION with DISTINCTION. Congratulations!`,
        
        `Brilliant work, ${studentName}! PROMOTED with HIGH HONORS. Continue this momentum.`,
        
        `Exceptional performance! ${studentName} is PROMOTED with DISTINCTION. Well deserved!`,
        
        `Outstanding results! ${studentName} earns PROMOTION with HIGH DISTINCTION. Very impressive!`,
        
        `Remarkable academic journey! ${studentName} PROMOTED with DISTINCTION.`,
        
        `Superb effort, ${studentName}! PROMOTED with HIGH HONORS for ${averageScore}% average.`,
        
        `Exceptional achievement! ${studentName} is PROMOTED with DISTINCTION. Keep soaring!`,
        
        `Outstanding work! ${studentName} earns PROMOTION with HIGH DISTINCTION.`,
        
        `Brilliant performance! ${studentName} PROMOTED with DISTINCTION. Well done!`,
        
        `Exceptional results! ${studentName} is PROMOTED with HIGH HONORS. Very proud!`,
        
        `Outstanding academic display! ${studentName} earns PROMOTION with DISTINCTION.`,
        
        `Superb achievement, ${studentName}! PROMOTED with HIGH DISTINCTION. Congratulations!`,
        
        `Brilliant work! ${studentName} is PROMOTED with DISTINCTION. Keep it up!`,
        
        `Exceptional performance, ${studentName}! PROMOTED with HIGH HONORS. Well deserved!`,
        
        `Outstanding results! ${studentName} earns PROMOTION with DISTINCTION. Very impressive!`,
        
        `Remarkable work! ${studentName} PROMOTED with HIGH DISTINCTION. Continue excelling!`,
        
        `Superb academic year! ${studentName} is PROMOTED with DISTINCTION.`,
        
        `Exceptional achievement, ${studentName}! PROMOTED with HIGH HONORS. Well done!`,
        
        `Outstanding performance! ${studentName} earns PROMOTION with DISTINCTION. Very proud!`,
      ],
      excellent: [
        `The Management congratulates ${studentName} on an excellent performance (${averageScore}% average). ${pronoun} has shown remarkable dedication to ${possessive} studies. ${pronoun} is PROMOTED with HONORS. Well done!`,
        
        `Excellent results, ${studentName}! With ${averageScore}% average, ${pronoun} has demonstrated strong academic ability. ${pronoun} is PROMOTED with MERIT. Keep striving for excellence.`,
        
        `Very impressive performance. ${studentName} achieved ${averageScore}% average, showing consistent effort and understanding. ${pronoun} is PROMOTED with COMMENDATION. Continue this momentum.`,
        
        `Excellent work, ${studentName}! ${pronoun} is PROMOTED with HONORS for ${averageScore}% average.`,
        
        `Very good results! ${studentName} earns PROMOTION with MERIT. Keep it up!`,
        
        `Impressive performance, ${studentName}! PROMOTED with COMMENDATION. Well done!`,
        
        `Excellent academic display! ${studentName} is PROMOTED with HONORS. Very proud!`,
        
        `Very impressive, ${studentName}! PROMOTED with MERIT for consistent effort.`,
        
        `Good results! ${studentName} earns PROMOTION with COMMENDATION. Continue striving!`,
        
        `Excellent achievement, ${studentName}! PROMOTED with HONORS. Well deserved!`,
        
        `Very good work! ${studentName} is PROMOTED with MERIT. Keep pushing!`,
        
        `Impressive results, ${studentName}! PROMOTED with COMMENDATION. Well done!`,
        
        `Excellent performance! ${studentName} earns PROMOTION with HONORS. Very proud!`,
        
        `Very impressive, ${studentName}! PROMOTED with MERIT for excellent effort.`,
        
        `Good achievement! ${studentName} is PROMOTED with COMMENDATION. Continue this trajectory.`,
        
        `Excellent work! ${studentName} earns PROMOTION with HONORS. Well deserved!`,
        
        `Very good results, ${studentName}! PROMOTED with MERIT. Keep it up!`,
        
        `Impressive performance! ${studentName} is PROMOTED with COMMENDATION.`,
        
        `Excellent academic year! ${studentName} earns PROMOTION with HONORS.`,
        
        `Very impressive, ${studentName}! PROMOTED with MERIT for consistency.`,
        
        `Good work! ${studentName} is PROMOTED with COMMENDATION. Well done!`,
        
        `Excellent results! ${studentName} earns PROMOTION with HONORS. Very proud!`,
        
        `Very impressive achievement! ${studentName} PROMOTED with MERIT.`,
        
        `Impressive work! ${studentName} is PROMOTED with COMMENDATION. Keep striving!`,
        
        `Excellent performance, ${studentName}! PROMOTED with HONORS. Well deserved!`,
        
        `Very good results! ${studentName} earns PROMOTION with MERIT. Continue excelling!`,
        
        `Impressive academic display! ${studentName} is PROMOTED with COMMENDATION.`,
        
        `Excellent work, ${studentName}! PROMOTED with HONORS for consistent effort.`,
        
        `Very impressive! ${studentName} earns PROMOTION with MERIT. Well done!`,
        
        `Good achievement! ${studentName} is PROMOTED with COMMENDATION. Keep it up!`,
        
        `Excellent results, ${studentName}! PROMOTED with HONORS. Very proud of you!`,
      ],
      veryGood: [
        `The Management acknowledges ${studentName}'s very good performance (${averageScore}% average). ${pronoun} has shown great promise and consistency. ${pronoun} is PROMOTED to the next class. Keep building on this foundation.`,
        
        `Good results, ${studentName}. With ${averageScore}% average, ${pronoun} is on the right track. ${pronoun} is PROMOTED. With continued effort, excellence is within reach.`,
        
        `Satisfactory performance. ${studentName} scored ${averageScore}% on average, meeting the expected standards. ${pronoun} is PROMOTED. Aim higher next term for even better outcomes.`,
        
        `Very good work, ${studentName}! ${pronoun} is PROMOTED. Keep up the good effort.`,
        
        `Good performance! ${studentName} earns PROMOTION. Continue building on this foundation.`,
        
        `Satisfactory results, ${studentName}! PROMOTED. Aim higher next term.`,
        
        `Very good effort! ${studentName} is PROMOTED. Keep striving for excellence.`,
        
        `Good work, ${studentName}! PROMOTED. With more effort, excellence awaits.`,
        
        `Satisfactory progress! ${studentName} earns PROMOTION. Well done!`,
        
        `Very good achievement! ${studentName} is PROMOTED. Keep pushing forward.`,
        
        `Good results! ${studentName} earns PROMOTION. Continue this momentum.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. Aim for higher grades next term.`,
        
        `Very good performance! ${studentName} is PROMOTED. Keep up the consistency.`,
        
        `Good effort! ${studentName} earns PROMOTION. Well deserved!`,
        
        `Satisfactory results, ${studentName}! PROMOTED. Continue striving.`,
        
        `Very good work! ${studentName} is PROMOTED. Keep building on this foundation.`,
        
        `Good achievement! ${studentName} earns PROMOTION. Well done!`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Aim higher!`,
        
        `Very good results! ${studentName} earns PROMOTION. Keep it up!`,
        
        `Good performance! ${studentName} is PROMOTED. Continue this trajectory.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. Well deserved!`,
        
        `Very good effort! ${studentName} earns PROMOTION. Keep pushing!`,
        
        `Good results! ${studentName} is PROMOTED. Well done!`,
        
        `Satisfactory achievement! ${studentName} earns PROMOTION. Keep striving!`,
        
        `Very good work, ${studentName}! PROMOTED. Continue the good work.`,
        
        `Good progress! ${studentName} is PROMOTED. Aim for excellence.`,
        
        `Satisfactory performance! ${studentName} earns PROMOTION. Well done!`,
        
        `Very good results! ${studentName} is PROMOTED. Keep it up!`,
        
        `Good effort! ${studentName} earns PROMOTION. Continue this momentum.`,
        
        `Satisfactory work! ${studentName} is PROMOTED. Well deserved!`,
        
        `Very good achievement! ${studentName} earns PROMOTION. Keep building!`,
      ],
      good: [
        `${studentName} has performed well with ${averageScore}% average. ${pronoun} has shown understanding across most subjects. ${pronoun} is PROMOTED to the next class. Keep working hard.`,
        
        `Good effort, ${studentName}. With ${averageScore}% average, ${pronoun} has met the basic requirements. ${pronoun} is PROMOTED. There is room for improvement, so stay focused.`,
        
        `Commendable progress. ${studentName} achieved ${averageScore}% average, showing improvement in key areas. ${pronoun} is PROMOTED. Continue building on this momentum.`,
        
        `Good work, ${studentName}! ${pronoun} is PROMOTED. Keep working hard.`,
        
        `Satisfactory performance! ${studentName} earns PROMOTION. Room for improvement.`,
        
        `Commendable effort, ${studentName}! PROMOTED. Continue building.`,
        
        `Good results! ${studentName} is PROMOTED. Stay focused next term.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. Keep pushing forward.`,
        
        `Good progress! ${studentName} earns PROMOTION. Well done!`,
        
        `Commendable achievement! ${studentName} is PROMOTED. Keep it up!`,
        
        `Good effort! ${studentName} earns PROMOTION. Aim higher next term.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. Well deserved.`,
        
        `Good work, ${studentName}! PROMOTED. Continue this momentum.`,
        
        `Commendable performance! ${studentName} earns PROMOTION. Keep striving.`,
        
        `Good results! ${studentName} is PROMOTED. Well done!`,
        
        `Satisfactory effort! ${studentName} earns PROMOTION. Room for growth.`,
        
        `Good progress! ${studentName} is PROMOTED. Keep it up!`,
        
        `Commendable work! ${studentName} earns PROMOTION. Well deserved.`,
        
        `Good achievement! ${studentName} is PROMOTED. Continue building.`,
        
        `Satisfactory results! ${studentName} earns PROMOTION. Stay focused.`,
        
        `Good effort, ${studentName}! PROMOTED. Keep working hard.`,
        
        `Commendable progress! ${studentName} is PROMOTED. Well done!`,
        
        `Good work! ${studentName} earns PROMOTION. Aim higher.`,
        
        `Satisfactory performance! ${studentName} is PROMOTED. Keep it up!`,
        
        `Good results! ${studentName} earns PROMOTION. Continue striving.`,
        
        `Commendable effort! ${studentName} is PROMOTED. Well deserved.`,
        
        `Good progress! ${studentName} earns PROMOTION. Keep building.`,
        
        `Satisfactory work! ${studentName} is PROMOTED. Stay focused.`,
        
        `Good achievement! ${studentName} earns PROMOTION. Well done!`,
        
        `Commendable results! ${studentName} is PROMOTED. Keep pushing!`,
        
        `Good effort, ${studentName}! PROMOTED. Continue this momentum.`,
      ],
      aboveAverage: [
        `${studentName} achieved a fair average of ${averageScore}%. ${pronoun} passed and has areas for growth. ${pronoun} is PROMOTED with encouragement to focus more on weaker areas next term. Additional dedication and practice will lead to improved results.`,
        
        `Average performance. ${studentName} scored ${averageScore}% on average, meeting the minimum standard. ${pronoun} is PROMOTED. Aiming higher next term will bring even better outcomes.`,
        
        `Satisfactory progress. ${studentName} is PROMOTED with ${averageScore}% average. ${pronoun} is encouraged to work on ${weakestSubject.name} to achieve better results next term.`,
        
        `Fair performance, ${studentName}! PROMOTED. More effort in weaker areas will bring improvement.`,
        
        `Average results! ${studentName} is PROMOTED. Aim higher next term.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. Room for improvement.`,
        
        `Fair achievement! ${studentName} earns PROMOTION. Working on weaker areas will help.`,
        
        `Average effort! ${studentName} is PROMOTED. Keep striving for growth.`,
        
        `Satisfactory results! ${studentName} earns PROMOTION. Focus more on challenging subjects.`,
        
        `Fair work, ${studentName}! PROMOTED. Dedication to weaker areas will bring progress.`,
        
        `Average performance! ${studentName} is PROMOTED. Aim for excellence.`,
        
        `Satisfactory progress! ${studentName} earns PROMOTION. More effort will bring results.`,
        
        `Fair results! ${studentName} is PROMOTED. Keep pushing forward.`,
        
        `Average work! ${studentName} earns PROMOTION. Strive for better.`,
        
        `Satisfactory achievement! ${studentName} is PROMOTED. Room to grow.`,
        
        `Fair effort, ${studentName}! PROMOTED. Consistent effort will bring success.`,
        
        `Average results! ${studentName} is PROMOTED. Aim higher.`,
        
        `Satisfactory work! ${studentName} earns PROMOTION. Focus more on learning.`,
        
        `Fair performance! ${studentName} is PROMOTED. Dedication will bring improvement.`,
        
        `Average progress! ${studentName} earns PROMOTION. Keep striving for better.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. More effort in weaker areas.`,
        
        `Fair work! ${studentName} earns PROMOTION. Hard work will pay off.`,
        
        `Average achievement! ${studentName} is PROMOTED. Aim for better results.`,
        
        `Satisfactory effort! ${studentName} earns PROMOTION. Room for growth.`,
        
        `Fair results! ${studentName} is PROMOTED. Stay focused on improvement.`,
        
        `Average work! ${studentName} earns PROMOTION. Keep pushing forward.`,
        
        `Satisfactory performance! ${studentName} is PROMOTED. More dedication needed.`,
        
        `Fair progress! ${studentName} earns PROMOTION. Consistent effort will help.`,
        
        `Average results! ${studentName} is PROMOTED. Aim higher next term.`,
        
        `Satisfactory work! ${studentName} earns PROMOTION. Focus required.`,
        
        `Fair achievement! ${studentName} is PROMOTED. Keep striving for growth.`,
      ],
      satisfactory: [
        `${studentName} achieved a satisfactory average of ${averageScore}%. ${pronoun} has met the basic requirements. ${pronoun} is PROMOTED. More effort and consistency will lead to better results next term.`,
        
        `Satisfactory performance, ${studentName}. ${pronoun} is PROMOTED to the next class. Continued hard work and focus will bring improvement.`,
        
        `Adequate results. ${studentName} scored ${averageScore}% average. ${pronoun} is PROMOTED. Aiming for improvement next term will help ${objective} succeed.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. More dedication to learning will help.`,
        
        `Adequate performance! ${studentName} is PROMOTED. Keep striving for better.`,
        
        `Satisfactory progress! ${studentName} earns PROMOTION. Room for growth.`,
        
        `Adequate results! ${studentName} is PROMOTED. Aim higher.`,
        
        `Satisfactory effort! ${studentName} earns PROMOTION. Work harder on weaker areas.`,
        
        `Adequate work, ${studentName}! PROMOTED. Focus more on challenging subjects.`,
        
        `Satisfactory achievement! ${studentName} is PROMOTED. Keep pushing forward.`,
        
        `Adequate performance! ${studentName} earns PROMOTION. More effort will bring results.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. Strive for better.`,
        
        `Adequate work! ${studentName} earns PROMOTION. Dedication to learning will help.`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Aim higher next term.`,
        
        `Adequate results! ${studentName} earns PROMOTION. Keep working hard.`,
        
        `Satisfactory effort! ${studentName} is PROMOTED. More focus on learning.`,
        
        `Adequate performance! ${studentName} earns PROMOTION. Room to improve.`,
        
        `Satisfactory work! ${studentName} is PROMOTED. Strive for excellence.`,
        
        `Adequate results! ${studentName} earns PROMOTION. Keep pushing forward.`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Work harder on weaknesses.`,
        
        `Adequate effort! ${studentName} earns PROMOTION. Aim for growth.`,
        
        `Satisfactory performance! ${studentName} is PROMOTED. More dedication needed.`,
        
        `Adequate work! ${studentName} earns PROMOTION. Stay focused on learning.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. Keep striving for better.`,
        
        `Adequate achievement! ${studentName} earns PROMOTION. Room for improvement.`,
        
        `Satisfactory effort! ${studentName} is PROMOTED. Work harder next term.`,
        
        `Adequate performance! ${studentName} earns PROMOTION. Aim higher.`,
        
        `Satisfactory work! ${studentName} is PROMOTED. More effort needed.`,
        
        `Adequate results! ${studentName} earns PROMOTION. Keep building on this.`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Strive for better.`,
        
        `Adequate effort! ${studentName} earns PROMOTION. Stay focused.`,
      ],
      average: [
        `${studentName} achieved a credit pass with ${averageScore}% average. ${pronoun} is PROMOTED with encouragement to develop stronger study habits. Parental support and additional practice in weaker areas are recommended.`,
        
        `Credit performance. ${studentName} scored ${averageScore}% on average. ${pronoun} is PROMOTED. Harder work and consistent effort will bring improvement next term.`,
        
        `${studentName} passed with ${averageScore}% average. ${pronoun} is PROMOTED. ${pronoun} is encouraged to put in more effort and seek support in weaker areas next term.`,
        
        `Credit pass, ${studentName}! PROMOTED. More effort and focus needed for even better results.`,
        
        `Average performance! ${studentName} is PROMOTED. Hard work will bring improvement.`,
        
        `Credit results! ${studentName} earns PROMOTION. Focus more on learning strategies.`,
        
        `${studentName} passed! ${pronoun} is PROMOTED. Dedication to studies will help ${objective} improve.`,
        
        `Credit work, ${studentName}! PROMOTED. Aim higher next term with consistent effort.`,
        
        `Average achievement! ${studentName} is PROMOTED. Keep striving for better results.`,
        
        `Credit effort! ${studentName} earns PROMOTION. More focus on challenging subjects will help.`,
        
        `${studentName} passed with credit. ${pronoun} is PROMOTED. Working harder next term will bring success.`,
        
        `Credit results! ${studentName} earns PROMOTION. Consistent study habits will help ${objective} improve.`,
        
        `Average performance! ${studentName} is PROMOTED. Stay focused on learning goals.`,
        
        `Credit pass! ${studentName} earns PROMOTION. More dedication to studies is encouraged.`,
        
        `${studentName} passed! ${pronoun} is PROMOTED. Aim for improvement in weaker areas.`,
        
        `Credit work! ${studentName} earns PROMOTION. Keep pushing forward with determination.`,
        
        `Average effort! ${studentName} is PROMOTED. Working harder next term will pay off.`,
        
        `Credit results! ${studentName} earns PROMOTION. Focus on building stronger foundations.`,
        
        `${studentName} achieved credit. ${pronoun} is PROMOTED. More consistent study is recommended.`,
        
        `Credit performance! ${studentName} earns PROMOTION. Strive for better understanding.`,
        
        `Average work! ${studentName} is PROMOTED. Dedication to learning will bring progress.`,
        
        `Credit pass! ${studentName} earns PROMOTION. Aim higher with focused effort.`,
        
        `${studentName} passed! ${pronoun} is PROMOTED. Keep working hard on all subjects.`,
        
        `Credit results! ${studentName} earns PROMOTION. More effort in weaker areas is encouraged.`,
        
        `Average achievement! ${studentName} is PROMOTED. Stay focused on continuous improvement.`,
        
        `Credit work! ${studentName} earns PROMOTION. Work harder on challenging concepts.`,
        
        `${studentName} passed with credit. ${pronoun} is PROMOTED. Focus on developing stronger study skills.`,
        
        `Credit effort! ${studentName} earns PROMOTION. Aim for growth in all subjects.`,
        
        `Average performance! ${studentName} is PROMOTED. Keep striving for academic growth.`,
        
        `Credit results! ${studentName} earns PROMOTION. More dedication to learning is recommended.`,
        
        `${studentName} passed! ${pronoun} is PROMOTED. Studying with greater focus will help next term.`,
      ],
      belowAverage: [
        `${studentName} passed with ${averageScore}% average. ${pronoun} is PROMOTED with encouragement to focus on improvement next term. Parents are encouraged to work with the school to support ${possessive} learning journey.`,
        
        `${studentName} achieved ${averageScore}% average. ${pronoun} is PROMOTED. ${pronoun} is encouraged to work much harder next term and seek extra support in weaker subjects to build confidence and understanding.`,
        
        `Passed by a narrow margin. ${studentName} is PROMOTED. We encourage ${objective} to focus on improvement areas and seek extra support. Parents are encouraged to partner with the school.`,
        
        `Below average, ${studentName}! PROMOTED. Significant effort and focus needed next term. We believe in ${possessive} potential!`,
        
        `${studentName} passed! ${pronoun} is PROMOTED. Working harder with determination will bring success.`,
        
        `Narrow margin! ${studentName} earns PROMOTION. Immediate focus on weaker areas is encouraged.`,
        
        `Below standard! ${studentName} is PROMOTED. Parents are encouraged to monitor progress and support learning.`,
        
        `Close call! ${studentName} earns PROMOTION. Urgent improvement needed in key subjects. We are here to help!`,
        
        `${studentName} passed! ${pronoun} is PROMOTED. Hard work on weak areas will bring improvement.`,
        
        `Narrow pass! ${studentName} earns PROMOTION. Focus on building stronger foundations.`,
        
        `Below average performance! ${studentName} is PROMOTED. More effort and dedication will help.`,
        
        `Close call, ${studentName}! PROMOTED. Immediate action and support are recommended.`,
        
        `${studentName} achieved a pass! ${pronoun} earns PROMOTION. Working much harder next term is encouraged.`,
        
        `Narrow margin pass! ${studentName} is PROMOTED. Focus on developing better study habits.`,
        
        `Below standard results! ${studentName} earns PROMOTION. Parents are advised to support learning at home.`,
        
        `Close pass! ${studentName} is PROMOTED. Urgent improvement in weaker areas is recommended.`,
        
        `${studentName} passed! ${pronoun} earns PROMOTION. More dedication to learning will help.`,
        
        `Narrow achievement! ${studentName} is PROMOTED. Studying harder next term will bring success.`,
        
        `Below average effort! ${studentName} earns PROMOTION. Focus more on understanding key concepts.`,
        
        `Close results! ${studentName} is PROMOTED. Work required on weak areas with teacher support.`,
        
        `${studentName} passed with a narrow margin! ${pronoun} earns PROMOTION. Immediate focus on improvement is needed.`,
        
        `Narrow margin! ${studentName} is PROMOTED. Parents are encouraged to support learning at home.`,
        
        `Below standard! ${studentName} earns PROMOTION. Urgent effort and focus are needed next term.`,
        
        `Close call! ${studentName} is PROMOTED. Working much harder next term is encouraged.`,
        
        `${studentName} passed! ${pronoun} earns PROMOTION. Focus on building skills in weak areas.`,
        
        `Narrow pass! ${studentName} is PROMOTED. More consistent study habits are recommended.`,
        
        `Below average performance! ${studentName} earns PROMOTION. Dedication and hard work will bring improvement.`,
        
        `Close achievement! ${studentName} is PROMOTED. Immediate action and support are recommended.`,
        
        `${studentName} passed! ${pronoun} earns PROMOTION. Working harder on challenges will help.`,
        
        `Narrow results! ${studentName} is PROMOTED. Focus on continuous improvement.`,
        
        `Below standard pass! ${studentName} earns PROMOTION. Parents are encouraged to provide extra support.`,
      ],
      marginal: [
        `${studentName} passed with ${averageScore}% average. ${pronoun} is PROMOTED with a strong recommendation to focus on improvement next term. Parents are encouraged to work closely with the school to support ${possessive} progress.`,
        
        `Marginal pass. ${studentName} is PROMOTED. ${pronoun} must improve significantly next term with additional support and consistent effort. We believe in ${possessive} ability to succeed.`,
        
        `Close call. ${studentName} is PROMOTED. ${pronoun} needs to double efforts next term. Parental support and partnership with the school are encouraged.`,
        
        `Barely passed, ${studentName}! PROMOTED. Major effort and support needed next term. We believe in you!`,
        
        `Marginal results! ${studentName} is PROMOTED. Significant improvement required with extra support.`,
        
        `Close call! ${studentName} earns PROMOTION. Double efforts and seek help when needed.`,
        
        `Barely made it! ${studentName} is PROMOTED. Working much harder next term is essential.`,
        
        `Marginal pass! ${studentName} earns PROMOTION. Urgent improvement needed with teacher support.`,
        
        `Close results! ${studentName} is PROMOTED. Parental support is encouraged to help ${objective} succeed.`,
        
        `Barely achieved! ${studentName} earns PROMOTION. Focus on building stronger foundations.`,
        
        `Marginal effort! ${studentName} is PROMOTED. Significant work needed in weaker areas.`,
        
        `Close call pass! ${studentName} earns PROMOTION. Double dedication to studies is recommended.`,
        
        `Barely passed! ${studentName} is PROMOTED. Major improvement needed with extra support.`,
        
        `Marginal results! ${studentName} earns PROMOTION. Urgent focus required on key subjects.`,
        
        `Close achievement! ${studentName} is PROMOTED. Parents are encouraged to support learning at home.`,
        
        `Barely made it! ${studentName} earns PROMOTION. Working harder will bring success.`,
        
        `Marginal pass! ${studentName} is PROMOTED. Significant effort needed next term.`,
        
        `Close call! ${studentName} earns PROMOTION. Double effort and focus on weak areas needed.`,
        
        `Barely passed! ${studentName} is PROMOTED. Major focus on improvement is recommended.`,
        
        `Marginal results! ${studentName} earns PROMOTION. Urgent dedication to studies is needed.`,
        
        `Close achievement! ${studentName} is PROMOTED. Parental support is encouraged.`,
        
        `Barely made it! ${studentName} earns PROMOTION. Working much harder is essential.`,
        
        `Marginal pass! ${studentName} is PROMOTED. Significant improvement needed next term.`,
        
        `Close call! ${studentName} earns PROMOTION. Double efforts and seek support.`,
        
        `Barely passed! ${studentName} is PROMOTED. Major work needed with teacher guidance.`,
        
        `Marginal results! ${studentName} earns PROMOTION. Urgent focus on learning is required.`,
        
        `Close achievement! ${studentName} is PROMOTED. Parents are encouraged to monitor progress.`,
        
        `Barely made it! ${studentName} earns PROMOTION. Working harder next term is essential.`,
        
        `Marginal pass! ${studentName} is PROMOTED. Significant dedication to studies is needed.`,
        
        `Close call! ${studentName} earns PROMOTION. Double effort required next term.`,
        
        `Barely passed! ${studentName} is PROMOTED. Major focus on improvement is recommended.`,
      ],
      poor: [
        `${studentName} has faced challenges this term, achieving ${averageScore}% average. ${pronoun} is PROMOTED with a strong recommendation for intensive academic support and a structured learning plan. Parents are encouraged to work closely with the school to help ${objective} succeed next term.`,
        
        `${studentName} scored ${averageScore}% average, which is below expectations. ${pronoun} is PROMOTED with extra support. Extra lessons, consistent practice, and a parent-teacher conference are strongly recommended.`,
        
        `${studentName} has not met the expected standard this term. ${pronoun} is PROMOTED with comprehensive support. A personalized learning plan and regular parent-teacher collaboration are recommended to help ${objective} succeed.`,
        
        `Poor performance, ${studentName}! ${pronoun} is PROMOTED with intensive support. Parent meeting and extra tutoring are encouraged.`,
        
        `${studentName} achieved below expectations. ${pronoun} is PROMOTED with immediate intervention and support. We believe in ${possessive} potential!`,
        
        `Below standard performance! ${studentName} is PROMOTED. Extra lessons and support are strongly recommended.`,
        
        `Poor achievement! ${studentName} is PROMOTED. Parent meeting is encouraged to discuss support strategies.`,
        
        `${studentName} has faced challenges. ${pronoun} is PROMOTED with intensive support and encouragement.`,
        
        `Below requirements! ${studentName} is PROMOTED. Extra lessons and support are recommended.`,
        
        `Poor results! ${studentName} is PROMOTED. Immediate action and support needed. We are here to help!`,
        
        `${studentName} scored below standard. ${pronoun} is PROMOTED. Parent meeting is encouraged to plan for improvement.`,
        
        `Below pass! ${studentName} is PROMOTED. Urgent intervention and support needed. We believe in you!`,
        
        `Poor effort! ${studentName} is PROMOTED. Extra lessons are strongly recommended.`,
        
        `${studentName} has not met expectations. ${pronoun} is PROMOTED with extra support. Parent conference is encouraged.`,
        
        `Below standards! ${studentName} is PROMOTED. Immediate support and guidance are recommended.`,
        
        `Poor results! ${studentName} is PROMOTED. Parent meeting is encouraged to support learning.`,
        
        `${studentName} achieved below requirements. ${pronoun} is PROMOTED. Intensive intervention and support are recommended.`,
        
        `Below requirements! ${studentName} is PROMOTED. Extra lessons and support strongly recommended.`,
        
        `Poor performance! ${studentName} is PROMOTED. Parent meeting and extra support are encouraged.`,
        
        `${studentName} scored below standard. ${pronoun} is PROMOTED. Urgent action and support needed.`,
        
        `Below standards! ${studentName} is PROMOTED. Immediate support is recommended for success.`,
        
        `Poor achievement! ${studentName} is PROMOTED. Extra lessons are strongly recommended.`,
        
        `${studentName} has faced challenges. ${pronoun} is PROMOTED. Parent conference is encouraged.`,
        
        `Below requirements! ${studentName} is PROMOTED. Urgent intervention and support are recommended.`,
        
        `Poor work! ${studentName} is PROMOTED. Intensive support is recommended for improvement.`,
        
        `${studentName} achieved below expectations. ${pronoun} is PROMOTED. Parent meeting is encouraged to plan for success.`,
        
        `Below requirements! ${studentName} is PROMOTED. Extra lessons and support are recommended.`,
        
        `Poor performance! ${studentName} is PROMOTED. Immediate action and encouragement needed.`,
        
        `${studentName} has not met standards. ${pronoun} is PROMOTED with comprehensive support.`,
        
        `Below standards! ${studentName} is PROMOTED. Parent conference and support are encouraged.`,
        
        `Poor results! ${studentName} is PROMOTED. Extra lessons are strongly recommended for growth.`,
      ],
      veryPoor: [
        `${studentName} has faced significant academic challenges this term, achieving ${averageScore}% average. ${pronoun} is PROMOTED with comprehensive support and encouragement. We strongly recommend intensive tutoring, a structured learning plan, and regular parent-teacher collaboration to help ${objective} succeed next term. We believe in ${possessive} potential!`,
        
        `${studentName} scored ${averageScore}% average, which is significantly below expectations. ${pronoun} is PROMOTED with extra support. Immediate intervention, extra lessons, and a parent-teacher conference are strongly recommended.`,
        
        `${studentName} has not met the required standard this term. ${pronoun} is PROMOTED with intensive academic support. A comprehensive learning plan and strong home-school partnership are recommended. We are committed to ${possessive} success.`,
        
        `Critical academic concern, ${studentName}! ${pronoun} is PROMOTED with intensive intervention. Extra tutoring, consistent practice, and parent collaboration are strongly encouraged.`,
        
        `${studentName} achieved far below expectations. ${pronoun} is PROMOTED with comprehensive support. We recommend extra lessons, academic intervention, and a parent meeting to discuss strategies for improvement.`,
        
        `Critical results, ${studentName}. ${pronoun} is PROMOTED with urgent intervention. We are committed to providing the support needed for ${possessive} success.`,
        
        `${studentName} underperformed significantly. ${pronoun} is PROMOTED with immediate support. Extra lessons and regular practice are strongly recommended.`,
        
        `Very poor performance, ${studentName}. ${pronoun} is PROMOTED with intensive academic support. We believe improvement is possible with the right help.`,
        
        `${studentName} scored far below expectations. ${pronoun} is PROMOTED with comprehensive intervention. Parental support is encouraged.`,
        
        `Critical achievement level, ${studentName}. ${pronoun} is PROMOTED with intensive help. We are here to support ${possessive} growth.`,
        
        `${studentName} performed very poorly. ${pronoun} is PROMOTED with extra support. A parent-teacher meeting is strongly recommended.`,
        
        `${studentName} achieved critical results. ${pronoun} is PROMOTED with comprehensive intervention. We are committed to helping ${objective}.`,
        
        `${studentName} underperformed significantly. ${pronoun} is PROMOTED with urgent academic support. We believe in ${possessive} ability to improve.`,
        
        `Very poor performance, ${studentName}. ${pronoun} is PROMOTED with immediate intervention. Extra tutoring is strongly recommended.`,
        
        `${studentName} scored far below standard. ${pronoun} is PROMOTED with extra support. Parents are encouraged to seek additional help.`,
        
        `Critical effort level, ${studentName}. ${pronoun} is PROMOTED with comprehensive support. Remedial classes are strongly recommended.`,
        
        `${studentName} performed very poorly. ${pronoun} is PROMOTED with intensive intervention. We believe in ${possessive} potential.`,
        
        `${studentName} has faced challenges. ${pronoun} is PROMOTED with comprehensive support. We are here to help ${objective} succeed.`,
        
        `${studentName} underperformed significantly. ${pronoun} is PROMOTED with urgent intervention. Extra support is recommended.`,
        
        `Very poor achievement, ${studentName}. ${pronoun} is PROMOTED with extra lessons. We are committed to ${possessive} success.`,
        
        `${studentName} scored far below expectations. ${pronoun} is PROMOTED with immediate support. Parent collaboration is encouraged.`,
        
        `Critical results, ${studentName}. ${pronoun} is PROMOTED with intensive intervention. We believe in ${possessive} ability to improve.`,
        
        `${studentName} performed very poorly. ${pronoun} is PROMOTED with urgent support. Parents are encouraged to work with the school.`,
        
        `${studentName} achieved critical results. ${pronoun} is PROMOTED with comprehensive intervention. We are here to help.`,
        
        `${studentName} underperformed significantly. ${pronoun} is PROMOTED with immediate support. Extra lessons are recommended.`,
        
        `Very poor achievement, ${studentName}. ${pronoun} is PROMOTED with intensive help. We are committed to ${possessive} success.`,
        
        `${studentName} performed very poorly. ${pronoun} is PROMOTED with comprehensive support. Extra tutoring is strongly recommended.`,
        
        `Critical academic concern, ${studentName}. ${pronoun} is PROMOTED with urgent intervention. We believe improvement is possible.`,
        
        `${studentName} scored far below standard. ${pronoun} is PROMOTED with extra support. Parental involvement is encouraged.`,
        
        `Very poor performance, ${studentName}. ${pronoun} is PROMOTED with major intervention. We are committed to helping ${objective} succeed.`,
        
        `${studentName} underperformed significantly. ${pronoun} is PROMOTED with extra support. Parents are encouraged to seek additional help.`,
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