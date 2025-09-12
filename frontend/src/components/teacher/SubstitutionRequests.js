import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClock, FaCheckCircle, FaTimesCircle, FaUserGraduate, FaCalendarAlt, FaExchangeAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const SubstitutionRequests = () => {
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  const { user } = useAuth();
  const teacherId = user?._id;

  useEffect(() => {
    if (teacherId) {
      fetchSubstitutions();
    }
  }, [teacherId]);

  const fetchSubstitutions = async () => {
    if (!teacherId) {
      console.log('No teacher ID available');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      console.log('Fetching substitutions for teacher ID:', teacherId);

      const response = await axios.get(`/api/timetable/substitutions/teacher/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Substitutions response:', response.data);

      if (response.data.success) {
        // Filter to show only substitutions where this teacher is the substitute
        const teacherSubstitutions = response.data.data.filter(substitution => {
          const substituteId = substitution.substituteTeacherId?._id || substitution.substituteTeacherId;
          const isSubstitute = substituteId?.toString() === teacherId?.toString();
          
          console.log('Checking substitution:', {
            substitutionId: substitution._id,
            substituteId: substituteId,
            teacherId: teacherId,
            isSubstitute: isSubstitute,
            status: substitution.status
          });
          
          return isSubstitute;
        });
        
        console.log('Filtered substitutions for teacher:', teacherSubstitutions);
        setSubstitutions(teacherSubstitutions);
      }
    } catch (error) {
      console.error('Error fetching substitutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (substitutionId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `/api/timetable/substitutions/${substitutionId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Substitution accepted successfully!');
        fetchSubstitutions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error accepting substitution:', error);
      alert('Error accepting substitution');
    }
  };

  const handleReject = async (substitutionId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `/api/timetable/substitutions/${substitutionId}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Substitution rejected successfully!');
        setRejectionReason('');
        setSelectedSubstitution(null);
        fetchSubstitutions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting substitution:', error);
      alert('Error rejecting substitution');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" />
          Pending Response
        </span>;
      case 'accepted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" />
          Accepted
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimesCircle className="mr-1" />
          Rejected
        </span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Completed
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  const getDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <FaExchangeAlt className="mr-3" />
          Substitution Requests
        </h1>
        <p className="text-blue-100">Manage your substitution assignments and requests</p>
      </div>

      {/* Substitution Requests */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">My Substitution Requests</h2>
        </div>
        
        {substitutions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FaExchangeAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No substitution requests found.</p>
            <p className="text-sm text-gray-400 mt-2">When an admin assigns you a substitution, it will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {substitutions.map((substitution) => (
              <div key={substitution._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {substitution.subject} - {substitution.className}
                      </h3>
                      {getStatusBadge(substitution.status)}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Substitute Request
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="text-blue-500" />
                        <span>{getDayName(substitution.day)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaClock className="text-green-500" />
                        <span>Period {substitution.periodNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaUserGraduate className="text-purple-500" />
                        <span>Substituting for: {substitution.originalTeacherId?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaExchangeAlt className="text-orange-500" />
                        <span>Requested: {new Date(substitution.assignedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {substitution.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Admin Notes:</strong> {substitution.notes}
                        </p>
                      </div>
                    )}

                    {substitution.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {substitution.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {substitution.status === 'requested' && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleAccept(substitution._id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FaCheckCircle className="mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => setSelectedSubstitution(substitution)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FaTimesCircle className="mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedSubstitution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Substitution Request</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this substitution request for{' '}
                <strong>{selectedSubstitution.subject} - {selectedSubstitution.className}</strong>
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setSelectedSubstitution(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedSubstitution._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubstitutionRequests;

