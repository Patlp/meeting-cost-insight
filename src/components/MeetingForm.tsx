
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MeetingInput } from '@/types/meeting';

interface MeetingFormProps {
  onCalculate: (data: MeetingInput) => void;
  loading?: boolean;
}

const MeetingForm: React.FC<MeetingFormProps> = ({ onCalculate, loading = false }) => {
  const [formData, setFormData] = useState<MeetingInput>({
    duration: 30,
    attendees: 5,
    averageSalary: 50000,
    purpose: '',
    worthIt: null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'purpose' ? value : Number(value)
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      worthIt: value === 'yes' ? true : value === 'no' ? false : null
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="space-y-4">
        <div>
          <Label htmlFor="duration">Meeting Duration (minutes)</Label>
          <Input
            id="duration"
            name="duration"
            type="number"
            min="1"
            required
            value={formData.duration}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="attendees">Number of Attendees</Label>
          <Input
            id="attendees"
            name="attendees"
            type="number"
            min="1"
            required
            value={formData.attendees}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="averageSalary">Average Annual Salary per Attendee (£)</Label>
          <Input
            id="averageSalary"
            name="averageSalary"
            type="number"
            min="1"
            required
            value={formData.averageSalary}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="purpose">Meeting Purpose/Outcome (Optional)</Label>
          <Textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            className="mt-1"
            placeholder="What is this meeting about?"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="worthIt">Was this meeting worth it?</Label>
          <Select
            value={formData.worthIt === null ? "" : formData.worthIt ? "yes" : "no"}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Not sure</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Calculating..." : "Calculate Meeting Cost"}
      </Button>
    </form>
  );
};

export default MeetingForm;
