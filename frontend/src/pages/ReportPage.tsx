import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ReportPage() {
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TO DO: implement form submission logic
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Report an Issue</h1>
      <p className="text-gray-500 text-sm mt-0.5">Please provide details about the issue you are experiencing.</p>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700 mt-4">
          Title
          <input type="text" className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm" />
        </label>
        <label className="block text-sm font-medium text-gray-700 mt-4">
          Description
          <textarea className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm" />
        </label>
        <button type="submit" className="btn-primary mt-4 text-sm">Submit</button>
      </form>
    </div>
  );
}