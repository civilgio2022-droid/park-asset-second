import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import AssetRegistration from './components/AssetRegistration.tsx';
import AssetInquiry from './components/AssetInquiry.tsx';
import ReportGeneration from './components/ReportGeneration.tsx';
import { ParkAsset } from './types.ts';

// Firebase 초기화
const firebaseConfig = (window as any).firebaseConfig;
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

type Stage = 'registration' | 'inquiry' | 'report';

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>('registration');
  const [assets, setAssets] = useState<ParkAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [assetToEdit, setAssetToEdit] = useState<ParkAsset | null>(null);

  useEffect(() => {
    const assetsRef = ref(database, 'assets');
    const unsubscribe = onValue(assetsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedAssets: ParkAsset[] = data ? Object.entries(data).map(([key, value]) => ({
        id: key,
        ...(value as Omit<ParkAsset, 'id'>),
      })) : [];
      setAssets(loadedAssets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAsset = async (asset: Omit<ParkAsset, 'id'>) => {
    const newAssetRef = push(ref(database, 'assets'));
    await set(newAssetRef, asset);
  };
  
  const handleUpdateAsset = async (asset: ParkAsset) => {
    const assetRef = ref(database, `assets/${asset.id}`);
    const { id, ...assetData } = asset;
    await update(assetRef, assetData);
    setAssetToEdit(null);
  };
  
  const handleDeleteAsset = async (assetId: string, imageUrl: string) => {
    if (window.confirm('정말로 이 자산을 삭제하시겠습니까?')) {
      // Delete from Realtime Database
      await remove(ref(database, `assets/${assetId}`));
      
      // Delete from Storage
      if (imageUrl) {
        try {
           const imageRef = storageRef(storage, imageUrl);
           await deleteObject(imageRef);
        } catch (error: any) {
           // It's okay if the image doesn't exist (e.g., old data), just log it.
           console.warn("Could not delete image from storage:", error.message);
        }
      }
    }
  };

  const handleEditAsset = (asset: ParkAsset) => {
    setAssetToEdit(asset);
    setStage('registration');
  };
  
  const handleCancelEdit = () => {
    setAssetToEdit(null);
  }

  const renderStage = () => {
    switch (stage) {
      case 'registration':
        return (
          <AssetRegistration 
            onAddAsset={handleAddAsset} 
            onUpdateAsset={handleUpdateAsset}
            storage={storage}
            assetToEdit={assetToEdit}
            onCancelEdit={handleCancelEdit}
          />
        );
      case 'inquiry':
        return (
          <AssetInquiry 
            assets={assets}
            loading={loading}
            onEdit={handleEditAsset}
            onDelete={handleDeleteAsset}
          />
        );
      case 'report':
        return <ReportGeneration assets={assets} />;
      default:
        return null;
    }
  };
  
  const NavButton: React.FC<{
      targetStage: Stage;
      currentStage: Stage;
      onClick: (stage: Stage) => void;
      children: React.ReactNode;
  }> = ({ targetStage, currentStage, onClick, children }) => (
      <button
          onClick={() => onClick(targetStage)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentStage === targetStage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
      >
          {children}
      </button>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">공원 자산 관리 시스템</h1>
        <nav className="mt-4 flex justify-center space-x-2">
           <NavButton targetStage="registration" currentStage={stage} onClick={setStage}>자산 등록</NavButton>
           <NavButton targetStage="inquiry" currentStage={stage} onClick={setStage}>자산 조회</NavButton>
           <NavButton targetStage="report" currentStage={stage} onClick={setStage}>보고서 출력</NavButton>
        </nav>
      </header>
      <main className="bg-white shadow-md rounded-lg p-6">
        {renderStage()}
      </main>
    </div>
  );
};

export default App;
