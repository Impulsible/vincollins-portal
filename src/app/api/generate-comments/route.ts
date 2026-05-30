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
        `${studentName} has performed fairly this term with an average of ${averageScore}%. ${pronoun} did well in ${bestSubject.name} (${bestSubject.score}%) but needs to improve in ${weakestSubject.name} (${weakestSubject.score}%). Extra lessons and consistent practice are recommended.`,
        
        `Fair performance, ${studentName}. ${pronoun} achieved ${averageScore}% average, passing all subjects. ${possessive} best subject was ${bestSubject.name} at ${bestSubject.score}%. ${pronoun} should seek additional support in ${weakestSubject.name} to improve.`,
        
        `${studentName} has met the minimum requirements with a fair average of ${averageScore}%. ${pronoun} performed best in ${bestSubject.name} (${bestSubject.score}%). More effort and focus on ${weakestSubject.name} will yield better results next term.`,
        
        `Acceptable performance, ${studentName}. With ${averageScore}% average, ${pronoun} has passed. However, ${weakestSubject.name} at ${weakestSubject.score}% requires significant improvement. A structured study plan is advised.`,
        
        `${studentName} has achieved an above average performance with ${averageScore}%. ${pronoun} excels in ${bestSubject.name} (${bestSubject.score}%) but needs to work on ${weakestSubject.name}.`,
        
        `Fair results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `${studentName} has performed fairly, earning ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Acceptable work, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has shown fair understanding with ${averageScore}% average. Focus on ${weakestSubject.name} for improvement.`,
        
        `Fair performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met basic requirements.`,
        
        `${studentName} has achieved an above average average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is good.`,
        
        `Acceptable results, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `${studentName} has performed fairly, achieving ${averageScore}% average. Keep working on ${weakestSubject.name}.`,
        
        `Fair work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown some understanding.`,
        
        `${studentName} has achieved an above average performance at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Acceptable performance, ${studentName}! ${pronoun} has earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has shown fair academic ability with ${averageScore}% average. Keep pushing on ${weakestSubject.name}.`,
        
        `Fair results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
        
        `Acceptable work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term.`,
        
        `${studentName} has performed fairly, achieving ${averageScore}% average. Focus on ${weakestSubject.name} next term.`,
        
        `Fair performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met expectations.`,
        
        `${studentName} has shown fair understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Acceptable results, ${studentName}! ${pronoun} has earned ${averageScore}% average. Keep working hard.`,
        
        `${studentName} has achieved an above average average of ${averageScore}%. Well done!`,
        
        `Fair work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown progress.`,
        
        `${studentName} has performed fairly, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `Acceptable performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term.`,
        
        `${studentName} has shown fair academic ability with ${averageScore}% average. Keep striving!`,
        
        `Fair results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. Good job!`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
      ],
      satisfactory: [
        `${studentName} has achieved a satisfactory average of ${averageScore}% this term. ${pronoun} performed best in ${bestSubject.name} (${bestSubject.score}%). However, ${weakestSubject.name} at ${weakestSubject.score}% needs improvement. Consistent effort will lead to better results.`,
        
        `Satisfactory performance, ${studentName}. With ${averageScore}% average, ${pronoun} has met the basic requirements. ${bestSubject.name} (${bestSubject.score}%) is ${possessive} strongest area. More dedication to ${weakestSubject.name} is advised.`,
        
        `${studentName} has shown adequate understanding this term, averaging ${averageScore}%. ${pronoun} needs to pay more attention to ${weakestSubject.name} where ${pronoun} scored ${weakestSubject.score}%.`,
        
        `Fairly satisfactory results, ${studentName}. ${pronoun} achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) is good, but ${weakestSubject.name} requires more focus.`,
        
        `${studentName} has performed at a satisfactory level with ${averageScore}% average. ${possessive} strength in ${bestSubject.name} is evident at ${bestSubject.score}%.`,
        
        `Satisfactory work, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `${studentName} has achieved satisfactory results at ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Adequate performance, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has shown satisfactory understanding with ${averageScore}% average. Focus on ${weakestSubject.name} for improvement.`,
        
        `Satisfactory results, ${studentName}! With ${averageScore}% average, ${pronoun} has met expectations.`,
        
        `${studentName} has achieved a satisfactory average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is good.`,
        
        `Adequate work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Keep working on ${weakestSubject.name}.`,
        
        `${studentName} has performed satisfactorily, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `Satisfactory effort, ${studentName}! With ${averageScore}% average, ${pronoun} has shown some understanding.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
        
        `Adequate performance, ${studentName}! ${pronoun} has earned ${averageScore}% average this term.`,
        
        `${studentName} has shown satisfactory academic ability with ${averageScore}% average. Keep pushing on ${weakestSubject.name}.`,
        
        `Satisfactory results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is noteworthy.`,
        
        `Adequate work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term.`,
        
        `${studentName} has performed satisfactorily, achieving ${averageScore}% average. Focus on ${weakestSubject.name} next term.`,
        
        `Satisfactory performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met requirements.`,
        
        `${studentName} has shown satisfactory understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Adequate results, ${studentName}! ${pronoun} has earned ${averageScore}% average. Keep working hard.`,
        
        `${studentName} has achieved a satisfactory average of ${averageScore}%. Well done!`,
        
        `Satisfactory work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown progress.`,
        
        `${studentName} has performed satisfactorily, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `Adequate performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term.`,
        
        `${studentName} has shown satisfactory academic ability with ${averageScore}% average. Keep striving!`,
        
        `Satisfactory results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. Good job!`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
      ],
      average: [
        `${studentName} has achieved an average of ${averageScore}%. ${pronoun} performed best in ${bestSubject.name} (${bestSubject.score}%). To improve, ${pronoun} must dedicate more time to ${weakestSubject.name} (${weakestSubject.score}%).`,
        
        `Credit level achieved, ${studentName}. With ${averageScore}% average, ${pronoun} has passed all subjects. ${bestSubject.name} was ${possessive} strongest at ${bestSubject.score}%. ${pronoun} is encouraged to work harder on ${weakestSubject.name}.`,
        
        `${studentName} has met the pass mark with an average of ${averageScore}%. ${pronoun} excels in ${bestSubject.name} (${bestSubject.score}%) but struggles with ${weakestSubject.name} (${weakestSubject.score}%). More effort is required in weaker areas.`,
        
        `Passing grade achieved. ${studentName} scored ${averageScore}% on average. ${possessive} best subject is ${bestSubject.name} (${bestSubject.score}%). ${pronoun} needs to improve in ${weakestSubject.name} to raise overall performance.`,
        
        `${studentName} has achieved an average performance with ${averageScore}%. ${possessive} strength in ${bestSubject.name} is evident at ${bestSubject.score}%.`,
        
        `Average results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `${studentName} has earned ${averageScore}% average this term. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Credit performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is impressive.`,
        
        `${studentName} has shown average understanding with ${averageScore}% average. Focus on ${weakestSubject.name} for improvement.`,
        
        `Average performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met basic requirements.`,
        
        `${studentName} has achieved an average of ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} is good.`,
        
        `Credit work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term. Keep working on ${weakestSubject.name}.`,
        
        `${studentName} has performed at an average level, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) stands out.`,
        
        `Average effort, ${studentName}! With ${averageScore}% average, ${pronoun} has shown some understanding.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
        
        `Credit performance, ${studentName}! ${pronoun} has earned ${averageScore}% average this term.`,
        
        `${studentName} has shown average academic ability with ${averageScore}% average. Keep pushing on ${weakestSubject.name}.`,
        
        `Average results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is noteworthy.`,
        
        `Credit work, ${studentName}! ${pronoun} has earned ${averageScore}% average this term.`,
        
        `${studentName} has performed at an average level, achieving ${averageScore}% average. Focus on ${weakestSubject.name} next term.`,
        
        `Average performance, ${studentName}! With ${averageScore}% average, ${pronoun} has met requirements.`,
        
        `${studentName} has shown average understanding with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Credit results, ${studentName}! ${pronoun} has earned ${averageScore}% average. Keep working hard.`,
        
        `${studentName} has achieved an average of ${averageScore}%. Well done!`,
        
        `Average work, ${studentName}! With ${averageScore}% average, ${pronoun} has shown progress.`,
        
        `${studentName} has performed at an average level, earning ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `Credit performance, ${studentName}! ${pronoun} has achieved ${averageScore}% average this term.`,
        
        `${studentName} has shown average academic ability with ${averageScore}% average. Keep striving!`,
        
        `Average results, ${studentName}! With ${averageScore}% average, ${pronoun} has passed. Good job!`,
        
        `${studentName} has achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is commendable.`,
      ],
      belowAverage: [
        `${studentName} narrowly passed this term with ${averageScore}% average. ${pronoun} performed relatively well in ${bestSubject.name} (${bestSubject.score}%) but struggled significantly in ${weakestSubject.name} (${weakestSubject.score}%). Immediate intervention and extra lessons are strongly recommended.`,
        
        `Borderline performance. ${studentName} scored ${averageScore}% on average, barely meeting the pass mark. ${possessive} ${bestSubject.score}% in ${bestSubject.name} helped ${objective} pass. ${pronoun} must improve dramatically in ${weakestSubject.name}.`,
        
        `Pass by a narrow margin. ${studentName} averaged ${averageScore}%. While ${bestSubject.name} (${bestSubject.score}%) was acceptable, ${weakestSubject.name} (${weakestSubject.score}%) is a major concern. ${pronoun} needs to work much harder next term.`,
        
        `${studentName}, your performance this term was below expectations with ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is your strength, but ${weakestSubject.name} (${weakestSubject.score}%) requires urgent attention. Please see your subject teachers for support.`,
        
        `${studentName} barely passed with ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} helped, but ${weakestSubject.name} at ${weakestSubject.score}% is concerning.`,
        
        `Below average performance, ${studentName}! With ${averageScore}% average, ${pronoun} needs to improve significantly.`,
        
        `${studentName} narrowly passed, achieving ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Borderline results, ${studentName}! ${pronoun} earned ${averageScore}% average. Focus on ${weakestSubject.name} urgently.`,
        
        `${studentName} passed by a narrow margin at ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Below average effort, ${studentName}! With ${averageScore}% average, ${pronoun} must work harder next term.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs attention.`,
        
        `Narrow pass, ${studentName}! ${pronoun} earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) was good.`,
        
        `${studentName} barely passed at ${averageScore}%. ${possessive} performance in ${bestSubject.name} is encouraging.`,
        
        `Below average results, ${studentName}! With ${averageScore}% average, ${pronoun} needs improvement.`,
        
        `${studentName} narrowly met the pass mark at ${averageScore}%. Focus on ${weakestSubject.name} next term.`,
        
        `Borderline pass, ${studentName}! ${pronoun} achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `${studentName} passed by a slim margin at ${averageScore}%. ${weakestSubject.name} requires urgent attention.`,
        
        `Below average performance, ${studentName}! With ${averageScore}% average, ${pronoun} must dedicate more effort.`,
        
        `${studentName} achieved ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Narrow pass, ${studentName}! ${pronoun} earned ${averageScore}% average. Keep working on ${weakestSubject.name}.`,
        
        `${studentName} barely passed at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `Below average results, ${studentName}! With ${averageScore}% average, ${pronoun} needs support in ${weakestSubject.name}.`,
        
        `${studentName} narrowly met requirements at ${averageScore}%. Focus on improvement areas.`,
        
        `Borderline performance, ${studentName}! ${pronoun} achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} passed by a narrow margin at ${averageScore}%. Keep pushing on ${weakestSubject.name}.`,
        
        `Below average effort, ${studentName}! With ${averageScore}% average, ${pronoun} must improve next term.`,
        
        `${studentName} achieved ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% needs work.`,
        
        `Narrow pass, ${studentName}! ${pronoun} earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is promising.`,
        
        `${studentName} barely passed at ${averageScore}%. ${possessive} performance in ${bestSubject.name} is encouraging.`,
        
        `Below average results, ${studentName}! With ${averageScore}% average, ${pronoun} needs extra support.`,
        
        `${studentName} narrowly passed, achieving ${averageScore}% average. Focus on ${weakestSubject.name} next term.`,
      ],
      marginal: [
        `${studentName} barely passed with ${averageScore}% average. ${possessive} performance in ${bestSubject.name} (${bestSubject.score}%) was satisfactory, but ${weakestSubject.name} (${weakestSubject.score}%) is a serious concern. ${pronoun} must show significant improvement next term.`,
        
        `Close call, ${studentName}. Scoring ${averageScore}% on average, ${pronoun} narrowly avoided failure. ${bestSubject.name} (${bestSubject.score}%) was ${possessive} saving grace. ${pronoun} needs to double efforts, especially in ${weakestSubject.name}.`,
        
        `Marginal pass. ${studentName} achieved ${averageScore}% average, just above the minimum. ${weakestSubject.name} at ${weakestSubject.score}% is particularly concerning. A parent-teacher meeting is advised to discuss ${possessive} progress.`,
        
        `${studentName} passed by a slim margin. ${possessive} average of ${averageScore}% indicates serious gaps in understanding, especially in ${weakestSubject.name} (${weakestSubject.score}%). Extra tutoring is strongly recommended.`,
        
        `${studentName} barely scraped through with ${averageScore}% average. ${possessive} ${bestSubject.score}% in ${bestSubject.name} saved ${objective}.`,
        
        `Marginal results, ${studentName}! With ${averageScore}% average, ${pronoun} needs urgent improvement.`,
        
        `${studentName} narrowly passed at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) was good, but ${weakestSubject.name} needs work.`,
        
        `Close call, ${studentName}! ${pronoun} earned ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% is concerning.`,
        
        `${studentName} barely met requirements at ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} helped.`,
        
        `Marginal pass, ${studentName}! With ${averageScore}% average, ${pronoun} must improve significantly.`,
        
        `${studentName} narrowly passed at ${averageScore}%. ${weakestSubject.name} requires urgent attention.`,
        
        `Close results, ${studentName}! ${pronoun} achieved ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `${studentName} barely passed at ${averageScore}%. ${possessive} performance in ${bestSubject.name} is encouraging.`,
        
        `Marginal performance, ${studentName}! With ${averageScore}% average, ${pronoun} needs extra support.`,
        
        `${studentName} narrowly met expectations at ${averageScore}%. Focus on ${weakestSubject.name} next term.`,
        
        `Close call, ${studentName}! ${pronoun} earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) was good.`,
        
        `${studentName} barely passed at ${averageScore}%. ${weakestSubject.name} at ${weakestSubject.score}% needs work.`,
        
        `Marginal results, ${studentName}! With ${averageScore}% average, ${pronoun} must work harder.`,
        
        `${studentName} narrowly passed at ${averageScore}%. ${possessive} ${bestSubject.score}% in ${bestSubject.name} shows potential.`,
        
        `Close pass, ${studentName}! ${pronoun} achieved ${averageScore}% average. Keep working on ${weakestSubject.name}.`,
        
        `${studentName} barely passed at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a highlight.`,
        
        `Marginal performance, ${studentName}! With ${averageScore}% average, ${pronoun} needs improvement.`,
        
        `${studentName} narrowly met requirements at ${averageScore}%. Focus on ${weakestSubject.name} urgently.`,
        
        `Close results, ${studentName}! ${pronoun} earned ${averageScore}% average. ${bestSubject.name} (${bestSubject.score}%) is good.`,
        
        `${studentName} barely passed at ${averageScore}%. ${weakestSubject.name} requires significant effort.`,
        
        `Marginal pass, ${studentName}! With ${averageScore}% average, ${pronoun} must improve next term.`,
        
        `${studentName} narrowly achieved ${averageScore}% average. ${possessive} performance in ${bestSubject.name} is promising.`,
        
        `Close call, ${studentName}! ${pronoun} earned ${averageScore}% average. Keep pushing on ${weakestSubject.name}.`,
        
        `${studentName} barely passed at ${averageScore}%. ${bestSubject.name} (${bestSubject.score}%) is a strength.`,
        
        `Marginal results, ${studentName}! With ${averageScore}% average, ${pronoun} needs extra support.`,
        
        `${studentName} narrowly passed, achieving ${averageScore}% average. Focus on improvement areas.`,
      ],
      poor: [
        `${studentName} performed poorly this term with an average of ${averageScore}%, which is below the expected standard. ${weakestSubject.name} (${weakestSubject.score}%) is a major area of concern. ${pronoun} is required to attend extra lessons and a parent-teacher meeting is mandatory.`,
        
        `Unsatisfactory performance. ${studentName} scored ${averageScore}% on average, failing to meet the minimum requirements. ${weakestSubject.name} at ${weakestSubject.score}% is unacceptable. Immediate academic intervention is required.`,
        
        `Poor results, ${studentName}. With ${averageScore}% average, ${pronoun} has not met the expected learning outcomes. ${weakestSubject.name} (${weakestSubject.score}%) needs urgent improvement. ${pronoun} is placed on academic probation.`,
        
        `${studentName} has underperformed this term, achieving only ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) is critically low. ${pronoun} must attend mandatory remedial classes next term.`,
        
        `${studentName} performed below standard with ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% is concerning.`,
        
        `Poor results, ${studentName}! With ${averageScore}% average, ${pronoun} needs significant improvement.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} (${weakestSubject.score}%) requires urgent attention.`,
        
        `Unsatisfactory performance, ${studentName}! ${pronoun} earned ${averageScore}% average. Extra lessons required.`,
        
        `${studentName} scored below expectations at ${averageScore}%. ${weakestSubject.name} needs immediate support.`,
        
        `Poor achievement, ${studentName}! With ${averageScore}% average, ${pronoun} must improve dramatically.`,
        
        `${studentName} performed below standard at ${averageScore}%. Parent-teacher meeting required.`,
        
        `Unsatisfactory results, ${studentName}! ${pronoun} achieved ${averageScore}% average. ${weakestSubject.name} is a concern.`,
        
        `${studentName} underperformed at ${averageScore}%. Immediate academic intervention needed.`,
        
        `Poor performance, ${studentName}! With ${averageScore}% average, ${pronoun} requires extra support.`,
        
        `${studentName} scored below expectations at ${averageScore}%. ${weakestSubject.name} needs urgent work.`,
        
        `Unsatisfactory effort, ${studentName}! ${pronoun} earned ${averageScore}% average. Remedial classes required.`,
        
        `${studentName} performed poorly at ${averageScore}%. ${weakestSubject.name} at ${weakestSubject.score}% is concerning.`,
        
        `Below standard results, ${studentName}! With ${averageScore}% average, ${pronoun} needs improvement.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} requires attention.`,
        
        `Poor achievement, ${studentName}! ${pronoun} achieved ${averageScore}% average. Extra lessons mandatory.`,
        
        `${studentName} scored below expectations at ${averageScore}%. Immediate action required.`,
        
        `Unsatisfactory performance, ${studentName}! With ${averageScore}% average, ${pronoun} must work harder.`,
        
        `${studentName} performed below standard at ${averageScore}%. ${weakestSubject.name} needs urgent support.`,
        
        `Poor results, ${studentName}! ${pronoun} earned ${averageScore}% average. Academic probation advised.`,
        
        `${studentName} underperformed at ${averageScore}%. Parent-teacher meeting strongly recommended.`,
        
        `Unsatisfactory achievement, ${studentName}! With ${averageScore}% average, ${pronoun} needs help.`,
        
        `${studentName} performed poorly at ${averageScore}%. ${weakestSubject.name} is a major concern.`,
        
        `Below standard results, ${studentName}! ${pronoun} achieved ${averageScore}% average. Extra tutoring required.`,
        
        `${studentName} scored below expectations at ${averageScore}%. Immediate improvement needed.`,
        
        `Poor performance, ${studentName}! With ${averageScore}% average, ${pronoun} requires intervention.`,
        
        `${studentName} underperformed at ${averageScore}%. ${weakestSubject.name} needs urgent work.`,
      ],
      veryPoor: [
        `${studentName} has performed very poorly this term with an average of ${averageScore}%, far below the expected standard. ${weakestSubject.name} (${weakestSubject.score}%) is critically low. Mandatory extra lessons and parent-teacher conference are required.`,
        
        `Critical academic concern. ${studentName} scored ${averageScore}% on average, which is significantly below passing standard. ${weakestSubject.name} at ${weakestSubject.score}% indicates major learning gaps. Intensive intervention is required.`,
        
        `Very poor results, ${studentName}. With only ${averageScore}% average, ${pronoun} has not met the minimum requirements. ${weakestSubject.name} (${weakestSubject.score}%) is a serious concern. Urgent action needed.`,
        
        `${studentName} has severely underperformed this term, achieving only ${averageScore}% average. ${weakestSubject.name} (${weakestSubject.score}%) is critically low. Immediate remedial action is required.`,
        
        `${studentName} performed very poorly with ${averageScore}% average. ${weakestSubject.name} at ${weakestSubject.score}% is unacceptable.`,
        
        `Critical results, ${studentName}! With ${averageScore}% average, ${pronoun} needs urgent intervention.`,
        
        `${studentName} severely underperformed at ${averageScore}%. ${weakestSubject.name} requires immediate support.`,
        
        `Very poor performance, ${studentName}! ${pronoun} earned ${averageScore}% average. Mandatory extra lessons.`,
        
        `${studentName} scored far below expectations at ${averageScore}%. ${weakestSubject.name} is a major concern.`,
        
        `Critical achievement level, ${studentName}! With ${averageScore}% average, ${pronoun} requires intensive help.`,
        
        `${studentName} performed very poorly at ${averageScore}%. Parent-teacher meeting mandatory.`,
        
        `Unacceptable results, ${studentName}! ${pronoun} achieved ${averageScore}% average. ${weakestSubject.name} is critical.`,
        
        `${studentName} severely underperformed at ${averageScore}%. Urgent academic intervention needed.`,
        
        `Very poor performance, ${studentName}! With ${averageScore}% average, ${pronoun} requires immediate support.`,
        
        `${studentName} scored far below standard at ${averageScore}%. ${weakestSubject.name} needs urgent work.`,
        
        `Critical effort level, ${studentName}! ${pronoun} earned ${averageScore}% average. Remedial classes mandatory.`,
        
        `${studentName} performed very poorly at ${averageScore}%. ${weakestSubject.name} at ${weakestSubject.score}% is critical.`,
        
        `Unacceptable performance, ${studentName}! With ${averageScore}% average, ${pronoun} needs major improvement.`,
        
        `${studentName} severely underperformed at ${averageScore}%. ${weakestSubject.name} requires urgent attention.`,
        
        `Very poor achievement, ${studentName}! ${pronoun} achieved ${averageScore}% average. Extra lessons required.`,
        
        `${studentName} scored far below expectations at ${averageScore}%. Immediate action mandatory.`,
        
        `Critical results, ${studentName}! With ${averageScore}% average, ${pronoun} must improve dramatically.`,
        
        `${studentName} performed very poorly at ${averageScore}%. ${weakestSubject.name} needs urgent support.`,
        
        `Unacceptable performance, ${studentName}! ${pronoun} earned ${averageScore}% average. Intensive intervention needed.`,
        
        `${studentName} severely underperformed at ${averageScore}%. Parent-teacher conference required.`,
        
        `Very poor achievement, ${studentName}! With ${averageScore}% average, ${pronoun} needs immediate help.`,
        
        `${studentName} performed very poorly at ${averageScore}%. ${weakestSubject.name} is a serious concern.`,
        
        `Critical academic concern, ${studentName}! ${pronoun} achieved ${averageScore}% average. Urgent action needed.`,
        
        `${studentName} scored far below standard at ${averageScore}%. Immediate improvement required.`,
        
        `Very poor performance, ${studentName}! With ${averageScore}% average, ${pronoun} requires major intervention.`,
        
        `${studentName} severely underperformed at ${averageScore}%. ${weakestSubject.name} needs urgent work.`,
      ],
    }

    // PRINCIPAL COMMENT TEMPLATES (30+ per level)
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
        `${studentName} achieved a fair average of ${averageScore}%. ${pronoun} passed but can do better. ${pronoun} is PROMOTED conditionally. More dedication and focus are required next term.`,
        
        `Average performance. ${studentName} scored ${averageScore}% on average, meeting the minimum standard. ${pronoun} is PROMOTED. Aim higher next term for better outcomes.`,
        
        `Satisfactory but not impressive. ${studentName} is PROMOTED with ${averageScore}% average. ${pronoun} needs to work harder next term to achieve better results.`,
        
        `Fair performance, ${studentName}! PROMOTED conditionally. More effort needed.`,
        
        `Average results! ${studentName} is PROMOTED. Aim higher next term.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. Room for improvement.`,
        
        `Fair achievement! ${studentName} earns PROMOTION conditionally. Work harder.`,
        
        `Average effort! ${studentName} is PROMOTED. Keep striving.`,
        
        `Satisfactory results! ${studentName} earns PROMOTION. Focus more.`,
        
        `Fair work, ${studentName}! PROMOTED conditionally. Dedication needed.`,
        
        `Average performance! ${studentName} is PROMOTED. Aim for excellence.`,
        
        `Satisfactory progress! ${studentName} earns PROMOTION. More effort required.`,
        
        `Fair results! ${studentName} is PROMOTED conditionally. Keep pushing.`,
        
        `Average work! ${studentName} earns PROMOTION. Strive for better.`,
        
        `Satisfactory achievement! ${studentName} is PROMOTED. Room to grow.`,
        
        `Fair effort, ${studentName}! PROMOTED conditionally. Work harder.`,
        
        `Average results! ${studentName} is PROMOTED. Aim higher.`,
        
        `Satisfactory work! ${studentName} earns PROMOTION. Focus more.`,
        
        `Fair performance! ${studentName} is PROMOTED conditionally. Dedication needed.`,
        
        `Average progress! ${studentName} earns PROMOTION. Keep striving.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. More effort.`,
        
        `Fair work! ${studentName} earns PROMOTION conditionally. Work harder.`,
        
        `Average achievement! ${studentName} is PROMOTED. Aim for better.`,
        
        `Satisfactory effort! ${studentName} earns PROMOTION. Room for growth.`,
        
        `Fair results! ${studentName} is PROMOTED conditionally. Stay focused.`,
        
        `Average work! ${studentName} earns PROMOTION. Keep pushing.`,
        
        `Satisfactory performance! ${studentName} is PROMOTED. More dedication.`,
        
        `Fair progress! ${studentName} earns PROMOTION conditionally. Work harder.`,
        
        `Average results! ${studentName} is PROMOTED. Aim higher next term.`,
        
        `Satisfactory work! ${studentName} earns PROMOTION. Focus required.`,
        
        `Fair achievement! ${studentName} is PROMOTED conditionally. Keep striving.`,
      ],
      satisfactory: [
        `${studentName} achieved a satisfactory average of ${averageScore}%. ${pronoun} has met the basic requirements. ${pronoun} is PROMOTED. More effort will lead to better results.`,
        
        `Satisfactory performance, ${studentName}. ${pronoun} is PROMOTED to the next class. Keep working hard.`,
        
        `Adequate results. ${studentName} scored ${averageScore}% average. ${pronoun} is PROMOTED. Aim for improvement next term.`,
        
        `Satisfactory work, ${studentName}! PROMOTED. More dedication needed.`,
        
        `Adequate performance! ${studentName} is PROMOTED. Keep striving.`,
        
        `Satisfactory progress! ${studentName} earns PROMOTION. Room for growth.`,
        
        `Adequate results! ${studentName} is PROMOTED. Aim higher.`,
        
        `Satisfactory effort! ${studentName} earns PROMOTION. Work harder.`,
        
        `Adequate work, ${studentName}! PROMOTED. Focus more next term.`,
        
        `Satisfactory achievement! ${studentName} is PROMOTED. Keep pushing.`,
        
        `Adequate performance! ${studentName} earns PROMOTION. More effort.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. Strive for better.`,
        
        `Adequate work! ${studentName} earns PROMOTION. Dedication needed.`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Aim higher.`,
        
        `Adequate results! ${studentName} earns PROMOTION. Keep working.`,
        
        `Satisfactory effort! ${studentName} is PROMOTED. More focus.`,
        
        `Adequate performance! ${studentName} earns PROMOTION. Room to improve.`,
        
        `Satisfactory work! ${studentName} is PROMOTED. Strive for excellence.`,
        
        `Adequate results! ${studentName} earns PROMOTION. Keep pushing.`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Work harder.`,
        
        `Adequate effort! ${studentName} earns PROMOTION. Aim for growth.`,
        
        `Satisfactory performance! ${studentName} is PROMOTED. More dedication.`,
        
        `Adequate work! ${studentName} earns PROMOTION. Stay focused.`,
        
        `Satisfactory results! ${studentName} is PROMOTED. Keep striving.`,
        
        `Adequate achievement! ${studentName} earns PROMOTION. Room for improvement.`,
        
        `Satisfactory effort! ${studentName} is PROMOTED. Work harder.`,
        
        `Adequate performance! ${studentName} earns PROMOTION. Aim higher.`,
        
        `Satisfactory work! ${studentName} is PROMOTED. More effort needed.`,
        
        `Adequate results! ${studentName} earns PROMOTION. Keep building.`,
        
        `Satisfactory progress! ${studentName} is PROMOTED. Strive for better.`,
        
        `Adequate effort! ${studentName} earns PROMOTION. Stay focused.`,
      ],
      average: [
        `${studentName} achieved a credit pass with ${averageScore}% average. ${pronoun} is PROMOTED conditionally. More focused study habits and parental support are recommended.`,
        
        `Credit performance. ${studentName} scored ${averageScore}% on average. ${pronoun} is PROMOTED conditionally. Harder work is required next term.`,
        
        `Barely passed. ${studentName} is PROMOTED conditionally with ${averageScore}% average. ${pronoun} needs to put in more effort next term.`,
        
        `Credit pass, ${studentName}! PROMOTED conditionally. More effort needed.`,
        
        `Average performance! ${studentName} is PROMOTED conditionally. Work harder.`,
        
        `Credit results! ${studentName} earns conditional promotion. Focus more.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally. Dedication required.`,
        
        `Credit work, ${studentName}! PROMOTED conditionally. Aim higher.`,
        
        `Average achievement! ${studentName} is PROMOTED conditionally. Keep striving.`,
        
        `Credit effort! ${studentName} earns conditional promotion. More focus.`,
        
        `Barely made it! ${studentName} is PROMOTED conditionally. Work harder.`,
        
        `Credit results! ${studentName} earns conditional promotion. Study more.`,
        
        `Average performance! ${studentName} is PROMOTED conditionally. Stay focused.`,
        
        `Credit pass! ${studentName} earns conditional promotion. More dedication.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally. Aim for improvement.`,
        
        `Credit work! ${studentName} earns conditional promotion. Keep pushing.`,
        
        `Average effort! ${studentName} is PROMOTED conditionally. Work harder.`,
        
        `Credit results! ${studentName} earns conditional promotion. Focus required.`,
        
        `Barely achieved! ${studentName} is PROMOTED conditionally. More study needed.`,
        
        `Credit performance! ${studentName} earns conditional promotion. Strive for better.`,
        
        `Average work! ${studentName} is PROMOTED conditionally. Dedication needed.`,
        
        `Credit pass! ${studentName} earns conditional promotion. Aim higher.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally. Keep working.`,
        
        `Credit results! ${studentName} earns conditional promotion. More effort.`,
        
        `Average achievement! ${studentName} is PROMOTED conditionally. Stay focused.`,
        
        `Credit work! ${studentName} earns conditional promotion. Work harder.`,
        
        `Barely made it! ${studentName} is PROMOTED conditionally. Focus more.`,
        
        `Credit effort! ${studentName} earns conditional promotion. Aim for growth.`,
        
        `Average performance! ${studentName} is PROMOTED conditionally. Keep striving.`,
        
        `Credit results! ${studentName} earns conditional promotion. More dedication.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally. Study harder.`,
      ],
      belowAverage: [
        `${studentName} passed with ${averageScore}% average. ${pronoun} is PROMOTED conditionally. Significant improvement is required next term. Parents are advised to monitor progress closely.`,
        
        `Borderline performance. ${studentName} is PROMOTED conditionally with ${averageScore}% average. ${pronoun} must work much harder next term to avoid retention.`,
        
        `Passed by a narrow margin. ${studentName} is PROMOTED conditionally. Immediate improvement is required, especially in weaker subjects.`,
        
        `Below average, ${studentName}! PROMOTED conditionally. Significant effort needed.`,
        
        `Borderline pass! ${studentName} is PROMOTED conditionally. Work much harder.`,
        
        `Narrow margin! ${studentName} earns conditional promotion. Immediate focus required.`,
        
        `Below standard! ${studentName} is PROMOTED conditionally. Parents must monitor.`,
        
        `Close call! ${studentName} earns conditional promotion. Urgent improvement needed.`,
        
        `Borderline results! ${studentName} is PROMOTED conditionally. Work harder.`,
        
        `Narrow pass! ${studentName} earns conditional promotion. Focus on weak areas.`,
        
        `Below average performance! ${studentName} is PROMOTED conditionally. More effort.`,
        
        `Close call, ${studentName}! PROMOTED conditionally. Immediate action needed.`,
        
        `Borderline achievement! ${studentName} earns conditional promotion. Work much harder.`,
        
        `Narrow margin pass! ${studentName} is PROMOTED conditionally. Focus required.`,
        
        `Below standard results! ${studentName} earns conditional promotion. Parents advised.`,
        
        `Close pass! ${studentName} is PROMOTED conditionally. Urgent improvement.`,
        
        `Borderline work! ${studentName} earns conditional promotion. More dedication.`,
        
        `Narrow achievement! ${studentName} is PROMOTED conditionally. Study harder.`,
        
        `Below average effort! ${studentName} earns conditional promotion. Focus more.`,
        
        `Close results! ${studentName} is PROMOTED conditionally. Work required.`,
        
        `Borderline pass! ${studentName} earns conditional promotion. Immediate focus.`,
        
        `Narrow margin! ${studentName} is PROMOTED conditionally. Parents must monitor.`,
        
        `Below standard! ${studentName} earns conditional promotion. Urgent effort needed.`,
        
        `Close call! ${studentName} is PROMOTED conditionally. Work much harder.`,
        
        `Borderline results! ${studentName} earns conditional promotion. Focus on weak areas.`,
        
        `Narrow pass! ${studentName} is PROMOTED conditionally. More study needed.`,
        
        `Below average performance! ${studentName} earns conditional promotion. Dedication required.`,
        
        `Close achievement! ${studentName} is PROMOTED conditionally. Immediate action.`,
        
        `Borderline effort! ${studentName} earns conditional promotion. Work harder.`,
        
        `Narrow results! ${studentName} is PROMOTED conditionally. Focus required.`,
        
        `Below standard pass! ${studentName} earns conditional promotion. Parents advised.`,
      ],
      marginal: [
        `${studentName} barely passed with ${averageScore}% average. ${pronoun} is PROMOTED conditionally on probation. Serious improvement is required next term.`,
        
        `Marginal pass. ${studentName} is PROMOTED conditionally. ${pronoun} must improve significantly to avoid retention.`,
        
        `Close call. ${studentName} is PROMOTED conditionally. ${pronoun} needs to double efforts next term. Parental support is urgently needed.`,
        
        `Barely passed, ${studentName}! PROMOTED conditionally on probation. Major effort needed.`,
        
        `Marginal results! ${studentName} is PROMOTED conditionally. Significant improvement required.`,
        
        `Close call! ${studentName} earns conditional promotion. Double efforts needed.`,
        
        `Barely made it! ${studentName} is PROMOTED conditionally on probation. Work much harder.`,
        
        `Marginal pass! ${studentName} earns conditional promotion. Urgent improvement.`,
        
        `Close results! ${studentName} is PROMOTED conditionally. Parental support needed.`,
        
        `Barely achieved! ${studentName} earns conditional promotion on probation. Focus required.`,
        
        `Marginal effort! ${studentName} is PROMOTED conditionally. Significant work needed.`,
        
        `Close call pass! ${studentName} earns conditional promotion. Double dedication.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally on probation. Major improvement.`,
        
        `Marginal results! ${studentName} earns conditional promotion. Urgent focus required.`,
        
        `Close achievement! ${studentName} is PROMOTED conditionally. Parents must support.`,
        
        `Barely made it! ${studentName} earns conditional promotion on probation. Work harder.`,
        
        `Marginal pass! ${studentName} is PROMOTED conditionally. Significant effort.`,
        
        `Close call! ${studentName} earns conditional promotion. Double effort needed.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally on probation. Major focus.`,
        
        `Marginal results! ${studentName} earns conditional promotion. Urgent dedication.`,
        
        `Close achievement! ${studentName} is PROMOTED conditionally. Parental support.`,
        
        `Barely made it! ${studentName} earns conditional promotion on probation. Work much harder.`,
        
        `Marginal pass! ${studentName} is PROMOTED conditionally. Significant improvement.`,
        
        `Close call! ${studentName} earns conditional promotion. Double efforts.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally on probation. Major work needed.`,
        
        `Marginal results! ${studentName} earns conditional promotion. Urgent focus.`,
        
        `Close achievement! ${studentName} is PROMOTED conditionally. Parents must monitor.`,
        
        `Barely made it! ${studentName} earns conditional promotion on probation. Work harder.`,
        
        `Marginal pass! ${studentName} is PROMOTED conditionally. Significant dedication.`,
        
        `Close call! ${studentName} earns conditional promotion. Double effort required.`,
        
        `Barely passed! ${studentName} is PROMOTED conditionally on probation. Major focus needed.`,
      ],
      poor: [
        `${studentName} performed poorly with ${averageScore}% average. ${pronoun} is NOT PROMOTED and must repeat the class. Immediate academic intervention is required. A mandatory parent-teacher meeting is scheduled.`,
        
        `Unsatisfactory results. ${studentName} scored ${averageScore}% on average, failing to meet standards. ${pronoun} must repeat the class. Intensive support and extra lessons are mandatory.`,
        
        `${studentName} has failed to meet the required standard. ${pronoun} is RETAINED in the same class. Parents must meet with the school to discuss a recovery plan.`,
        
        `Poor performance, ${studentName}! NOT PROMOTED. Must repeat class. Parent meeting required.`,
        
        `Unsatisfactory results! ${studentName} is RETAINED. Immediate intervention needed.`,
        
        `Failed to meet standards! ${studentName} must repeat the class. Extra lessons mandatory.`,
        
        `Poor achievement! ${studentName} is NOT PROMOTED. Parent meeting scheduled.`,
        
        `Unsatisfactory work! ${studentName} is RETAINED. Intensive support required.`,
        
        `Failed requirements! ${studentName} must repeat class. Mandatory extra lessons.`,
        
        `Poor results! ${studentName} is NOT PROMOTED. Immediate action required.`,
        
        `Unsatisfactory performance! ${studentName} is RETAINED. Parent meeting mandatory.`,
        
        `Failed to pass! ${studentName} must repeat the class. Urgent intervention needed.`,
        
        `Poor effort! ${studentName} is NOT PROMOTED. Extra lessons required.`,
        
        `Unsatisfactory achievement! ${studentName} is RETAINED. Parent conference scheduled.`,
        
        `Failed standards! ${studentName} must repeat class. Immediate support needed.`,
        
        `Poor results! ${studentName} is NOT PROMOTED. Mandatory parent meeting.`,
        
        `Unsatisfactory work! ${studentName} is RETAINED. Intensive intervention required.`,
        
        `Failed requirements! ${studentName} must repeat the class. Extra lessons mandatory.`,
        
        `Poor performance! ${studentName} is NOT PROMOTED. Parent meeting required.`,
        
        `Unsatisfactory results! ${studentName} is RETAINED. Urgent action needed.`,
        
        `Failed to meet standards! ${studentName} must repeat class. Immediate support.`,
        
        `Poor achievement! ${studentName} is NOT PROMOTED. Extra lessons required.`,
        
        `Unsatisfactory effort! ${studentName} is RETAINED. Parent conference mandatory.`,
        
        `Failed pass! ${studentName} must repeat the class. Urgent intervention.`,
        
        `Poor work! ${studentName} is NOT PROMOTED. Intensive support needed.`,
        
        `Unsatisfactory results! ${studentName} is RETAINED. Parent meeting required.`,
        
        `Failed requirements! ${studentName} must repeat class. Extra lessons mandatory.`,
        
        `Poor performance! ${studentName} is NOT PROMOTED. Immediate action needed.`,
        
        `Unsatisfactory achievement! ${studentName} is RETAINED. Mandatory intervention.`,
        
        `Failed standards! ${studentName} must repeat class. Parent conference scheduled.`,
        
        `Poor results! ${studentName} is NOT PROMOTED. Extra lessons required.`,
      ],
      veryPoor: [
        `FAILED. ${studentName} scored ${averageScore}% on average, which is below the passing standard. ${pronoun} must repeat the class. Mandatory remedial classes and parent-teacher conferences are required.`,
        
        `Academic failure. ${studentName} has not met the minimum requirements with ${averageScore}% average. ${pronoun} will repeat the class. Intensive intervention is necessary.`,
        
        `${studentName} has failed this term. ${pronoun} will repeat the class. A comprehensive academic recovery plan is required. Parents must attend a meeting with the school administration.`,
        
        `FAILED, ${studentName}! Must repeat class. Parent conference mandatory.`,
        
        `Academic failure! ${studentName} will repeat the class. Intensive intervention needed.`,
        
        `Failed requirements! ${studentName} must repeat. Mandatory remedial classes.`,
        
        `FAILED performance! ${studentName} is retained. Parent meeting required.`,
        
        `Academic failure! ${studentName} must repeat class. Urgent intervention needed.`,
        
        `Failed standards! ${studentName} will repeat. Mandatory extra lessons.`,
        
        `FAILED results! ${studentName} is retained. Parent conference mandatory.`,
        
        `Academic failure! ${studentName} must repeat class. Intensive support required.`,
        
        `Failed to pass! ${studentName} will repeat. Immediate action needed.`,
        
        `FAILED effort! ${studentName} is retained. Mandatory remedial classes.`,
        
        `Academic failure! ${studentName} must repeat class. Parent meeting required.`,
        
        `Failed requirements! ${studentName} will repeat. Urgent intervention.`,
        
        `FAILED performance! ${studentName} is retained. Extra lessons mandatory.`,
        
        `Academic failure! ${studentName} must repeat class. Intensive support.`,
        
        `Failed standards! ${studentName} will repeat. Parent conference required.`,
        
        `FAILED results! ${studentName} is retained. Mandatory intervention.`,
        
        `Academic failure! ${studentName} must repeat class. Urgent action.`,
        
        `Failed to meet standards! ${studentName} will repeat. Extra lessons.`,
        
        `FAILED work! ${studentName} is retained. Parent meeting mandatory.`,
        
        `Academic failure! ${studentName} must repeat class. Intensive support.`,
        
        `Failed requirements! ${studentName} will repeat. Urgent intervention.`,
        
        `FAILED performance! ${studentName} is retained. Mandatory classes.`,
        
        `Academic failure! ${studentName} must repeat class. Parent conference.`,
        
        `Failed standards! ${studentName} will repeat. Extra lessons required.`,
        
        `FAILED results! ${studentName} is retained. Immediate action needed.`,
        
        `Academic failure! ${studentName} must repeat class. Intensive help.`,
        
        `Failed to pass! ${studentName} will repeat. Parent meeting required.`,
        
        `FAILED effort! ${studentName} is retained. Mandatory remedial classes.`,
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