// FIX: 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
import React, { useState, useEffect } from 'react';
// FIX: 'firebase' refers to a UMD global, but the current file is a module. Consider adding an import instead.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { ParkAsset } from './types.ts';
import AssetRegistration from './components/AssetRegistration.tsx';
import AssetInquiry from './components/AssetInquiry.tsx';
import ReportGeneration from './components/ReportGeneration.tsx';

const firebaseConfig = {
  apiKey: "AIzaSyCrbVL1KkJ7x7_BRt8vQQrmLm90O2GVAqo",
  authDomain: "park-asset-management.firebaseapp.com",
  databaseURL: "https://park-asset-management-default-rtdb.firebaseio.com",
  projectId: "park-asset-management",
  storageBucket: "park-asset-management.firebasestorage.app",
  messagingSenderId: "1097483381623",
  appId: "1:1097483381623:web:c2d2f1f285714f1b664f72",
  measurementId: "G-Q2JNB48PDZ"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

function App() {
    const [activeTab, setActiveTab] = useState('register');
    const [assets, setAssets] = useState<ParkAsset[]>([]);
    const [assetToEdit, setAssetToEdit] = useState<ParkAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const assetsRef = database.ref('assets');
        const listener = assetsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            const loadedAssets: ParkAsset[] = [];
            if (data) {
                for (const key in data) {
                    loadedAssets.push({
                        id: key,
                        ...data[key]
                    });
                }
            }
            setAssets(loadedAssets.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
            setLoading(false);
        }, (error) => {
            console.error(error);
            setError('데이터를 불러오는 데 실패했습니다.');
            setLoading(false);
        });

        return () => assetsRef.off('value', listener);
    }, []);
    
    const handleSaveAsset = (asset: Omit<ParkAsset, 'id'>, id: string | null) => {
        if (id) {
            database.ref(`assets/${id}`).update(asset)
            .then(() => {
                 setAssetToEdit(null);
                 setActiveTab('inquiry');
            })
            .catch(err => setError("자산 업데이트 실패: " + err.message));
        } else {
             database.ref('assets').push(asset)
            .then(() => {
                setActiveTab('inquiry');
            })
            .catch(err => setError("자산 등록 실패: " + err.message));
        }
    };
    
    const handleDeleteAsset = (id: string) => {
        const assetToDelete = assets.find(asset => asset.id === id);
        if (assetToDelete) {
             const imageRef = storage.refFromURL(assetToDelete.photoUrl);
             
             imageRef.delete().then(() => {
                database.ref(`assets/${id}`).remove();
             }).catch(error => {
                if (error.code === 'storage/object-not-found') {
                    console.warn("스토리지에 이미지가 없어 데이터베이스 항목만 삭제합니다.");
                    database.ref(`assets/${id}`).remove();
                } else {
                    console.error("이미지 삭제 실패:", error);
                    setError("이미지 삭제에 실패했습니다. 자산 정보를 삭제할 수 없습니다.");
                }
            });
        }
    };

    const handleEditAsset = (asset: ParkAsset) => {
        setAssetToEdit(asset);
        setActiveTab('register');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'register':
                return <AssetRegistration 
                    onSave={handleSaveAsset} 
                    assetToEdit={assetToEdit} 
                    setAssetToEdit={setAssetToEdit}
                    storage={storage} 
                />;
            case 'inquiry':
                return <AssetInquiry 
                    assets={assets}
                    onEdit={handleEditAsset}
                    onDelete={handleDeleteAsset}
                    loading={loading}
                 />;
            case 'report':
                return <ReportGeneration assets={assets} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <header className="text-center my-6">
                <h1 className="text-4xl font-bold text-gray-800">공원 자산 관리 시스템</h1>
                <p className="text-gray-500 mt-2">공원 자산을 효율적으로 등록, 조회하고 보고서를 생성하세요.</p>
            </header>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            <div className="bg-white rounded-lg shadow-lg">
                <nav className="flex border-b">
                    <button onClick={() => setActiveTab('register')} className={`flex-1 py-4 px-2 text-center text-gray-600 border-b-4 tab-button ${activeTab === 'register' ? 'active' : 'border-transparent hover:border-gray-300'}`}>자산 등록</button>
                    <button onClick={() => setActiveTab('inquiry')} className={`flex-1 py-4 px-2 text-center text-gray-600 border-b-4 tab-button ${activeTab === 'inquiry' ? 'active' : 'border-transparent hover:border-gray-300'}`}>자산 조회</button>
                    <button onClick={() => setActiveTab('report')} className={`flex-1 py-4 px-2 text-center text-gray-600 border-b-4 tab-button ${activeTab === 'report' ? 'active' : 'border-transparent hover:border-gray-300'}`}>보고서 출력</button>
                </nav>
                <main className="p-6">
                    {renderContent()}
                </main>
            </div>
             <footer className="text-center mt-8 text-gray-500 text-sm">
                &copy; 2024 Park Asset Management System. All rights reserved.
            </footer>
        </div>
    );
}

export default App;
