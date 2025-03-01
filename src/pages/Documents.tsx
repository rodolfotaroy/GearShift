import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../components';

interface Document {
  id: number;
  car_id: number;
  name: string;
  type: string;
  file_url: string;
  expiration_date?: string;
  cars: {
    make: string;
    model: string;
  };
}

export default function Documents() {
  const { supabaseClient } = useSupabase();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | 'all'>('all');
  const [cars, setCars] = useState<{ id: number; name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCars();
    fetchDocuments();
  }, [selectedCarId]);

  async function fetchCars() {
    try {
      const { data, error } = await supabaseClient
        .from('cars')
        .select('id, make, model');
      
      if (error) throw error;
      
      setCars(data.map(car => ({
        id: car.id,
        name: `${car.make} ${car.model}`
      })));
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  }

  async function fetchDocuments() {
    try {
      let query = supabaseClient
        .from('documents')
        .select('*, cars(make, model)');
      
      if (selectedCarId !== 'all') {
        query = query.eq('car_id', selectedCarId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  }

  async function handleUpload(file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error } = await supabaseClient
        .from('documents')
        .insert({
          name: file.name,
          file_url: publicUrl,
          type: file.type,
          car_id: selectedCarId === 'all' ? cars[0].id : selectedCarId
        });

      if (error) throw error;

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  }

  async function handleDeleteDocument(documentId: number) {
    try {
      const { error } = await supabaseClient
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Vehicle Documents</h1>
        
        <div className="mb-4 flex items-center space-x-4">
          <label htmlFor="car-select" className="block text-sm font-medium text-gray-700">
            Select Car:
          </label>
          <select
            id="car-select"
            value={selectedCarId}
            onChange={(e) => setSelectedCarId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="all">All Cars</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.name}
              </option>
            ))}
          </select>

          <label 
            htmlFor="file-upload" 
            className="inline-block"
          >
            <Button
              onClick={() => {
                if (selectedFile) {
                  handleUpload(selectedFile);
                }
              }}
              variant="primary"
              className="w-auto"
              disabled={!selectedFile}
            >
              Upload
            </Button>
            <input 
              type="file" 
              id="file-upload" 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {doc.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.cars.make} {doc.cars.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      onClick={() => handleDeleteDocument(doc.id)}
                      variant="default"
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
