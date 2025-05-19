
import React from 'react';
import { Link } from 'react-router-dom';
import MeetingHistoryComponent from '../components/MeetingHistory';
import UserMenu from '../components/UserMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { setRememberMe, getRememberMe } from '@/utils/customStorage';
import { useState, useEffect } from 'react';

const MeetingHistory = () => {
  const [rememberMe, setRememberMeState] = useState(false);
  
  useEffect(() => {
    // Initialize the remember me checkbox state from storage
    setRememberMeState(getRememberMe());
  }, []);

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMeState(checked);
    setRememberMe(checked);
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Meeting History</h1>
        <UserMenu />
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-4">Your Past Meetings</h2>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            View and manage your past meetings below.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember-me" 
                checked={rememberMe}
                onCheckedChange={handleRememberMeChange}
              />
              <Label htmlFor="remember-me">Remember session</Label>
            </div>
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Calculator
              </Button>
            </Link>
          </div>
        </div>
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
