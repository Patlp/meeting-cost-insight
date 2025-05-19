
import React from 'react';
import { Link } from 'react-router-dom';
import MeetingCalculator from '../components/MeetingCalculator';
import UserMenu from '../components/UserMenu';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

const Index = () => {
  return (
    <div className="container mx-auto max-w-2xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">TalkTax</h1>
        <div className="flex items-center space-x-4">
          <Link to="/history">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              History
            </Button>
          </Link>
          <UserMenu />
        </div>
      </div>
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Meeting Cost Calculator</h2>
        <p className="mt-2 text-lg text-gray-600">
          Calculate the real cost of your meetings and make better decisions about your time.
        </p>
      </div>
      
      <MeetingCalculator />
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>
          Save time and money by tracking your meeting costs with TalkTax.
          <br />
          Store your meeting history and access team-level reporting.
        </p>
      </footer>
    </div>
  );
};

export default Index;
