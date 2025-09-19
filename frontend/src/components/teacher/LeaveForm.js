import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const LeaveForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    subject: user?.subject || '',
    leaveType: 'casual',
    duration: 'full-day'
  });
  const [loading, setLoading] = useState(false);
  const [leaveLimits, setLeaveLimits] = useState({
    casualLeaveLimit: 12,
    medicalLeaveLimit: 6,
    earnedLeaveLimit: 30
  });
  const [leaveBalances, setLeaveBalances] = useState({
    casualLeaveUsed: 0,
    medicalLeaveUsed: 0,
    earnedLeaveUsed: 0
  });

  useEffect(() => {
    fetchLeaveLimits();
    fetchLeaveBalances();
  }, []);

  const fetchLeaveLimits = async () => {
    try {
      const response = await axios.get('/api/teachers/leave-limits', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        setLeaveLimits(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave limits:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await axios.get('/api/teachers/leave-balances', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        setLeaveBalances(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/teachers/apply-leave', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Leave application submitted successfully!');
      setFormData({ 
        date: '', 
        reason: '', 
        subject: user?.subject || '', 
        leaveType: 'casual',
        duration: 'full-day'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting leave application');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingLeaves = (leaveType) => {
    switch (leaveType) {
      case 'casual':
        return leaveLimits.casualLeaveLimit - leaveBalances.casualLeaveUsed;
      case 'medical':
        return leaveLimits.medicalLeaveLimit - leaveBalances.medicalLeaveUsed;
      case 'earned':
        return leaveLimits.earnedLeaveLimit - leaveBalances.earnedLeaveUsed;
      default:
        return 0;
    }
  };

  const getUsedLeaves = (leaveType) => {
    switch (leaveType) {
      case 'casual':
        return leaveBalances.casualLeaveUsed;
      case 'medical':
        return leaveBalances.medicalLeaveUsed;
      case 'earned':
        return leaveBalances.earnedLeaveUsed;
      default:
        return 0;
    }
  };

  const getLimit = (leaveType) => {
    switch (leaveType) {
      case 'casual':
        return leaveLimits.casualLeaveLimit;
      case 'medical':
        return leaveLimits.medicalLeaveLimit;
      case 'earned':
        return leaveLimits.earnedLeaveLimit;
      default:
        return 0;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Apply for Leave</h2>
      
      {/* Leave Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Casual Leave</h3>
              <p className="text-lg font-semibold text-blue-900">
                {getRemainingLeaves('casual')} / {getLimit('casual')} remaining
              </p>
            </div>
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">Medical Leave</h3>
              <p className="text-lg font-semibold text-red-900">
                {getRemainingLeaves('medical')} / {getLimit('medical')} remaining
              </p>
            </div>
            <div className="text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">Earned Leave</h3>
              <p className="text-lg font-semibold text-green-900">
                {getRemainingLeaves('earned')} / {getLimit('earned')} remaining
              </p>
            </div>
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="casual">Casual Leave</option>
              <option value="medical">Medical Leave</option>
              <option value="earned">Earned Leave</option>
            </select>
            {formData.leaveType && (
              <p className="text-sm text-gray-600 mt-1">
                Remaining: {getRemainingLeaves(formData.leaveType)} / {getLimit(formData.leaveType)} days
                {getRemainingLeaves(formData.leaveType) === 0 && (
                  <span className="text-red-600 ml-2">(No leaves remaining)</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Leave Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="half-day">Half Day</option>
              <option value="full-day">Full Day</option>
              <option value="multiple-days">Multiple Days</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Please provide a detailed reason for your leave request..."
            />
          </div>

          {getRemainingLeaves(formData.leaveType) === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    No Leaves Remaining
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>You have used all your {formData.leaveType} leaves for this year. Please contact the administrator if you need to apply for additional leaves.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || getRemainingLeaves(formData.leaveType) === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;
