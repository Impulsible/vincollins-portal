// ============================================
// SCHEDULE TAB - Complete with Responsive Layout
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, MapPin, Users, BookOpen, ChevronLeft, ChevronRight, Plus, Video, Building, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Schedule {
  id: string
  title: string
  description: string
  type: string
  start_time: string
  end_time: string
  location: string
  class: string
  subject: string
  attendees: number
  status: string
  priority: string
}

interface ScheduleTabProps {
  staffProfile: any
  termInfo: any
}

export function ScheduleTab({ staffProfile, termInfo }: ScheduleTabProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('timetable')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [classes, setClasses] = useState<string[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00']

  useEffect(() => { setMounted(true); loadClasses(); loadSchedules() }, [])
  useEffect(() => { if (selectedClass) loadSchedules() }, [selectedClass])

  const loadClasses = async () => {
    try { const { data } = await supabase.from('class_students').select('class').order('class'); setClasses([...new Set(data?.map(d => d.class) || [])]); if (data?.length && !selectedClass) setSelectedClass([...new Set(data.map(d => d.class))][0]) } catch (e) { console.error(e) }
  }

  const loadSchedules = async () => {
    setLoading(true)
    try { let q = supabase.from('schedules').select('*').order('start_time', { ascending: true }); if (selectedClass) q = q.eq('class', selectedClass); const { data } = await q; setSchedules(data || []) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const getScheduleForDayAndTime = (day: string, timeSlot: string) => {
    return schedules.find(s => new Date(s.start_time).toLocaleDateString('en-US', { weekday: 'long' }) === day && new Date(s.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).startsWith(timeSlot.split(' - ')[0]))
  }

  const getPriorityColor = (p: string) => { switch(p) { case 'high': return 'border-red-500 bg-red-50'; case 'medium': return 'border-yellow-500 bg-yellow-50'; default: return 'border-green-500 bg-green-50' } }
  const getTypeIcon = (t: string) => { switch(t) { case 'class': return <BookOpen className="h-4 w-4" />; case 'meeting': return <Users className="h-4 w-4" />; case 'exam': return <Clock className="h-4 w-4" />; case 'online': return <Video className="h-4 w-4" />; default: return <Calendar className="h-4 w-4" /> } }

  if (!mounted) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Schedule & Timetable</h1><p className="text-xs sm:text-sm text-gray-500 mt-1">{termInfo?.termName} {termInfo?.sessionYear}</p></div>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />Add Event</Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-3 sm:p-4"><div className="w-48"><Label className="text-xs mb-1 block">Select Class</Label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0"><TabsTrigger value="timetable" className="data-[state=active]:border-blue-600 rounded-none px-4 py-2"><Calendar className="h-4 w-4 mr-2" />Timetable</TabsTrigger><TabsTrigger value="calendar" className="data-[state=active]:border-blue-600 rounded-none px-4 py-2"><Clock className="h-4 w-4 mr-2" />Calendar</TabsTrigger><TabsTrigger value="events" className="data-[state=active]:border-blue-600 rounded-none px-4 py-2"><Users className="h-4 w-4 mr-2" />Events</TabsTrigger></TabsList>

        <TabsContent value="timetable">
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b"><div className="flex justify-between items-center"><CardTitle>Weekly Timetable - {selectedClass}</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm"><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm font-medium">Week {termInfo?.currentWeek || 1}</span><Button variant="outline" size="sm"><ChevronRight className="h-4 w-4" /></Button></div></div></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr className="bg-gray-50 border-b"><th className="p-3 text-left text-xs font-semibold w-20">Time</th>{daysOfWeek.map(d => <th key={d} className="p-3 text-left text-xs font-semibold">{d}</th>)}</tr></thead>
                <tbody>{timeSlots.map(ts => <tr key={ts} className="border-b"><td className="p-3 text-xs text-gray-500">{ts}</td>{daysOfWeek.map(d => { const s = getScheduleForDayAndTime(d, ts); return <td key={d} className="p-2">{s && <div className={cn("p-2 rounded-lg border-l-4", getPriorityColor(s.priority))}><div className="flex items-center gap-1 mb-1">{getTypeIcon(s.type)}<span className="text-xs font-semibold truncate">{s.title}</span></div><p className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</p>{s.subject && <Badge variant="outline" className="mt-1 text-[9px]">{s.subject}</Badge>}</div>}</td> })}</tr>)}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar"><Card className="border-0 shadow-sm bg-white"><CardContent className="p-8 text-center"><Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-medium">Calendar View</p><p className="text-sm text-gray-500">Coming soon</p></CardContent></Card></TabsContent>

        <TabsContent value="events">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-0">
              {loading ? <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div> : schedules.length === 0 ? <div className="text-center py-12"><Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p>No scheduled events</p></div> : (
                <div className="divide-y">{schedules.map(s => <div key={s.id} className="p-4 hover:bg-gray-50"><div className="flex items-start gap-3"><div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.type==='class'&&"bg-blue-100", s.type==='meeting'&&"bg-purple-100", s.type==='exam'&&"bg-red-100")}>{getTypeIcon(s.type)}</div><div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold">{s.title}</p><Badge variant="outline">{s.type}</Badge></div><p className="text-sm text-gray-600">{s.description}</p><div className="flex items-center gap-4 mt-2"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(s.start_time).toLocaleTimeString()} - {new Date(s.end_time).toLocaleTimeString()}</span><span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span></div></div></div></div>)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}