
import React, { useState, useCallback } from 'react';
import AssetRegistration from './components/AssetRegistration';
import AssetInquiry from './components/AssetInquiry';
import ReportGeneration from './components/ReportGeneration';
import { ParkAsset, Stage } from './types';

// SVG Icons
const RegisterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
);
const InquiryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
);
const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm3.5 4a1.5 1.5 0 013 0V14a1.5 1.5 0 01-3 0V10zm6.5-1.5a1.5 1.5 0 00-3 0V14a1.5 1.5 0 003 0V8.5z" /></svg>
);

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>('register');
  const [assets, setAssets] = useState<ParkAsset[]>(() => {
    // Load assets from localStorage or use initial mock data
    try {
      const savedAssets = localStorage.getItem('parkAssets');
      return savedAssets ? JSON.parse(savedAssets) : [];
    } catch (error) {
      console.error("Could not parse assets from localStorage", error);
      return [];
    }
  });

  const addAsset = useCallback((newAsset: Omit<ParkAsset, 'id'>) => {
    setAssets(prevAssets => {
      const updatedAssets = [...prevAssets, { ...newAsset, id: new Date().toISOString() }];
      localStorage.setItem('parkAssets', JSON.stringify(updatedAssets));
      return updatedAssets;
    });
  }, []);

  const STAGES: { id: Stage; name: string; icon: React.ReactNode }[] = [
    { id: 'register', name: '자산 등록', icon: <RegisterIcon /> },
    { id: 'inquiry', name: '자산 조회', icon: <InquiryIcon /> },
    { id: 'report', name: '보고서 출력', icon: <ReportIcon /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-park-green-700">공원 자산 관리 시스템</h1>
          </div>
          <nav className="flex space-x-1 border-b">
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none ${
                  stage === s.id
                    ? 'border-b-2 border-park-green-600 text-park-green-600'
                    : 'text-gray-500 hover:text-park-green-600'
                }`}
              >
                {s.icon}
                {s.name}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {stage === 'register' && <AssetRegistration onAddAsset={addAsset} onComplete={() => setStage('inquiry')} />}
        {stage === 'inquiry' && <AssetInquiry assets={assets} />}
        {stage === 'report' && <ReportGeneration assets={assets} />}
      </main>
    </div>
  );
};

export default App;
