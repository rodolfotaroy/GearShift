import { Button } from './Button';
import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Document, Car, DOCUMENT_TYPES } from '../types';
import { PlusIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

interface DocumentViewProps {
    car: Car;
}

export default function DocumentView({ car }: DocumentViewProps) {
    const { supabaseClient, supabaseAuth } = useSupabase();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDocument, setShowAddDocument] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newDocument, setNewDocument] = useState({
        document_type: DOCUMENT_TYPES[0],
        title: '',
        expiry_date: '',
        description: ''
    });

    useEffect(() => {
        fetchDocuments();
    }, [car.id]);

    async function fetchDocuments() {
        setLoading(true);
        try {
            const { error } = await supabaseClient
                .from('documents')
                .select('*')
                .eq('car_id', car.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(error ? [] : []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    }

    async function uploadDocument() {
        if (!selectedFile) return;

        try {
            const { data: { user } } = await supabaseAuth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Upload file to storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${car.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('car-documents')
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('car-documents')
                .getPublicUrl(fileName);

            // Save document record
            const { error: dbError } = await supabaseClient
                .from('documents')
                .insert([{
                    car_id: car.id,
                    user_id: user.id,
                    file_url: publicUrl,
                    ...newDocument
                }]);

            if (dbError) throw dbError;

            setShowAddDocument(false);
            setSelectedFile(null);
            setNewDocument({
                document_type: DOCUMENT_TYPES[0],
                title: '',
                expiry_date: '',
                description: ''
            });
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
        }
    }

    async function deleteDocument(document: Document) {
        try {
            // Delete from storage
            const fileName = document.file_url.split('/').pop();
            if (fileName) {
                await supabaseClient.storage
                    .from('car-documents')
                    .remove([fileName]);
            }

            // Delete from database
            const { error } = await supabaseClient
                .from('documents')
                .delete()
                .eq('id', document.id);

            if (error) throw error;
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <button
                    type="button"
                    onClick={() => setShowAddDocument(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Document
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {documents.map((document) => (
                        <li key={document.id}>
                            <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <DocumentIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {document.title}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {document.document_type}
                                            {document.expiry_date && 
                                                ` • Expires: ${DateTime.fromISO(document.expiry_date).toFormat('yyyy/MM/dd')}`
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <a
                                        href={document.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                        View
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => deleteDocument(document)}
                                        className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-100"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Add Document Modal */}
            {showAddDocument && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Document</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.document_type}
                                    onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value as typeof DOCUMENT_TYPES[number] })}
                                >
                                    <option value="">Select a type</option>
                                    {DOCUMENT_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.title}
                                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.expiry_date}
                                    onChange={(e) => setNewDocument({ ...newDocument, expiry_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.description}
                                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">File</label>
                                <input
                                    type="file"
                                    className="mt-1 block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowAddDocument(false)}
                                variant="default"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={uploadDocument}
                                disabled={!selectedFile || !newDocument.title}
                                variant="primary"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

