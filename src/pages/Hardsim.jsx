import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const HardwareSimulator = () => {
  const [vehicleDetails, setVehicleDetails] = useState({
    vinNumber: '',
    ecuIdentifier: '',
    distanceTraveled: ''
  });

  const [crashDetails, setCrashDetails] = useState({
    date: '',
    time: '',
    location: ''
  });

  const [uploadedMediaFile, setUploadedMediaFile] = useState(null);
  const [uploadedDataFile, setUploadedDataFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [successMessage, setSuccessMessage] = useState(''); // Success message state
  const navigate = useNavigate(); // Initialize navigate for redirection

  useEffect(() => {
    // Automatically set the current date and time
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const formattedTime = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS
    setCrashDetails(prev => ({
      ...prev,
      date: formattedDate,
      time: formattedTime
    }));
  }, []);

  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      if (fileType === 'media') {
        setUploadedMediaFile(file);
      } else if (fileType === 'data') {
        setUploadedDataFile(file);
      }
    }
  };

  const handleInputChange = (event, category) => {
    const { name, value } = event.target;
    const stateKey = name.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());

    if (category === 'vehicle') {
      setVehicleDetails(prev => ({ ...prev, [stateKey]: value }));
    } else if (category === 'crash') {
      setCrashDetails(prev => ({ ...prev, [stateKey]: value }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true); // Start loading animation
    const formData = new FormData();

    if (uploadedMediaFile) {
      formData.append('image', uploadedMediaFile);
    }
    if (uploadedDataFile) {
      formData.append('file', uploadedDataFile);
    }

    // Append other form fields
    Object.entries(vehicleDetails).forEach(([key, value]) => formData.append(key, value));
    Object.entries(crashDetails).forEach(([key, value]) => formData.append(key, value));

    try {
      const response = await fetch('http://localhost:3000/crash-report/upload-and-analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload and analysis successful:', result);

      // Show success message and redirect
      setSuccessMessage('Data uploaded and analyzed successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 3000); // Redirect after 3 seconds
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Error uploading and analyzing data: ${error.message}`);
    } finally {
      setIsLoading(false); // Stop loading animation
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#000000] to-[#000000] relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#6C63FF]"></div>
        </div>
      )}
      <div className={`w-full max-w-6xl bg-[#2C2F48] shadow-2xl rounded-lg p-8 ${isLoading ? 'opacity-50' : ''}`}>
        <h2 className="text-4xl font-bold text-[#6C63FF] mb-6 text-center">Data Upload Page</h2>

        {successMessage ? (
          <p className="text-center text-green-500 text-lg">{successMessage}</p>
        ) : (
          <div className="grid grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
              <h3 className="text-3xl font-semibold text-[#6C63FF] mb-4">Upload Files</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-300 mb-2">Upload Photo/Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e, 'media')}
                    className="block w-full text-base text-gray-300 border border-gray-500 rounded-lg cursor-pointer bg-[#3B3F5C] shadow-sm focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] transition duration-300 ease-in-out hover:bg-[#44486A]"
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-300 mb-2">Upload CSV/Excel File</label>
                  <input
                    type="file"
                    accept=".csv, .xls, .xlsx"
                    onChange={(e) => handleFileUpload(e, 'data')}
                    className="block w-full text-base text-gray-300 border border-gray-500 rounded-lg cursor-pointer bg-[#3B3F5C] shadow-sm focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] transition duration-300 ease-in-out hover:bg-[#44486A]"
                  />
                </div>
              </div>
            </div>

            {/* Event Details Section */}
            <div>
              <h3 className="text-3xl font-semibold text-[#6C63FF] mb-4">Event Details</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'VIN Number', name: 'vinNumber', category: 'vehicle' },
                  { label: 'ECU Identifier', name: 'ecuIdentifier', category: 'vehicle' },
                  { label: 'Distance Traveled', name: 'distanceTraveled', category: 'vehicle' },
                  { label: 'Date', name: 'date', category: 'crash' },
                  { label: 'Time', name: 'time', category: 'crash' },
                  { label: 'Location', name: 'location', category: 'crash' }
                ].map(({ label, name, category }, index) => (
                  <div key={index} className="transition duration-300 ease-in-out transform hover:scale-105">
                    <label className="block text-base font-medium text-gray-300 mb-2">{label}</label>
                    <input
                      type="text"
                      name={name}
                      value={category === 'crash' ? crashDetails[name] : vehicleDetails[name]}
                      onChange={(e) => handleInputChange(e, category)}
                      className="block w-full border border-gray-500 rounded-lg shadow-sm focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] text-base p-3 bg-[#3B3F5C] text-gray-300 transition duration-300 ease-in-out hover:bg-[#44486A]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!successMessage && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white py-3 px-12 rounded-lg shadow-lg text-lg font-medium hover:from-[#FF6584] hover:to-[#6C63FF] focus:outline-none focus:ring-4 focus:ring-[#6C63FF] transition duration-300 ease-in-out transform hover:scale-105"
            >
              Submit Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HardwareSimulator;