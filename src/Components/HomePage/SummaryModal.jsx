import React, { useState } from 'react';
import { RxCross2 } from 'react-icons/rx';
import { DotPulse } from '@uiball/loaders';

const SummaryModal = ({ isOpen, onClose, summary, isLoading, onDaysChange }) => {
    const [days, setDays] = useState(7);

    if (!isOpen) return null;

    const handleDaysChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setDays(value);
            onDaysChange(value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chat Summary</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <RxCross2 size={24} />
                    </button>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number of days to summarize
                    </label>
                    <input
                        type="number"
                        id="days"
                        min="1"
                        value={days}
                        onChange={handleDaysChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-theme focus:border-theme dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="mt-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <DotPulse size={40} color="#3B82F6" />
                        </div>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {summary}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SummaryModal; 