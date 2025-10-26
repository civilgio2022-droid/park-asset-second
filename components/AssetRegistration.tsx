// FIX: 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
import React, { useState, useEffect, useRef } from 'react';
import { ParkAsset } from '../types.ts';

interface AssetRegistrationProps {
    onSave: (asset: Omit<ParkAsset, 'id'>, id: string | null) => void;
    assetToEdit: ParkAsset | null;
    setAssetToEdit: (asset: ParkAsset | null) => void;
    storage: any;
}

function AssetRegistration({ onSave, assetToEdit, setAssetToEdit, storage }: AssetRegistrationProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('good');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [mapUrl, setMapUrl] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (assetToEdit) {
            setName(assetToEdit.name);
            setType(assetToEdit.type);
            setStatus(assetToEdit.status);
            setDescription(assetToEdit.description);
            setPhotoPreview(assetToEdit.photoUrl);
            setMapUrl(assetToEdit.mapUrl);
            setLatitude(assetToEdit.latitude);
            setLongitude(assetToEdit.longitude);
            setPhoto(null);
        } else {
            resetForm();
        }
    }, [assetToEdit]);

    const resetForm = () => {
        setName('');
        setType('');
        setStatus('good');
        setDescription('');
        setPhoto(null);
        setPhotoPreview(null);
        setMapUrl('');
        setLatitude(null);
        setLongitude(null);
        setAssetToEdit(null);
    };
    
    const handleStartCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("카메라 접근 실패:", err);
            alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
            setShowCamera(false);
        }
    };
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
            
            canvasRef.current.toBlob(blob => {
                if (blob) {
                    setPhoto(new File([blob], "capture.jpg", { type: "image/jpeg" }));
                    setPhotoPreview(URL.createObjectURL(blob));
                }
            }, 'image/jpeg');

            handleStopCamera();
            
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude);
                setLongitude(longitude);
                // Naver Static Map API (Note: Requires a valid client ID in index.html)
                const naverMapURL = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=300&h=300&center=${longitude},${latitude}&level=16&markers=type:t|size:mid|pos:${longitude} ${latitude}|label:${encodeURIComponent(name || '현위치')}`;
                setMapUrl(naverMapURL);
            }, error => {
                console.error("Geolocation error:", error);
                alert("위치 정보를 가져올 수 없습니다.");
            });
        }
    };
    
    const handleStopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !type || !status || !description || (!photo && !assetToEdit)) {
            alert('모든 필드를 채워주세요.');
            return;
        }
        setIsSubmitting(true);

        let finalPhotoUrl = assetToEdit?.photoUrl || '';
        if (photo) {
            const filePath = `assets/${Date.now()}_${photo.name}`;
            const fileRef = storage.ref(filePath);
            try {
                const snapshot = await fileRef.put(photo);
                finalPhotoUrl = await snapshot.ref.getDownloadURL();
            } catch (error) {
                console.error("이미지 업로드 실패:", error);
                alert("이미지 업로드에 실패했습니다.");
                setIsSubmitting(false);
                return;
            }
        }
        
        const assetData = {
            name,
            type,
            status,
            description,
            photoUrl: finalPhotoUrl,
            mapUrl,
            latitude: latitude ?? 0,
            longitude: longitude ?? 0,
            registrationDate: assetToEdit?.registrationDate || new Date().toISOString()
        };
        
        onSave(assetData, assetToEdit ? assetToEdit.id : null);
        resetForm();
        setIsSubmitting(false);
    };

    return (
        <div>
             {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                    <video ref={videoRef} autoPlay className="w-full max-w-lg h-auto"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="mt-4 flex gap-4">
                        <button onClick={handleCapture} className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600">촬영</button>
                        <button onClick={handleStopCamera} className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600">취소</button>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">자산명</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" required />
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">자산 종류</label>
                        <input type="text" id="type" value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">상태</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" required>
                        <option value="good">양호</option>
                        <option value="fair">보통</option>
                        <option value="poor">불량</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" required></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">현장 사진</label>
                    <div className="mt-2">
                        <button type="button" onClick={handleStartCamera} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">카메라 열기</button>
                        {photoPreview && <img src={photoPreview} alt="현장 사진" className="mt-4 max-h-48 rounded-md shadow-sm"/>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">위치도</label>
                     <div className="mt-2 p-2 border rounded-md">
                        {mapUrl ? <img src={mapUrl} alt="위치도" className="w-full h-auto rounded-md"/> : <p className="text-gray-500">사진 촬영 시 위치가 자동으로 기록됩니다.</p>}
                        {latitude && longitude && (
                            <div className="mt-2 text-sm text-gray-600">
                                <p>위도: {latitude.toFixed(6)}</p>
                                <p>경도: {longitude.toFixed(6)}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={resetForm} disabled={isSubmitting} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50">취소</button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400">
                        {isSubmitting ? '저장 중...' : (assetToEdit ? '수정 완료' : '자산 등록')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AssetRegistration;
