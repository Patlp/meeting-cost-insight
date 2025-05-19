
import React from 'react';
import MeetingCalculator from '../components/MeetingCalculator';

const Index = () => {
  return (
    <div className="container mx-auto max-w-2xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Meeting Cost Calculator</h1>
        <p className="mt-2 text-lg text-gray-600">
          Calculate the real cost of your meetings and make better decisions about your time.
        </p>
      </div>
      
      <MeetingCalculator />
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>
          Save time and money by tracking your meeting costs.
          <br />
          Connect to Supabase to store meeting history and access team-level reporting.
        </p>
      </footer>
    </div>
  );
};

export default Index;
