import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaUserGraduate, FaClock, FaCheckCircle, FaTimesCircle, FaExchangeAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const ManageSubstitutions = () => {
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [substitutions, setSubstitutions] = useState([]);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [className, setClassName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubstitution, setEditingSubstitution] = useState(null);
  const [teacherDayPeriods, setTeacherDayPeriods] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [isClassNameAutoFilled, setIsClassNameAutoFilled] = useState(false);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    fetchApprovedLeaves();
    fetchSubstitutions();
  }, []);

  // Helper to convert date to weekday string used by backend (lowercase)
  const getWeekdayString = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const dayIdx = d.getDay(); // 0=Sun
      const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return map[dayIdx] || 'monday';
    } catch (e) {
      return 'monday';
    }
  };

  // When a leave is selected, auto-set day from leave date and fetch teacher timetable for that day
  useEffect(() => {
    const initFromLeave = async () => {
      if (!selectedLeave) return;

      const leaveDay = getWeekdayString(selectedLeave.date);
      // If Sunday, default to Monday (no classes expected on Sunday)
      const normalizedDay = leaveDay === 'sunday' ? 'monday' : leaveDay;
      setSelectedDay(normalizedDay);

      try {
        // First try to get teacher's assigned periods from their profile
        const teacherRes = await axios.get(`/api/teachers/${selectedLeave.teacherId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (teacherRes.data && teacherRes.data.success) {
          const teacher = teacherRes.data.data;
          const assignedPeriods = teacher.assignedPeriods || [];
          
          // Find periods for the leave day
          const dayPeriods = assignedPeriods.filter(p => p.day === normalizedDay);
          
          if (dayPeriods.length > 0) {
            setTeacherDayPeriods(dayPeriods);
            
            // Prefer a period matching the leave subject, otherwise first period
            const match = dayPeriods.find(p => (p.subject || '').toLowerCase() === (selectedLeave.subject || '').toLowerCase());
            const chosen = match || dayPeriods[0];
            setSelectedPeriod(chosen.periodNumber);
            
            // Auto-populate class name from the assigned period
            let classNameToSet = '';
            
            if (chosen.classId && chosen.classId.name) {
              classNameToSet = chosen.classId.name;
            } else if (chosen.className) {
              classNameToSet = chosen.className;
            } else {
              // Fallback: find class by scanning classes timetable
              try {
                const classesRes = await axios.get('/api/classes', {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const classes = (classesRes.data && classesRes.data.data) || [];
                
                // Try to find class by teacher and period
                for (const c of classes) {
                  if (!Array.isArray(c.timetable)) continue;
                  const dayEntry = c.timetable.find(d => d.day === normalizedDay);
                  if (!dayEntry || !Array.isArray(dayEntry.periods)) continue;
                  const hit = dayEntry.periods.find(per => 
                    per.periodNumber === chosen.periodNumber && 
                    (per.teacherId === selectedLeave.teacherId || (per.teacherId && per.teacherId._id === selectedLeave.teacherId))
                  );
                  if (hit) {
                    classNameToSet = c.name;
                    break;
                  }
                }
                
                // If still not found, try to find by subject match
                if (!classNameToSet) {
                  for (const c of classes) {
                    if (!Array.isArray(c.timetable)) continue;
                    const dayEntry = c.timetable.find(d => d.day === normalizedDay);
                    if (!dayEntry || !Array.isArray(dayEntry.periods)) continue;
                    const hit = dayEntry.periods.find(per => 
                      per.periodNumber === chosen.periodNumber && 
                      per.subject && selectedLeave.subject &&
                      per.subject.toLowerCase().includes(selectedLeave.subject.toLowerCase())
                    );
                    if (hit) {
                      classNameToSet = c.name;
                      break;
                    }
                  }
                }
              } catch (e) {
                console.error('Error resolving class name from classes list:', e);
              }
            }
            
            setClassName(classNameToSet);
            setIsClassNameAutoFilled(!!classNameToSet);
            
            // Show success message if class was auto-populated
            if (classNameToSet) {
              console.log(`Auto-populated class name: ${classNameToSet} for teacher ${selectedLeave.teacherName} on ${normalizedDay} period ${chosen.periodNumber}`);
            }
          } else {
            // No periods on that day; clear fields so user can choose
            setClassName('');
            setTeacherDayPeriods([]);
          }
        }
      } catch (err) {
        console.error('Error loading teacher data for leave day:', err);
        setClassName('');
        setTeacherDayPeriods([]);
      }
    };

    initFromLeave();
  }, [selectedLeave]);

  // When period changes, update class name from cached timetable periods if available
  useEffect(() => {
    if (!teacherDayPeriods || teacherDayPeriods.length === 0) return;
    const period = teacherDayPeriods.find(p => p.periodNumber === selectedPeriod);
    if (period) {
      if (period.classId && period.classId.name) {
        setClassName(period.classId.name);
      } else if (period.className) {
        setClassName(period.className);
      }
    }
  }, [selectedPeriod, teacherDayPeriods]);

  const fetchApprovedLeaves = async () => {
    try {
      const response = await axios.get('/api/leaves/approved', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        setLeaves(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching approved leaves:', error);
    }
  };

  const fetchSubstitutions = async () => {
    try {
      const response = await axios.get('/api/substitutions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        setSubstitutions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching substitutions:', error);
    }
  };

  const getRecommendations = async (leave) => {
    if (!leave || !className.trim()) {
      alert('Please select a leave request and enter a class name');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/timetable/substitution-recommendations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          subject: leave.subject || 'General',
          day: selectedDay,
          periodNumber: selectedPeriod,
          date: leave.date,
          excludeTeacherId: leave.teacherId
        }
      });

      if (response.data && response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Error getting recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const assignSubstitution = async (substituteTeacherIds) => {
    if (!selectedLeave || !className.trim()) {
      alert('Please select a leave request and enter a class name');
      return;
    }

    if (!substituteTeacherIds || substituteTeacherIds.length === 0) {
      alert('Please select at least one teacher for substitution');
      return;
    }

    try {
      // Resolve classId from className to satisfy backend validation
      const classesRes = await axios.get('/api/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const classes = (classesRes.data && classesRes.data.data) || [];
      const inputName = className.trim();
      const classDoc = classes.find(c => (c.name || '').toLowerCase() === inputName.toLowerCase());

      if (!classDoc) {
        alert('Class not found. Please enter a valid class name.');
        return;
      }

      console.log('Assigning substitution to multiple teachers:', {
        leaveId: selectedLeave._id,
        originalTeacherId: selectedLeave.teacherId,
        substituteTeacherIds,
        day: selectedDay,
        periodNumber: selectedPeriod,
        subject: selectedLeave.subject || 'General',
        className: classDoc.name,
        classId: classDoc._id,
        date: selectedLeave.date,
        notes: `Substitution request for ${selectedLeave.teacherName} on ${new Date(selectedLeave.date).toLocaleDateString()}`
      });

      const response = await axios.post('/api/timetable/assign-substitution-multi', {
        leaveId: selectedLeave._id,
        originalTeacherId: selectedLeave.teacherId,
        substituteTeacherIds,
        day: selectedDay,
        periodNumber: selectedPeriod,
        subject: selectedLeave.subject || 'General',
        className: classDoc.name,
        classId: classDoc._id,
        date: selectedLeave.date,
        notes: `Substitution request for ${selectedLeave.teacherName} on ${new Date(selectedLeave.date).toLocaleDateString()}`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      console.log('Multi-teacher substitution assignment response:', response.data);

      if (response.data && response.data.success) {
        // Refresh data
        fetchApprovedLeaves();
        fetchSubstitutions();
        setSelectedLeave(null);
        setRecommendations([]);
        setClassName('');
        setSelectedTeachers([]);
        setIsClassNameAutoFilled(false);
        setShowAddForm(false);
        
        // Show success message
        alert(`Substitution requests sent to ${response.data.data.length} teachers successfully!`);
      }
    } catch (error) {
      console.error('Error assigning substitution:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Error assigning substitution. Please try again.');
      }
    }
  };

  const updateSubstitutionStatus = async (substitutionId, status, rejectionReason = '') => {
    try {
      const response = await axios.patch(`/api/substitutions/${substitutionId}`, {
        status,
        rejectionReason
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data && response.data.success) {
        fetchSubstitutions();
        alert(`Substitution ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating substitution:', error);
      alert('Error updating substitution. Please try again.');
    }
  };

  const deleteSubstitution = async (substitutionId) => {
    if (!window.confirm('Are you sure you want to delete this substitution?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/substitutions/${substitutionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data && response.data.success) {
        fetchSubstitutions();
        alert('Substitution deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting substitution:', error);
      alert('Error deleting substitution. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'requested': { color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
      'accepted': { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
      'expired': { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle },
      'completed': { color: 'bg-blue-100 text-blue-800', icon: FaExchangeAlt }
    };

    const config = statusConfig[status] || statusConfig['assigned'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const resetForm = () => {
    setSelectedLeave(null);
    setRecommendations([]);
    setClassName('');
    setSelectedDay('monday');
    setSelectedPeriod(1);
    setShowAddForm(false);
    setEditingSubstitution(null);
    setSelectedTeachers([]);
    setIsClassNameAutoFilled(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Manage Substitutions</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            {showAddForm ? 'Cancel' : 'New Substitution'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Substitution</h3>
          
          {/* Selected Leave Information */}
          {selectedLeave && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Selected Leave Request:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Teacher:</span> {selectedLeave.teacherName}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Subject:</span> {selectedLeave.subject}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Date:</span> {new Date(selectedLeave.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Leave Type:</span> {selectedLeave.leaveType}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Duration:</span> {selectedLeave.duration}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Reason:</span> {selectedLeave.reason}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {days.map(day => (
                  <option key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {(teacherDayPeriods.length > 0 ? teacherDayPeriods.map(p => p.periodNumber) : periods)
                  .map(period => (
                  <option key={period} value={period}>
                    Period {period}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name *
                {isClassNameAutoFilled && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    (Auto-filled from teacher's timetable)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setIsClassNameAutoFilled(false); // Reset auto-fill flag when manually edited
                }}
                placeholder="e.g., Class 10A"
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  isClassNameAutoFilled 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300'
                }`}
                required
              />
              {isClassNameAutoFilled && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Class automatically detected from {selectedLeave.teacherName}'s schedule
                </p>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={() => getRecommendations(selectedLeave)}
                disabled={!selectedLeave || !className.trim() || loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FaSearch className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Find Teachers'}
              </button>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-700 mb-3">Available Teachers (Select 3-4 teachers)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.map((rec, index) => (
                  <div key={rec.teacherId} className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTeachers.includes(rec.teacherId) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(rec.teacherId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedTeachers.length < 4) {
                                setSelectedTeachers([...selectedTeachers, rec.teacherId]);
                              } else {
                                alert('Maximum 4 teachers can be selected');
                              }
                            } else {
                              setSelectedTeachers(selectedTeachers.filter(id => id !== rec.teacherId));
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{rec.teacherName}</p>
                          <p className="text-sm text-gray-600">{rec.subject} • {rec.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Score: {Math.round(rec.scores.total * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          Attendance: {rec.attendancePercentage}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span className="mr-2">CL: {rec.leaveBalances.casualLeave}</span>
                        <span className="mr-2">ML: {rec.leaveBalances.medicalLeave}</span>
                        <span>EL: {rec.leaveBalances.earnedLeave}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedTeachers.includes(rec.teacherId) ? 'Selected' : 'Click to select'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTeachers.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">
                        {selectedTeachers.length} teacher(s) selected
                      </p>
                      <p className="text-sm text-blue-700">
                        Substitution requests will be sent to all selected teachers. 
                        The first teacher to accept will get the assignment, others will be automatically cancelled.
                      </p>
                    </div>
                    <button
                      onClick={() => assignSubstitution(selectedTeachers)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <FaExchangeAlt className="mr-2" />
                      Send to {selectedTeachers.length} Teachers
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leaves */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaClock className="mr-2 text-yellow-600" />
            Approved Leaves (Need Substitutions)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leaves.length === 0 ? (
              <div className="text-center py-8">
                <FaClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No approved leaves need substitutions</p>
                <p className="text-sm text-gray-400">All approved leaves have been processed</p>
              </div>
            ) : (
              leaves.map(leave => (
                <div
                  key={leave._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLeave?._id === leave._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedLeave(leave);
                    setShowAddForm(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{leave.teacherName}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {leave.duration}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Subject:</span> {leave.subject}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {leave.leaveType}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(leave.date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Reason:</span> {leave.reason.substring(0, 30)}...
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeave(leave);
                          setShowAddForm(true);
                        }}
                      >
                        Assign Substitution →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Substitution Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{substitutions.length}</p>
              <p className="text-sm text-blue-600">Total Substitutions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {substitutions.filter(s => s.status === 'accepted').length}
              </p>
              <p className="text-sm text-green-600">Accepted</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {substitutions.filter(s => s.status === 'assigned').length}
              </p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {substitutions.filter(s => s.status === 'rejected').length}
              </p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Substitutions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaExchangeAlt className="mr-2 text-blue-600" />
          Active Substitutions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Original Teacher</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Substitute Teacher</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Class Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Day/Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {substitutions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <FaExchangeAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No active substitutions</p>
                  </td>
                </tr>
              ) : (
                substitutions.map(sub => (
                  <tr key={sub._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{sub.originalTeacherId?.name}</p>
                        <p className="text-sm text-gray-500">{sub.originalTeacherId?.subject}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{sub.substituteTeacherId?.name}</p>
                        <p className="text-sm text-gray-500">{sub.substituteTeacherId?.subject}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{sub.subject}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 font-medium">{sub.className}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 capitalize">{sub.day}</p>
                      <p className="text-sm text-gray-500">Period {sub.periodNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">
                        {new Date(sub.assignedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {sub.status === 'requested' && (
                          <span className="text-sm text-gray-500">
                            Waiting for teacher response
                          </span>
                        )}
                        {sub.status === 'accepted' && (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Accepted
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <div className="text-sm">
                            <span className="text-red-600 font-medium">✗ Rejected</span>
                            {sub.rejectionReason && (
                              <p className="text-xs text-gray-500 mt-1" title={sub.rejectionReason}>
                                {sub.rejectionReason.substring(0, 20)}...
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => deleteSubstitution(sub._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageSubstitutions;
