
import React, { useMemo } from 'react';
import { SessionRecord, CEFRBand, CEFRLevel } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Calendar, Trophy, AlertTriangle, PlayCircle, Trash2, Clock, Target, Award } from 'lucide-react';
import { computeCEFRLevel, computeDimensionScores, sessionsToNextLevel, CEFR_BANDS } from '../services/assessmentService';


interface ProgressViewProps {
  history: SessionRecord[];
  isDarkMode: boolean;
  onReviewSession?: (session: SessionRecord) => void;
  onDeleteSession?: (id: string) => void;
}

const ProgressView: React.FC<ProgressViewProps> = ({ history, isDarkMode, onReviewSession, onDeleteSession }) => {
  
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const total = history.length;
    const avgScore = Math.round(history.reduce((acc, curr) => acc + curr.overall_score, 0) / total);
    const bestScore = Math.max(...history.map(h => h.overall_score));
    
    // Calculate common phoneme errors
    const phonemeCounts: Record<string, number> = {};
    history.forEach(session => {
      session.phoneme_errors.forEach(err => {
        const p = err.phoneme;
        phonemeCounts[p] = (phonemeCounts[p] || 0) + 1;
      });
    });

    const topErrors = Object.entries(phonemeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { total, avgScore, bestScore, topErrors };
  }, [history]);

  const chartData = useMemo(() => {
    // Create a reversed copy for the chart so it goes left-to-right chronologically
    const reversedHistory = [...history].reverse();
    return reversedHistory.map(h => ({
      date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: new Date(h.timestamp).toLocaleString(),
      overall: h.overall_score,
      pronunciation: h.pronunciation_score,
      intelligibility: h.intelligibility_score
    }));
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Progress Yet</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
          Complete your first practice session to start tracking your improvement over time.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* CEFR Level Badge */}
      {history.length > 0 && (() => {
        const scores = history.map(h => h.full_analysis?.overall_score ?? h.overall_score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const cefr = computeCEFRLevel(avgScore);
        const dimensions = computeDimensionScores(stats && stats.total > 0 ? history[history.length - 1].full_analysis || {} : { overall_score: avgScore } as any);
        const nextInfo = sessionsToNextLevel(scores, cefr);
        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg ${
                  cefr.band === 'A1' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                  cefr.band === 'A2' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  cefr.band === 'B1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  cefr.band === 'B2' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                  cefr.band === 'C1' ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' :
                  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {cefr.band}
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estimated CEFR Level</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{cefr.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{cefr.description}</p>
                  {/* SL-08: the IELTS equivalence line was removed. The band above is an
                      uncalibrated estimate from an LLM score, not an exam-equivalent result. */}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Estimate only — not an exam score</p>
                </div>
              </div>
              {nextInfo.nextBand && nextInfo.sessions !== null && nextInfo.sessions > 0 && (
                <div className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">{nextInfo.sessions} session{nextInfo.sessions > 1 ? 's' : ''} to reach {nextInfo.nextBand}</span>
                </div>
              )}
              {nextInfo.sessions === 0 && nextInfo.nextBand && (
                <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Reached {nextInfo.nextBand}!</span>
                </div>
              )}
            </div>

            {/* Dimension Radar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4">Skill Breakdown</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* SL-08: a null dimension is one the pipeline cannot measure yet.
                    It renders as an em dash, never as a zero. */}
                {Object.entries(dimensions).map(([dim, score]) => (
                  <div key={dim} className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                      score === null ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' :
                      score >= 80 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      score >= 60 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`} title={score === null ? 'Not yet measured' : undefined}>
                      {score === null ? '—' : score}
                    </div>
                    <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{dim}</p>
                  </div>
                ))}
              </div>
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {/* SL-08: only plot dimensions that were actually measured. */}
                  <RadarChart data={Object.entries(dimensions).filter(([, v]) => v !== null).map(([name, value]) => ({ name, value }))}>
                    <PolarGrid stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} fontSize={0} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Sessions</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Average Score</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.avgScore}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Best Score</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.bestScore}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Score History Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Score History</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#f1f5f9"} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  minTickGap={30}
                />
                <YAxis 
                  stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="overall" 
                  name="Overall"
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pronunciation" 
                  name="Pronunciation"
                  stroke="#0ea5e9" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="intelligibility" 
                  name="Intelligibility"
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Errors Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Frequent Issues
          </h3>
          {stats && stats.topErrors.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topErrors} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#f1f5f9"} horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                    fontSize={14} 
                    fontWeight={600}
                    width={40}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                      color: isDarkMode ? '#fff' : '#000'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#f59e0b" 
                    radius={[0, 4, 4, 0]} 
                    barSize={24} 
                    name="Occurrences"
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                Based on detected phoneme errors in past sessions.
              </p>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 italic text-sm">
              No recurring errors detected yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Recent Sessions
          </h3>
          <div className="space-y-3">
             {history.slice(0, 10).map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors gap-4">
                   <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                           session.overall_score >= 80 
                             ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                             : session.overall_score >= 60
                               ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                               : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                       }`}>
                          {session.overall_score}
                       </div>
                       <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                              {session.target_phoneme ? `Target: /${session.target_phoneme}/` : 'Daily Practice'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(session.timestamp).toLocaleString()}
                          </p>
                       </div>
                   </div>

                   <div className="flex items-center gap-2 self-end sm:self-center">
                       {onReviewSession && session.full_analysis && (
                           <button 
                              onClick={() => onReviewSession(session)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                           >
                               <PlayCircle className="w-4 h-4" /> Review
                           </button>
                       )}
                       {onDeleteSession && (
                           <button 
                              onClick={() => onDeleteSession(session.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete Session"
                           >
                               <Trash2 className="w-4 h-4" />
                           </button>
                       )}
                   </div>
                </div>
             ))}
          </div>
      </div>

    </div>
  );
};

export default ProgressView;
