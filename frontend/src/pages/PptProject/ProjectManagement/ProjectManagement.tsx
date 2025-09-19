import React from 'react';

export const PipelineManagementPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pipeline Management</h1>
      <p className="mb-6">
        Hier kannst du deine Pipeline-Einstellungen verwalten.
      </p>
      <form className="space-y-4 max-w-md">
        <div>
          <label className="block text-gray-700">Pipeline-Name</label>
          <input
            type="text"
            placeholder="Name eingeben"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Cron-Schedule</label>
          <input
            type="text"
            placeholder="z.B. 0 0 * * *"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="enabled" className="mr-2" />
          <label htmlFor="enabled" className="text-gray-700">
            Aktiviert
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Speichern
        </button>
      </form>
    </div>
  );
};