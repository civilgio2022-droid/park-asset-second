// Fix: Add imports for React, child components, and the ParkAsset type.
import React from 'react';
import AssetRegistration from './components/AssetRegistration';
import AssetInquiry from './components/AssetInquiry';
import ReportGeneration from './components/ReportGeneration';
import { ParkAsset } from './types';

const App = () => {
  const { database, storage } = window as any;
  const [stage, setStage] = React.useState('registration');
  const [assets, setAssets] = React.useState<ParkAsset[]>([]);
  const [assetToEdit, setAssetToEdit] = React.useState<ParkAsset | null>(null);

  React.useEffect(() => {
    const assetsRef = database.ref('assets');
    const listener = assetsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const loadedAssets: ParkAsset[] = [];
      for (const key in data) {
        loadedAssets.push({
          id: key,
          ...data[key],
        });
      }
      setAssets(loadedAssets.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
    });

    return () => assetsRef.off('value', listener);
  }, []);

  const handleSetAssetToEdit = (asset: ParkAsset) => {
    setAssetToEdit(asset);
    setStage('registration');
  };

  const handleClearAssetToEdit = () => {
    setAssetToEdit(null);
  };
  
  const handleAssetUpdated = () => {
      setAssetToEdit(null);
      setStage('inquiry');
  }

  const handleDeleteAsset = (assetId: string) => {
    if (window.confirm('정말로 이 자산을 삭제하시겠습니까?')) {
      const assetRef = database.ref(`assets/${assetId}`);
      assetRef.remove()
        .then(() => {
           const imagePath = assets.find(a => a.id === assetId)?.photoURL;
           if(imagePath) {
             const imageRef = storage.refFromURL(imagePath);
             imageRef.delete().catch(err => console.error("Error deleting image:", err));
           }
        })
        .catch((error) => {
          console.error('Error removing asset: ', error);
          alert('자산 삭제에 실패했습니다.');
        });
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="container mx-auto p-4">
        <header className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 text-center">공원 자산 관리 시스템</h1>
          <nav className="flex justify-center space-x-4 mt-4 border-t pt-4">
            {['registration', 'inquiry', 'report'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStage(s);
                  handleClearAssetToEdit();
                }}
                className={`px-6 py-2 rounded-md text-lg font-semibold transition-all duration-300 ${
                  stage === s
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {s === 'registration' && '자산 등록/수정'}
                {s === 'inquiry' && '자산 조회'}
                {s === 'report' && '보고서 출력'}
              </button>
            ))}
          </nav>
        </header>
        <main className="bg-white shadow-md rounded-lg p-8">
          {stage === 'registration' && <AssetRegistration assetToEdit={assetToEdit} onAssetUpdated={handleAssetUpdated} />}
          {stage === 'inquiry' && <AssetInquiry assets={assets} onEdit={handleSetAssetToEdit} onDelete={handleDeleteAsset} />}
          {stage === 'report' && <ReportGeneration assets={assets} />}
        </main>
      </div>
    </div>
  );
};

// Fix: Add default export for the App component.
export default App;
