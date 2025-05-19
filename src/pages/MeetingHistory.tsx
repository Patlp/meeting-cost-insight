
import React from 'react';
import MeetingHistoryComponent from '../components/MeetingHistory';
import UserMenu from '../components/UserMenu';

const MeetingHistory = () => {
  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Meeting History</h1>
        <UserMenu />
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-4">Your Past Meetings</h2>
        <p className="text-gray-600">
          View and manage your past meetings below.
        </p>
      </div>
      
      <MeetingHistoryComponent />
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>
          View the history of your meetings and analyze your costs with TalkTax.
          <br />
          Make better decisions about your time with meeting cost insights.
        </p>
      </footer>
    </div>
  );
};

export default MeetingHistory;
