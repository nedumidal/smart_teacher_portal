import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSave, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

const LeaveLimitsManagement = () => {
  const [limits, setLimits] = useState({
    casualLeaveLimit: 12,
    medicalLeaveLimit: 6,
    earnedLeaveLimit: 30
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await axios.get('/api/admin/leave-limits', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        setLimits(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave limits:', error);
      toast.error('Error fetching leave limits');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put('/api/admin/leave-limits', limits, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        toast.success('Leave limits updated successfully!');
        setEditing(false);
      } else {
        toast.error('Failed to update leave limits');
      }
    } catch (error) {
      console.error('Error updating leave limits:', error);
      toast.error('Error updating leave limits');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchLimits(); // Reset to original values
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leave Limits Management</h2>
        <div className="flex space-x-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <FaSave className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Limits
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Leave Limits</h3>
          <p className="text-sm text-gray-600 mb-6">
            Set the maximum number of leaves allowed for each type. These limits will be applied to all teachers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Casual Leave Limit */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Casual Leave</h4>
                <p className="text-sm text-gray-600">Personal/General purpose leaves</p>
              </div>
            </div>
            
            {editing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Days per Year
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={limits.casualLeaveLimit}
                  onChange={(e) => setLimits({...limits, casualLeaveLimit: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {limits.casualLeaveLimit}
                </div>
                <div className="text-sm text-gray-600">days per year</div>
              </div>
            )}
          </div>

          {/* Medical Leave Limit */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Medical Leave</h4>
                <p className="text-sm text-gray-600">Health-related leaves</p>
              </div>
            </div>
            
            {editing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Days per Year
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={limits.medicalLeaveLimit}
                  onChange={(e) => setLimits({...limits, medicalLeaveLimit: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {limits.medicalLeaveLimit}
                </div>
                <div className="text-sm text-gray-600">days per year</div>
              </div>
            )}
          </div>

          {/* Earned Leave Limit */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Earned Leave</h4>
                <p className="text-sm text-gray-600">Accumulated vacation leaves</p>
              </div>
            </div>
            
            {editing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Days per Year
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={limits.earnedLeaveLimit}
                  onChange={(e) => setLimits({...limits, earnedLeaveLimit: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {limits.earnedLeaveLimit}
                </div>
                <div className="text-sm text-gray-600">days per year</div>
              </div>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Changing leave limits will affect all teachers immediately. 
                    Teachers who have already used more than the new limit will not be able to apply for new leaves of that type.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveLimitsManagement;
